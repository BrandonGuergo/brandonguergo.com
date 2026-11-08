/**
 * A package label set the way Florida Statutes § 500.80 requires.
 * The street is a blank on purpose: Cottage prints it on the package
 * and keeps it off the public page.
 */
export function LabelSheet() {
  return (
    <div className="relative mx-auto w-full max-w-md py-6 pr-4">
      <div
        aria-hidden="true"
        className="absolute top-8 right-0 bottom-4 left-6 rounded-sm bg-[oklch(0.9_0.03_82)]"
      />
      <article className="relative rounded-sm border border-[color:var(--accent)] bg-card px-6 pt-0 pb-6 shadow-[0_22px_50px_oklch(0.3_0.05_50_/_0.1)]">
        <div className="cottage-check -mx-6 mb-5 h-8" />
        <Bow />
        <p className="text-center font-mono text-[0.62rem] tracking-[0.22em] text-accent uppercase">
          Cottage food
        </p>
        <h3 className="mt-2 text-center font-serif text-3xl tracking-tight">Lemon pound cake</h3>
        <p className="mt-3 text-center text-sm">Front Porch Flour</p>
        <p className="text-center text-sm text-muted-foreground">
          Your street prints here
          <br />
          Jensen Beach, Florida
        </p>
        <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm leading-relaxed">
          <div>
            <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-accent uppercase">
              Ingredients
            </dt>
            <dd className="mt-1">
              Wheat flour, sugar, butter, eggs, lemon zest, lemon juice, baking powder, salt.
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-accent uppercase">
              Allergens
            </dt>
            <dd className="mt-1">Contains: wheat, eggs, milk.</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-mono text-[0.62rem] tracking-[0.16em] text-accent uppercase">
              Net weight
            </dt>
            <dd className="tabular-nums">16 oz (1 lb)</dd>
          </div>
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-[13px] leading-snug font-medium">
          Made in a cottage food operation that is not subject to Florida&apos;s food safety
          regulations.
        </p>
      </article>
    </div>
  )
}

function Bow() {
  return (
    <svg viewBox="0 0 64 28" className="mx-auto -mt-3 mb-3 h-7 w-16" aria-hidden="true">
      <ellipse
        cx="22"
        cy="12"
        rx="12"
        ry="7"
        fill="#f7f1e6"
        stroke="#7a4a1c"
        strokeWidth="1.2"
        transform="rotate(-18 22 12)"
      />
      <ellipse
        cx="42"
        cy="12"
        rx="12"
        ry="7"
        fill="#f7f1e6"
        stroke="#7a4a1c"
        strokeWidth="1.2"
        transform="rotate(18 42 12)"
      />
      <circle cx="32" cy="13" r="3" fill="#f7f1e6" stroke="#7a4a1c" strokeWidth="1.2" />
      <path
        d="M29 16.5 24 26M35 16.5 40 26"
        fill="none"
        stroke="#f7f1e6"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M29 16.5 24 26M35 16.5 40 26"
        fill="none"
        stroke="#7a4a1c"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}
