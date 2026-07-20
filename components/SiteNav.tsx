'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readSessionCookie, clearSessionCookie } from '@/lib/supabase/readSessionCookie'

const LINKS = [
  { href: '/cooks', label: 'Hire a Cook' },
  { href: '/jobs', label: 'Community Cravings' },
  { href: '/my-bookings', label: 'My Bookings' },
  { href: '/become-a-cook', label: 'Cook Guide' },
  { href: '/', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

interface Session {
  avatarUrl: string | null
  name: string
  dashboardHref: string
}

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadSession() {
      try {
        // Read the session straight from its cookie instead of calling
        // supabase.auth.getSession() — that call has been observed taking
        // 4-6+ seconds on this project (likely a network round-trip to the
        // auth server), which made the avatar take far too long to appear.
        // This is a cosmetic check only; every security-sensitive check
        // still goes through server-side getUser().
        const user = readSessionCookie()
        if (!user) {
          setSession(null)
          return
        }
        setSession({
          avatarUrl: (user.user_metadata?.avatar_url || user.user_metadata?.picture || null) as string | null,
          name: (user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Account') as string,
          // Default to My Bookings — patched below once we know whether
          // this user is actually a cook.
          dashboardHref: '/my-bookings',
        })
        // A logged-in user is either a cook (goes to their dashboard) or a
        // client (goes to My Bookings) — resolved separately since it needs
        // a DB round-trip, which shouldn't block the avatar itself from
        // appearing. Uses a plain fetch against PostgREST directly (cooks
        // is publicly readable) instead of the Supabase client's .from() —
        // that call has shown the same unreliable multi-second-or-hung
        // behavior as getSession() and signOut() on this project.
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cooks?user_id=eq.${user.id}&select=id`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
          }
        )
        const rows = res.ok ? await res.json() : []
        if (rows[0]?.id) {
          const cookId = rows[0].id
          setSession(prev => prev && { ...prev, dashboardHref: `/dashboard/${cookId}` })
        }
      } catch (err) {
        // Fall back to the logged-out nav rather than leaving state stuck
        // mid-check forever if the session check errors for any reason.
        console.error('[SiteNav] Session check failed:', err)
        setSession(null)
      }
    }

    loadSession()
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadSession())
    return () => listener.subscription.unsubscribe()
  }, [])

  function handleLogout() {
    clearSessionCookie()
    setSession(null)
    setOpen(false)
    router.push('/')
    router.refresh()
    // Fire-and-forget: revokes the refresh token server-side, but the UI
    // has already logged out locally — no reason to make the user wait on it.
    createClient().auth.signOut().catch(() => {})
  }

  function Avatar({ size }: { size: number }) {
    if (!session) return null
    return session.avatarUrl ? (
      <img
        src={session.avatarUrl}
        alt={session.name}
        width={size}
        height={size}
        className="rounded-full ring-2 ring-brass-light object-cover"
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        className="rounded-full ring-2 ring-brass-light bg-copper-600 text-white font-display font-bold flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {session.name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
        {LINKS.map(l => (
          <a key={l.href} href={l.href} className="text-paper/80 hover:text-brass-light">{l.label}</a>
        ))}
        {session ? (
          <div className="flex items-center gap-3">
            <a href={session.dashboardHref} className="flex items-center gap-2 text-paper/80 hover:text-brass-light" title={session.name}>
              <Avatar size={32} />
            </a>
            <button onClick={handleLogout} className="text-xs text-paper/60 hover:text-brass-light">Log out</button>
          </div>
        ) : (
          <div className="flex items-center border border-paper/25 rounded-lg overflow-hidden">
            <a href="/apply" className="px-4 py-2 bg-copper-600 text-white hover:bg-copper-700">Cook Sign In</a>
          </div>
        )}
      </nav>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-paper/80 hover:text-brass-light"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {session ? (
          <Avatar size={28} />
        ) : open ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col py-2 z-50 text-sm font-medium">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
              {l.label}
            </a>
          ))}
          <div className="border-t border-gray-100 my-1" />
          {session ? (
            <>
              <a href={session.dashboardHref} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
                {session.name}
              </a>
              <button onClick={handleLogout} className="text-left px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
                Log out
              </button>
            </>
          ) : (
            <a href="/apply" onClick={() => setOpen(false)} className="mx-4 mt-1 mb-1 px-4 py-2 text-center rounded-lg bg-copper-600 text-white hover:bg-copper-700">
              Cook Sign In
            </a>
          )}
        </nav>
      )}
    </div>
  )
}
