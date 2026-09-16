import { useCallback, useEffect, useRef, useState } from 'react'

import MatrixName from './MatrixName'

type NavLink = {
  href: string
  label: string
  external: boolean
}

const NAV_LINKS: readonly NavLink[] = [
  { href: '#programming', label: 'Projects', external: false },
  { href: '#photography', label: 'Photography', external: false },
  { href: '#about', label: 'About', external: false },
  { href: 'https://github.com/BrandonGuergo', label: 'GitHub', external: true },
]

/** In-page sections tracked for the active-link underline. */
const SECTION_IDS = NAV_LINKS.filter((l) => !l.external).map((l) => l.href.slice(1))

const DRAWER_LINK_CLASS =
  'block py-4 font-medium text-muted uppercase tracking-widest text-lg hover:text-emerald hover:pl-2 transition-all'

export default function Header() {
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
  useEffect(() => {
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
  }, [])

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

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-100 py-4 transition-colors duration-500 ${
          scrolled || isOpen
            ? 'border-b border-sage-light/20 bg-linear-to-br from-[#171208] via-[#16281c] to-[#0b1a11] backdrop-blur-2xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-8">
          <a
            href="#top"
            className={`font-serif text-xl font-semibold tracking-wider transition-colors duration-500 ${
              scrolled || isOpen ? 'text-parchment' : 'text-white'
            }`}
          >
            <MatrixName decodeKey={scrolled || isOpen} />
          </a>

          {/* Desktop nav */}
          <ul className="hidden gap-10 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = !link.external && active === link.href.slice(1)
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative pb-1 text-xs font-medium tracking-widest uppercase transition-colors duration-500 ${
                      scrolled
                        ? isActive
                          ? 'text-sage-light'
                          : 'text-cream/75 hover:text-parchment'
                        : isActive
                          ? 'text-parchment'
                          : 'text-cream/60 hover:text-parchment'
                    } after:absolute after:bottom-0 after:left-0 after:h-0.5 after:transition-all after:duration-300 after:content-[''] ${
                      scrolled ? 'after:bg-sage-light' : 'after:bg-sage-light'
                    } ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'}`}
                    {...(link.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : null)}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
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
                className={`block h-0.5 w-6 rounded-sm transition-all duration-300 ${
                  scrolled || isOpen ? 'bg-parchment' : 'bg-parchment'
                } ${state}`}
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
        className={`fixed top-0 right-0 left-0 z-99 bg-parchment/98 px-6 pt-20 backdrop-blur-3xl transition-[transform,visibility] duration-500 md:hidden ${
          isOpen ? 'translate-y-0 visible' : '-translate-y-full invisible'
        }`}
      >
        <ul className="space-y-0">
          {NAV_LINKS.map((link, idx) => (
            <li
              key={link.href}
              className={`border-t border-soil/10 ${
                idx === NAV_LINKS.length - 1 ? 'border-b' : ''
              }`}
            >
              <a
                href={link.href}
                onClick={closeMenu}
                className={DRAWER_LINK_CLASS}
                {...(link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : null)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
