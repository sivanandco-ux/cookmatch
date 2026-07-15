'use client'

import { useState } from 'react'

export default function StartJobActions({
  bookingId,
  cookId,
}: {
  bookingId: string
  cookId: string
}) {
  const [state, setState] = useState<'idle' | 'sent' | 'started'>('idle')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRequestOtp() {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/request-start-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cook_id: cookId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      setState('sent')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleVerify() {
    if (!code.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify-start-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cook_id: cookId, code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      setState('started')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  if (state === 'started') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-center text-green-800 font-medium">
        ✓ Job started
      </div>
    )
  }

  if (state === 'sent') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-500">Ask the client for the code we just texted them, then enter it below.</p>
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper-400 w-full bg-white tracking-widest text-center"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
        />
        <button
          onClick={handleVerify}
          disabled={loading || code.trim().length < 6}
          className="w-full bg-copper-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-copper-700 disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Verify & Start Job'}
        </button>
        <button onClick={handleRequestOtp} disabled={loading} className="text-xs text-gray-400 hover:text-gray-600 text-center">
          Resend code
        </button>
        {error && <p className="text-red-600 text-xs text-center">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRequestOtp}
        disabled={loading}
        className="w-full bg-copper-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-copper-700 disabled:opacity-60"
      >
        {loading ? 'Sending code...' : 'Start Job'}
      </button>
      {error && <p className="text-red-600 text-xs text-center">{error}</p>}
    </div>
  )
}
