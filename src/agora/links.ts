/**
 * The only place Agora's public destinations are set.
 * Leave a string empty until the real value exists. Empty values are shown
 * on the page as labeled gaps and are never turned into links.
 */
export const agoraLinks = {
  appStoreUrl: '',
  supportEmail: 'divinital@protonmail.com',
  privacyPolicyUrl: 'https://brandonguergo.com/agora-privacy/',
  termsUrl: 'https://brandonguergo.com/agora-terms/',
}

/** An http(s) URL, or null when the slot is still empty or not a web address. */
export function httpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.href
  } catch {
    return null
  }
}

/** A plain mailbox, or null when the slot is still empty or not an email. */
export function mailbox(value: string): string | null {
  const trimmed = value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}
