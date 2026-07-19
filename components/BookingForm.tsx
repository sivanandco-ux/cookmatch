'use client'

import { useState } from 'react'
import SessionBrief from './SessionBrief'
import type { SessionBriefFormData } from '@/lib/types'

export default function BookingForm({
  cookId,
  cookName,
  availableDates,
  cookDietarySpecialties,
  cookOfferingTypes,
  cookCuisineTypes,
}: {
  cookId: string
  cookName: string
  availableDates: string[]
  cookDietarySpecialties?: string[]
  cookOfferingTypes?: string[]
  cookCuisineTypes?: string[]
}) {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(data: SessionBriefFormData) {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, cook_id: cookId }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Submission failed')
    }
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
          Once {cookName} accepts, you will both receive each other's contact details to discuss the details and confirm the booking.
        </p>
      </div>
    )
  }

  return (
    <SessionBrief
      mode="browse"
      availableDates={availableDates}
      cookName={cookName}
      cookDietarySpecialties={cookDietarySpecialties}
      cookOfferingTypes={cookOfferingTypes}
      cookCuisineTypes={cookCuisineTypes}
      onSubmit={handleSubmit}
      submitLabel={`Send Brief to ${cookName}`}
    />
  )
}
