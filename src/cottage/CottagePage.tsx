import { FreshBoard } from './fresh-board'
import { FreshSteam, HeroStill } from './hero-still'
import { LabelSheet } from './label-sheet'
import { APP_STORE_URL, COTTAGE_STATUTE_URL } from './store'
import { Button, Container, Reveal, Section } from './ui'

const ctaClass = 'rounded-full shadow-[0_8px_18px_oklch(0.35_0.08_50_/_0.18)]'

const coast = [
  'Jensen Beach',
  'Stuart',
  'Palm City',
  'Port St. Lucie',
  'Hobe Sound',
  'Rio',
  "Sewall's Point",
] as const

const bakers = [
  {
    title: 'A page with your name and your town',
    body: 'A photo and a sentence. People can follow the kitchen. The recipes stay yours.',
  },
  {
    title: 'A recipe, written once',
    body: 'Cottage puts the ingredients in the order the label requires and names the allergens from what you typed.',
  },
  {
    title: 'A batch, posted in a few taps',
    body: "Followers hear about it. What's left goes down as people ask. When it's gone, it leaves the board.",
  },
  {
    title: 'Directions after you say yes',
    body: 'Your town is public. Directions to your door, and a mailing address, stay hidden until you accept.',
  },
] as const

const neighbors = [
  {
    title: 'Look without an account',
    body: 'The board shows a photo, a price, how far away it is, how many are left, and what\'s in it. Sign in with Apple only to follow or ask.',
  },
  {
    title: "Hide what you don't eat",
    body: 'An ingredient you avoid stays off your board. That list lives on your phone.',
  },
  {
    title: "Ask, including for what isn't posted",
    body: 'You don\'t pay anything, and nothing is reserved, until the baker says yes.',
  },
  {
    title: 'Pay the baker',
    body: 'Cash, or their own Venmo, Cash App, Zelle, or Square. Cottage never sees the payment and never takes a cut.',
  },
] as const

const steps = [
  {
    title: 'Ask',
    body: 'For something on the board, or for a bake that isn\'t posted yet. A standing Saturday loaf works the same way: the baker still says yes to that week.',
  },
  {
    title: 'Decide',
    body: 'Yes or no. Pickup directions stay private until the baker says yes. For mail, the baker sees Florida first, and the street only after they accept.',
  },
  {
    title: 'Ready',
    body: 'The batch is marked ready. The person who asked has the baker\'s number on that order, in case something goes wrong at pickup.',
  },
  {
    title: 'Porch or mail',
    body: "Handed over in person, or mailed by the baker to a Florida address. Cottage doesn't pack, carry, or ship anything.",
  },
] as const

const laws = [
  {
    title: 'Sold only in Florida',
    body: 'Every sale stays in Florida. In person, or mailed to a Florida address. Not across a state line, and not wholesale.',
  },
  {
    title: 'A home kitchen',
    body: 'The state does not inspect it. The label has to say that, in at least 10-point type.',
  },
  {
    title: 'Your sales for the year',
    body: "Florida's cap is $250,000 in gross sales a year. The app shows that total. Cottage is not a lawyer. Staying under the cap is up to the baker.",
  },
] as const

const labelLines = [
  'Your name and address',
  'The name of the food',
  'Ingredients, heaviest first',
  'The net weight or volume',
  'The allergens',
  'The cottage food disclaimer, at least 10-point type, in a contrasting color',
] as const

export default function CottagePage() {
  return (
    <>
      <Section className="overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8">
            <div>
              <FreshSteam />
              <p className="font-mono text-[0.68rem] tracking-[0.2em] text-accent uppercase">
                Fresh · Treasure Coast
              </p>
              <h1 className="cottage-display mt-4 max-w-[12ch] text-[clamp(3.4rem,8vw,6.4rem)] text-balance">
                What&apos;s <span className="italic">fresh,</span> nearby.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Cottage is a live board of homemade food from kitchens on the Treasure Coast. Bread,
                cookies, cakes, jams, candy. A neighbor asks. The baker says yes. The money stays
                between them.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className={ctaClass}>
                  <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                    Get the app
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full shadow-none">
                  <a href="#board">See the board</a>
                </Button>
              </div>
              <p className="mt-5 font-mono text-[0.65rem] tracking-[0.16em] text-muted-foreground uppercase">
                Free · No cut · Florida cottage food
              </p>
            </div>
            <HeroStill />
          </div>
        </Container>
      </Section>

      <div className="border-y border-border/80">
        <Container className="py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-[0.65rem] tracking-[0.18em] text-accent uppercase">
              Starting here
            </span>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {coast.map((town) => (
                <li key={town} className="font-serif text-sm text-foreground/80">
                  {town}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Florida first. Then the rest of the country, one state at a time.
          </p>
        </Container>
      </div>

      <Section id="board" aria-labelledby="board-heading" className="scroll-mt-28">
        <Container>
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-[0.68rem] tracking-[0.18em] text-accent uppercase">
                Example batches
              </p>
              <h2 id="board-heading" className="cottage-display mt-3 text-4xl sm:text-6xl">
                A morning on the board.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                These are the example batches on the board, not a live order.
              </p>
            </div>
          </Reveal>
          <div className="mt-10">
            <FreshBoard />
          </div>
        </Container>
      </Section>

      <Section id="kitchens" aria-labelledby="kitchens-heading" className="scroll-mt-28 pt-0">
        <Container>
          <Reveal>
            <h2 id="kitchens-heading" className="cottage-display text-4xl sm:text-6xl">
              Same sale,
              <br />
              two sides.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="mt-10 overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_60px_oklch(0.3_0.05_50_/_0.08)]">
              <div className="cottage-check h-3" />
              <div className="grid md:grid-cols-2 md:divide-x md:divide-border">
                <Ledger title="If you bake" items={bakers} />
                <Ledger title="If you're hungry" items={neighbors} />
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section id="label" aria-labelledby="label-heading" className="scroll-mt-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <h2 id="label-heading" className="cottage-display text-4xl sm:text-6xl">
                Print the label from the recipe.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Write it once. Cottage fills in the lines below. You print the label and put it on
                the food. Your street is on that label, because the law requires it, and it is not
                on your public page.
              </p>
              <ol className="mt-8 space-y-3 text-sm leading-relaxed">
                {labelLines.map((line, index) => (
                  <li key={line} className="flex gap-4 border-t border-border pt-3">
                    <span className="font-mono text-[0.65rem] tracking-[0.14em] text-accent">
                      0{index + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.12}>
              <LabelSheet />
              <p className="mx-auto mt-2 max-w-md text-center text-xs leading-relaxed text-muted-foreground">
                A sample label. A nutrition facts panel is required only if you make a nutrient
                claim. Cottage does not add one.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section aria-labelledby="handoff-heading" className="pt-0">
        <Container>
          <Reveal>
            <h2 id="handoff-heading" className="cottage-display text-4xl sm:text-6xl">
              How an order works.
            </h2>
          </Reveal>
          <ol className="mt-10 overflow-hidden rounded-[2rem] border border-border bg-card md:grid md:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="border-border border-t px-6 py-8 first:border-t-0 md:border-t-0 md:border-l md:first:border-l-0"
              >
                <span className="font-mono text-[0.65rem] tracking-[0.18em] text-accent">
                  0{index + 1}
                </span>
                <h3 className="mt-4 font-serif text-2xl tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section id="law" aria-labelledby="law-heading" className="scroll-mt-28 pt-0">
        <Container>
          <Reveal>
            <p className="font-mono text-[0.68rem] tracking-[0.18em] text-accent uppercase">
              Cottage food law
            </p>
            <h2 id="law-heading" className="cottage-display mt-3 max-w-[14ch] text-4xl sm:text-6xl">
              What Florida allows.
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {laws.map((law, index) => (
              <li key={law.title}>
                <span className="cottage-display text-4xl text-accent">0{index + 1}</span>
                <h3 className="mt-3 font-serif text-2xl tracking-tight">{law.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{law.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Cottage is the board. The baker is the seller. The app shows you Florida&apos;s rules.
            It does not follow them for you.{' '}
            <a
              href={COTTAGE_STATUTE_URL}
              className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Florida Statutes § 500.80
            </a>
            .
          </p>
        </Container>
      </Section>

      <Section className="pt-0 pb-20">
        <Container>
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <div className="cottage-check h-3" />
            <div className="grid items-end gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.4fr_auto] lg:py-14">
              <div>
                <h2 className="cottage-display text-5xl sm:text-7xl">Free for neighbors.</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  Bakers pay a flat monthly subscription through Apple, and the price is shown
                  before it starts. Cottage takes no percentage of a sale, and it never holds a
                  card.
                </p>
              </div>
              <Button asChild size="lg" className={ctaClass}>
                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Get Cottage
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

function Ledger({
  title,
  items,
}: {
  title: string
  items: readonly { title: string; body: string }[]
}) {
  return (
    <div className="px-6 py-8 sm:px-8 sm:py-10">
      <h3 className="font-serif text-3xl tracking-tight">{title}</h3>
      <ol className="mt-6">
        {items.map((item, index) => (
          <li key={item.title} className="border-t border-border py-4 first:border-t-0">
            <div className="flex gap-4">
              <span className="mt-1 font-mono text-[0.65rem] tracking-[0.14em] text-accent">
                0{index + 1}
              </span>
              <span>
                <span className="block font-medium">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
