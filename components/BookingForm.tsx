'use client'

import { useState } from 'react'

const OCCASIONS = ['Daily Meals / Tiffin', 'Weekend Family Cooking', 'Festival / Occasion', 'Dinner Party', 'Other']
const GROUP_SIZES = ['2–4 people', '5–10 people', '10–20 people', '20+ people']

interface ContactInfo {
  phone: string
  email: string
  whatsapp: string | null
  discountCode: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function BookingForm({
  cookId,
  cookName,
  cuisineTypes,
  dietarySpecialties,
  availableRecurring,
  availableDates,
}: {
  cookId: string
  cookName: string
  cuisineTypes: string[]
  dietarySpecialties: string[]
  availableRecurring: boolean
  availableDates: string[]
}) {
  const [sessionType, setSessionType] = useState<'one_time' | 'recurring'>('one_time')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const body = {
      cook_id: cookId,
      client_name: formData.get('client_name'),
      client_email: formData.get('client_email'),
      client_phone: formData.get('client_phone'),
      session_type: sessionType,
      recurring_frequency: sessionType === 'recurring' ? formData.get('recurring_frequency') : null,
      preferred_date: selectedDate,
      group_size: formData.get('group_size'),
      cuisine_needs: formData.get('cuisine_needs'),
      dietary_needs: formData.get('dietary_needs'),
      occasion_type: formData.get('occasion_type'),
      notes: formData.get('notes'),
    }

    if (!selectedDate) {
      setError('Please select an available date.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const data = await res.json()
    setContact(data.contact)
    setLoading(false)
  }

  if (contact) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-semibold text-green-800 mb-3">Contact {cookName} directly:</p>
          <div className="space-y-2 text-sm">
            <p>📞 <a href={`tel:${contact.phone}`} className="text-orange-600 hover:underline">{contact.phone}</a></p>
            <p>✉️ <a href={`mailto:${contact.email}`} className="text-orange-600 hover:underline">{contact.email}</a></p>
            {contact.whatsapp && (
              <p>💬 WhatsApp: <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} className="text-orange-600 hover:underline">{contact.whatsapp}</a></p>
            )}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-orange-800 mb-1">🎁 Your SivanSpices Gift</p>
          <p className="text-xs text-orange-700 mb-2">Use code below for 20% off your first order at SivanSpices.com:</p>
          <p className="font-mono font-bold text-orange-600 text-lg tracking-wide">{contact.discountCode}</p>
          <a href="https://sivanspices.com" target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-orange-600 hover:underline">
            Shop SivanSpices →
          </a>
        </div>
        <p className="text-xs text-gray-400">{cookName} has also been notified of your inquiry.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-semibold text-gray-900">Request to Book</h3>

      {/* Session type toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setSessionType('one_time')}
          className={`flex-1 py-2 ${sessionType === 'one_time' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
        >
          One-time
        </button>
        {availableRecurring && (
          <button
            type="button"
            onClick={() => setSessionType('recurring')}
            className={`flex-1 py-2 ${sessionType === 'recurring' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600'}`}
          >
            Recurring
          </button>
        )}
      </div>

      {sessionType === 'recurring' && (
        <select name="recurring_frequency" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      )}

      <input name="client_name" required placeholder="Your name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input name="client_email" type="email" required placeholder="Your email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input name="client_phone" type="tel" required placeholder="Your phone number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />

      {availableDates.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-sm text-amber-800">
          This cook hasn't set their availability yet — check back soon.
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-2">Select an available date:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {availableDates.map(date => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`rounded-lg px-2 py-2 text-xs font-medium border transition-colors ${
                  selectedDate === date
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                }`}
              >
                {formatDate(date)}
              </button>
            ))}
          </div>
        </div>
      )}

      <select name="group_size" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Number of people</option>
        {GROUP_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select name="occasion_type" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Occasion type</option>
        {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <select name="cuisine_needs" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Cuisine preference</option>
        {cuisineTypes.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select name="dietary_needs" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Dietary needs</option>
        {dietarySpecialties.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <textarea name="notes" placeholder="Any special requests or notes" rows={3} className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || availableDates.length === 0}
        className="bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? 'Submitting...' : 'Submit & Get Contact Info'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Contact info is revealed after submission. All terms are negotiated directly with {cookName}.
      </p>
    </form>
  )
}
