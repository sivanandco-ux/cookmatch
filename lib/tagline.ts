// Builds a short tagline from a cook's bio — the first sentence, capped at
// maxLen. Truncation (when needed) breaks on the last word boundary rather
// than an arbitrary character count, so it never ends mid-word, and adds an
// ellipsis so it's clear the text was cut.
export function makeTagline(bio: string, maxLen = 120, fallback = ''): string {
  const trimmedBio = bio.trim()
  const firstSentence = trimmedBio.split(/[.!?]/)[0].trim()
  const base = firstSentence || trimmedBio || fallback

  if (base.length <= maxLen) return base

  const truncated = base.slice(0, maxLen)
  const lastSpace = truncated.lastIndexOf(' ')
  const cut = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated
  return `${cut.trim()}…`
}
