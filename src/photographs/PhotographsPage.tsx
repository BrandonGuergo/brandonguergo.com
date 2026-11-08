import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  CATEGORIES,
  PHOTOS,
  PhotoImage,
  type CategoryFilter,
  type Photo,
} from '../photos'

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let transitionRunning = false

function runTransition(update: () => void) {
  if (
    prefersReducedMotion() ||
    typeof document.startViewTransition !== 'function' ||
    transitionRunning
  ) {
    update()
    return Promise.resolve()
  }
  transitionRunning = true
  const transition = document.startViewTransition(() => {
    flushSync(update)
  })
  // `ready` rejects with AbortError when a newer transition skips this one.
  transition.ready.catch(() => {})
  return transition.finished.catch(() => {}).finally(() => {
    transitionRunning = false
  })
}

function filtered(category: CategoryFilter) {
  if (category === 'All') return PHOTOS
  return PHOTOS.filter((photo) => photo.category === category)
}

export default function PhotographsPage() {
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [selected, setSelected] = useState<Photo | null>(null)
  const [shareName, setShareName] = useState<string | null>(null)
  const [namesOn, setNamesOn] = useState(true)
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false })
  const rowRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const closeRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const wasOpen = useRef(false)

  const visible = filtered(category)

  const measure = () => {
    const row = rowRef.current
    const button = buttonRefs.current[CATEGORIES.indexOf(category)]
    if (!row || !button) return
    const rowBox = row.getBoundingClientRect()
    const box = button.getBoundingClientRect()
    setIndicator({
      left: box.left - rowBox.left - row.clientLeft,
      top: box.top - rowBox.top - row.clientTop,
      width: box.width,
      height: box.height,
      ready: true,
    })
  }

  useLayoutEffect(() => {
    measure()
  }, [category])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [category])

  useEffect(() => {
    if (selected && !wasOpen.current) closeRef.current?.focus()
    if (!selected && wasOpen.current) openerRef.current?.focus()
    wasOpen.current = selected !== null
  }, [selected])

  const viewerOpen = selected !== null

  useEffect(() => {
    if (!viewerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [viewerOpen])

  useEffect(() => {
    if (!selected) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        step(-1)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected, category])

  const choose = (next: CategoryFilter) => {
    if (next === category) return
    void runTransition(() => {
      setCategory(next)
      setSelected(null)
      setShareName(null)
      setNamesOn(true)
    })
  }

  const open = (photo: Photo, button: HTMLButtonElement) => {
    openerRef.current = button
    void runTransition(() => {
      setShareName(photo.base)
      setSelected(photo)
    }).then(() => setShareName(null))
  }

  const close = () => {
    void runTransition(() => {
      setSelected(null)
      setShareName(null)
      setNamesOn(false)
    }).then(() => setNamesOn(true))
  }

  const step = (delta: number) => {
    if (!selected || visible.length < 2) return
    const index = visible.findIndex((photo) => photo.base === selected.base)
    const next = visible[(index + delta + visible.length) % visible.length]
    if (!next) return
    void runTransition(() => setSelected(next))
  }

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <header className="border-b border-soil/15">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-6 py-6 md:px-8">
          <a href="/" className="font-serif text-2xl text-bark transition-colors hover:text-emerald">
            Brandon Guergo
          </a>
          <a href="/#photography" className="text-sm text-soil transition-colors hover:text-emerald">
            Back
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-12 pb-24 md:px-8 md:pt-16">
        <p className="text-[0.65rem] tracking-[0.3em] text-emerald-pop uppercase">
          Landscape &amp; Wildlife
        </p>
        <div className="mt-3 flex flex-col gap-8 border-b border-soil/15 pb-8 md:flex-row md:items-end md:justify-between">
          <h1 className="font-serif text-5xl leading-none font-medium tracking-tight text-bark md:text-6xl">
            Photographs
          </h1>
          <div
            ref={rowRef}
            role="toolbar"
            aria-label="Categories"
            className="relative inline-flex self-start rounded-full border border-soil/15 bg-card p-1"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full bg-emerald"
              style={{
                left: indicator.left,
                top: indicator.top,
                width: indicator.width,
                height: indicator.height,
                opacity: indicator.ready ? 1 : 0,
                transition: prefersReducedMotion()
                  ? 'none'
                  : `left 0.5s ${EASE}, top 0.5s ${EASE}, width 0.5s ${EASE}, height 0.5s ${EASE}, opacity 0.2s linear`,
              }}
            />
            {CATEGORIES.map((item, index) => {
              const active = item === category
              return (
                <button
                  key={item}
                  ref={(node) => {
                    buttonRefs.current[index] = node
                  }}
                  type="button"
                  aria-pressed={active}
                  onClick={() => choose(item)}
                  className={`relative z-10 rounded-full px-4 py-2 text-sm transition-colors duration-500 ${
                    active ? 'text-parchment' : 'text-soil hover:text-bark'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted">
          {visible.length} {visible.length === 1 ? 'photograph' : 'photographs'}
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
          {visible.map((photo, index) => {
            const feature = visible.length === 1 || (category === 'All' && index === 0)
            const gridName = !namesOn || selected ? undefined : `photo-${photo.base}`
            return (
              <li key={photo.base} className={feature ? 'md:col-span-2' : undefined}>
                <button
                  type="button"
                  onClick={(event) => open(photo, event.currentTarget)}
                  className="group block w-full text-left"
                >
                  <PhotoImage
                    photo={photo}
                    sizes={
                      feature
                        ? '(min-width: 48rem) 1088px, calc(100vw - 3rem)'
                        : '(min-width: 48rem) 520px, calc(100vw - 3rem)'
                    }
                    vtName={gridName}
                    className={`w-full object-cover ${feature ? 'aspect-[16/9]' : 'aspect-[3/2]'}`}
                  />
                  <span className="mt-4 block">
                    <span className="block font-serif text-2xl text-bark md:text-3xl">{photo.caption}</span>
                    {photo.place ? <span className="mt-1 block text-sm text-soil">{photo.place}</span> : null}
                    <span className="mt-2 block text-[0.65rem] tracking-[0.22em] text-muted uppercase">
                      {photo.category}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </main>

      {selected ? (
        <div className="fixed inset-0 z-[1100]" style={{ viewTransitionName: 'viewer-scrim' }}>
          <button
            type="button"
            className="absolute inset-0 bg-[#0b1a11]/90"
            aria-label="Close photograph"
            onClick={close}
          />
          <figure className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 pt-16 pb-10">
            <PhotoImage
              photo={selected}
              sizes="92vw"
              loading="eager"
              vtName={shareName === selected.base ? `photo-${selected.base}` : 'viewer-photo'}
              className="pointer-events-auto max-h-[74vh] w-auto max-w-full object-contain shadow-2xl"
            />
            <figcaption className="pointer-events-none mt-5 text-center">
              <span className="block font-serif text-3xl text-parchment">{selected.caption}</span>
              {selected.place ? (
                <span className="mt-1 block text-sm text-cream/70">{selected.place}</span>
              ) : null}
            </figcaption>
          </figure>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="absolute top-5 right-5 rounded-full border border-cream/20 px-4 py-2 text-sm text-parchment transition-colors hover:bg-cream/10"
          >
            Close
          </button>
          {visible.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="absolute top-1/2 left-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/20 text-lg text-parchment transition-colors hover:bg-cream/10 md:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/20 text-lg text-parchment transition-colors hover:bg-cream/10 md:right-6"
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
