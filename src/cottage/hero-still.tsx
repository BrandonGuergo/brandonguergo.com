import { ExampleBakeCard, exampleBakes } from './fresh-board'

/** The word "Fresh" wears the same steam as the app's board. */
export function FreshSteam() {
  return (
    <svg viewBox="0 0 36 18" className="cottage-steam h-4 w-9 text-accent" aria-hidden="true">
      <path
        d="M8 16c0-4 2.4-4.2 2.4-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 16c0-5 2.6-5.2 2.6-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M28 16c0-3.6 2.2-3.8 2.2-7.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * A poster-scale fresh card with the app icon sitting on its corner —
 * the object people just tapped on the App Store, landed on the page.
 * The loaf is the one in the mitt: Rosa Delgado's country sourdough.
 */
export function HeroStill() {
  const mittLoaf = exampleBakes[0]
  return (
    <div className="relative mx-auto w-full max-w-md pt-10 pl-8 sm:pl-10">
      <ExampleBakeCard bake={mittLoaf} prominent />
      <img
        src="/cottage/app-icon.png"
        alt=""
        width={128}
        height={128}
        className="absolute -top-2 -left-3 w-24 rounded-[1.4rem] shadow-[0_14px_18px_oklch(0.3_0.05_50_/_0.22)] sm:-left-4 sm:w-28"
      />
    </div>
  )
}
