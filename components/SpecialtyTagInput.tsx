'use client'

import { useState } from 'react'

export default function SpecialtyTagInput({
  value,
  onChange,
  suggestions,
  label,
  placeholder,
  max,
  skipValidation,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  label: string
  placeholder?: string
  max?: number
  skipValidation?: boolean
}) {
  const [text, setText] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  function hasTag(tag: string) {
    return value.some(v => v.toLowerCase() === tag.toLowerCase())
  }

  // With a max reached, a newly-added tag replaces the existing one(s)
  // instead of appending — used to reuse this component as a single
  // validated-item field (max=1) rather than a multi-tag list.
  function addTag(tag: string, current: string[]) {
    if (max && current.length >= max) return [tag]
    return [...current, tag]
  }

  // The placeholder text ("e.g. Chettinad, Baking, Pickles") implies commas
  // separate multiple entries — split on them so "Batter, Sambar" becomes
  // two tags instead of one literal "Batter, Sambar" tag.
  async function addTyped(raw: string) {
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length === 0 || checking) return

    if (skipValidation) {
      let next = value
      for (const part of parts) {
        if (!next.some(v => v.toLowerCase() === part.toLowerCase())) {
          next = addTag(part, next)
        }
      }
      onChange(next)
      setText('')
      return
    }

    setChecking(true)
    setError('')
    try {
      let next = value
      const invalid: string[] = []
      for (const part of parts) {
        if (next.some(v => v.toLowerCase() === part.toLowerCase())) continue
        const res = await fetch('/api/validate-specialty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: part }),
        })
        const data = await res.json()
        if (data.valid) {
          const finalTag = data.corrected || part
          if (!next.some(v => v.toLowerCase() === finalTag.toLowerCase())) {
            next = addTag(finalTag, next)
          }
        } else {
          invalid.push(part)
        }
      }
      onChange(next)
      if (invalid.length > 0) {
        setText(invalid.join(', '))
        setError(`${invalid.map(t => `"${t}"`).join(', ')} ${invalid.length > 1 ? "don't" : "doesn't"} look like a valid cuisine, cooking style, or food specialty. Try something like "Chettinad" (a cuisine), "Baking" (a category), or "Pickles" (a specific item).`)
      } else {
        setText('')
      }
    } catch {
      setError('Something went wrong checking that — please try again.')
    } finally {
      setChecking(false)
    }
  }

  function addSuggestion(s: string) {
    if (!hasTag(s)) onChange(addTag(s, value))
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
            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-copper-50 text-copper-700 rounded-full pl-2.5 pr-1.5 py-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-copper-400 hover:text-copper-600 leading-none"
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
          className="text-sm text-copper-600 border border-copper-300 rounded-lg px-3 py-2 hover:bg-copper-50 disabled:opacity-40 shrink-0"
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
              className="text-xs rounded-full px-2.5 py-1 border border-gray-200 text-gray-600 hover:border-copper-400 hover:text-copper-600 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
