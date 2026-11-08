import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { twMerge } from 'tailwind-merge'

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={twMerge('mx-auto w-full max-w-6xl px-6 lg:px-8', className)} {...props} />
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={twMerge('py-16 sm:py-24', className)} {...props} />
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium tracking-[0.01em] transition-[color,background-color,box-shadow,transform] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]'

const buttonVariant = {
  default:
    'bg-accent text-accent-foreground shadow-[0_0_24px_color-mix(in_oklch,var(--accent)_35%,transparent)] hover:bg-accent/90',
  outline:
    'border border-foreground/15 bg-foreground/5 text-foreground backdrop-blur-sm hover:border-accent/40 hover:bg-foreground/10',
} as const

const buttonSize = {
  default: 'h-11 px-6',
  sm: 'h-9 px-4',
  lg: 'h-12 px-8 text-base',
} as const

export function Button({
  asChild = false,
  variant = 'default',
  size = 'default',
  className,
  children,
}: {
  asChild?: boolean
  variant?: keyof typeof buttonVariant
  size?: keyof typeof buttonSize
  className?: string
  children: ReactNode
}) {
  const classes = twMerge(buttonBase, buttonVariant[variant], buttonSize[size], className)
  if (asChild && isValidElement<{ className?: string }>(children)) {
    const child = children as ReactElement<{ className?: string }>
    return cloneElement(child, { className: twMerge(classes, child.props.className) })
  }
  return (
    <button type="button" className={classes}>
      {children}
    </button>
  )
}

/** Fades and lifts on scroll. Reduced motion leaves the children still. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        el.classList.add('is-visible')
        observer.disconnect()
      },
      { rootMargin: '-60px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={twMerge('cottage-reveal', className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}
