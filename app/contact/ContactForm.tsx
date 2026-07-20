'use client'

import { useState } from 'react'

const MESSAGE_LIMIT = 1000

export default function ContactForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSending(true)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    })
    setSending(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Something went wrong. Please try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Message sent</h2>
        <p className="text-sm text-gray-500">Thanks for reaching out — we'll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Your email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
        <textarea
          required
          rows={6}
          maxLength={MESSAGE_LIMIT}
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
          placeholder="What's on your mind?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
        <p className={`text-xs mt-1 ${message.length >= MESSAGE_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
          {message.length} / {MESSAGE_LIMIT} characters
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-50"
      >
        {sending ? 'Sending...' : 'Send message'}
      </button>
    </form>
  )
}
