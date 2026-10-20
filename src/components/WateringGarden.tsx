import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// -----------------------------------------------------------------------------
// Rendering / simulation
// -----------------------------------------------------------------------------

const MAX_DPR = 2

const WATER_RATE = 18
const GRAVITY = 620
const MAX_DROPS = 320
const MAX_FLOWERS = 36
const FLOWER_SPROUT_CHANCE = 0.036

// The can is authored at a larger drawing size for detail, then scaled down
// into cursor dimensions at render time.
const CAN_SCALE = 0.58
const CAN_TILT = -0.3
const CAN_TILT_RESPONSE = 18
// Side of the square cursor canvas, in CSS px. Roomy enough for the scaled
// artwork at full tilt.
const CAN_BOX = 160

// Rose position in the unscaled can artwork. The can is mirrored horizontally
// at draw time, so the actual local x coordinate is negative.
const ROSE_X = -58
const ROSE_Y = -15

// A handful of virtual holes across the rose face. Each emits independently,
// which produces a shower instead of one continuous jet.
const ROSE_HOLES = [-4.2, -2.1, 0, 2.1, 4.2] as const

// -----------------------------------------------------------------------------
// Palette
// -----------------------------------------------------------------------------

const WATER = 'rgba(91, 148, 160, 0.72)'
const WATER_LIGHT = 'rgba(140, 176, 178, 0.42)'

const STEM = 'rgb(61, 138, 99)'
const LEAF = 'rgb(91, 148, 91)'
const BARK = 'rgb(92, 74, 53)'

const CAN_GREEN = 'rgb(36, 119, 95)'
const CAN_GREEN_DARK = 'rgb(25, 88, 72)'
const CAN_GREEN_LIGHT = 'rgb(82, 154, 128)'

const COPPER = 'rgb(177, 91, 54)'
const COPPER_LIGHT = 'rgb(222, 137, 89)'
const COPPER_DARK = 'rgb(124, 66, 43)'

const FLOWER_COLORS = [
  'rgb(196, 148, 58)',
  'rgb(150, 92, 64)',
  'rgb(172, 132, 126)',
  'rgb(214, 196, 160)',
  'rgb(140, 176, 132)',
] as const

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Drop = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

type Flower = {
  x: number
  born: number
  height: number
  lean: number
  petals: number
  color: string
  growMs: number
  holdMs: number
  fadeMs: number
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const ease = (t: number) => {
  t = clamp01(t)
  return t * t * (3 - 2 * t)
}

export default function WateringGarden({
  className = '',
}: {
  className?: string
}) {
  // Two canvases, split by how each moves on scroll. The garden (drops and
  // flowers) lives inside the section, so the compositor scrolls it with the
  // page and scrolling costs no redraw. The can is a cursor, so it sits on a
  // small fixed canvas moved by transform and stays put while the page scrolls.
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canCanvasRef = useRef<HTMLCanvasElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const canvas = canvasRef.current
    const canCanvas = canCanvasRef.current
    const anchor = anchorRef.current

    if (!canvas || !canCanvas || !anchor) return

    const section = anchor.parentElement
    const ctx = canvas.getContext('2d', { alpha: true })
    const canCtx = canCanvas.getContext('2d', { alpha: true })

    if (!section || !ctx || !canCtx) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const finePointer = window.matchMedia('(pointer: fine)').matches
    const interactive = finePointer && !reduceMotion

    // Garden canvas size, which is the section's. The ground is its bottom.
    let width = 0
    let height = 0
    let dpr = 1
    // Section's viewport offset, re-measured whenever pointer coordinates are
    // converted, since content above it can reflow without resizing it.
    let sectionLeft = 0
    let sectionTop = 0
    let canShown = false
    let drawnAngle = NaN

    let drops: Drop[] = []
    let flowers: Flower[] = []

    let raf = 0
    let running = false
    let inView = false
    // True once a render has left the canvas empty, so idle frames can skip
    // clearing and recompositing a viewport-sized layer that is already clear.
    let blank = false
    let last = performance.now()
    let lastWater = 0

    // The rendered angle is eased independently from the pointer position.
    // Pointer coordinates are never smoothed, so the can stays cursor-tight.
    let canAngle = 0

    const pointer = {
      // Section-local coordinates, where the shower is emitted.
      x: 0,
      y: 0,

      // Viewport coordinates, which place the fixed can canvas.
      clientX: 0,
      clientY: 0,

      visible: false,
      watering: false,
      activePointerId: null as number | null,
    }

    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min)

    // -------------------------------------------------------------------------
    // Pointer positioning
    // -------------------------------------------------------------------------

    const positionPointer = () => {
      const rect = section.getBoundingClientRect()
      sectionLeft = rect.left
      sectionTop = rect.top
      pointer.x = pointer.clientX - sectionLeft
      pointer.y = pointer.clientY - sectionTop
    }

    // Reads the offsets `positionPointer` just measured.
    const pointerIsInsideSection = () =>
      pointer.clientX >= 0 &&
      pointer.clientX <= window.innerWidth &&
      pointer.y >= 0 &&
      pointer.y <= height

    const updatePointer = (event: PointerEvent) => {
      pointer.clientX = event.clientX
      pointer.clientY = event.clientY

      // Off screen the pointer cannot be inside the section, so skip the
      // layout read on every move elsewhere on the page.
      if (inView || pointer.watering) positionPointer()
      pointer.visible = true
      // Set straight from the event rather than on the next frame, so the can
      // tracks like a native cursor.
      canCanvas.style.transform = `translate3d(${pointer.clientX - CAN_BOX / 2}px, ${pointer.clientY - CAN_BOX / 2}px, 0)`
    }

    // -------------------------------------------------------------------------
    // Flowers
    // -------------------------------------------------------------------------

    const createFlower = (x: number, now: number) => {
      if (flowers.length >= MAX_FLOWERS) return

      // Keep neighbouring blooms distinct rather than allowing a dense pileup
      // under one heavily watered point.
      const occupied = flowers.some(
        (flower) =>
          Math.abs(flower.x - x) < 18 &&
          now - flower.born <
            flower.growMs + flower.holdMs + flower.fadeMs,
      )

      if (occupied) return

      flowers.push({
        x: Math.max(12, Math.min(width - 12, x + rand(-8, 8))),
        born: now,
        height: rand(34, 70),
        lean: rand(-8, 8),
        petals: Math.round(rand(5, 8)),
        color:
          FLOWER_COLORS[
            (Math.random() * FLOWER_COLORS.length) | 0
          ],
        growMs: rand(1300, 1900),
        holdMs: rand(2600, 4200),
        fadeMs: rand(1200, 1900),
      })
    }

    // -------------------------------------------------------------------------
    // Water
    // -------------------------------------------------------------------------

    const emitDrop = (holeOffset: number) => {
      if (drops.length >= MAX_DROPS) return

      /*
       * Transform the rose centre using the same scale and rotation as the can.
       *
       * Because the artwork is permanently mirrored, ROSE_X is already
       * expressed as the left-facing local coordinate.
       */
      const localX = ROSE_X * CAN_SCALE
      const localY = ROSE_Y * CAN_SCALE

      const cos = Math.cos(canAngle)
      const sin = Math.sin(canAngle)

      const roseX =
        pointer.x +
        localX * cos -
        localY * sin

      const roseY =
        pointer.y +
        localX * sin +
        localY * cos

      // π points left. Adding the current can rotation tips the shower down
      // with the rose head as the user holds the mouse.
      const baseAngle = Math.PI + canAngle
      const perpendicular = baseAngle + Math.PI / 2

      // Start each droplet at one of several distinct holes across the rose,
      // with only enough jitter to keep the shower organic.
      const offset = holeOffset + rand(-0.45, 0.45)

      const startX =
        roseX +
        Math.cos(perpendicular) * offset

      const startY =
        roseY +
        Math.sin(perpendicular) * offset

      // Each hole gets a slightly different trajectory and speed. Combined
      // with gravity this produces a soft fan of rain rather than a solid jet.
      const sprayAngle = baseAngle + rand(-0.25, 0.25)
      const speed = rand(38, 74)

      drops.push({
        x: startX + rand(-0.8, 0.8),
        y: startY + rand(-0.8, 0.8),
        vx:
          Math.cos(sprayAngle) * speed +
          rand(-5, 5),
        vy:
          Math.sin(sprayAngle) * speed +
          rand(10, 24),
        size: rand(0.5, 1.05),
      })
    }

    const emitWater = (now: number) => {
      if (!pointer.watering) return
      if (now - lastWater < WATER_RATE) return

      // Not every perforation emits on every frame. That irregularity keeps
      // the spray visually light while still clearly reading as a shower head.
      for (const hole of ROSE_HOLES) {
        if (Math.random() < 0.82) {
          emitDrop(hole)
        }
      }

      lastWater = now
    }

    // Every drop shares one style, so it is set once for the whole shower
    // rather than saved and restored per drop.
    const drawDrops = () => {
      if (!drops.length) return

      ctx.globalAlpha = 0.52
      ctx.strokeStyle = WATER
      ctx.lineCap = 'round'

      for (const drop of drops) {
        const speed = Math.hypot(drop.vx, drop.vy) || 1
        const ux = drop.vx / speed
        const uy = drop.vy / speed

        const length = Math.min(4, 1.2 + speed * 0.012)

        ctx.lineWidth = drop.size

        ctx.beginPath()
        ctx.moveTo(
          drop.x - ux * length,
          drop.y - uy * length,
        )
        ctx.lineTo(drop.x, drop.y)
        ctx.stroke()
      }

      // A tiny highlight gives larger drops a little depth without making the
      // water look glossy or visually heavy. One path, one fill.
      ctx.globalAlpha = 0.2
      ctx.fillStyle = WATER_LIGHT

      ctx.beginPath()
      for (const drop of drops) {
        if (drop.size <= 0.8) continue
        const r = drop.size * 0.42
        ctx.moveTo(drop.x - 0.4 + r, drop.y - 0.4)
        ctx.arc(
          drop.x - 0.4,
          drop.y - 0.4,
          r,
          0,
          Math.PI * 2,
        )
      }
      ctx.fill()

      ctx.globalAlpha = 1
    }

    // -------------------------------------------------------------------------
    // Flower drawing
    // -------------------------------------------------------------------------

    const drawFlower = (flower: Flower, now: number) => {
      const age = now - flower.born
      const total =
        flower.growMs + flower.holdMs + flower.fadeMs

      if (age < 0 || age > total) return

      const grow = ease(age / flower.growMs)

      const fadeStart = flower.growMs + flower.holdMs

      const alpha =
        age <= fadeStart
          ? 1
          : 1 -
            clamp01((age - fadeStart) / flower.fadeMs)

      const stemHeight = flower.height * grow
      const baseY = height + 2

      const topX = flower.x + flower.lean * grow
      const topY = baseY - stemHeight

      ctx.save()
      ctx.globalAlpha = alpha * 0.72

      // Stem
      ctx.strokeStyle = STEM
      ctx.lineWidth = 1.4
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(flower.x, baseY)
      ctx.quadraticCurveTo(
        flower.x + flower.lean * 0.25,
        baseY - stemHeight * 0.52,
        topX,
        topY,
      )
      ctx.stroke()

      // Leaves emerge after the stem has established itself.
      if (grow > 0.38) {
        const leafAlpha = clamp01((grow - 0.38) / 0.3)

        ctx.globalAlpha = alpha * leafAlpha * 0.55
        ctx.fillStyle = LEAF

        const leafY = baseY - stemHeight * 0.5
        const leafX =
          flower.x + flower.lean * grow * 0.18

        ctx.save()
        ctx.translate(leafX, leafY)
        ctx.rotate(-0.45)

        ctx.beginPath()
        ctx.ellipse(6, 0, 7, 2.6, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        ctx.save()
        ctx.translate(leafX + 1, leafY - 7)
        ctx.rotate(Math.PI + 0.4)

        ctx.beginPath()
        ctx.ellipse(6, 0, 6, 2.3, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      // Bloom near the end of the growth phase.
      const bloom = ease(
        (age - flower.growMs * 0.68) /
          (flower.growMs * 0.32),
      )

      if (bloom > 0) {
        ctx.translate(topX, topY)
        ctx.scale(bloom, bloom)

        const petalRadius = 6.2

        ctx.fillStyle = flower.color
        ctx.globalAlpha = alpha * 0.7

        for (let i = 0; i < flower.petals; i++) {
          const angle =
            (i / flower.petals) * Math.PI * 2

          ctx.save()
          ctx.rotate(angle)
          ctx.translate(0, -5)

          ctx.beginPath()
          ctx.ellipse(
            0,
            -3.5,
            3.4,
            petalRadius,
            0,
            0,
            Math.PI * 2,
          )
          ctx.fill()

          ctx.restore()
        }

        ctx.globalAlpha = alpha * 0.75
        ctx.fillStyle = BARK

        ctx.beginPath()
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    // -------------------------------------------------------------------------
    // Watering can
    // -----------------------------------------------------------------------------

    // Drawn about the centre of its own small canvas; the canvas itself is
    // what follows the pointer.
    const drawCan = () => {
      canCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      canCtx.clearRect(0, 0, CAN_BOX, CAN_BOX)

      canCtx.save()

      canCtx.translate(CAN_BOX / 2, CAN_BOX / 2)
      canCtx.rotate(canAngle)

      // Artwork is authored facing right and permanently mirrored left.
      canCtx.scale(-CAN_SCALE, CAN_SCALE)

      canCtx.lineJoin = 'round'
      canCtx.lineCap = 'round'

      // Main copper carry handle. Drawn first so the body naturally overlaps
      // the lower attachment points.
      canCtx.lineWidth = 5
      canCtx.strokeStyle = COPPER_DARK

      canCtx.beginPath()
      canCtx.moveTo(-10, -10)
      canCtx.bezierCurveTo(-6, -38, 26, -39, 29, -10)
      canCtx.stroke()

      canCtx.lineWidth = 3.3
      canCtx.strokeStyle = COPPER

      canCtx.beginPath()
      canCtx.moveTo(-10, -10)
      canCtx.bezierCurveTo(-6, -38, 26, -39, 29, -10)
      canCtx.stroke()

      // Handle highlight
      canCtx.lineWidth = 1.1
      canCtx.strokeStyle = COPPER_LIGHT
      canCtx.globalAlpha = 0.8

      canCtx.beginPath()
      canCtx.moveTo(-8, -11)
      canCtx.bezierCurveTo(-3, -34, 23, -35, 27, -11)
      canCtx.stroke()

      canCtx.globalAlpha = 1

      // Rear grip
      canCtx.lineWidth = 4
      canCtx.strokeStyle = COPPER_DARK

      canCtx.beginPath()
      canCtx.moveTo(-17, -4)
      canCtx.bezierCurveTo(-32, -12, -34, 5, -23, 12)
      canCtx.stroke()

      canCtx.lineWidth = 2.6
      canCtx.strokeStyle = COPPER

      canCtx.beginPath()
      canCtx.moveTo(-17, -4)
      canCtx.bezierCurveTo(-32, -12, -34, 5, -23, 12)
      canCtx.stroke()

      // Tapered enamel spout
      const spoutGradient = canCtx.createLinearGradient(
        12,
        -4,
        53,
        -9,
      )

      spoutGradient.addColorStop(0, CAN_GREEN_DARK)
      spoutGradient.addColorStop(0.45, CAN_GREEN)
      spoutGradient.addColorStop(1, CAN_GREEN_LIGHT)

      canCtx.fillStyle = spoutGradient
      canCtx.strokeStyle = CAN_GREEN_DARK
      canCtx.lineWidth = 1.4

      canCtx.beginPath()
      canCtx.moveTo(12, -7)
      canCtx.lineTo(48, -19)
      canCtx.lineTo(53, -14)
      canCtx.lineTo(50, -9)
      canCtx.lineTo(12, 3)
      canCtx.closePath()
      canCtx.fill()
      canCtx.stroke()

      canCtx.strokeStyle = 'rgba(225,245,235,0.35)'
      canCtx.lineWidth = 1

      canCtx.beginPath()
      canCtx.moveTo(16, -6)
      canCtx.lineTo(47, -16)
      canCtx.stroke()

      // Perforated rose head. Keeping this visually prominent is important:
      // it makes the object immediately identifiable as a watering can.
      canCtx.save()
      canCtx.translate(55, -15)
      canCtx.rotate(-0.28)

      canCtx.fillStyle = CAN_GREEN_DARK
      canCtx.fillRect(-6, -4, 9, 8)

      canCtx.beginPath()
      canCtx.ellipse(
        5,
        0,
        9,
        12,
        0,
        0,
        Math.PI * 2,
      )
      canCtx.fill()

      const roseGradient = canCtx.createRadialGradient(
        3,
        -3,
        1,
        5,
        0,
        11,
      )

      roseGradient.addColorStop(
        0,
        'rgb(192, 210, 194)',
      )
      roseGradient.addColorStop(
        0.6,
        'rgb(123, 166, 143)',
      )
      roseGradient.addColorStop(
        1,
        CAN_GREEN_DARK,
      )

      canCtx.fillStyle = roseGradient
      canCtx.strokeStyle = 'rgba(25,88,72,0.9)'
      canCtx.lineWidth = 1

      canCtx.beginPath()
      canCtx.ellipse(
        3,
        0,
        7.5,
        10.5,
        0,
        0,
        Math.PI * 2,
      )
      canCtx.fill()
      canCtx.stroke()

      canCtx.fillStyle = 'rgba(36,70,60,0.72)'

      const holes = [
        [0, 0],
        [-2.5, -3],
        [2.4, -3],
        [-3, 3],
        [2.8, 3],
        [0, -6],
        [0, 6],
        [-4.5, 0],
        [4.4, 0],
      ] as const

      for (const [hx, hy] of holes) {
        canCtx.beginPath()
        canCtx.arc(
          3 + hx,
          hy,
          0.75,
          0,
          Math.PI * 2,
        )
        canCtx.fill()
      }

      canCtx.strokeStyle = 'rgba(240,250,242,0.45)'
      canCtx.lineWidth = 0.8

      canCtx.beginPath()
      canCtx.ellipse(
        2,
        -0.5,
        6,
        8.8,
        0,
        Math.PI * 0.75,
        Math.PI * 1.55,
      )
      canCtx.stroke()

      canCtx.restore()

      // Cylindrical enamel body
      const bodyGradient = canCtx.createLinearGradient(
        -19,
        0,
        20,
        0,
      )

      bodyGradient.addColorStop(0, CAN_GREEN_DARK)
      bodyGradient.addColorStop(0.18, CAN_GREEN)
      bodyGradient.addColorStop(
        0.58,
        'rgb(47,132,105)',
      )
      bodyGradient.addColorStop(0.82, CAN_GREEN)
      bodyGradient.addColorStop(1, CAN_GREEN_DARK)

      canCtx.fillStyle = bodyGradient
      canCtx.strokeStyle = CAN_GREEN_DARK
      canCtx.lineWidth = 1.5

      canCtx.beginPath()
      canCtx.moveTo(-19, -10)
      canCtx.bezierCurveTo(-20, -3, -20, 14, -18, 18)
      canCtx.quadraticCurveTo(0, 22, 19, 18)
      canCtx.bezierCurveTo(20, 10, 20, -3, 18, -10)
      canCtx.closePath()
      canCtx.fill()
      canCtx.stroke()

      // Top rim / lid
      canCtx.fillStyle = CAN_GREEN_DARK

      canCtx.beginPath()
      canCtx.ellipse(
        0,
        -10,
        19,
        5,
        0,
        0,
        Math.PI * 2,
      )
      canCtx.fill()

      const topGradient = canCtx.createLinearGradient(
        0,
        -15,
        0,
        -6,
      )

      topGradient.addColorStop(0, CAN_GREEN_LIGHT)
      topGradient.addColorStop(1, CAN_GREEN)

      canCtx.fillStyle = topGradient

      canCtx.beginPath()
      canCtx.ellipse(
        0,
        -11,
        17,
        4,
        0,
        0,
        Math.PI * 2,
      )
      canCtx.fill()

      canCtx.strokeStyle = 'rgba(215,240,225,0.55)'
      canCtx.lineWidth = 1

      canCtx.beginPath()
      canCtx.ellipse(
        0,
        -12,
        11,
        2.5,
        0,
        Math.PI,
        Math.PI * 2,
      )
      canCtx.stroke()

      // Lid grip
      canCtx.strokeStyle = CAN_GREEN_DARK
      canCtx.lineWidth = 1.5

      canCtx.beginPath()
      canCtx.moveTo(-4, -13)
      canCtx.quadraticCurveTo(0, -17, 5, -13)
      canCtx.stroke()

      // Stamped-metal body bands
      canCtx.strokeStyle = 'rgba(20,75,60,0.35)'
      canCtx.lineWidth = 0.9

      canCtx.beginPath()
      canCtx.moveTo(-17, 6)
      canCtx.quadraticCurveTo(0, 9, 18, 6)
      canCtx.stroke()

      canCtx.beginPath()
      canCtx.moveTo(-17, 13)
      canCtx.quadraticCurveTo(0, 16, 18, 13)
      canCtx.stroke()

      // Enamel highlight
      canCtx.strokeStyle = 'rgba(235,250,242,0.3)'
      canCtx.lineWidth = 1.1

      canCtx.beginPath()
      canCtx.moveTo(8, -6)
      canCtx.quadraticCurveTo(11, 3, 9, 14)
      canCtx.stroke()

      // Bottom rim
      canCtx.strokeStyle = CAN_GREEN_DARK
      canCtx.lineWidth = 1.5

      canCtx.beginPath()
      canCtx.ellipse(
        0,
        18,
        18,
        4,
        0,
        0,
        Math.PI,
      )
      canCtx.stroke()

      // Copper handle attachment caps
      canCtx.fillStyle = COPPER

      canCtx.beginPath()
      canCtx.arc(-10, -9, 2.2, 0, Math.PI * 2)
      canCtx.fill()

      canCtx.beginPath()
      canCtx.arc(18, -8, 2.2, 0, Math.PI * 2)
      canCtx.fill()

      canCtx.restore()
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    const render = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      for (const flower of flowers) {
        drawFlower(flower, now)
      }

      drawDrops()

      blank = isIdle()
    }

    const isIdle = () => !drops.length && !flowers.length

    // Shows or hides the can, and redraws it only when its tilt has moved.
    const syncCan = () => {
      const show = pointer.visible && interactive

      if (show !== canShown) {
        canShown = show
        canCanvas.style.visibility = show ? 'visible' : 'hidden'
      }

      if (show && canAngle !== drawnAngle) {
        drawnAngle = canAngle
        drawCan()
      }
    }

    const step = (now: number) => {
      raf = requestAnimationFrame(step)

      const dt = Math.min((now - last) / 1000, 0.04)
      last = now

      // Only the angle is eased. Cursor position itself is always exact.
      const targetAngle = pointer.watering
        ? CAN_TILT
        : 0

      const tiltEase =
        1 - Math.exp(-CAN_TILT_RESPONSE * dt)

      canAngle +=
        (targetAngle - canAngle) * tiltEase

      if (Math.abs(targetAngle - canAngle) < 0.001) {
        canAngle = targetAngle
      }

      // The section moves under a still pointer while the page scrolls, so
      // the spout is re-measured each frame it is pouring.
      if (pointer.watering) positionPointer()

      emitWater(now)

      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]

        drop.vy += GRAVITY * dt
        drop.x += drop.vx * dt
        drop.y += drop.vy * dt

        // A droplet that reaches the soil has a small chance to germinate.
        if (drop.y >= height - 1) {
          if (Math.random() < FLOWER_SPROUT_CHANCE) {
            createFlower(drop.x, now)
          }

          drops.splice(i, 1)
          continue
        }

        if (
          drop.x < -30 ||
          drop.x > width + 30 ||
          drop.y > height + 30
        ) {
          drops.splice(i, 1)
        }
      }

      flowers = flowers.filter((flower) => {
        const age = now - flower.born

        return (
          age <
          flower.growMs +
            flower.holdMs +
            flower.fadeMs
        )
      })

      syncCan()

      if (blank && isIdle()) return

      render(now)
    }

    // -------------------------------------------------------------------------
    // Layout
    // -------------------------------------------------------------------------

    const resize = () => {
      const rect = canvas.getBoundingClientRect()

      const nextWidth = Math.round(rect.width)
      const nextHeight = Math.round(rect.height)
      const nextDpr = Math.min(
        window.devicePixelRatio || 1,
        MAX_DPR,
      )
      // Reassigning width/height reallocates the
      // backing store even when the value is unchanged, so only do it on a
      // real change.
      if (
        nextWidth !== width ||
        nextHeight !== height ||
        nextDpr !== dpr
      ) {
        width = nextWidth
        height = nextHeight
        dpr = nextDpr

        canvas.width = Math.max(
          1,
          Math.round(width * dpr),
        )

        canvas.height = Math.max(
          1,
          Math.round(height * dpr),
        )

        canCanvas.width = Math.round(CAN_BOX * dpr)
        canCanvas.height = Math.round(CAN_BOX * dpr)
        drawnAngle = NaN
      }

      if (pointer.visible || pointer.watering) {
        positionPointer()
      }

      render(performance.now())
    }

    // -------------------------------------------------------------------------
    // Pointer interaction
    // -------------------------------------------------------------------------

    const previousCursor = section.style.cursor
    const previousDocumentCursor = document.documentElement.style.cursor

    const syncCursor = () => {
      const cursor =
        pointer.visible || pointer.watering
          ? 'none'
          : previousDocumentCursor

      if (document.documentElement.style.cursor !== cursor) {
        document.documentElement.style.cursor = cursor
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event)

      if (!pointer.watering) {
        pointer.visible = inView && pointerIsInsideSection()
      }

      syncCursor()
      syncCan()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return

      updatePointer(event)

      if (!inView || !pointerIsInsideSection()) {
        pointer.visible = false
        syncCursor()
        return
      }

      pointer.watering = true
      pointer.activePointerId = event.pointerId
      syncCursor()

      // Allow an immediate first spray rather than waiting for WATER_RATE.
      lastWater = performance.now() - WATER_RATE

    }

    const endWatering = (event?: PointerEvent) => {
      if (
        event &&
        pointer.activePointerId !== null &&
        event.pointerId !== pointer.activePointerId
      ) {
        return
      }

      if (event) {
        pointer.clientX = event.clientX
        pointer.clientY = event.clientY
      }

      pointer.watering = false

      pointer.activePointerId = null

      positionPointer()
      pointer.visible = pointerIsInsideSection()
      syncCursor()
    }

    /*
     * The garden scrolls with the page and the can is fixed, so scrolling
     * needs no redraw. A still pointer can still be carried out of the
     * section, though, so the can's visibility is re-checked.
     */
    const onScroll = () => {
      if (!pointer.visible || pointer.watering) return

      positionPointer()
      pointer.visible = inView && pointerIsInsideSection()

      syncCursor()
      syncCan()
    }

    // -------------------------------------------------------------------------
    // Animation lifecycle
    // -------------------------------------------------------------------------

    const start = () => {
      if (running || reduceMotion) return

      running = true
      last = performance.now()
      raf = requestAnimationFrame(step)
    }

    const stop = () => {
      if (!running) return

      running = false
      cancelAnimationFrame(raf)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting

        if (
          entry.isIntersecting &&
          !document.hidden
        ) {
          start()
        } else {
          stop()
        }
      },
      { threshold: 0 },
    )

    const resizeObserver = new ResizeObserver(resize)

    const onVisibility = () => {
      if (document.hidden) {
        stop()
        return
      }

      const rect = section.getBoundingClientRect()

      if (
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      ) {
        start()
      }
    }

    if (interactive) {
      section.style.cursor = 'none'

      window.addEventListener(
        'pointermove',
        onPointerMove,
      )

      window.addEventListener(
        'pointerdown',
        onPointerDown,
      )

      window.addEventListener(
        'pointerup',
        endWatering,
      )

      window.addEventListener(
        'pointercancel',
        endWatering,
      )

      window.addEventListener(
        'scroll',
        onScroll,
        { passive: true },
      )
    }

    document.addEventListener(
      'visibilitychange',
      onVisibility,
    )

    observer.observe(section)
    resizeObserver.observe(canvas)
    resizeObserver.observe(section)

    resize()

    return () => {
      stop()

      observer.disconnect()
      resizeObserver.disconnect()

      section.style.cursor = previousCursor
      document.documentElement.style.cursor = previousDocumentCursor

      if (interactive) {
        window.removeEventListener(
          'pointermove',
          onPointerMove,
        )

        window.removeEventListener(
          'pointerdown',
          onPointerDown,
        )

        window.removeEventListener(
          'pointerup',
          endWatering,
        )

        window.removeEventListener(
          'pointercancel',
          endWatering,
        )

        window.removeEventListener(
          'scroll',
          onScroll,
        )
      }

      document.removeEventListener(
        'visibilitychange',
        onVisibility,
      )
    }
  }, [mounted])

  return (
    <>
      <div
        ref={anchorRef}
        aria-hidden="true"
        className={`pointer-events-none ${className}`}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {mounted &&
        createPortal(
          <canvas
            ref={canCanvasRef}
            aria-hidden="true"
            className="pointer-events-none invisible fixed top-0 left-0 z-[9999] will-change-transform"
            style={{ width: CAN_BOX, height: CAN_BOX }}
          />,
          document.body,
        )}
    </>
  )

}