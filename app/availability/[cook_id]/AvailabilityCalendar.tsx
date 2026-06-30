'use client'

import { useState } from 'react'

function getNext21Days() {
  const days: string[] = []
  const today = new Date()
  for (let i = 0; i < 21; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function getMinBookableDate(): string {
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000)
  return cutoff.toISOString().split('T')[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function AvailabilityCalendar({
  cookId,
  cookName,
  existingDates,
}: {
  cookId: string
  cookName: string
  existingDates: string[]
}) {
  const days = getNext21Days()
  const minBookableDate = getMinBookableDate()
  const [selected, setSelected] = useState<Set<string>>(new Set(existingDates))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(date: string) {
    setSaved(false)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId, dates: [...selected] }),
    })
    setLoading(false)
    setSaved(true)
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Your Availability</h1>
      <p className="text-gray-500 text-sm mb-8">Hi {cookName}, tap the dates you are available to cook. Clients can see this when booking.</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {days.map(date => {
          const within48hrs = date <= minBookableDate
          return (
            <button
              key={date}
              onClick={() => toggle(date)}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors flex flex-col items-center gap-0.5 ${
                selected.has(date)
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
              }`}
            >
              <span>{formatDate(date)}</span>
              {within48hrs && (
                <span className={`text-xs font-normal ${selected.has(date) ? 'text-orange-100' : 'text-amber-500'}`}>
                  closed to clients
                </span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mb-6">Dates within 48 hours are not shown to clients for new bookings.</p>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save Availability'}
      </button>

      {saved && (
        <p className="mt-4 text-center text-green-600 text-sm font-medium">
          Availability saved — thank you!
        </p>
      )}
    </div>
  )
}
