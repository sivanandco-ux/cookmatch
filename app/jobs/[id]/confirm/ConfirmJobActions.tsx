'use client'

import { useState } from 'react'

export default function ConfirmJobActions({ jobId, interestId }: { jobId: string; interestId: string }) {
  const [loading, setLoading] = useState<'confirm' | 'decline' | null>(null)
  const [done, setDone] = useState<'confirmed' | 'declined' | null>(null)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading('confirm')
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interest_id: interestId }),
    })
    setLoading(null)
    if (res.ok) setDone('confirmed')
    else setError('Something went wrong. Please try again.')
  }

  async function handleDecline() {
    setDone('declined')
  }

  if (done === 'confirmed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800 mb-1">Booking confirmed</p>
        <p className="text-sm text-green-700">Contact details for your cook have been sent to your email.</p>
      </div>
    )
  }

  if (done === 'declined') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-gray-600 mb-2">You passed on this cook.</p>
        <p className="text-gray-500 text-sm mb-4">You will be notified if other cooks express interest in your job.</p>
        <a href="/jobs" className="text-orange-600 hover:underline text-sm">View job board →</a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleConfirm}
        disabled={loading !== null}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading === 'confirm' ? 'Confirming...' : 'Yes, confirm this cook'}
      </button>
      <button
        onClick={handleDecline}
        disabled={loading !== null}
        className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:border-gray-400 disabled:opacity-60"
      >
        Not this cook — wait for others
      </button>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
