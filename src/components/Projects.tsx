import SectionHeading from './SectionHeading'

type Project = {
  num: string
  title: string
  description: string
  tags: readonly string[]
  link?: string
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
    title: 'Home Market',
    description:
      'An iPhone app in Swift for a local goods marketplace, currently in development and focused on neighborhood discovery and simple product browsing.',
    tags: ['In Development', 'Swift', 'iPhone App', 'Marketplace'],
    link: '',
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
              {/* Accent bar that fills on hover. */}
              <span className="absolute top-0 left-0 h-0 w-0.5 bg-linear-to-b from-emerald to-sage transition-all duration-300 group-hover:h-full" />

              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[0.65rem] tracking-[0.2em] text-emerald-pop">
                  {project.num}
                </span>
                <h3 className="font-serif text-2xl font-semibold text-bark">
                  {project.title}
                </h3>
                <span className="ml-auto text-soil/35 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
                  {project.link ? '↗' : '•'}
                </span>
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

          return (
            <li key={project.link || project.title} className="flex h-full">
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-[300px] w-full flex-col overflow-hidden rounded-lg border border-soil/12 bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald/30 hover:shadow-xl motion-reduce:hover:translate-y-0"
                >
                  {cardContent}
                </a>
              ) : (
                <div className="group relative flex h-[300px] w-full flex-col overflow-hidden rounded-lg border border-soil/12 bg-card p-7 shadow-xs transition-all duration-300 hover:border-emerald/30 hover:shadow-xl motion-reduce:hover:translate-y-0">
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
