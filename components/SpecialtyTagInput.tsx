'use client'

import { useState } from 'react'

export default function SpecialtyTagInput({
  value,
  onChange,
  suggestions,
  label,
  placeholder,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  label: string
  placeholder?: string
}) {
  const [text, setText] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  function hasTag(tag: string) {
    return value.some(v => v.toLowerCase() === tag.toLowerCase())
  }

  async function addTyped(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed || checking) return
    if (hasTag(trimmed)) { setText(''); return }

    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/validate-specialty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json()
      if (data.valid) {
        const finalTag = data.corrected || trimmed
        if (!hasTag(finalTag)) onChange([...value, finalTag])
        setText('')
      } else {
        setError(`"${trimmed}" doesn't look like a valid cuisine, cooking style, or food specialty. Try something like "Chettinad" (a cuisine), "Baking" (a category), or "Pickles" (a specific item).`)
      }
    } catch {
      setError('Something went wrong checking that — please try again.')
    } finally {
      setChecking(false)
    }
  }

  function addSuggestion(s: string) {
    if (!hasTag(s)) onChange([...value, s])
  }

  function removeTag(tag: string) {
    onChange(value.filter(v => v !== tag))
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 rounded-full pl-2.5 pr-1.5 py-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-orange-400 hover:text-orange-600 leading-none"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTyped(text) } }}
          placeholder={placeholder ?? 'e.g. Chettinad, Baking, Pickles'}
          disabled={checking}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={() => addTyped(text)}
          disabled={checking || !text.trim()}
          className="text-sm text-orange-600 border border-orange-300 rounded-lg px-3 py-2 hover:bg-orange-50 disabled:opacity-40 shrink-0"
        >
          {checking ? 'Checking…' : 'Add'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

      {suggestions.some(s => !hasTag(s)) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs text-gray-400 mt-1">Suggestions:</span>
          {suggestions.filter(s => !hasTag(s)).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addSuggestion(s)}
              className="text-xs rounded-full px-2.5 py-1 border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
