import SectionHeading from '../components/SectionHeading'

type Video = {
  title: string
  description: string
  /**
   * The video's YouTube link, pasted as-is: `youtube.com/watch?v=…`,
   * `youtu.be/…` and `youtube.com/shorts/…` all work. Leave unset until the
   * video is ready.
   */
  youtube?: string
}

type Section = {
  id: string
  eyebrow: string
  title: string
  accent: string
  intro: string
  videos: readonly Video[]
}

// Placeholder copy throughout — replace with the real descriptions and links.
const SECTIONS: readonly Section[] = [
  {
    id: 'vlogs',
    eyebrow: 'Vlogs du cours',
    title: 'Mes',
    accent: 'vlogs',
    intro: 'Trois vlogs en français, réalisés au fil du semestre.',
    videos: [
      {
        title: 'Je me présente',
        description: 'Une ou deux phrases sur ce vlog.',
      },
      {
        title: 'Mon temps libre',
        description: 'Une ou deux phrases sur ce vlog.',
      },
      {
        title: 'Recette',
        description: 'Une ou deux phrases sur ce vlog.',
      },
    ],
  },
  {
    id: 'french-on-my-own',
    eyebrow: 'French on My Own',
    title: 'Le français',
    accent: 'en dehors du cours',
    intro: 'Deux vlogs sur des activités en français que j’ai faites par moi-même.',
    videos: [
      {
        title: 'Titre du vlog',
        description: 'L’activité, où elle a eu lieu, et ce que j’en ai retenu.',
      },
      {
        title: 'Titre du vlog',
        description: 'L’activité, où elle a eu lieu, et ce que j’en ai retenu.',
      },
    ],
  },
  {
    id: 'reflect-and-teach',
    eyebrow: 'Reflect & Teach',
    title: 'Réfléchir et',
    accent: 'enseigner',
    intro: 'Une de mes vidéos Reflect & Teach.',
    videos: [
      {
        title: 'Titre de la vidéo',
        description: 'Le sujet de la vidéo et ce qu’elle enseigne.',
      },
    ],
  },
]

const NAV = [
  ...SECTIONS.map((s) => ({ href: `#${s.id}`, label: s.eyebrow })),
  { href: '#reflection', label: 'Réflexion finale' },
]

const SECTION_CLASS = 'mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20'

/** Pulls the video id out of any of the usual YouTube link shapes. */
function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/)
  return match ? match[1] : null
}

function VideoFrame({ title, youtube }: { title: string; youtube?: string }) {
  const frame = 'aspect-video w-full overflow-hidden rounded-md bg-bark'
  const id = youtube ? youtubeId(youtube) : null
  if (!id) {
    return (
      <div className={`${frame} flex items-center justify-center`}>
        <span className="text-[0.65rem] tracking-[0.28em] text-cream/50 uppercase">
          Vidéo à venir
        </span>
      </div>
    )
  }
  return (
    <iframe
      className={frame}
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={title}
      loading="lazy"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

export default function FrenchPortfolio() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-parchment text-ink">
      <header className="bg-linear-to-br from-[#171208] via-[#16281c] to-[#0b1a11] text-parchment">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <a href="/" className="font-serif text-xl font-semibold tracking-wider">
            Brandon Guergo
          </a>
          <span className="text-xs font-medium tracking-widest text-cream/60 uppercase">
            ePortfolio
          </span>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pt-12 pb-14 md:px-8 md:pt-20 md:pb-20">
          <p className="text-[0.65rem] tracking-[0.3em] text-sage-light uppercase">
            Université de Floride · Automne 2026
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-none font-medium tracking-tight md:text-7xl">
            Portfolio de <span className="text-emerald-pop italic">français</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-cream/80">
            Présentez-vous ici : qui vous êtes, votre cours de français, et ce que ce
            portfolio rassemble — les vlogs, les activités en dehors du cours, et vos
            réflexions sur ce semestre.
          </p>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {NAV.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-xs font-medium tracking-widest text-cream/70 uppercase transition-colors hover:text-parchment"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="flex-1">
        {SECTIONS.map((section, sIdx) => (
          <section key={section.id} id={section.id} className={SECTION_CLASS}>
            <SectionHeading
              eyebrow={section.eyebrow}
              title={section.title}
              accent={section.accent}
              index={String(sIdx + 1).padStart(2, '0')}
            />
            <p className="mt-6 max-w-3xl text-base leading-8 text-soil">{section.intro}</p>

            <ul className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {section.videos.map((item, idx) => (
                <li
                  key={idx}
                  className="flex flex-col rounded-lg border border-soil/12 bg-card p-4"
                >
                  <VideoFrame title={item.title} youtube={item.youtube} />
                  <h3 className="mt-4 px-1 font-serif text-2xl leading-tight text-bark">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 px-1 text-sm leading-7 text-soil">
                    {item.description}
                  </p>
                  {item.youtube && (
                    <a
                      href={item.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-1 pb-1 text-sm tracking-wide text-emerald transition-colors hover:text-emerald-pop"
                    >
                      Voir sur YouTube ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section id="reflection" className={SECTION_CLASS}>
          <SectionHeading
            eyebrow="Réflexion finale"
            title="Ce que"
            accent="j’ai appris"
            index={String(SECTIONS.length + 1).padStart(2, '0')}
          />
          <div className="mt-8 max-w-3xl space-y-5 text-base leading-8 text-soil">
            <p>
              Votre réflexion finale, selon les consignes du devoir ePortfolio sur Canvas :
              vos progrès en français, ce qui a été difficile, ce qui vous a surpris.
            </p>
            <p>Ajoutez autant de paragraphes que nécessaire.</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#3b2a1f] text-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-[0.7rem] tracking-[0.2em] text-cream/35 uppercase sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>&copy; 2026 Brandon Guergo</p>
          <div className="flex gap-8">
            <a href="#top" className="transition-colors hover:text-parchment">
              Haut de page ↑
            </a>
            <a href="/" className="transition-colors hover:text-parchment">
              Site principal →
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
