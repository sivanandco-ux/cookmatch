'use client'

import { useState } from 'react'

export default function DashboardActions({ bookingId, cookId }: { bookingId: string; cookId: string }) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)

  async function handleAccept() {
    setLoading('accept')
    const res = await fetch(`/api/bookings/${bookingId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId }),
    })
    setLoading(null)
    if (res.ok) setDone('accepted')
  }

  async function handleDecline() {
    setLoading('decline')
    const res = await fetch(`/api/bookings/${bookingId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId }),
    })
    setLoading(null)
    if (res.ok) setDone('declined')
  }

  if (done === 'accepted') {
    return (
      <p className="text-sm text-blue-700 font-medium">
        Accepted — waiting for the client to confirm. You will be notified when they do.
      </p>
    )
  }

  if (done === 'declined') {
    return <p className="text-sm text-gray-500">You declined this brief.</p>
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleAccept}
        disabled={loading !== null}
        className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading === 'accept' ? 'Accepting...' : 'I want this job'}
      </button>
      <button
        onClick={handleDecline}
        disabled={loading !== null}
        className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400 disabled:opacity-60"
      >
        {loading === 'decline' ? 'Declining...' : 'Not available'}
      </button>
    </div>
  )
}
