'use client'

import { useState } from 'react'
import SessionBrief from '@/components/SessionBrief'
import type { SessionBriefFormData } from '@/lib/types'

export default function PostJobPage() {
  const [jobId, setJobId] = useState<string | null>(null)

  async function handleSubmit(data: SessionBriefFormData) {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Submission failed')
    }
    const result = await res.json()
    setJobId(result.job_id)
  }

  if (jobId) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Craving posted</h1>
        <p className="text-gray-600 mb-2">
          Your craving is now live on the board. Approved cooks will review it and express interest.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You will receive an email when a cook wants the job. You then confirm the cook before contact details are shared.
        </p>
        <div className="flex flex-col gap-3">
          <a href="/jobs" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 inline-block">
            View Community Cravings
          </a>
          <a href="/cooks" className="text-orange-600 hover:underline text-sm">
            Or browse cooks directly →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <a href="/jobs" className="text-sm text-orange-600 hover:underline mb-6 inline-block">
        ← Back to Community Cravings
      </a>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Your Craving</h1>
      <p className="text-gray-600 mb-8 text-sm">
        Describe what you need and approved cooks will express interest. You choose who to confirm.
      </p>
      <SessionBrief
        mode="job-board"
        onSubmit={handleSubmit}
        submitLabel="Post Your Craving"
      />
    </div>
  )
}
