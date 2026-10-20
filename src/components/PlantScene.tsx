import { useEffect, useRef } from 'react'

/**
 * Interactive generative plant scene for the hero.
 *
 * Plants are grown rather than drawn: each one starts as a single tip at the
 * bottom edge and advances a short step per frame, turning under its own curl,
 * a slow global wind and an upward tropism. When a tip has run out its segment
 * length it either branches into children — narrower, shorter, splayed — or
 * terminates in a leaf or a bloom. Growth stops on its own once every tip has
 * bottomed out, so a settled scene costs almost nothing to advance.
 *
 * Growth records geometry rather than painting it: each tip appends points to a
 * polyline, and leaves and blooms are stored as placed ornaments. The canvas is
 * cleared and the retained scene redrawn every frame, which is what lets a plant
 * have a real lifecycle — it grows, stands for `PLANT_LIFETIME`, then withers
 * over its last `WITHER_TIME`, browning and thinning out to nothing before it is
 * dropped and its slot replanted.
 *
 * (Baking strokes into the buffer and fading it with `destination-out` is the
 * cheaper approach, and was the original one, but that fade is multiplicative
 * against an 8-bit backing store: at these opacities the per-frame delta rounds
 * to zero and the ink never leaves. Plants died on paper and stayed on screen.)
 *
 * The pointer is a breeze. Tips growing nearby bend away from it, new plants
 * prefer to sprout under it, and a press plants a seed directly below it.
 *
 * The canvas keeps a transparent backdrop and composites additively, so the CSS
 * gradient behind it stays visible and the scene reads as light.
 *
 * Type laid over the scene needs somewhere stable to sit. Rather than cover the
 * field with a pane, the scene yields: elements matched by the `quiet` selector
 * are measured, and the growth over them is erased back toward the base gradient
 * (see `buildQuietMask`). Plants still grow through those bands, they just thin
 * out into them, so the field reads as parting around the words.
 *
 * The cursor sheds a sparse trail of small faceted leaves as it moves — drawn
 * with straight edges and hard outlines so they read as digital cut-outs
 * against the organic growth. They tumble briefly, then fade.
 */

const MAX_DPR = 2

// ---- growth ----------------------------------------------------------------

const STEP = 1.35 // px advanced per tip per frame at 60fps
const SAMPLE = 3 // px between retained polyline points
const MAX_DEPTH = 5
const MAX_TIPS = 44 // per plant, so a lucky branch run cannot run away
const TRUNK_LENGTH = 0.2 // of canvas height
const LENGTH_FALLOFF = 0.72
const WIDTH_FALLOFF = 0.72
const TROPISM = 0.0065 // upward pull, per px, strongest at the trunk
const WIND_BEND = 0.0045 // wind contribution to turn rate, per px
const FORK_LEAF_CHANCE = 0.85
const BLOOM_CHANCE = 0.4

// ---- scene -----------------------------------------------------------------

const PLANT_LIFETIME = 26000 // ms from sprouting to gone
const WITHER_TIME = 7000 // ms of that spent browning and fading out
const PLANT_SPACING = 220 // one plant per this many CSS px of width
const MIN_PLANTS = 3
const MAX_PLANTS = 7 // hard ceiling on plants alive at once
const MAX_GROWING = 3 // concurrent growers, so the scene fills in gradually

// ---- quiet zones -----------------------------------------------------------

const QUIET_PAD = 40 // px of calm claimed beyond a sheltered element's box
const QUIET_FEATHER = 56 // px the calm takes to dissolve back into the field
const QUIET_STRENGTH = 0.88 // < 1, so a ghost of the growth survives the erase

// ---- pointer ---------------------------------------------------------------

const POINTER_RADIUS = 200
const POINTER_BEND = 1.1 // how hard growing tips veer away
const POINTER_EASE = 0.12

// ---- cursor trail ----------------------------------------------------------

const TRAIL_SPACING = 34 // px of pointer travel between shed leaves
const TRAIL_MAX = 18 // hard cap on trail leaves alive at once
const TRAIL_LIFE = 950 // ms a shed leaf lasts
const TRAIL_DRIFT = 0.55 // px/frame of sideways scatter at birth
const TRAIL_FALL = 0.028 // per-frame gravity on a shed leaf

/** Sampled greens, sages and clays from the site palette, as additive fills. */
const STEM_COLORS = [
  [46, 107, 80], // emerald-mid
  [61, 138, 99], // emerald-pop
  [122, 140, 110], // sage
] as const

const LEAF_COLORS = [
  [61, 138, 99], // emerald-pop
  [168, 184, 154], // sage-light
  [122, 140, 110], // sage
] as const

const BLOOM_COLORS = [
  [184, 154, 126], // clay-light
  [168, 184, 154], // sage-light
  [237, 231, 217], // cream
] as const

/** Where every colour heads as a plant dies — clay, so age reads as autumn. */
const WITHER_COLOR = [150, 116, 86] as const

type RGB = readonly [number, number, number]

type Branch = {
  width: number
  pts: number[] // flat x,y pairs
}

type Leaf = { x: number; y: number; angle: number; size: number }

/** A leaf shed by the cursor: tumbles, drifts down, and fades out. */
type TrailLeaf = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  size: number
  born: number
  color: RGB
}
type Bloom = { x: number; y: number; size: number; spin: number }

type Tip = {
  x: number
  y: number
  angle: number
  width: number
  length: number // segment length before the next branch decision
  grown: number
  depth: number
  curl: number
  leafAt: number // `grown` distance at which the next leaf sprouts
  leafSide: number // alternates, so foliage does not stack on one side
  branch: Branch
  sampled: number // px since the last retained point
  dead: boolean
}

type Plant = {
  tips: Tip[]
  branches: Branch[]
  leaves: Leaf[]
  blooms: Bloom[]
  spawned: number // tips created so far, against MAX_TIPS
  stem: RGB
  leaf: RGB
  bloom: RGB
  scale: number
  growing: boolean
  carry: number // leftover fractional frame time, see `growPlant`
  born: number // timestamp the plant went in; it withers a lifetime later
}

/** Signed shortest turn from `from` to `to`, so tropism never spins the long way. */
function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function rgba(c: RGB, alpha: number): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha.toFixed(3)})`
}

export default function PlantScene({
  className = '',
  quiet,
}: {
  className?: string
  /** Selector for elements the scene should thin out behind. */
  quiet?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let dprScale = 1
    let plants: Plant[] = []

    // Round-robin column, so successive plants spread across the width instead
    // of clumping wherever the random number generator happens to land.
    let column = 0
    let nextSpawn = 0

    // Pointer state. `tx/ty` is where the pointer actually is; `x/y` chases it
    // so the influence lags slightly instead of teleporting across the scene.
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false }

    // Cursor trail. `shedX/shedY` is where the last leaf came off, so shedding
    // is paced by distance travelled rather than by event rate.
    const trail: TrailLeaf[] = []
    let shedX = -9999
    let shedY = -9999

    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const pick = <T,>(list: readonly T[]): T => list[(Math.random() * list.length) | 0]

    // ---- plants ------------------------------------------------------------

    const makeTip = (
      plant: Plant,
      x: number,
      y: number,
      angle: number,
      width: number,
      length: number,
      depth: number,
    ): Tip => {
      const branch: Branch = { width, pts: [x, y] }
      plant.branches.push(branch)
      return {
        x,
        y,
        angle,
        width,
        length,
        grown: 0,
        depth,
        curl: rand(-0.006, 0.006),
        // The trunk stays bare for its first stretch, so plants read as rising
        // from the ground rather than as foliage piled on the bottom edge.
        leafAt: depth === 0 ? length * rand(0.5, 0.75) : length * rand(0.25, 0.5),
        leafSide: Math.random() < 0.5 ? 1 : -1,
        branch,
        sampled: 0,
        dead: false,
      }
    }

    const plantDensity = () =>
      Math.max(MIN_PLANTS, Math.min(MAX_PLANTS, Math.round(width / PLANT_SPACING)))

    const seed = (x: number, born: number): Plant => {
      const scale = rand(0.75, 1.4)
      const plant: Plant = {
        tips: [],
        branches: [],
        leaves: [],
        blooms: [],
        spawned: 1,
        stem: pick(STEM_COLORS),
        leaf: pick(LEAF_COLORS),
        bloom: pick(BLOOM_COLORS),
        scale,
        growing: true,
        carry: 0,
        born,
      }
      // Start just under the bottom edge so no plant shows a cut-off root.
      plant.tips.push(
        makeTip(
          plant,
          x,
          height + rand(4, 18),
          -Math.PI / 2 + rand(-0.22, 0.22),
          rand(3.4, 5) * scale,
          height * TRUNK_LENGTH * scale * rand(0.85, 1.15),
          0,
        ),
      )
      return plant
    }

    /** Bottom-edge x for the next plant, biased toward the pointer when it is in. */
    const nextX = () => {
      if (pointer.active && Math.random() < 0.5) {
        return Math.max(0, Math.min(width, pointer.x + rand(-90, 90)))
      }
      const slots = plantDensity()
      const slot = column++ % slots
      return ((slot + 0.5) / slots) * width + rand(-0.35, 0.35) * (width / slots)
    }

    /** Leaf size tapers with the stem that carries it. */
    const leafSize = (plant: Plant, tip: Tip) => (9 + tip.width * 9) * plant.scale

    const addLeaf = (plant: Plant, x: number, y: number, angle: number, size: number) => {
      plant.leaves.push({ x, y, angle, size })
    }

    const addBloom = (plant: Plant, tip: Tip) => {
      plant.blooms.push({
        x: tip.x,
        y: tip.y,
        size: rand(5, 9) * plant.scale,
        spin: Math.random() * Math.PI,
      })
    }

    /** A tip has run out its segment: branch, or finish in a leaf or a bloom. */
    const branchOut = (plant: Plant, tip: Tip, next: Tip[]) => {
      tip.dead = true

      const terminal = tip.depth >= MAX_DEPTH || plant.spawned >= MAX_TIPS
      if (terminal) {
        if (Math.random() < BLOOM_CHANCE) addBloom(plant, tip)
        else addLeaf(plant, tip.x, tip.y, tip.angle + rand(-0.4, 0.4), leafSize(plant, tip))
        return
      }

      // A leaf in the crook of the fork, where a real one would sit.
      if (Math.random() < FORK_LEAF_CHANCE) {
        const side = Math.random() < 0.5 ? 1 : -1
        addLeaf(plant, tip.x, tip.y, tip.angle + side * rand(0.8, 1.35), leafSize(plant, tip))
      }

      const children = Math.random() < 0.12 ? 3 : 2
      const spread = rand(0.26, 0.48)
      for (let i = 0; i < children; i++) {
        if (plant.spawned >= MAX_TIPS) break
        // Fan the children evenly either side of the parent heading.
        const offset = (i - (children - 1) / 2) * spread * 2
        next.push(
          makeTip(
            plant,
            tip.x,
            tip.y,
            tip.angle + offset + rand(-0.12, 0.12),
            Math.max(0.45, tip.width * WIDTH_FALLOFF),
            tip.length * LENGTH_FALLOFF * rand(0.85, 1.1),
            tip.depth + 1,
          ),
        )
        plant.spawned++
      }
    }

    /**
     * One fixed-size growth step for every live tip. The step is deliberately
     * not scaled by frame time: it sets how finely a stem is sampled, so a
     * longer step would give a plant a visibly coarser silhouette on a 120Hz
     * display than on a 60Hz one. `growPlant` handles the timing instead.
     */
    const advance = (plant: Plant, wind: number, usePointer: boolean) => {
      const distance = STEP
      const next: Tip[] = []
      let alive = false
      let buried = false

      for (const tip of plant.tips) {
        if (tip.dead) continue

        let turn = tip.curl + wind * WIND_BEND
        // Upward pull, strongest on the trunk — higher branches are freer to
        // splay, which is what keeps a plant from growing as a rigid fan.
        turn += angleDelta(tip.angle, -Math.PI / 2) * (TROPISM / (1 + tip.depth * 1.2))

        if (usePointer && pointer.active) {
          const dx = tip.x - pointer.x
          const dy = tip.y - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < POINTER_RADIUS * POINTER_RADIUS) {
            const d = Math.sqrt(d2) || 1
            const falloff = 1 - d / POINTER_RADIUS
            turn += angleDelta(tip.angle, Math.atan2(dy, dx)) * falloff * POINTER_BEND * 0.02
          }
        }

        tip.angle += turn * distance
        tip.x += Math.cos(tip.angle) * distance
        tip.y += Math.sin(tip.angle) * distance
        tip.grown += distance

        // Retain the stem coarsely: the curves are smooth enough that a point
        // every few px is indistinguishable from one per step, and it keeps the
        // per-frame redraw cheap.
        tip.sampled += distance
        if (tip.sampled >= SAMPLE) {
          tip.branch.pts.push(tip.x, tip.y)
          tip.sampled = 0
        }

        // Foliage along the stem, alternating sides, not only at the forks.
        if (tip.grown >= tip.leafAt) {
          addLeaf(
            plant,
            tip.x,
            tip.y,
            tip.angle + tip.leafSide * rand(0.75, 1.25),
            leafSize(plant, tip) * rand(0.7, 1),
          )
          tip.leafSide *= -1
          tip.leafAt += tip.length * rand(0.3, 0.55)
        }

        const escaped =
          tip.x < -60 || tip.x > width + 60 || tip.y < height * 0.08 || tip.y > height + 60
        if (escaped) {
          tip.branch.pts.push(tip.x, tip.y)
          tip.dead = true
          buried = true
          continue
        }

        if (tip.grown >= tip.length) {
          tip.branch.pts.push(tip.x, tip.y)
          branchOut(plant, tip, next)
          buried = true
        } else {
          alive = true
        }
      }

      // Only rebuild the tip list on a frame where something actually ended,
      // which for a settled plant is never.
      if (buried || next.length) {
        plant.tips = plant.tips.filter((tip) => !tip.dead)
        for (const tip of next) plant.tips.push(tip)
      }
      plant.growing = alive || next.length > 0
    }

    const growPlant = (plant: Plant, dt: number, wind: number, usePointer: boolean) => {
      plant.carry += dt
      const steps = Math.floor(plant.carry)
      if (steps < 1) return
      plant.carry -= steps
      for (let i = 0; i < steps; i++) advance(plant, wind, usePointer)
    }

    /** Run a plant to completion in one pass, for priming and for still frames. */
    const growFully = (plant: Plant, wind: number) => {
      let guard = 0
      while (plant.growing && guard++ < 6000) advance(plant, wind, false)
    }

    // ---- rendering ---------------------------------------------------------

    /**
     * How far through its death a plant is: 0 while it stands, ramping to 1 at
     * the end of its lifetime. Smoothstepped, so the last of a plant thins out
     * rather than blinking off.
     */
    const witherAmount = (plant: Plant, now: number) => {
      const t = (now - plant.born - (PLANT_LIFETIME - WITHER_TIME)) / WITHER_TIME
      return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
    }

    /**
     * A pointed leaf: two mirrored quadratics from the stem out to the tip.
     * Placed with one setTransform rather than save/translate/rotate/restore,
     * and styled with strings the caller builds once per plant, since a full
     * scene draws several hundred of these a frame.
     */
    const drawLeaf = (leaf: Leaf, fill: string, stroke: string) => {
      const cos = Math.cos(leaf.angle) * dprScale
      const sin = Math.sin(leaf.angle) * dprScale
      ctx.setTransform(cos, sin, -sin, cos, leaf.x * dprScale, leaf.y * dprScale)
      const size = leaf.size
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(size * 0.45, -size * 0.34, size, 0)
      ctx.quadraticCurveTo(size * 0.45, size * 0.34, 0, 0)
      ctx.fillStyle = fill
      ctx.fill()
      // A midrib, which is most of what makes the shape read as a leaf rather
      // than as a blob at the sizes these are drawn at.
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(size * 0.95, 0)
      ctx.strokeStyle = stroke
      ctx.lineWidth = 0.6
      ctx.stroke()
    }

    const drawBloom = (bloom: Bloom, petalFill: string, centreFill: string) => {
      const petals = 5
      const size = bloom.size
      ctx.fillStyle = petalFill
      for (let i = 0; i < petals; i++) {
        const a = bloom.spin + (i / petals) * Math.PI * 2
        ctx.beginPath()
        ctx.ellipse(
          bloom.x + Math.cos(a) * size * 0.6,
          bloom.y + Math.sin(a) * size * 0.6,
          size * 0.62,
          size * 0.34,
          a,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(bloom.x, bloom.y, size * 0.34, 0, Math.PI * 2)
      ctx.fillStyle = centreFill
      ctx.fill()
    }

    /**
     * Draw one plant at its current age. Dying plants brown toward clay and
     * lose their foliage faster than their stems, so what is left at the end is
     * a bare, pale frame rather than a uniformly dim copy of a live plant.
     */
    const drawPlant = (plant: Plant, now: number) => {
      const w = witherAmount(plant, now)
      const alpha = 1 - w
      if (alpha <= 0.01) return

      const stem = mix(plant.stem, WITHER_COLOR, w * 0.9)
      const leafColor = mix(plant.leaf, WITHER_COLOR, w)
      const bloomColor = mix(plant.bloom, WITHER_COLOR, w * 0.7)
      const foliageAlpha = alpha * (1 - w * 0.55)

      const stemStroke = rgba(stem, 0.4 * alpha)
      for (const branch of plant.branches) {
        const pts = branch.pts
        if (pts.length < 4) continue
        ctx.strokeStyle = stemStroke
        ctx.lineWidth = branch.width
        ctx.beginPath()
        ctx.moveTo(pts[0], pts[1])
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1])
        ctx.stroke()
      }

      const leafFill = rgba(leafColor, 0.16 * foliageAlpha)
      const leafStroke = rgba(leafColor, 0.22 * foliageAlpha)
      for (const leaf of plant.leaves) drawLeaf(leaf, leafFill, leafStroke)
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)

      const petalFill = rgba(bloomColor, 0.16 * foliageAlpha)
      const centreFill = rgba(bloomColor, 0.34 * foliageAlpha)
      for (const bloom of plant.blooms) drawBloom(bloom, petalFill, centreFill)
    }

    /**
     * A shed leaf is all straight lines: a faceted, kite-like blade with a hard
     * outline and a segmented midrib, so it reads as a digital cut-out rather
     * than another piece of foliage.
     */
    const drawTrailLeaf = (leaf: TrailLeaf, now: number) => {
      const t = (now - leaf.born) / TRAIL_LIFE
      if (t >= 1) return
      // Pop in fast, fade out slow.
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
      const s = leaf.size

      ctx.save()
      ctx.translate(leaf.x, leaf.y)
      ctx.rotate(leaf.angle)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(s * 0.3, -s * 0.32)
      ctx.lineTo(s * 0.72, -s * 0.22)
      ctx.lineTo(s, 0)
      ctx.lineTo(s * 0.72, s * 0.22)
      ctx.lineTo(s * 0.3, s * 0.32)
      ctx.closePath()
      ctx.fillStyle = rgba(leaf.color, 0.28 * alpha)
      ctx.fill()
      ctx.strokeStyle = rgba(leaf.color, 0.85 * alpha)
      ctx.lineWidth = 1
      ctx.stroke()
      // Segmented midrib — the dashes are what make it look rendered, not grown.
      ctx.beginPath()
      ctx.setLineDash([s * 0.18, s * 0.1])
      ctx.moveTo(s * 0.08, 0)
      ctx.lineTo(s * 0.92, 0)
      ctx.strokeStyle = rgba(leaf.color, 0.6 * alpha)
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()
    }

    /** Advance the shed leaves: drift, tumble, and drop the expired. */
    const stepTrail = (now: number, dt: number) => {
      for (let i = trail.length - 1; i >= 0; i--) {
        const leaf = trail[i]
        if (now - leaf.born >= TRAIL_LIFE) {
          trail.splice(i, 1)
          continue
        }
        leaf.vy += TRAIL_FALL * dt
        leaf.vx *= 1 - 0.03 * dt
        leaf.x += leaf.vx * dt
        leaf.y += leaf.vy * dt
        leaf.angle += leaf.spin * dt
      }
    }

    const render = (now: number) => {
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'
      for (const plant of plants) drawPlant(plant, now)

      // Punch the calm back out of the finished scene. Erasing after the fact
      // rather than suppressing growth keeps the simulation honest — plants
      // still grow through these bands, they just do not paint there.
      if (quietMask) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.globalAlpha = QUIET_STRENGTH
        ctx.drawImage(quietMask, 0, 0, width, height)
        ctx.globalAlpha = 1
      }

      ctx.globalCompositeOperation = 'source-over'

      // The trail rides above the mask: it follows the cursor, so it is allowed
      // over the quiet zones where the growth is not.
      for (const leaf of trail) drawTrailLeaf(leaf, now)
    }

    // ---- quiet zones -------------------------------------------------------

    let quietMask: HTMLCanvasElement | null = null

    /**
     * Bake an eraser for the sheltered elements, once per layout rather than
     * once per frame. Each box is drawn oversized and blurred, so the calm has
     * no edge of its own; the mask is then just a `destination-out` blit.
     *
     * Canvas `filter` is the whole trick, so where it is unsupported each box
     * falls back to a radial gradient — softer-cornered and less exact, but the
     * same idea, and it still carries the type.
     */
    const buildQuietMask = () => {
      const targets = quiet ? document.querySelectorAll<HTMLElement>(quiet) : []
      if (!targets.length || width < 1 || height < 1) {
        quietMask = null
        return
      }

      const mask = quietMask ?? document.createElement('canvas')
      mask.width = width
      mask.height = height
      const mctx = mask.getContext('2d')
      if (!mctx) {
        quietMask = null
        return
      }

      mctx.filter = 'blur(1px)'
      const blurs = mctx.filter === 'blur(1px)'
      mctx.filter = blurs ? `blur(${QUIET_FEATHER / 2}px)` : 'none'
      mctx.fillStyle = '#fff'

      const base = canvas.getBoundingClientRect()
      for (const el of targets) {
        const r = el.getBoundingClientRect()
        if (r.width < 1 || r.height < 1) continue
        // The blur spreads the fill outward by roughly its radius, so the drawn
        // box is inset by that much to land the full-strength core on the
        // element's own bounds plus the pad.
        const inset = blurs ? QUIET_FEATHER / 2 : 0
        const x = r.left - base.left - QUIET_PAD + inset
        const y = r.top - base.top - QUIET_PAD + inset
        const w = r.width + QUIET_PAD * 2 - inset * 2
        const h = r.height + QUIET_PAD * 2 - inset * 2
        if (w <= 0 || h <= 0) continue

        if (blurs) {
          mctx.beginPath()
          mctx.roundRect(x, y, w, h, Math.min(28, w / 2, h / 2))
          mctx.fill()
        } else {
          const cx = x + w / 2
          const cy = y + h / 2
          const rad = Math.max(w, h) / 2
          const g = mctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
          g.addColorStop(0, 'rgba(255,255,255,1)')
          g.addColorStop(0.62, 'rgba(255,255,255,1)')
          g.addColorStop(1, 'rgba(255,255,255,0)')
          mctx.save()
          mctx.translate(cx, cy)
          mctx.scale(w / (rad * 2), h / (rad * 2))
          mctx.translate(-cx, -cy)
          mctx.fillStyle = g
          mctx.beginPath()
          mctx.arc(cx, cy, rad, 0, Math.PI * 2)
          mctx.fill()
          mctx.restore()
          mctx.fillStyle = '#fff'
        }
      }

      mctx.filter = 'none'
      quietMask = mask
    }

    // ---- setup -------------------------------------------------------------

    /**
     * Fill the scene with fully grown plants so the hero is never bare on load.
     * Their ages are staggered across the standing part of a lifetime, so they
     * wither and hand over to live growth one at a time instead of the whole
     * scene turning over at once.
     */
    const prime = () => {
      const count = plantDensity()
      const now = performance.now()
      plants = []
      for (let i = 0; i < count; i++) {
        const x = ((i + 0.5) / count) * width + rand(-0.4, 0.4) * (width / count)
        const age = ((i + rand(0, 0.6)) / count) * (PLANT_LIFETIME - WITHER_TIME)
        const plant = seed(x, now - age)
        growFully(plant, Math.sin(i * 1.7) * 0.4)
        plants.push(plant)
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const next = { w: Math.round(rect.width), h: Math.round(rect.height) }
      if (next.w === width && next.h === height) {
        // Same canvas, but the sheltered elements may have reflowed under it
        // (a font landing, the mobile menu opening). Re-measure and repaint.
        buildQuietMask()
        render(performance.now())
        return
      }
      width = next.w
      height = next.h
      dprScale = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.max(1, Math.round(width * dprScale))
      canvas.height = Math.max(1, Math.round(height * dprScale))
      ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // Geometry is sized against the old canvas, so the scene is replanted
      // rather than stretched.
      prime()
      buildQuietMask()
      nextSpawn = performance.now() + PLANT_LIFETIME / plantDensity()
      // Draw once immediately, so a still scene (reduced motion, or a hero that
      // is off screen) is not blank.
      render(performance.now())
    }

    // ---- pointer -----------------------------------------------------------

    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const onPointerMove = (e: PointerEvent) => {
      // Off screen the loop is stopped and nothing reads the pointer, so skip
      // the layout read this would otherwise cost on every move down the page.
      if (!running) {
        pointer.active = false
        return
      }
      const { x, y } = toLocal(e.clientX, e.clientY)
      const inside = x >= 0 && y >= 0 && x <= width && y <= height
      if (!inside) {
        pointer.active = false
        return
      }
      if (!pointer.active) {
        // Entering the scene: jump rather than sweep in from the last position.
        pointer.x = x
        pointer.y = y
        shedX = x
        shedY = y
      }
      pointer.active = true
      pointer.tx = x
      pointer.ty = y

      // Shed a leaf once per stretch of travel, so a slow drag and a fast
      // sweep leave the same sparse trail.
      const dx = x - shedX
      const dy = y - shedY
      if (dx * dx + dy * dy >= TRAIL_SPACING * TRAIL_SPACING) {
        shedX = x
        shedY = y
        if (trail.length >= TRAIL_MAX) trail.shift()
        const along = Math.atan2(dy, dx)
        trail.push({
          x,
          y,
          // Scatter sideways off the stroke, with a touch of carried momentum.
          vx: Math.cos(along) * 0.4 + rand(-TRAIL_DRIFT, TRAIL_DRIFT),
          vy: Math.sin(along) * 0.4 + rand(-TRAIL_DRIFT, TRAIL_DRIFT * 0.4),
          angle: along + rand(-0.6, 0.6),
          spin: rand(-0.06, 0.06),
          size: rand(7, 12),
          born: performance.now(),
          color: pick(LEAF_COLORS),
        })
      }
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    /** Plants that are not yet dying — the ones that hold a slot. */
    const standingCount = (now: number) =>
      plants.reduce((n, plant) => n + (witherAmount(plant, now) > 0 ? 0 : 1), 0)

    const onPointerDown = (e: PointerEvent) => {
      if (!running) return
      const { x, y } = toLocal(e.clientX, e.clientY)
      if (x < 0 || y < 0 || x > width || y > height) return

      // A press plants: the seed goes in directly below the cursor, but only
      // while there is room under the population cap.
      const now = performance.now()
      if (standingCount(now) < plantDensity()) plants.push(seed(x, now))

      pointer.x = x
      pointer.y = y
      pointer.tx = x
      pointer.ty = y
      pointer.active = true
    }

    // ---- animation ---------------------------------------------------------

    let raf = 0
    let running = false
    let last = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)

      // Normalised against 60fps, and clamped so a backgrounded tab or a long
      // main-thread stall does not fling the whole scene forward at once.
      const dt = Math.min((now - last) / 16.667, 2.5)
      last = now

      pointer.x += (pointer.tx - pointer.x) * POINTER_EASE * dt
      pointer.y += (pointer.ty - pointer.y) * POINTER_EASE * dt

      // Two overlapping periods, so the wind never repeats on an obvious beat.
      const wt = now * 0.00035
      const wind = Math.sin(wt) * 0.6 + Math.sin(wt * 2.3 + 1.1) * 0.25

      // Drop plants that have finished withering. They are already invisible by
      // this point, so this only releases the memory.
      for (let i = plants.length - 1; i >= 0; i--) {
        if (now - plants[i].born >= PLANT_LIFETIME) plants.splice(i, 1)
      }

      let growing = 0
      for (const plant of plants) {
        if (!plant.growing) continue
        growing++
        growPlant(plant, dt, wind, true)
      }

      // A withering plant no longer holds its slot, so its replacement sprouts
      // and fills in while it browns out, rather than after it is gone.
      const capacity = plantDensity()
      if (now >= nextSpawn && growing < MAX_GROWING && standingCount(now) < capacity) {
        plants.push(seed(nextX(), now))
        nextSpawn = now + (PLANT_LIFETIME / capacity) * rand(0.7, 1.3)
      }

      stepTrail(now, dt)
      render(now)
    }

    const start = () => {
      if (running || reduceMotion) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
    }

    // Only animate while the hero is on screen and the tab is visible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start()
        else stop()
      },
      { threshold: 0 },
    )
    observer.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stop()
      else if (canvas.getBoundingClientRect().bottom > 0) start()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    resize()
    document.addEventListener('visibilitychange', onVisibility)

    // The serif display face lands after first paint and reflows the headline
    // under the mask. If the hero's own height does not change with it the
    // ResizeObserver never fires, so the quiet zones are re-measured directly.
    let stale = false
    document.fonts?.ready.then(() => {
      if (stale) return
      buildQuietMask()
      render(performance.now())
    })

    // Reduced motion keeps the primed still scene and skips the loop entirely,
    // so there is nothing for the pointer to drive.
    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onPointerDown, { passive: true })
      window.addEventListener('blur', onPointerLeave)
    }

    return () => {
      stale = true
      stop()
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('blur', onPointerLeave)
    }
  }, [quiet])

  return (
    <div aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
