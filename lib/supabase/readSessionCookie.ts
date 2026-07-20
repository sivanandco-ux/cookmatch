// Cosmetic-only session read: decodes the sb-<project-ref>-auth-token cookie
// directly instead of calling supabase.auth.getSession(), which has been
// observed taking 4-6+ seconds (likely a network round-trip to the auth
// server) on this project — far too slow for gating what a page shows right
// after a Google sign-in redirect. Server-side pages already prove the
// cookie itself is valid the instant it's set (getUser() in middleware and
// server components), so this only needs to answer "is a session cookie
// present," not re-verify it. Never use this for anything security-sensitive.
export interface ClientSessionUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

function getProjectRef(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  } catch {
    return null
  }
}

export function readSessionCookie(): ClientSessionUser | null {
  if (typeof document === 'undefined') return null
  const projectRef = getProjectRef()
  if (!projectRef) return null
  const baseName = `sb-${projectRef}-auth-token`

  const cookies: Record<string, string> = {}
  for (const pair of document.cookie.split('; ')) {
    if (!pair) continue
    const idx = pair.indexOf('=')
    if (idx === -1) continue
    cookies[pair.slice(0, idx)] = decodeURIComponent(pair.slice(idx + 1))
  }

  // Small sessions fit in the base cookie; larger ones are chunked into
  // <baseName>.0, <baseName>.1, ... by @supabase/ssr.
  let raw = cookies[baseName]
  if (raw === undefined) {
    const parts: string[] = []
    for (let i = 0; cookies[`${baseName}.${i}`] !== undefined; i++) {
      parts.push(cookies[`${baseName}.${i}`])
    }
    if (parts.length === 0) return null
    raw = parts.join('')
  }

  try {
    const jsonStr = raw.startsWith('base64-') ? atob(raw.slice(7)) : raw
    const parsed = JSON.parse(jsonStr)
    return parsed?.user ?? null
  } catch {
    return null
  }
}

// Clears the session cookie(s) immediately instead of waiting on
// supabase.auth.signOut(), which shares the same multi-second network
// latency documented above — logging out shouldn't make someone wait 4-6+
// seconds staring at an unresponsive button. Call supabase.auth.signOut()
// too (fire-and-forget) so the refresh token is actually revoked
// server-side, but don't block the UI on it.
export function clearSessionCookie(): void {
  if (typeof document === 'undefined') return
  const projectRef = getProjectRef()
  if (!projectRef) return
  const baseName = `sb-${projectRef}-auth-token`

  const names = document.cookie
    .split('; ')
    .map(pair => pair.slice(0, pair.indexOf('=')))
    .filter(name => name === baseName || name.startsWith(`${baseName}.`))

  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`
  }
}
