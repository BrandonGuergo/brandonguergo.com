import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'

import SectionHeading from './SectionHeading'
import { PHOTOS, PhotoImage } from '../photos'

const SIZES = '(max-width: 768px) 92vw, 704px'

/**
 * Horizontal print carousel. A swipe, a sideways trackpad scroll, or an arrow
 * brings the next photograph forward. The print in the frame is full size.
 * The one leaving slides off to the side and fades. It never crosses the one
 * coming in.
 */
export default function ParallaxPhotos() {
  const stageRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLParagraphElement>(null)
  const api = useRef({ step: (_dir: number) => {}, goTo: (_index: number) => {} })
  const applyRef = useRef<() => void>(() => {})
  const [active, setActive] = useState(0)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const slides = [...stage.querySelectorAll<HTMLElement>('[data-slide]')]
    const n = slides.length
    const max = n - 1
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduce = motion.matches
    let position = 0
    let target = 0
    let dragging = false
    let wheeling = false
    let running = false
    let raf = 0
    let last = 0
    let lastActive = 0
    let wheelTimer = 0
    let alive = true

    const span = () => Math.max(1, (slides[0]?.offsetWidth ?? 1) * 0.9)

    const rubber = (value: number) => {
      if (value < 0) return value * 0.35
      if (value > max) return max + (value - max) * 0.35
      return value
    }

    const apply = () => {
      slides.forEach((slide, i) => {
        const d = i - position
        const ad = Math.abs(d)
        const photo = slide.querySelector<HTMLElement>('[data-layer="photo"]')
        const caption = slide.querySelector<HTMLElement>('[data-layer="caption"]')
        if (reduce) {
          const on = ad < 0.5
          slide.style.transform = 'translate(-50%, -50%)'
          slide.style.opacity = on ? '1' : '0'
          slide.style.visibility = on ? 'visible' : 'hidden'
          slide.style.zIndex = on ? '2' : '1'
          if (photo) photo.style.transform = ''
          if (caption) caption.style.transform = ''
          const veil = slide.querySelector<HTMLElement>('[data-layer="veil"]')
          if (veil) veil.style.opacity = '0'
          return
        }
        const cardW = slides[0]?.offsetWidth ?? 1
        // A full card plus a gap, so two mats never share an edge. The one
        // leaving dissolves as it travels; no turn, so nothing can slice
        // through the print that is coming forward.
        const t = Math.min(ad, 1)
        const smooth = t * t * (3 - 2 * t)
        const x = d * (cardW + 40)
        const scale = 1 - smooth * 0.16
        const fade = 1 - smooth
        slide.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, 0) scale(${scale})`
        slide.style.opacity = String(fade)
        slide.style.visibility = fade < 0.02 ? 'hidden' : 'visible'
        slide.style.zIndex = String(100 - Math.round(ad * 10))
        const clamped = Math.max(-1, Math.min(1, d))
        if (photo) photo.style.transform = `translate3d(${clamped * -5}%, 0, 0) scale(1.08)`
        if (caption) caption.style.transform = `translate3d(${clamped * 12}px, 0, 0)`
        const veil = slide.querySelector<HTMLElement>('[data-layer="veil"]')
        if (veil) veil.style.opacity = '0'
      })

      const nearest = Math.max(0, Math.min(max, Math.round(position)))
      if (alive && nearest !== lastActive) {
        lastActive = nearest
        setActive(nearest)
        const photo = PHOTOS[nearest]
        if (liveRef.current && photo) {
          liveRef.current.textContent = `${photo.caption}, ${nearest + 1} of ${n}`
        }
      }
    }

    applyRef.current = apply

    const frame = (now: number) => {
      const dt = last ? Math.min(40, now - last) : 16
      last = now
      if (!dragging && !wheeling) {
        if (reduce || Math.abs(target - position) < 0.001) position = target
        else position += (target - position) * (1 - Math.exp(-dt / 130))
      }
      apply()
      if (!dragging && !wheeling && position === target) {
        running = false
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }

    const goTo = (index: number) => {
      dragging = false
      wheeling = false
      target = Math.max(0, Math.min(max, index))
      if (reduce) position = target
      wake()
    }

    api.current.step = (dir) => goTo(Math.round(target) + dir)
    api.current.goTo = goTo

    type Drag = {
      id: number
      pointer: string
      x: number
      y: number
      origin: number
      locked: 'x' | 'y' | null
      lastX: number
      lastT: number
      vx: number
    }
    let drag: Drag | null = null

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      drag = {
        id: event.pointerId,
        pointer: event.pointerType,
        x: event.clientX,
        y: event.clientY,
        origin: position,
        locked: null,
        lastX: event.clientX,
        lastT: performance.now(),
        vx: 0,
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (!drag.locked) {
        if (Math.hypot(dx, dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          drag = null
          return
        }
        drag.locked = 'x'
        dragging = true
        wheeling = false
      }
      if (drag.locked !== 'x') return
      const now = performance.now()
      const instant = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT)
      drag.vx = drag.vx * 0.65 + instant * 0.35
      drag.lastX = event.clientX
      drag.lastT = now
      position = rubber(drag.origin - (event.clientX - drag.x) / span())
      target = position
      apply()
    }

    const finishDrag = (event: PointerEvent, cancel: boolean) => {
      if (!drag || event.pointerId !== drag.id) return
      const current = drag
      drag = null
      dragging = false
      if (current.locked !== 'x') {
        if (!cancel && current.pointer === 'mouse' && current.locked === null) {
          const rect = stage.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width
          if (x < 0.28) goTo(Math.round(position) - 1)
          else if (x > 0.72) goTo(Math.round(position) + 1)
        }
        return
      }
      if (cancel) {
        target = Math.max(0, Math.min(max, Math.round(position)))
        wake()
        return
      }
      const delta = position - current.origin
      const intent = Math.abs(current.vx) > 0.45 || Math.abs(delta) > 0.16
      let dest = Math.round(current.origin)
      if (Math.abs(delta) >= 1) dest = Math.round(position)
      else if (intent) dest = dest + Math.sign(delta || -current.vx)
      target = Math.max(0, Math.min(max, dest))
      wake()
    }

    const onPointerUp = (event: PointerEvent) => finishDrag(event, false)
    const onPointerCancel = (event: PointerEvent) => finishDrag(event, true)

    const onWheel = (event: WheelEvent) => {
      let dx = event.deltaX
      if (event.deltaMode === 1) dx *= 16
      else if (event.deltaMode === 2) dx *= stage.clientWidth
      if (Math.abs(dx) <= Math.abs(event.deltaY) || Math.abs(dx) < 0.5) return
      event.preventDefault()
      if (!wheeling) {
        wheeling = true
        dragging = false
      }
      position = rubber(position + dx / span())
      target = position
      apply()
      window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => {
        wheeling = false
        target = Math.max(0, Math.min(max, Math.round(position)))
        wake()
      }, 90)
    }

    const onMotion = () => {
      reduce = motion.matches
      apply()
    }

    const onResize = () => apply()
    const resize = new ResizeObserver(onResize)

    apply()
    stage.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    stage.addEventListener('wheel', onWheel, { passive: false })
    motion.addEventListener('change', onMotion)
    resize.observe(stage)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.clearTimeout(wheelTimer)
      stage.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      stage.removeEventListener('wheel', onWheel)
      motion.removeEventListener('change', onMotion)
      resize.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    applyRef.current()
  }, [active])

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest('a')) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      api.current.step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      api.current.step(-1)
    }
  }

  return (
    <section
      id="photography"
      aria-roledescription="carousel"
      aria-label="Photographs"
      onKeyDown={onKeyDown}
    >
      <div className="mx-auto max-w-7xl border-t border-soil/10 px-6 pt-20 pb-2 md:px-8 md:pt-24">
        <SectionHeading
          eyebrow="Landscape &amp; Wildlife"
          title="My"
          accent="Photography"
          index="03"
        />
      </div>

      <p ref={liveRef} className="sr-only" aria-live="polite" />

      <div className="relative mt-8 md:mx-auto md:flex md:max-w-7xl md:items-center md:gap-5 md:px-8">
        <button
          type="button"
          aria-label="Previous photograph"
          disabled={active === 0}
          onClick={() => api.current.step(-1)}
          className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-parchment text-bark shadow-[0_8px_24px_rgba(30,26,19,0.16)] ring-1 ring-soil/20 transition-colors hover:text-emerald disabled:opacity-30 md:inline-flex"
        >
          <Chevron dir={-1} />
        </button>
        <div className="@container min-w-0 flex-1">
          <div
            ref={stageRef}
            data-photo-stage
            className="photo-fade relative h-[calc(min(86cqw,44rem)*2/3+4.5rem)] cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing md:h-[calc(min(72cqw,44rem)*2/3+4.5rem)]"
          >
            {PHOTOS.map((photo, i) => (
              <figure
                key={photo.base}
                data-slide={i}
                className="pointer-events-none absolute top-1/2 left-1/2 w-[min(86cqw,44rem)] origin-center will-change-transform md:w-[min(72cqw,44rem)]"
              >
                <div className="bg-[#fbf7f0] p-2 shadow-[0_18px_40px_rgba(30,26,19,0.22)] ring-1 ring-soil/10 md:p-3">
                  <div className="relative aspect-[3/2] overflow-hidden bg-bark">
                    <div data-layer="photo" className="absolute inset-0 will-change-transform">
                      <PhotoImage
                        photo={photo}
                        sizes={SIZES}
                        loading="eager"
                        className="pointer-events-none h-full w-full max-w-none object-cover"
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-[rgba(11,26,17,0.72)] to-transparent" />
                    <figcaption
                      data-layer="caption"
                      className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4 text-[0.65rem] tracking-[0.28em] text-parchment uppercase md:p-6"
                    >
                      <span className="block h-px w-6 shrink-0 bg-sage-light" />
                      {photo.caption}
                    </figcaption>
                    <div data-layer="veil" className="pointer-events-none absolute inset-0 bg-[#1a140e] opacity-0" />
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Next photograph"
          disabled={active === PHOTOS.length - 1}
          onClick={() => api.current.step(1)}
          className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-parchment text-bark shadow-[0_8px_24px_rgba(30,26,19,0.16)] ring-1 ring-soil/20 transition-colors hover:text-emerald disabled:opacity-30 md:inline-flex"
        >
          <Chevron dir={1} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.base}
            type="button"
            aria-label={`Show ${photo.caption}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => api.current.goTo(i)}
            className="flex h-8 w-8 items-center justify-center"
          >
            <span
              className={`block h-px transition-[width,background-color] duration-300 ${
                i === active ? 'w-7 bg-emerald' : 'w-3.5 bg-soil/30'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-2 pb-20 md:px-8 md:pb-24">
        <a
          id="all-photographs"
          href="/photographs/"
          className="inline-flex items-center gap-2.5 rounded-sm border border-emerald px-5 py-2.5 text-sm text-emerald transition-colors hover:bg-emerald hover:text-parchment"
        >
          All photographs
          <span aria-hidden="true">→</span>
        </a>
        <p data-photo-count className="text-[0.65rem] tracking-[0.28em] text-soil uppercase">
          {active + 1} / {PHOTOS.length}
        </p>
      </div>
    </section>
  )
}

function Chevron({ dir }: { dir: -1 | 1 }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none">
      <path
        d={dir < 0 ? 'M11.5 3.5 L6 9 L11.5 14.5' : 'M6.5 3.5 L12 9 L6.5 14.5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
