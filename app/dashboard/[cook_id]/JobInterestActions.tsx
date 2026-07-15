'use client'

import { useState } from 'react'

export default function JobInterestActions({
  jobId,
  interestId,
  cookId,
  cookConfirmed,
}: {
  jobId: string
  interestId: string
  cookId: string
  cookConfirmed: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'idle' | 'waiting' | 'done'>(cookConfirmed ? 'waiting' : 'idle')
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/cook-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest_id: interestId, cook_id: cookId }),
    })
    setLoading(false)
    if (!res.ok) { setError('Something went wrong. Please try again.'); return }
    const data = await res.json()
    setState(data.bothConfirmed ? 'done' : 'waiting')
  }

  if (state === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-center text-green-800 font-medium">
        ✓ Booking confirmed — check your email for details
      </div>
    )
  }

  if (state === 'waiting') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium">You have confirmed your availability</p>
        <p className="text-xs mt-0.5 text-blue-600">Waiting for the client to confirm. You will be notified by email.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-copper-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-copper-700 disabled:opacity-60"
      >
        {loading ? 'Confirming...' : 'Confirm I am available'}
      </button>
      {error && <p className="text-red-600 text-xs text-center">{error}</p>}
    </div>
  )
}
