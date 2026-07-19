'use client'

import { useState } from 'react'

const SESSION_DIMENSIONS = [
  { key: 'taste',            label: 'Taste' },
  { key: 'cleanliness',      label: 'Cleanliness' },
  { key: 'punctuality',      label: 'Punctuality' },
  { key: 'respect',          label: 'Respect' },
  { key: 'clean_appearance', label: 'Clean Appearance' },
] as const

const ITEM_DIMENSIONS = [
  { key: 'taste',       label: 'Taste' },
  { key: 'packaging',   label: 'Packaging' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'respect',     label: 'Respect' },
] as const

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors ${star <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function FeedbackForm({
  bookingId,
  cookId,
  cookName,
  clientName,
  ratingCategory,
}: {
  bookingId: string
  cookId: string
  cookName: string
  clientName: string
  ratingCategory: 'session' | 'item'
}) {
  const DIMENSIONS = ratingCategory === 'session' ? SESSION_DIMENSIONS : ITEM_DIMENSIONS
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(DIMENSIONS.map(d => [d.key, 0]))
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (Object.values(ratings).some(v => v === 0)) {
      setError(`Please rate all ${DIMENSIONS.length} dimensions before submitting.`)
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId, cook_id: cookId, rating_category: ratingCategory, ...ratings, notes }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Thank you for your feedback!</h1>
        <p className="text-gray-600">Your review helps {cookName} grow and helps other clients find the right cook.</p>
        <a href="/cooks" className="mt-8 inline-block text-copper-600 hover:underline">Browse cooks →</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {ratingCategory === 'session' ? `How was your session with ${cookName}?` : `How was your order from ${cookName}?`}
      </h1>
      <p className="text-gray-500 text-sm mb-8">Hi {clientName}, share your experience — it takes under 2 minutes.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 w-40">{label}</span>
              <StarPicker
                value={ratings[key]}
                onChange={(v) => setRatings(prev => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any comments for the cook? (optional)"
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-copper-600 text-white py-3 rounded-lg font-medium hover:bg-copper-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}
