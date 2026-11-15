import { agoraLinks, httpUrl, mailbox } from './links'

const UPDATED = '15 November 2026'
const AGE_LINE = 'I am 18 or older. This post is not a weapon, a live animal, or anything illegal.'
const LISTING_PRODUCT = 'com.brandonguergo.agora.listing.monthly'

type PageId = 'support' | 'privacy' | 'terms'

const PAGES: { id: PageId; label: string; href: string }[] = [
  { id: 'support', label: 'Support', href: '/agora-support/' },
  { id: 'privacy', label: 'Privacy', href: httpUrl(agoraLinks.privacyPolicyUrl) ?? '/agora-privacy/' },
  { id: 'terms', label: 'Terms', href: httpUrl(agoraLinks.termsUrl) ?? '/agora-terms/' },
]

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

function MailLink() {
  const email = mailbox(agoraLinks.supportEmail)
  if (!email) return null
  return <a href={`mailto:${email}`}>{email}</a>
}

function PageLinks({ current }: { current: PageId }) {
  return (
    <>
      {PAGES.map((page) => (
        <a key={page.id} href={page.href} aria-current={page.id === current ? 'page' : undefined}>
          {page.label}
        </a>
      ))}
    </>
  )
}

function PrivacyBody() {
  return (
    <>
      <h2>The account</h2>
      <p>
        Sign in with Apple is the account. The same Apple ID buys and sells. The app asks Apple for your name and email, and it stores the Apple user ID, the name, and the email on the phone. A credential from that sign-in stays in memory while the app is open. It is not saved with your posts.
      </p>
      <h2>Posts</h2>
      <p>
        Posts stay on the phone. A request can hold a title, details, a category, a condition, a maximum price, and a city. A listing can hold a title, details, a category, a condition, a price, an optional lowest price, a city, and one photo. There is no shipping.
      </p>
      <h2>Location</h2>
      <p>
        If you tap Use my location, Agora asks for your location while you are using the app. That point can be saved on a listing, and the For Sale list can use a point on the phone to sort or filter by distance. The exact location point stays on the phone.
      </p>
      <h2>Matching</h2>
      <p>
        Matching uses Apple’s on-device model. The listing photo is read on the phone for that judgment. A stored yes is a hit. A no stays off screen. Matching does not purchase anything and does not guarantee a result. A release build does not call the worker, so the released app does not send your posts, your photo, or the exact location point to Agora.
      </p>
      <h2>Money</h2>
      <p>
        A request is free. A listing needs one photo and the subscription <code>{LISTING_PRODUCT}</code>, $10 a month, billed by Apple. People pay each other outside the app. There is no checkout and no escrow. The app does not move money between two people. Agora does not take a card number. Apple bills the subscription, and you cancel it with Apple.
      </p>
      <h2>Age</h2>
      <p>
        Publish stays off until this line is on: “{AGE_LINE}”
      </p>
      <h2>What is deleted</h2>
      <p>
        Sign out closes the account on that phone. It deletes the account record stored there: the Apple user ID, the name, and the email kept with that record. Requests, listings, photos, and stored matches stay on the phone. The name and email Apple provided can remain on the phone so the next sign-in can show them. Sign out does not cancel the Apple subscription.
      </p>
      <p>
        Remove deletes the request or the listing you choose. A stored yes, a stored no, an offer, a reply, and a message can remain on the phone after that post is gone.
      </p>
      <p>
        The released app does not keep a copy of your posts for Brandon Guergo. For a copy, a correction, or deletion of information he does hold, including mail you send him, write to <MailLink />.
      </p>
      <h2>This page</h2>
      <p>
        These public pages do not ask you to sign in. Mail sent to <MailLink /> is read by Brandon Guergo.
      </p>
    </>
  )
}

function TermsBody() {
  return (
    <>
      <h2>The account</h2>
      <p>
        Sign in with Apple is the account. The same Apple ID buys and sells. You sign in to publish a request or a listing, and to manage the ones you already posted on that phone.
      </p>
      <h2>Requests and listings</h2>
      <p>
        A request is free. A listing needs one photo and the subscription <code>{LISTING_PRODUCT}</code>, $10 a month, billed by Apple. Apple’s terms cover the charge, renewal, and cancellation. Agora does not bill that subscription itself.
      </p>
      <p>
        Publish stays off until this line is on: “{AGE_LINE}” Turning it on means you are 18 or older, and that the post is not a weapon, a live animal, or anything illegal.
      </p>
      <h2>Payment between people</h2>
      <p>
        People pay each other outside the app. There is no shipping, no checkout, and no escrow. The app does not move money between two people. Agora is not the seller of a listed item and does not hold the payment.
      </p>
      <h2>Matching</h2>
      <p>
        Matching uses Apple’s on-device model. A release build does not call the worker. A stored yes is a hit. A no stays off screen. Matching does not purchase anything and does not guarantee a result. A phone that cannot judge says so.
      </p>
      <h2>What stays on the phone</h2>
      <p>
        Posts stay on the phone. The exact location point stays on the phone.
      </p>
      <h2>Removing a post or leaving</h2>
      <p>
        Remove deletes the request or the listing you choose. Sign out closes the account on that phone and deletes the account record there. The posts stay until you remove them. The <a href={PAGES[1].href}>privacy policy</a> says what that deletion covers.
      </p>
      <h2>What Agora does not promise</h2>
      <p>
        Agora does not promise a hit, a reply, a sale, or that an item is as a post describes it. You deal with the other person outside the app.
      </p>
      <h2>Changes</h2>
      <p>
        If these terms change, this page changes, and the date above changes with it.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms go to <MailLink />.
      </p>
    </>
  )
}

export default function AgoraLegalPage({ page }: { page: 'privacy' | 'terms' }) {
  const title = page === 'privacy' ? 'Privacy policy' : 'Terms of service'
  const lede = page === 'privacy'
    ? 'Brandon Guergo makes Agora. This policy describes the Agora iPhone app as it works today.'
    : 'Brandon Guergo makes Agora. These terms cover the Agora iPhone app as it works today.'

  return (
    <div id="top" data-theme="agora" className="agora-page">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="shell header-bar">
          <a className="wordmark" href="/agora-support/">
            <Mark />
            <span className="word">Agora</span>
          </a>
          <nav className="header-nav" aria-label="Agora">
            <PageLinks current={page} />
          </nav>
        </div>
        <div className="shell">
          <nav className="section-nav" aria-label="Agora">
            <PageLinks current={page} />
          </nav>
        </div>
      </header>
      <main id="main">
        <article className="legal shell">
          <p className="kicker">Agora</p>
          <h1>{title}</h1>
          <p className="legal-updated">
            Last updated <time dateTime="2026-11-15">{UPDATED}</time>.
          </p>
          <p className="legal-lede">{lede}</p>
          {page === 'privacy' ? <PrivacyBody /> : <TermsBody />}
        </article>
      </main>
      <footer className="site-footer">
        <div className="shell footer-grid">
          <p className="footer-name">
            <Mark small />
            Agora
          </p>
          <nav className="footer-nav" aria-label="Agora">
            <PageLinks current={page} />
            <MailLink />
          </nav>
        </div>
        <div className="shell">
          <p className="copy">© 2026 Brandon Guergo.</p>
        </div>
      </footer>
    </div>
  )
}
