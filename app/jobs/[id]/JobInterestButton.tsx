'use client'

import { useState } from 'react'

export default function JobInterestButton({
  jobId,
  cookId,
  alreadyInterested,
}: {
  jobId: string
  cookId: string
  alreadyInterested: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyInterested)
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
      setDone(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong.')
    }
  }

  if (done) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium">Interest sent</p>
        <p className="mt-1">The client has been notified. You will be contacted if they confirm you for this job.</p>
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
        The client will be notified and can choose to confirm you.
      </p>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
    </div>
  )
}
