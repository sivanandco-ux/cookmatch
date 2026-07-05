'use client'

import { useState } from 'react'

type InterestState = 'none' | 'sent' | 'client_confirmed' | 'cook_confirmed' | 'both_confirmed'

function getInitialState(existing: { id: string; cook_confirmed: boolean; client_confirmed: boolean } | null): InterestState {
  if (!existing) return 'none'
  if (existing.cook_confirmed && existing.client_confirmed) return 'both_confirmed'
  if (existing.client_confirmed) return 'client_confirmed'
  if (existing.cook_confirmed) return 'cook_confirmed'
  return 'sent'
}

export default function JobInterestButton({
  jobId,
  cookId,
  existingInterest,
}: {
  jobId: string
  cookId: string
  existingInterest: { id: string; cook_confirmed: boolean; client_confirmed: boolean } | null
}) {
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<InterestState>(getInitialState(existingInterest))
  const [interestId, setInterestId] = useState(existingInterest?.id ?? '')
  const [error, setError] = useState('')

  async function handleInterest() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      setInterestId(data.interest_id ?? '')
      setState('sent')
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong.')
    }
  }

  async function handleCookConfirm() {
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
    setState(data.bothConfirmed ? 'both_confirmed' : 'cook_confirmed')
  }

  if (state === 'both_confirmed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800">Booking confirmed</p>
        <p className="text-sm text-green-700 mt-1">Both you and the client have confirmed. Check your email for details.</p>
      </div>
    )
  }

  if (state === 'client_confirmed') {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-900 mb-1">The client has confirmed you</p>
          <p className="text-sm text-orange-800">Contact the client, agree on the details, then confirm your availability below to lock in the booking.</p>
        </div>
        <button
          onClick={handleCookConfirm}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? 'Confirming...' : 'Confirm I am available'}
        </button>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>
    )
  }

  if (state === 'cook_confirmed') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium">You have confirmed your availability</p>
        <p className="mt-1 text-blue-600">Waiting for the client to confirm. You will receive an email once the booking is locked in.</p>
      </div>
    )
  }

  if (state === 'sent') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium">Interest sent</p>
        <p className="mt-1">The client has been notified with your contact details. Reach out to them and confirm your availability on this page once you have spoken.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleInterest}
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? 'Sending...' : 'I want this job'}
      </button>
      <p className="text-xs text-gray-400 text-center">
        The client will receive your contact details and can reach out to discuss the session.
      </p>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
