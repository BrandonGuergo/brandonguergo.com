export interface ExampleBake {
  name: string
  price: number
  kitchen: string
  town: string
  left: number
  ingredients: readonly string[]
  photo: string
  alt: string
}

/**
 * The seeded board in schema.sql section 35: two kitchens, two bakes each.
 * Example batches for this page, not a live order. No distance — nothing here
 * invents how far a kitchen is.
 *
 * Wheat Loaf is the loaf in the mitt, and it is also the hero.
 */
export const exampleBakes: readonly ExampleBake[] = [
  {
    name: 'Country Sourdough Loaf',
    price: 8,
    kitchen: 'Rosa Delgado',
    town: 'Jensen Beach',
    left: 4,
    ingredients: ['Bread flour', 'Water', 'Salt', 'Sourdough starter'],
    photo: '/cottage/country-sourdough.jpg',
    alt: 'A country sourdough loaf held in an oven mitt',
  },
  {
    name: 'Kalamata Olive Sourdough',
    price: 11,
    kitchen: 'Rosa Delgado',
    town: 'Jensen Beach',
    left: 3,
    ingredients: [
      'Bread flour',
      'Water',
      'Kalamata olives',
      'Whole wheat flour',
      'Sourdough starter',
      'Salt',
    ],
    photo: '/cottage/kalamata-olive-sourdough.jpg',
    alt: 'Kalamata olive sourdough loaves on a cooling rack',
  },
  {
    name: 'Soft Pretzels (6)',
    price: 9,
    kitchen: "Aunt Pearl's Kitchen",
    town: 'Palm City',
    left: 6,
    ingredients: ['Flour', 'Water', 'Butter', 'Brown sugar', 'Pretzel salt', 'Yeast', 'Baking soda'],
    photo: '/cottage/soft-pretzels.jpg',
    alt: 'Soft pretzels on a cooling rack',
  },
  {
    name: 'Honey Wheat Loaf',
    price: 9,
    kitchen: "Aunt Pearl's Kitchen",
    town: 'Palm City',
    left: 2,
    ingredients: ['Whole wheat flour', 'Bread flour', 'Water', 'Honey', 'Sourdough starter', 'Salt'],
    photo: '/cottage/honey-wheat-loaf.jpg',
    alt: 'Honey wheat loaves on a cooling rack',
  },
]

function money(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function ExampleBakeCard({
  bake,
  prominent = false,
}: {
  bake: ExampleBake
  prominent?: boolean
}) {
  const Name = prominent ? 'p' : 'h3'
  return (
    <article
      className="flex h-full flex-col rounded-[1.5rem] border border-border bg-card p-2 shadow-[0_8px_20px_rgb(0_0_0_/_0.06)]"
    >
      <img
        src={bake.photo}
        alt={bake.alt}
        width={1600}
        height={900}
        decoding={prominent ? 'sync' : 'async'}
        fetchPriority={prominent ? 'high' : 'auto'}
        loading={prominent ? 'eager' : 'lazy'}
        className="aspect-video w-full rounded-[1rem] object-cover"
      />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Name
          className={`min-w-0 font-serif leading-tight tracking-tight ${
            prominent ? 'text-2xl' : 'text-[1.35rem]'
          }`}
        >
          {bake.name}
        </Name>
        <p
          className={`shrink-0 font-serif text-accent tabular-nums ${
            prominent ? 'text-xl' : 'text-lg'
          }`}
        >
          {money(bake.price)}
        </p>
      </div>
      <p className="mt-3 text-sm">{bake.kitchen}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{bake.town}</p>
      <p className="mt-3">
        <span className="rounded-full bg-[var(--fresh-bg)] px-2.5 py-1 text-xs font-medium text-[var(--fresh)]">
          {bake.left} left
        </span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        <span className="sr-only">What&apos;s in it: </span>
        {bake.ingredients.join(', ')}
      </p>
    </article>
  )
}

export function FreshBoard() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {exampleBakes.map((bake) => (
        <li key={bake.photo}>
          <ExampleBakeCard bake={bake} />
        </li>
      ))}
    </ul>
  )
}
