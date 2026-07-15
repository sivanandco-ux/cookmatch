'use client'

import { useState } from 'react'

export default function ConfirmJobActions({
  jobId,
  interestId,
  cookName,
}: {
  jobId: string
  interestId: string
  cookName: string
}) {
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'idle' | 'waiting' | 'done'>('idle')
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest_id: interestId }),
    })
    setLoading(false)
    if (!res.ok) { setError('Something went wrong. Please try again.'); return }
    const data = await res.json()
    setState(data.bothConfirmed ? 'done' : 'waiting')
  }

  if (state === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800 mb-1">Booking confirmed</p>
        <p className="text-sm text-green-700">Both you and {cookName} have confirmed. Check your email for details.</p>
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-blue-800 mb-1">You have confirmed</p>
        <p className="text-sm text-blue-700">Waiting for {cookName} to confirm their availability. You will receive an email once the booking is locked in.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-copper-600 text-white py-3 rounded-lg font-medium hover:bg-copper-700 disabled:opacity-60"
      >
        {loading ? 'Confirming...' : 'Confirm this cook'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Not happy after your conversation? Simply wait — you will be notified when other cooks express interest.
      </p>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
