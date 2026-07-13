'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { renderMarkdown } from '@/lib/renderMarkdown'
import { US_STATES } from '@/lib/usStates'

type Message = { role: 'user' | 'assistant'; content: string }

const TOPICS = [
  {
    label: '🚗 Travel to cook in homes',
    needsState: true,
    prompt: (state: string) => `I'm in ${state} and I want to travel to client homes to cook. What do I need to get started?`,
  },
  {
    label: '🏠 Cook & sell from your home',
    needsState: true,
    prompt: (state: string) => `I'm in ${state} and I want to cook food at home and sell it. What do I need to do?`,
  },
  {
    label: '💵 Getting paid & taxes',
    needsState: false,
    prompt: () => 'How does getting paid work, and do I need to report my earnings?',
  },
]

export default function EducationChat({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingTopic, setPendingTopic] = useState<typeof TOPICS[number] | null>(null)
  const [selectedState, setSelectedState] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    if (!text.trim() || loading) return
    const next = [...messages, { role: 'user' as const, content: text.trim() }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.message || "Sorry, I didn't catch that — could you rephrase?" }])
    } catch {
      setMessages([...next, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  function pickTopic(topic: typeof TOPICS[number]) {
    if (topic.needsState) { setPendingTopic(topic); return }
    send(topic.prompt(''))
  }

  function confirmState() {
    if (!pendingTopic || !selectedState) return
    send(pendingTopic.prompt(selectedState))
    setPendingTopic(null)
    setSelectedState('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'gap-4'}`}>
      {!compact && (
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cook & Sell Food</h2>
          <p className="text-sm text-gray-500 mt-1">Ask about certification, selling food from home, or getting paid — anywhere in the US.</p>
        </div>
      )}

      <div ref={scrollRef} className={`flex-1 overflow-y-auto flex flex-col gap-3 ${compact ? 'px-4 py-4' : 'py-2'}`} style={compact ? undefined : { maxHeight: 420 }}>
        {messages.length === 0 && !pendingTopic && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Pick a topic to start</p>
            {TOPICS.map(t => (
              <button key={t.label} onClick={() => pickTopic(t)}
                className="text-left border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 hover:border-orange-400 hover:bg-orange-50 transition-colors">
                {t.label}
              </button>
            ))}
          </div>
        )}
        {messages.length === 0 && pendingTopic && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">{pendingTopic.label} — which state are you in? The requirements depend on where you live.</p>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
              value={selectedState} onChange={e => setSelectedState(e.target.value)}>
              <option value="">Select your state</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setPendingTopic(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:border-orange-400 hover:text-orange-600 transition-colors">Back</button>
              <button onClick={confirmState} disabled={!selectedState}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
                Continue
              </button>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
            m.role === 'user' ? 'self-end bg-orange-600 text-white' : 'self-start bg-gray-100 text-gray-800'
          }`}>
            {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-gray-100 text-gray-500 rounded-xl px-3 py-2 text-sm">Thinking...</div>
        )}
      </div>

      <div className={compact ? 'px-4 pb-3' : ''}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50">
            Send
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2">
          General information only, not legal or tax advice — confirm specifics with your state health/agriculture department or a tax professional.
        </p>
      </div>
    </div>
  )
}
