import type { ReactNode } from 'react'

import { APP_STORE_URL } from './store'
import { Button, Container } from './ui'

const links = [
  { href: '#board', label: 'The board' },
  { href: '#kitchens', label: 'Kitchens' },
  { href: '#label', label: 'The label' },
  { href: '#law', label: 'The law' },
] as const

const SUPPORT_URL = 'https://divinital.com/support'
const PRIVACY_URL = 'https://divinital.com/privacy'
const TERMS_URL = 'https://divinital.com/terms'

const linkClass =
  'rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * Product chrome for the Cottage marketing page. App Store visitors land here,
 * so the frame is Cottage's. The footer returns to this site.
 */
export function CottageFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      id="top"
      data-theme="cottage"
      className="cottage-page flex min-h-svh flex-col font-sans text-foreground"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-[color-mix(in_oklch,var(--background)_88%,white)] backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <img
              src="/cottage/app-icon.png"
              alt=""
              width={36}
              height={36}
              className="size-9 rounded-[0.55rem]"
            />
            <span className="font-serif text-xl tracking-tight">Cottage</span>
          </a>
          <nav aria-label="Cottage" className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <a href={SUPPORT_URL} className={linkClass}>
              Support
            </a>
            <Button
              asChild
              size="sm"
              className="rounded-full shadow-[0_8px_18px_oklch(0.35_0.08_50_/_0.18)]"
            >
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                Get the app
              </a>
            </Button>
          </div>
        </Container>
        <Container className="flex gap-5 overflow-x-auto pb-3 lg:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={`${linkClass} shrink-0`}>
              {link.label}
            </a>
          ))}
        </Container>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/70 py-10">
        <Container className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-2xl tracking-tight">Cottage</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Built in Jensen Beach. A person reads the mail at{' '}
              <a
                className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                href="mailto:cottage.support@protonmail.com"
              >
                cottage.support@protonmail.com
              </a>
              .
            </p>
          </div>
          <nav aria-label="Cottage policies" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href={SUPPORT_URL} className={linkClass}>
              Support
            </a>
            <a href={PRIVACY_URL} className={linkClass}>
              Privacy
            </a>
            <a href={TERMS_URL} className={linkClass}>
              Terms
            </a>
            <a href={APP_STORE_URL} className={linkClass} target="_blank" rel="noopener noreferrer">
              App Store
            </a>
            <a href="/" className={linkClass}>
              Portfolio
            </a>
          </nav>
        </Container>
        <Container className="mt-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Brandon Richard Guergo. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  )
}
