'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GoogleIcon from '@/components/GoogleIcon'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'That sign-in attempt is invalid or expired. Please try again below.',
  no_user: 'Something went wrong signing you in. Please try again.',
  not_authorized: 'Please log in to view that page.',
  oauth_failed: 'Something went wrong signing in with Google. Please try again.',
}

function ClientLoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo')

  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setSigningIn(true)
    setError('')
    const supabase = createClient()
    const callbackUrl = new URL('/client-auth/callback', window.location.origin)
    if (redirectTo) callbackUrl.searchParams.set('redirectTo', redirectTo)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })
    if (oauthError) {
      console.error('[ClientLogin] signInWithOAuth failed:', oauthError.status, oauthError.message)
      setError('Something went wrong starting Google sign-in. Please try again.')
      setSigningIn(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sign in with Google to see all your bookings and conversations with cooks in one place.
      </p>

      {urlError && (
        <p className="text-sm text-red-600 mb-4">{ERROR_MESSAGES[urlError] || 'Something went wrong. Please try again.'}</p>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={signingIn}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
      >
        <GoogleIcon />
        {signingIn ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <p className="text-xs text-gray-400 mt-6 text-center">
        You don&apos;t need an account to book a cook or message them — this just gives you one place to see everything.
      </p>
    </div>
  )
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={null}>
      <ClientLoginForm />
    </Suspense>
  )
}
