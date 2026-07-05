'use client'

import { useState } from 'react'

const REASONS = [
  'Profanity or offensive language',
  'Harassment or threatening content',
  'Spam or fake job',
  'Other',
]

export default function ReportButton({ jobId, cookId }: { jobId: string; cookId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  async function submit() {
    setStatus('submitting')
    await fetch(`/api/jobs/${jobId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cook_id: cookId, reason, details }),
    })
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-gray-500 text-center mt-6">
        Thank you — we will review this post within 24 hours.
      </p>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
        >
          Report this job post
        </button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-red-800 mb-3">Report inappropriate content</p>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Reason</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={2}
                placeholder="Describe what you heard or saw..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={status === 'submitting'}
                className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Sending…' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
