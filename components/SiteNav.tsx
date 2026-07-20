'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
  { href: '/cooks', label: 'Hire a Cook' },
  { href: '/jobs', label: 'Community Cravings' },
  { href: '/my-bookings', label: 'My Bookings' },
  { href: '/', label: 'About' },
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
        // getSession() reads the session straight from cookies — no network
        // round-trip. getUser() re-verifies against the auth server on every
        // call, which is the right call for a security-sensitive server-side
        // decision (middleware uses it for that reason) but is overkill and
        // an extra point of failure for a purely cosmetic "are they logged
        // in" check here.
        const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession()
        // TEMPORARY DEBUG — remove once the nav session bug is diagnosed.
        console.log('[SiteNav debug] document.cookie has sb- entries:', document.cookie.split('; ').filter(c => c.startsWith('sb-')).map(c => c.split('=')[0]))
        console.log('[SiteNav debug] getSession() result:', { hasSession: !!authSession, userId: authSession?.user?.id, error: sessionError })
        const user = authSession?.user
        if (!user) {
          setSession(null)
          return
        }
        // A logged-in user is either a cook (goes to their dashboard) or a
        // client (goes to My Bookings) — this is the only place that
        // distinction needs resolving just to pick the avatar's link target.
        const { data: cook } = await supabase.from('cooks').select('id').eq('user_id', user.id).maybeSingle()
        setSession({
          avatarUrl: (user.user_metadata?.avatar_url || user.user_metadata?.picture || null) as string | null,
          name: (user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Account') as string,
          dashboardHref: cook ? `/dashboard/${cook.id}` : '/my-bookings',
        })
      } catch (err) {
        // getUser() makes a live round-trip to the auth server — if it
        // errors (network blip, expired refresh token) fall back to the
        // logged-out nav rather than leaving state stuck mid-check forever.
        console.error('[SiteNav] Session check failed:', err)
        setSession(null)
      }
    }

    loadSession()
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadSession())
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
    setOpen(false)
    router.push('/')
    router.refresh()
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
            <a href="/become-a-cook" className="px-4 py-2 text-paper/80 hover:bg-leaf-600 hover:text-brass-light">Cook Guide</a>
            <a href="/login" className="px-4 py-2 text-paper/80 hover:bg-leaf-600 hover:text-brass-light border-l border-paper/25">Cook Log In</a>
            <a href="/apply" className="px-4 py-2 bg-copper-600 text-white hover:bg-copper-700 border-l border-paper/25">Cook Sign Up</a>
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
            <>
              <a href="/become-a-cook" onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
                Cook Guide
              </a>
              <a href="/login" onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
                Cook Log In
              </a>
              <a href="/apply" onClick={() => setOpen(false)} className="mx-4 mt-1 mb-1 px-4 py-2 text-center rounded-lg bg-copper-600 text-white hover:bg-copper-700">
                Cook Sign Up
              </a>
            </>
          )}
        </nav>
      )}
    </div>
  )
}
