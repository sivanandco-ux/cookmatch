'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: 'That link is invalid or has expired. Please request a new one below.',
  missing_code: 'That link is invalid or has expired. Please request a new one below.',
  no_application: "We couldn't find a Sivan Spices application for that email.",
  no_user: 'Something went wrong signing you in. Please try again.',
  email_mismatch: 'This email is linked to a different account. Contact support if this seems wrong.',
  not_authorized: 'Please log in to view that page.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo')

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    const supabase = createClient()
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (redirectTo) callbackUrl.searchParams.set('redirectTo', redirectTo)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    })
    setSending(false)
    if (otpError) {
      console.error('[Login] signInWithOtp failed:', otpError.status, otpError.message)
      setError(`Something went wrong sending the link: ${otpError.message}`)
      return
    }
    setSent(true)
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cook Login</h1>
      <p className="text-sm text-gray-500 mb-6">Enter the email you applied with — we'll send you a login link.</p>

      {urlError && !sent && (
        <p className="text-sm text-red-600 mb-4">{ERROR_MESSAGES[urlError] || 'Something went wrong. Please try again.'}</p>
      )}

      {sent ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          Check your email — we sent a login link to <strong>{email}</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send login link'}
          </button>
        </form>
      )}
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
