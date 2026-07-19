'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'That sign-in attempt is invalid or expired. Please try again below.',
  no_user: 'Something went wrong signing you in. Please try again.',
  not_authorized: 'Please log in to view that page.',
  oauth_failed: 'Something went wrong signing in with Google. Please try again.',
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.57.38-2.29V6.6H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.6l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  )
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
