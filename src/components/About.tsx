import SectionHeading from './SectionHeading'
import WateringGarden from './WateringGarden'

const FACTS = [
  { label: 'Based in', value: 'Florida, USA' },
  {
    label: 'Focus',
    value: 'Systems, language tooling, data structures',
  },
  {
    label: 'Interests',
    value: 'Metaphysics, Photography, Woodworking, Music',
  },
  {
    label: 'GitHub',
    value: 'github.com/BrandonGuergo',
  },
] as const

export default function About() {
  return (
  <section
    id="about"
    className="relative isolate mx-auto max-w-7xl select-none overflow-hidden px-6 py-20 md:px-8 md:py-24"
  >
      <WateringGarden className="absolute inset-0" />

      <SectionHeading
        eyebrow="Background"
        title="About"
        accent=""
        index="01"
      />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <p className="font-serif text-2xl leading-snug text-bark md:text-[1.75rem]">
            First principles are never secondary
          </p>

          <p className="mt-6 text-base leading-8 text-soil">
            I’m Brandon Guergo, a developer based in Florida. My work tends to live around the fundamentals: interpreters, data structures, language tooling, and the deeper mechanics underneath larger systems. I like solving problems that reward patience, clarity, and good design. Intentionality is crucial.
          </p>

          <p className="mt-4 text-base leading-8 text-soil">
            Outside of software, I’m drawn to the same kinds of questions in other forms: metaphysics, philosophy, fiction, and the way ideas take shape in the real world. I enjoy photography, baking, woodworking, and music (guitar, synthesizers, production). They all pull me toward craftsmanship, curiosity, and attention to detail.
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-lg border border-soil/12 bg-soil/12 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="bg-card px-5 py-4"
            >
              <dt className="text-[0.6rem] tracking-[0.28em] text-muted uppercase">
                {fact.label}
              </dt>

              <dd className="mt-1 text-sm tracking-wide text-bark">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}