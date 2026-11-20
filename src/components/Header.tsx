import { useCallback, useEffect, useRef, useState } from 'react'

import MatrixName from './MatrixName'

type NavLink = {
  href: string
  label: string
  external: boolean
}

const NAV_LINKS: readonly NavLink[] = [
  { href: '#programming', label: 'Software Projects', external: false },
  { href: '#about', label: 'About', external: false },
  { href: 'https://github.com/BrandonGuergo', label: 'GitHub', external: true },
]

/** Pages reached from Other Works. Each one is its own document, not a section of home. */
const OTHER_WORKS = [{ href: '/photographs/', label: 'Photography' }] as const

/** In-page sections tracked for the active-link underline. */
const SECTION_IDS = NAV_LINKS.filter((l) => !l.external).map((l) => l.href.slice(1))

const DRAWER_LINK_CLASS =
  'block py-4 font-medium text-muted uppercase tracking-widest text-lg hover:text-emerald hover:pl-2 transition-all'

function navLinkClass(solid: boolean, isActive: boolean) {
  return `relative pb-1 text-xs font-medium tracking-widest uppercase transition-colors duration-500 ${
    solid
      ? isActive
        ? 'text-sage-light'
        : 'text-cream/75 hover:text-parchment'
      : isActive
        ? 'text-parchment'
        : 'text-cream/60 hover:text-parchment'
  } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-sage-light after:transition-all after:duration-300 after:content-[''] ${
    isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
  }`
}

function OtherWorksMenu({ solid }: { solid: boolean }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const rootRef = useRef<HTMLLIElement>(null)
  const open = hover || pinned

  const close = () => {
    setHover(false)
    setPinned(false)
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <li
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close()
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="other-works-menu"
        onClick={() => setPinned((value) => !value)}
        className={`${navLinkClass(solid, open)} inline-flex items-center gap-2`}
      >
        Other Works
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 border-r border-b border-current transition-transform duration-200 ${
            open ? '-translate-y-px rotate-[225deg]' : 'translate-y-px rotate-45'
          }`}
        />
      </button>
      <div className={`absolute top-full left-1/2 z-10 -translate-x-1/2 pt-3 ${open ? '' : 'hidden'}`}>
        <ul
          id="other-works-menu"
          role="menu"
          aria-label="Other Works"
          className="min-w-44 border border-sage-light/20 bg-linear-to-br from-[#171208] via-[#16281c] to-[#0b1a11] py-2 shadow-2xl"
        >
          {OTHER_WORKS.map((item) => (
            <li key={item.href} role="none">
              <a
                role="menuitem"
                href={item.href}
                className="block px-4 py-2.5 text-xs font-medium tracking-widest text-cream/80 uppercase transition-colors hover:bg-cream/5 hover:text-parchment"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export default function Header({ overHero = true }: { overHero?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  // The header floats transparently over the dark hero and only takes on the
  // parchment bar once the page has scrolled past it.
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Whichever tracked section is crossing the middle of the viewport wins.
  // Other pages have none of these sections, so the observer stays off.
  useEffect(() => {
    if (!overHero) return
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (sections.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        // Keep document order rather than intersection-callback order.
        const first = SECTION_IDS.find((id) => visible.has(id))
        setActive(first ?? null)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [overHero])

  // Body scroll lock, tied to state rather than to the click handler so the
  // lock can never drift out of sync with whether the drawer is actually open.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Escape to close + focus trap while open.
  useEffect(() => {
    if (!isOpen) return

    const drawer = drawerRef.current
    if (!drawer) return

    const focusables = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((el) => el.offsetParent !== null)

    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        return
      }
      if (e.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      // Wrap at both ends, and pull focus back in if it has escaped the drawer.
      if (e.shiftKey && (active === first || !drawer.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !drawer.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (target && drawer.contains(target)) return
      if (target && hamburgerRef.current?.contains(target)) return
      closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen, closeMenu])

  // Return focus to the trigger when the drawer closes, but only if focus is
  // still inside the (now hidden) drawer — otherwise we would steal it.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      const active = document.activeElement
      if (!active || active === document.body || drawerRef.current?.contains(active)) {
        hamburgerRef.current?.focus()
      }
    }
    wasOpen.current = isOpen
  }, [isOpen])

  const bar = !overHero || scrolled || isOpen
  const linkTone = !overHero || scrolled
  const hashHref = (hash: string) => (overHero ? hash : `/${hash}`)

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-100 py-4 transition-colors duration-500 ${
          bar
            ? 'border-b border-sage-light/20 bg-linear-to-br from-[#171208] via-[#16281c] to-[#0b1a11]'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-8">
          <a
            href={overHero ? '#top' : '/'}
            className={`font-serif text-xl font-semibold tracking-wider transition-colors duration-500 ${
              bar ? 'text-parchment' : 'text-white'
            }`}
          >
            <MatrixName decodeKey={bar} />
          </a>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-10 md:flex">
            <li>
              <a
                href={hashHref('#programming')}
                aria-current={active === 'programming' ? 'true' : undefined}
                className={navLinkClass(linkTone, active === 'programming')}
              >
                Software Projects
              </a>
            </li>
            <OtherWorksMenu solid={linkTone} />
            <li>
              <a
                href={hashHref('#about')}
                aria-current={active === 'about' ? 'true' : undefined}
                className={navLinkClass(linkTone, active === 'about')}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="https://github.com/BrandonGuergo"
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass(linkTone, false)}
              >
                GitHub
              </a>
            </li>
          </ul>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            className="hamburger flex h-10 w-10 cursor-pointer flex-col justify-center gap-1 rounded-2xl p-1.5 transition-colors hover:bg-parchment/10 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobileDrawer"
            onClick={() => setIsOpen((open) => !open)}
          >
            {[
              isOpen ? 'translate-y-1.5 rotate-45' : '',
              isOpen ? 'scale-x-0 opacity-0' : '',
              isOpen ? '-translate-y-1.5 -rotate-45' : '',
            ].map((state, idx) => (
              <span
                key={idx}
                className={`block h-0.5 w-6 rounded-sm bg-parchment transition-all duration-300 ${state}`}
              ></span>
            ))}
          </button>
        </nav>
      </header>

      {/* Mobile drawer. `invisible` when closed keeps it out of the tab order;
          transitioning visibility alongside transform preserves the slide-out. */}
      <div
        id="mobileDrawer"
        ref={drawerRef}
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 left-0 z-99 bg-parchment/98 px-6 pt-20 transition-[transform,visibility] duration-500 md:hidden ${
          isOpen ? 'translate-y-0 visible' : '-translate-y-full invisible'
        }`}
      >
        <ul className="space-y-0">
          <li className="border-t border-soil/10">
            <a href={hashHref('#programming')} onClick={closeMenu} className={DRAWER_LINK_CLASS}>
              Software Projects
            </a>
          </li>
          <li className="border-t border-soil/10">
            <p className="pt-4 text-[0.65rem] font-medium tracking-[0.28em] text-muted/70 uppercase">
              Other Works
            </p>
            <ul>
              {OTHER_WORKS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} onClick={closeMenu} className={`${DRAWER_LINK_CLASS} py-3 pl-4`}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="border-t border-soil/10">
            <a href={hashHref('#about')} onClick={closeMenu} className={DRAWER_LINK_CLASS}>
              About
            </a>
          </li>
          <li className="border-t border-b border-soil/10">
            <a
              href="https://github.com/BrandonGuergo"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={DRAWER_LINK_CLASS}
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </>
  )
}
