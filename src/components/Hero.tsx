import PlantScene from './PlantScene'

/** Bottom strip. Every line is drawn from what the rest of the page already claims. */
const META = [
  { label: 'Based in', value: 'Florida, USA' },
  { label: 'Building', value: 'AI integrated web-apps' },
] as const

const INDEX = [
  { href: '#programming', num: '01', label: 'Software Projects' },
  { href: '#about', num: '02', label: 'About' },
] as const

const SIGNALS = [
  { label: 'Focus', value: 'Languages & structures' },
  { label: 'Surface', value: 'Web · iOS' },
] as const

export default function Hero() {
  return (
    <section
      aria-label="Introduction"
      className="relative isolate flex min-h-screen min-h-svh flex-col overflow-hidden"
    >
      {/* Base gradient. The canvas composites additively on top of it. */}
      <div className="absolute inset-0 -z-20 bg-linear-to-br from-[#171208] via-[#16281c] to-[#0b1a11]" />
      {/* `data-quiet` marks the blocks the field thins out behind. */}
      <PlantScene className="absolute inset-0 -z-10 h-full w-full" quiet="[data-quiet]" />
      {/* Vignette, so the type never fights the brightest part of the field. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_35%,rgba(6,14,9,0.72)_100%)]" />
      {/* Scrim. The canvas quiet zones clear the growth out from behind the
          type, but the base gradient runs warm at the top left and the meta
          strip sits over open field. One directional wash and one bottom fade
          settle both, with no edge anywhere for the eye to catch on. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(105deg,rgba(6,14,9,0.78)_0%,rgba(6,14,9,0.45)_42%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-[linear-gradient(to_top,rgba(6,14,9,0.85)_0%,rgba(6,14,9,0.5)_45%,transparent_100%)]" />

      <div className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-6 pt-24 pb-6 md:px-8 md:pt-28 md:pb-10">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-8">
          {/* Eyebrow, name, line and calls to action are one sheltered block,
              so the field parts around the whole introduction rather than
              around each line of it. No padding: the type aligns to the page
              margin like print, and the calm is padded outward on the canvas
              side instead (`QUIET_PAD` in PlantScene).

              `data-quiet` sits on the inner `w-fit` wrapper rather than on the
              grid cell. The cell is eight of twelve columns wide whatever the
              type does, so measuring it stranded the quiet zone's right edge
              far past the name; fit-content ends the calm where the longest
              line ends. `max-w-full` keeps the paragraph's `max-w-md` from
              setting a width narrow viewports cannot honour. */}
          <div className="animate-fadeInUp opacity-0 lg:col-span-8" style={{ animationDelay: '0s' }}>
            <div data-quiet className="w-fit max-w-full">
              <p className="mb-6 flex items-center gap-3 text-[0.7rem] tracking-[0.32em] text-sage-light uppercase">
                <span className="block h-px w-8 bg-sage" />
                Developer
              </p>

              <h1 className="font-serif text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.86] font-medium tracking-tight text-parchment">
                <em className="hero-name-sweep text-emerald-pop italic">Brandon</em>
                <br />
                Guergo
              </h1>

              <p className="mt-7 max-w-md text-lg leading-8 tracking-wide text-cream/75">
                I build programming languages and data structures from scratch.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#programming"
                  className="rounded-sm border border-emerald-mid bg-emerald-mid px-6 py-3 text-xs font-semibold tracking-[0.2em] text-parchment uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-pop hover:shadow-2xl motion-reduce:hover:translate-y-0"
                >
                  View Projects
                </a>
              </div>
            </div>
          </div>

          {/* Instrument panel. Same job as the old index — navigation and
              ballast — drawn as a readout so the software side of the page
              has a voice of its own beside the field. */}
          <nav
            aria-label="Page sections"
            data-quiet
            className="animate-fadeInUp relative border border-cream/15 bg-[#07140d]/72 p-5 opacity-0 shadow-[0_0_40px_rgba(61,138,99,0.08)] lg:col-span-4"
            style={{ animationDelay: '0.16s' }}
          >
            <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t border-l border-sage-light/70" />
            <span className="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t border-r border-sage-light/70" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-sage-light/70" />
            <span className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-sage-light/70" />

            <div className="flex items-center justify-between font-mono text-[0.62rem] tracking-[0.28em] text-sage-light uppercase">
              <span>System</span>
              <span className="flex items-center gap-2 text-cream/70">
                <span className="size-1.5 rounded-full bg-emerald-pop shadow-[0_0_8px_rgba(61,138,99,0.9)]" />
                Ready
                <span className="hud-caret text-emerald-pop">▍</span>
              </span>
            </div>

            <ul className="mt-4 divide-y divide-cream/12 border-y border-cream/12">
              {INDEX.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="group flex items-baseline gap-4 py-3 text-sm tracking-[0.18em] text-cream/70 uppercase transition-colors hover:text-parchment"
                  >
                    <span className="font-mono text-[0.65rem] text-emerald-pop/80">{item.num}</span>
                    {item.label}
                    <span className="ml-auto text-cream/25 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 font-mono text-[0.65rem] tracking-[0.14em] text-cream/45 uppercase">
              {SIGNALS.map((signal) => (
                <div key={signal.label} className="flex items-baseline justify-between gap-4">
                  <dt>{signal.label}</dt>
                  <dd className="text-right text-cream/80">{signal.value}</dd>
                </div>
              ))}
            </dl>
          </nav>
        </div>
      </div>

      {/* The strip is full-bleed, so it rides the bottom scrim rather than
          claiming a quiet zone of its own — a band that wide would erase the
          whole base of the field. A hairline separates it from the scene. */}
      <div
        className="animate-fadeInUp relative border-t border-cream/10 opacity-0"
        style={{ animationDelay: '0.3s' }}
      >
        <dl className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y divide-cream/12 px-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 md:px-8">
          {META.map((item) => (
            <div key={item.label} className="py-3 sm:px-6 sm:py-4 sm:first:pl-0 sm:last:pr-0">
              <dt className="text-[0.6rem] tracking-[0.28em] text-cream/35 uppercase">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm tracking-wide text-cream/75">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
