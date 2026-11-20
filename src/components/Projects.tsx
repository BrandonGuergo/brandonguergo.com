import SectionHeading from './SectionHeading'

type Project = {
  num: string
  title: string
  description: string
  tags: readonly string[]
  link?: string
  icon?: string
}

const PROJECTS: readonly Project[] = [
  {
    num: '01',
    title: 'CustomLang Interpreter',
    description:
      'A programming language written from scratch in Java — lexer, parser, and evaluator, no dependencies.',
    tags: ['Java', 'Lexer', 'Parser', 'Evaluator'],
    link: 'https://github.com/BrandonGuergo/CustomLang-Java-Interpreter',
  },
  {
    num: '02',
    title: 'Custom AVL Tree',
    description:
      'A self-balancing AVL tree in Java — insertions, deletions, and all four rotations.',
    tags: ['Data Structures', 'Self-Balancing', 'Rotations'],
    link: 'https://github.com/BrandonGuergo/Custom-AVL-Tree',
  },
  {
    num: '03',
    title: 'Intralocutor.com',
    description:
      'A full-featured web application for a conversational AI product, built to deliver a polished user experience with scalable frontend architecture.',
    tags: ['React', 'Vite', 'Web App', 'Frontend'],
    link: 'https://intralocutor.com',
  },
  {
    num: '04',
    title: 'Cottage',
    description:
      'A live board of what Treasure Coast home kitchens baked today. Neighbors ask, bakers say yes, and the payment stays between them. Cottage takes no cut.',
    tags: ['Swift', 'iPhone', 'App Store'],
    link: '/cottage/',
    icon: '/cottage/app-icon.png',
  },
  {
    num: '05',
    title: 'Agora',
    description:
      'An intelligent marketplace. Describe what you want in plain language, publish what you have, and a background watcher reads new listings against open requests.',
    tags: ['Swift', 'iPhone', 'Marketplace'],
    link: '/agora-support/',
    icon: '/agora/app-icon.png',
  },
]

export default function Projects() {
  return (
    <section
      id="programming"
      className="mx-auto max-w-7xl border-t border-soil/10 px-6 py-20 md:px-8 md:py-24"
    >
      <SectionHeading eyebrow="Built From Scratch" title="My" accent="Projects" index="02" />

      <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {PROJECTS.map((project) => {
          const cardContent = (
            <>
              <span className="card-scan pointer-events-none absolute inset-0" />
              <span className="pointer-events-none absolute top-2.5 left-2.5 h-2.5 w-2.5 border-t border-l border-emerald/0 transition-colors duration-300 group-hover:border-emerald/70" />
              <span className="pointer-events-none absolute top-2.5 right-2.5 h-2.5 w-2.5 border-t border-r border-emerald/0 transition-colors duration-300 group-hover:border-emerald/70" />
              <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-2.5 w-2.5 border-b border-l border-emerald/0 transition-colors duration-300 group-hover:border-emerald/70" />
              <span className="pointer-events-none absolute right-2.5 bottom-2.5 h-2.5 w-2.5 border-r border-b border-emerald/0 transition-colors duration-300 group-hover:border-emerald/70" />
              {/* Accent bar that fills on hover. */}
              <span className="absolute top-0 left-0 h-0 w-0.5 bg-linear-to-b from-emerald to-sage transition-all duration-300 group-hover:h-full" />

              <div className="flex items-center justify-between font-mono text-[0.62rem] tracking-[0.22em] text-emerald-pop uppercase">
                <span>PRJ / {project.num}</span>
                <span className="text-soil/35 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
                  {project.link ? '↗' : '•'}
                </span>
              </div>

              <div className={`mt-4 flex gap-3 ${project.icon ? 'items-center' : 'items-baseline'}`}>
                {project.icon ? (
                  <img
                    src={project.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 shrink-0 rounded-[22%] ring-1 ring-soil/15"
                  />
                ) : null}
                <h3 className="font-serif text-2xl font-semibold text-bark">
                  {project.title}
                </h3>
              </div>

              <p className="mt-3 grow text-sm leading-7 text-soil">{project.description}</p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-soil/12 bg-parchment px-2.5 py-1 text-[0.65rem] tracking-[0.14em] text-muted uppercase"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </>
          )

          const external = project.link?.startsWith('http') ?? false

          return (
            <li key={project.link || project.title} className="flex h-full">
              {project.link ? (
                <a
                  href={project.link}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-soil/12 bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald/30 hover:shadow-xl motion-reduce:hover:translate-y-0"
                >
                  {cardContent}
                </a>
              ) : (
                <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-soil/12 bg-card p-7 shadow-xs transition-all duration-300 hover:border-emerald/30 hover:shadow-xl motion-reduce:hover:translate-y-0">
                  {cardContent}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
