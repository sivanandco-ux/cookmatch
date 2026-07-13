'use client'

import { useState } from 'react'
import VoiceMemoRecorder from './VoiceMemoRecorder'
import CityInput from './CityInput'
import type { SessionBriefFormData, JobCategory, GrocerySituation } from '@/lib/types'

const OCCASIONS = ['Regular Meal', 'Festival / Occasion']
const DIETARY = ['Vegetarian', 'Non-Vegetarian']

const JOB_CATEGORIES: { value: JobCategory; label: string; range: string; max: number }[] = [
  { value: 'family_cooking', label: 'Family Cooking', range: '2–5 people', max: 5 },
  { value: 'small_event',    label: 'Small Event',    range: '6–10 people', max: 10 },
  { value: 'medium_event',   label: 'Medium Event',   range: '11–14 people', max: 14 },
]


function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface Props {
  mode: 'browse' | 'job-board'
  availableDates?: string[]
  cookId?: string
  cookName?: string
  cookDietarySpecialties?: string[]
  onSubmit: (data: SessionBriefFormData) => Promise<void>
  submitLabel?: string
}

export default function SessionBrief({ mode, availableDates = [], cookName, cookDietarySpecialties, onSubmit, submitLabel }: Props) {
  const [jobCategory, setJobCategory] = useState<JobCategory | ''>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [voiceMemoUrl, setVoiceMemoUrl] = useState('')
  const [textDescription, setTextDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categoryConfig = JOB_CATEGORIES.find(c => c.value === jobCategory)
  const availableDietary = cookDietarySpecialties && cookDietarySpecialties.length > 0
    ? DIETARY.filter(d => cookDietarySpecialties.includes(d))
    : DIETARY

  function toggleDietary(item: string) {
    setDietaryRestrictions(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!jobCategory) { setError('Please select a job type.'); return }
    if (!selectedDate) { setError('Please select a date.'); return }
    if (!voiceMemoUrl && !textDescription.trim()) {
      setError('Please provide at least one description — a voice memo, a written description, or both.')
      return
    }

    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''

    const numPeople = Number(get('num_people'))
    if (categoryConfig && (numPeople < 2 || numPeople > categoryConfig.max)) {
      setError(`For ${categoryConfig.label}, party size must be between 2 and ${categoryConfig.max}.`)
      return
    }

    const data: SessionBriefFormData = {
      client_name: get('client_name'),
      client_email: get('client_email'),
      client_phone: get('client_phone'),
      job_category: jobCategory as JobCategory,
      occasion: get('occasion'),
      specific_dishes: '',
      num_dishes: Number(get('num_dishes')),
      preferred_date: selectedDate,
      preferred_time: '',
      expected_duration_hours: 2,
      num_people: numPeople,
      dietary_restrictions: dietaryRestrictions,
      grocery_situation: ((form.elements.namedItem('grocery_pickup') as HTMLInputElement)?.checked ? 'need_grocery_pickup' : 'client_has_everything') as GrocerySituation,
      cleanup_needed: (form.elements.namedItem('cleanup_needed') as HTMLInputElement)?.checked ?? false,
      kitchen_access_time: '',
      city: get('city'),
      parking_available: (form.elements.namedItem('parking_available') as HTMLInputElement)?.checked ?? false,
      language_preferred: '',
      recurring: false,
      text_description: textDescription,
      voice_memo_url: voiceMemoUrl,
      additional_notes: '',
    }

    setLoading(true)
    try {
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Section 1: Job type */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-900">What kind of help do you need? <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-1 gap-2">
          {JOB_CATEGORIES.map(cat => (
            <label
              key={cat.value}
              className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                jobCategory === cat.value
                  ? 'border-orange-600 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="job_category_radio"
                  value={cat.value}
                  checked={jobCategory === cat.value}
                  onChange={() => setJobCategory(cat.value)}
                  className="text-orange-600"
                />
                <span className="text-sm font-medium text-gray-900">{cat.label}</span>
              </div>
              <span className="text-xs text-gray-400">{cat.range}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Occasion <span className="text-red-500">*</span></label>
            <select name="occasion" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select occasion</option>
              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Number of dishes <span className="text-red-500">*</span></label>
            <input name="num_dishes" type="number" required min={1} placeholder="e.g. 3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Section 2: When */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-900">When?</p>

        {mode === 'browse' ? (
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Select an available date <span className="text-red-500">*</span></label>
            {availableDates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-sm text-amber-800">
                This cook has no available dates yet — check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {availableDates.map(date => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium border transition-colors ${
                      selectedDate === date
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Preferred date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* Section 3: Who */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-900">Who?</p>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Number of people <span className="text-red-500">*</span>
            {categoryConfig && <span className="text-gray-400"> (max {categoryConfig.max} for {categoryConfig.label})</span>}
          </label>
          <input
            name="num_people"
            type="number"
            required
            min={2}
            max={categoryConfig?.max ?? 14}
            placeholder="e.g. 6"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-2 block">Dietary restrictions (select all that apply)</label>
          {cookDietarySpecialties && cookDietarySpecialties.length > 0 && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-2">
              This cook specialises in {cookDietarySpecialties.join(' and ')}. Only matching options are shown.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {availableDietary.map(item => (
              <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dietaryRestrictions.includes(item)}
                  onChange={() => toggleDietary(item)}
                  className="rounded border-gray-300 text-orange-600"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Logistics */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-900">Logistics</p>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">City <span className="text-red-500">*</span></label>
          <CityInput name="city" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="grocery_pickup" className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">I need the cook to pick up groceries</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="cleanup_needed" className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">I need the cook to clean up after cooking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="parking_available" className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">Parking is available</span>
          </label>
        </div>
      </div>

      {/* Section 5: Tell the cook */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Tell the cook what you need</p>
          <p className="text-xs text-gray-500 mt-0.5">Complete at least one — voice, text, or both.</p>
        </div>

        <VoiceMemoRecorder onUploaded={url => setVoiceMemoUrl(url)} />

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 h-px bg-gray-200" />
          <span>or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Written description</label>
          <textarea
            value={textDescription}
            onChange={e => setTextDescription(e.target.value)}
            placeholder="Describe what you need — dishes, number of courses, how you like things cooked, anything that helps the cook prepare"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      {/* Section 6: Contact info */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-900">Your contact info</p>
        <p className="text-xs text-gray-500">
          {mode === 'browse'
            ? `Shared with ${cookName ?? 'the cook'} only after both sides confirm.`
            : 'Shared with the matched cook only after both sides confirm.'}
        </p>
        <input name="client_name" required placeholder="Your name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input name="client_email" type="email" required placeholder="Email address" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <input name="client_phone" type="tel" required placeholder="Phone number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || (mode === 'browse' && availableDates.length === 0)}
        className="bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? 'Submitting...' : (submitLabel ?? 'Submit Session Brief')}
      </button>
    </form>
  )
}
