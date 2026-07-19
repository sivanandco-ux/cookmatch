'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import GoogleIcon from '@/components/GoogleIcon'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'That sign-in attempt is invalid or expired. Please try again below.',
  missing_code: 'That sign-in attempt is invalid or expired. Please try again below.',
  no_application: "We couldn't find a Sivan Cooks application for that Google account's email.",
  no_user: 'Something went wrong signing you in. Please try again.',
  email_mismatch: 'This email is linked to a different account. Contact support if this seems wrong.',
  not_authorized: 'Please log in to view that page.',
  oauth_failed: 'Something went wrong signing in with Google. Please try again.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo')

  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setSigningIn(true)
    setError('')
    const supabase = createClient()
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) callbackUrl.searchParams.set('redirectTo', redirectTo)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })
    if (oauthError) {
      console.error('[Login] signInWithOAuth failed:', oauthError.status, oauthError.message)
      setError('Something went wrong starting Google sign-in. Please try again.')
      setSigningIn(false)
    }
    // On success the browser navigates away to Google — nothing else to do here.
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cook Login</h1>
      <p className="text-sm text-gray-500 mb-6">Sign in with the Google account you applied with.</p>

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
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
