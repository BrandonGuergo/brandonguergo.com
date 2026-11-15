import { useState } from 'react'
import { agoraLinks, httpUrl, mailbox } from './links'

const NAV = [
  { href: '#how', label: 'How it works' },
  { href: '#matching', label: 'Matching' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
] as const

const FAQS = [
  {
    q: 'What is Agora?',
    a: 'Agora is an intelligent marketplace that allows users to publish listings and submit requests using natural language.',
  },
  {
    q: 'How does Agora work?',
    a: "Agora has two primary functions: Sell and Request. Sellers publish offerings, while requesters describe what they're looking for. Agora's background watcher agent evaluates new listings against active requests.",
  },
  {
    q: 'How do I find something on Agora?',
    a: "Simply submit a request describing what you want in plain English. Agora's matching system evaluates newly published listings for relevance.",
  },
  {
    q: 'How does AI matching work?',
    a: 'Agora uses a background watcher agent that analyzes newly published marketplace items and evaluates how closely they fit existing requests.',
  },
  {
    q: 'Can I sell on Agora?',
    a: 'Yes. Users can publish items or offerings to the marketplace.',
  },
  {
    q: "Does Agora guarantee that I will find what I'm looking for?",
    a: 'No. Matching helps identify potentially relevant listings, but results depend on what is available and how closely listings match individual requests.',
  },
  {
    q: 'How can I get help?',
    a: 'Contact our support team using the contact information below.',
  },
] as const

const STEPS = [
  {
    n: '01',
    title: 'A request is submitted',
    body: 'Someone describes what they want in ordinary language.',
    quote: 'A quiet desk lamp, warm light, small enough for a nightstand.',
  },
  {
    n: '02',
    title: 'A listing is published',
    body: 'Someone else offers an item or a service on the marketplace.',
    quote: 'Brass bedside lamp, dimmable, about fourteen inches.',
  },
  {
    n: '03',
    title: 'The watcher analyzes it',
    body: 'Agora\u2019s background agent reads the new listing and sets it beside requests that are already open.',
    quote: 'The lamp is placed next to the open request for a small, warm light.',
  },
  {
    n: '04',
    title: 'Closeness is evaluated',
    body: 'The system notes how near the listing sits to the request. It does not buy anything, and a close reading is not a promise.',
    quote: 'Near on intent: a small warm lamp is what was asked for. That is a reading, not a completed match.',
  },
] as const

function Mark({ small = false }: { small?: boolean }) {
  return (
    <img
      className={small ? 'mark-logo mark-logo-sm' : 'mark-logo'}
      src="/agora/app-icon.png"
      alt=""
      width={small ? 24 : 28}
      height={small ? 24 : 28}
    />
  )
}

function DownloadControl({ compact = false }: { compact?: boolean }) {
  const url = httpUrl(agoraLinks.appStoreUrl)
  const className = compact ? 'btn btn-primary btn-sm' : 'btn btn-primary'
  if (url) {
    return (
      <a className={className} href={url} target="_blank" rel="noopener noreferrer">
        Download Agora
      </a>
    )
  }
  if (compact) return null
  return (
    <span className="cta-slot">
      <button type="button" className={className} disabled>
        Download Agora
      </button>
      <p className="slot-note">[INSERT APP STORE URL]</p>
    </span>
  )
}

function PolicySlot({ href, label, token }: { href: string; label: string; token: string }) {
  const url = httpUrl(href)
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    )
  }
  return (
    <span className="footer-pending">
      <span>{label}</span>
      <span className="token">{token}</span>
    </span>
  )
}

function IntentBoard() {
  return (
    <figure className="board" aria-labelledby="board-caption">
      <div className="board-label">
        <span>Marketplace</span>
        <span>Background reading</span>
      </div>
      <div className="board-stage">
        <div className="board-card request">
          <p className="role">Request</p>
          <p>A quiet desk lamp, warm light, small enough for a nightstand.</p>
        </div>
        <div className="watcher">
          <span className="watcher-ring" aria-hidden="true" />
          <span className="watcher-ring-2" aria-hidden="true" />
          <span className="watcher-core">
            Watcher
          </span>
        </div>
        <div className="board-card listing">
          <p className="role">New listing</p>
          <p>Brass bedside lamp, dimmable, about fourteen inches.</p>
        </div>
      </div>
      <div className="reading">
        <strong>A close reading, not a purchase.</strong>
        <span>The listing sits near the request. Agora records that. Nothing is bought, and nothing is guaranteed.</span>
      </div>
      <figcaption id="board-caption">Illustration of a reading. Not a live result from the app.</figcaption>
    </figure>
  )
}

function FaqList() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="faq-list">
      {FAQS.map((item, index) => {
        const isOpen = open === index
        const panelId = `faq-panel-${index}`
        const buttonId = `faq-button-${index}`
        return (
          <div className="faq-item" key={item.q}>
            <h3>
              <button
                type="button"
                id={buttonId}
                className="faq-button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                {item.q}
                <svg className="chevron" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 6 L8 10.5 L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="faq-panel"
              data-open={isOpen ? 'true' : 'false'}
              inert={isOpen ? undefined : true}
            >
              <div className="faq-panel-inner">
                <p>{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContactEmail() {
  const email = mailbox(agoraLinks.supportEmail)
  if (email) {
    return (
      <a className="email-link" href={`mailto:${email}`}>
        {email}
      </a>
    )
  }
  return (
    <>
      <p className="email-pending">[INSERT SUPPORT EMAIL]</p>
      <p className="hint">The address is shown here, and becomes a mail link once it is a real mailbox.</p>
    </>
  )
}

export default function AgoraSupportPage() {
  return (
    <div id="top" data-theme="agora" className="agora-page">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="shell header-bar">
          <a className="wordmark" href="#top">
            <Mark />
            <span className="word">Agora</span>
          </a>
          <nav className="header-nav" aria-label="Agora">
            {NAV.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <DownloadControl compact />
        </div>
        <div className="shell">
          <nav className="section-nav" aria-label="Agora sections">
            {NAV.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="shell hero-grid">
            <div>
              <p className="kicker rise">Stop Searching. Start Asking.</p>
              <h1 id="hero-title" className="rise delay-1">
                Need Something? Just Ask.
              </h1>
              <p className="lede rise delay-2">
                Agora is an intelligent marketplace that connects what people want with what&apos;s available. Describe what you&apos;re looking for, publish what you have, and let AI-powered matching discover the possibilities.
              </p>
              <div className="cta-row rise delay-3">
                <DownloadControl />
                <a className="btn btn-secondary" href="#contact">
                  Contact Support
                </a>
              </div>
            </div>
            <div className="rise delay-2">
              <IntentBoard />
            </div>
          </div>
        </section>

        <div className="band">
          <div className="shell">
            <p>
              <span>The Intelligent Marketplace.</span>
              <span>A Marketplace Built Around Intent.</span>
              <span>Let AI Discover What You&apos;re Looking For.</span>
            </p>
          </div>
        </div>

        <section className="section" id="how" aria-labelledby="how-title">
          <div className="shell">
            <p className="kicker">Sell and Request</p>
            <h2 id="how-title">How Agora Works</h2>
            <p className="section-intro">
              Two actions carry the marketplace. Offer what you have, or describe what you want. Discovery starts from that intent.
            </p>
            <div className="card-grid">
              <article className="feature-card sell">
                <p className="card-index">Sell</p>
                <h3>Have Something to Offer?</h3>
                <p>
                  Publish an item or offering to Agora and make it discoverable to people actively looking for what you have.
                </p>
              </article>
              <article className="feature-card request">
                <p className="card-index">Request</p>
                <h3>Looking for Something Specific?</h3>
                <p>
                  Describe exactly what you want using everyday language. No complicated filters or endless searching.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="matching" aria-labelledby="matching-title">
          <div className="shell">
            <p className="kicker">Background watcher</p>
            <h2 id="matching-title">Matching Happens in the Background.</h2>
            <p className="section-intro">
              A watcher agent stays with the marketplace. When a listing is published, the agent reads it against requests that are already open and weighs how close the two are. The lamp below is one illustration of that reading. It is not a result from the app, not a purchase, and not a guarantee.
            </p>
            <ol className="steps">
              {STEPS.map((step) => (
                <li className="step" key={step.n}>
                  <span className="step-num">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <q>{step.quote}</q>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" id="faq" aria-labelledby="faq-title">
          <div className="shell">
            <p className="kicker">Questions</p>
            <h2 id="faq-title">Frequently Asked Questions</h2>
            <FaqList />
          </div>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-title">
          <div className="shell contact-grid">
            <div className="contact-copy">
              <p className="kicker">Support</p>
              <h2 id="contact-title">We&apos;re Here to Help.</h2>
              <p className="section-intro">
                Have a question, encountered an issue, or want to share feedback? We&apos;d love to hear from you.
              </p>
            </div>
            <div className="contact-card">
              <p className="label">Support email</p>
              <ContactEmail />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell footer-grid">
          <p className="footer-name">
            <Mark small />
            Agora
          </p>
          <nav className="footer-nav" aria-label="Agora">
            <a href="/agora-support/">Home</a>
            <a href="#contact">Support</a>
            <PolicySlot href={agoraLinks.privacyPolicyUrl} label="Privacy Policy" token="[INSERT PRIVACY POLICY URL]" />
            <PolicySlot href={agoraLinks.termsUrl} label="Terms of Service" token="[INSERT TERMS URL]" />
          </nav>
        </div>
        <div className="shell">
          <p className="copy">© 2026 Agora.</p>
        </div>
      </footer>
    </div>
  )
}
