'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clearSessionCookie } from '@/lib/supabase/readSessionCookie'

export default function LogoutButton() {
  const router = useRouter()

  function handleLogout() {
    clearSessionCookie()
    router.push('/login')
    router.refresh()
    // Fire-and-forget: revokes the refresh token server-side, but the UI
    // has already logged out locally — no reason to make the user wait on it.
    createClient().auth.signOut().catch(() => {})
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 shrink-0"
    >
      Log out
    </button>
  )
}
