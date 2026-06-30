'use client'

import { useState } from 'react'

export default function ConfirmActions({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)
  const [done, setDone] = useState<'confirmed' | 'cancelled' | null>(null)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading('confirm')
    setError('')
    const res = await fetch(`/api/bookings/${bookingId}/confirm`, { method: 'POST' })
    setLoading(null)
    if (res.ok) setDone('confirmed')
    else setError('Something went wrong. Please try again.')
  }

  async function handleCancel() {
    setLoading('cancel')
    setError('')
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
    setLoading(null)
    if (res.ok) setDone('cancelled')
    else setError('Something went wrong. Please try again.')
  }

  if (done === 'confirmed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-800 mb-1">Session confirmed</p>
        <p className="text-sm text-green-700">Contact details for your cook have been sent to your email.</p>
      </div>
    )
  }

  if (done === 'cancelled') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <p className="text-gray-600 mb-4">Your booking has been cancelled.</p>
        <a href="/cooks" className="text-orange-600 hover:underline text-sm">Browse other cooks →</a>
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
        {loading === 'confirm' ? 'Confirming...' : 'Yes, confirm this booking'}
      </button>
      <button
        onClick={handleCancel}
        disabled={loading !== null}
        className="w-full border border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:border-gray-400 disabled:opacity-60"
      >
        {loading === 'cancel' ? 'Cancelling...' : 'Cancel — my plans changed'}
      </button>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
