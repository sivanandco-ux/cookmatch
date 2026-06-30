'use client'

import { useState } from 'react'
import SessionBrief from './SessionBrief'
import type { SessionBriefFormData } from '@/lib/types'

export default function BookingForm({
  cookId,
  cookName,
  availableDates,
}: {
  cookId: string
  cookName: string
  availableDates: string[]
}) {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(data: SessionBriefFormData) {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, cook_id: cookId }),
    })
    if (!res.ok) throw new Error('Submission failed')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <p className="font-semibold text-green-800 mb-2">Brief sent to {cookName}</p>
        <p className="text-sm text-green-700">
          {cookName} will review your session brief and voice memo. You will receive an email when they respond — usually within a few hours.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Once {cookName} accepts, you will get an email to confirm the booking. Contact details are shared only after both sides confirm.
        </p>
      </div>
    )
  }

  return (
    <SessionBrief
      mode="browse"
      availableDates={availableDates}
      cookName={cookName}
      onSubmit={handleSubmit}
      submitLabel={`Send Brief to ${cookName}`}
    />
  )
}
