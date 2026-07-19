'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  id: string
  sender_type: 'client' | 'cook'
  body: string
  created_at: string
}

const POLL_INTERVAL_MS = 4000

export default function MessageThread({
  conversationId,
  senderType,
  cookToken,
  otherPartyName,
}: {
  conversationId: string
  senderType: 'client' | 'cook'
  cookToken?: string
  otherPartyName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const endpoint = `/api/messages/${conversationId}${senderType === 'cook' && cookToken ? `?cook_token=${cookToken}` : ''}`

  async function fetchMessages() {
    try {
      const res = await fetch(endpoint)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // Silent — the next poll will retry; no need to surface transient network blips.
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: trimmed,
          ...(senderType === 'cook' ? { cook_token: cookToken } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong sending your message.')
        return
      }
      setText('')
      await fetchMessages()
    } catch {
      setError('Something went wrong sending your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-panel rounded-sm border border-copper-100 h-96 overflow-y-auto p-4 flex flex-col gap-3">
        {!loaded ? (
          <p className="text-sm text-gray-400 text-center my-auto">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center my-auto">
            No messages yet — say hello to {otherPartyName}.
          </p>
        ) : (
          messages.map(m => {
            const isMine = m.sender_type === senderType
            return (
              <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-400 mb-0.5 px-1">{isMine ? 'You' : otherPartyName}</span>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? 'bg-copper-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Message ${otherPartyName}...`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-copper-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-copper-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
