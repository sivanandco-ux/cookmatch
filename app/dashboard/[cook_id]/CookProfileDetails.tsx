'use client'

import { useEffect, useState } from 'react'
import { US_STATES } from '@/lib/usStates'
import { US_CITIES_BY_STATE } from '@/lib/usCitiesByState'
import CityInput from '@/components/CityInput'
import SpecialtyTagInput from '@/components/SpecialtyTagInput'
import { isValidPhone } from '@/lib/phone'

const DIETARY = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
const AVAILABILITY = ['Available regularly', 'Made to order', 'Seasonal or festival-only']
const JOB_CATEGORIES = [
  { value: 'family_cooking', label: 'Family Cooking (2–5 people)' },
  { value: 'small_event', label: 'Small Event (6–10 people)' },
  { value: 'medium_event', label: 'Medium Event (11–14 people)' },
]
const KNOWN_ARRANGEMENTS = ["Cook at client's location", 'Cook from my setup']

interface Initial {
  phone: string
  whatsapp: string | null
  video_url: string | null
  cuisine_types: string[]
  offering_types: string[]
  dietary_specialties: string[]
  occasion_types: string[]
  cooking_arrangement: string[]
  languages: string[]
  price_min: number
  price_max: number
  min_hours: number | null
  state: string | null
  service_areas: string[]
  job_categories: string[]
  does_cleanup: boolean
  grocery_pickup: boolean
  grocery_pickup_charge: number | null
}

function CheckboxGroup({
  name,
  options,
  label,
  defaultValues,
}: {
  name: string
  options: string[]
  label: string
  defaultValues: string[]
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name={name} value={opt} defaultChecked={defaultValues.includes(opt)} className="rounded border-gray-300 text-copper-600" />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function CookProfileDetails({ cookId, initial }: { cookId: string; initial: Initial }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)

  const [specialties, setSpecialties] = useState<string[]>(initial.cuisine_types)
  const [specialtySuggestions, setSpecialtySuggestions] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(initial.languages)
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([])
  const [offeringTypes, setOfferingTypes] = useState<string[]>(initial.offering_types)

  const arrangementOtherInitial = initial.cooking_arrangement.find(a => !KNOWN_ARRANGEMENTS.includes(a)) || ''
  const [cooksAtClientLocation, setCooksAtClientLocation] = useState(initial.cooking_arrangement.includes("Cook at client's location"))
  const [arrangementOtherChecked, setArrangementOtherChecked] = useState(!!arrangementOtherInitial)

  const occasionOtherInitial = initial.occasion_types.find(o => !AVAILABILITY.includes(o)) || ''
  const [occasionOtherChecked, setOccasionOtherChecked] = useState(!!occasionOtherInitial)

  const [minHours, setMinHours] = useState(initial.min_hours || 2)
  const [state, setState] = useState(initial.state || '')
  const [primaryCity, ...restCities] = initial.service_areas
  const [otherCities, setOtherCities] = useState(restCities.join(', '))
  const [groceryPickup, setGroceryPickup] = useState(initial.grocery_pickup)

  useEffect(() => {
    fetch('/api/specialties')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.items)) setSpecialtySuggestions(data.items) })
      .catch(() => {})
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.items)) setLanguageSuggestions(data.items) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!savedNotice) return
    const t = setTimeout(() => setSavedNotice(false), 3000)
    return () => clearTimeout(t)
  }, [savedNotice])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const getChecked = (name: string) => formData.getAll(name).map(String)

    const phone = String(formData.get('phone') || '').trim()
    if (!isValidPhone(phone)) {
      setError('Please enter a valid US or India phone number.')
      return
    }
    const whatsapp = String(formData.get('whatsapp') || '').trim()
    if (whatsapp && !isValidPhone(whatsapp)) {
      setError('WhatsApp number must be a valid US or India phone number.')
      return
    }

    if (specialties.length === 0) {
      setError('Please add at least one thing you make.')
      return
    }
    if (offeringTypes.length === 0) {
      setError('Please select what you offer.')
      return
    }

    const occasionOtherText = String(formData.get('occasion_types_other') || '').trim()
    const occasionTypes = [...new Set([
      ...getChecked('occasion_types'),
      ...(occasionOtherText ? [occasionOtherText] : []),
    ])]

    const arrangementOtherText = String(formData.get('cooking_arrangement_other') || '').trim()
    const cookingArrangement = [...new Set([
      ...getChecked('cooking_arrangement'),
      ...(arrangementOtherText ? [arrangementOtherText] : []),
    ])]
    if (cookingArrangement.length === 0) {
      setError('Please select at least one option for how you cook.')
      return
    }

    const primaryCityValue = String(formData.get('primary_city') || '').trim()
    if (!primaryCityValue) {
      setError("Please enter the city you're located in.")
      return
    }

    const priceValue = cooksAtClientLocation ? Number(formData.get('hourly_rate')) : 0

    setSaving(true)
    const res = await fetch('/api/update-cook-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cook_id: cookId,
        phone,
        whatsapp: whatsapp || null,
        video_url: formData.get('video_url') || null,
        cuisine_types: specialties,
        offering_types: offeringTypes,
        dietary_specialties: getChecked('dietary_specialties'),
        occasion_types: occasionTypes,
        cooking_arrangement: cookingArrangement,
        languages,
        price_min: priceValue,
        price_max: priceValue,
        min_hours: cooksAtClientLocation ? minHours : null,
        state: state || null,
        service_areas: [...new Set([
          primaryCityValue,
          ...otherCities.split(',').map(s => s.trim()).filter(Boolean),
        ])],
        job_categories: getChecked('job_categories'),
        does_cleanup: formData.get('does_cleanup') === 'on',
        grocery_pickup: formData.get('grocery_pickup') === 'on',
        grocery_pickup_charge: groceryPickup ? Number(formData.get('grocery_pickup_charge')) || null : null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Update failed. Please try again.')
      return
    }
    setSavedNotice(true)
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Cooking Details</h2>
      <p className="text-sm text-gray-400 mb-4">The same details you filled out when you applied — keep them up to date so clients see accurate info.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-700">Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Phone</label>
              <input name="phone" type="tel" required defaultValue={initial.phone} placeholder="(510) 000-0000 or +91 98765 43210" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">WhatsApp number (if different from phone)</label>
              <input name="whatsapp" type="tel" defaultValue={initial.whatsapp || ''} placeholder="(510) 000-0000 or +91 98765 43210" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">YouTube intro video (optional)</label>
            <input name="video_url" type="url" defaultValue={initial.video_url || ''} placeholder="https://youtube.com/..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Cooking Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-700">What do you offer?</p>
          <div className="flex flex-col gap-2 -mt-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={offeringTypes.includes('session')}
                onChange={e => setOfferingTypes(prev => e.target.checked ? [...prev, 'session'] : prev.filter(t => t !== 'session'))}
                className="rounded border-gray-300 text-copper-600"
              />
              <span className="text-sm text-gray-700">Home-cooked meals — cooked in your home, delivered, or picked up</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={offeringTypes.includes('item')}
                onChange={e => setOfferingTypes(prev => e.target.checked ? [...prev, 'item'] : prev.filter(t => t !== 'item'))}
                className="rounded border-gray-300 text-copper-600"
              />
              <span className="text-sm text-gray-700">Specific items — like pickles or baked goods</span>
            </label>
          </div>

          <SpecialtyTagInput value={specialties} onChange={setSpecialties} suggestions={specialtySuggestions} label="What do you make?" />
          <CheckboxGroup name="dietary_specialties" options={DIETARY} label="Dietary specialties" defaultValues={initial.dietary_specialties} />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">When can clients get this from you?</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY.map(opt => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="occasion_types" value={opt} defaultChecked={initial.occasion_types.includes(opt)} className="rounded border-gray-300 text-copper-600" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={occasionOtherChecked} onChange={e => setOccasionOtherChecked(e.target.checked)} className="rounded border-gray-300 text-copper-600" />
                <span className="text-sm text-gray-700">Other</span>
              </label>
            </div>
            {occasionOtherChecked && (
              <input name="occasion_types_other" type="text" defaultValue={occasionOtherInitial} placeholder="Describe your availability" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            )}
          </div>

          <SpecialtyTagInput value={languages} onChange={setLanguages} suggestions={languageSuggestions} label="Languages you speak" placeholder="e.g. Hindi, Tamil, English" skipValidation />
        </div>

        {/* Cooking Arrangement */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700">How do you cook?</p>
            <p className="text-xs text-gray-400 mt-0.5">Select all that apply — you can cook at a client's home and prepare something else too.</p>
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="cooking_arrangement"
                  value="Cook at client's location"
                  checked={cooksAtClientLocation}
                  onChange={e => setCooksAtClientLocation(e.target.checked)}
                  className="rounded border-gray-300 text-copper-600"
                />
                <span className="text-sm text-gray-700">Cook at client&apos;s location</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" name="cooking_arrangement" value="Cook from my setup" defaultChecked={initial.cooking_arrangement.includes('Cook from my setup')} className="rounded border-gray-300 text-copper-600" />
                <span className="text-sm text-gray-700">Cook from my setup</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={arrangementOtherChecked} onChange={e => setArrangementOtherChecked(e.target.checked)} className="rounded border-gray-300 text-copper-600" />
                <span className="text-sm text-gray-700">Other</span>
              </label>
            </div>
            {arrangementOtherChecked && (
              <input name="cooking_arrangement_other" type="text" defaultValue={arrangementOtherInitial} placeholder="Describe your arrangement" className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            )}
          </div>
        </div>

        {/* Pricing / Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{cooksAtClientLocation ? 'Pricing & Location' : 'Location'}</p>
            {cooksAtClientLocation && (
              <p className="text-xs text-gray-400 mt-0.5">Sessions cooking at a client's location are billed hourly with a minimum of 2 hours.</p>
            )}
          </div>

          {cooksAtClientLocation && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Your hourly rate ($)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input name="hourly_rate" type="number" required min={30} defaultValue={initial.price_min || 30} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32" />
                  <span className="text-sm text-gray-500">per hour</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Minimum hours per visit: <span className="text-copper-600 font-semibold">{minHours} hours</span>
                </label>
                <input type="range" min={2} max={6} value={minHours} onChange={e => setMinHours(Number(e.target.value))} className="w-full accent-copper-600" />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">State</label>
              <select name="state" required value={state} onChange={e => setState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="" disabled>Select your state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">City</label>
              <CityInput name="primary_city" required defaultValue={primaryCity} placeholder="Enter your city" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Other cities you serve (optional)</label>
            <input
              name="service_areas_other"
              value={otherCities}
              onChange={e => setOtherCities(e.target.value)}
              placeholder="e.g. San Jose, Oakland — comma-separated"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {state && US_CITIES_BY_STATE[state] && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-gray-400 mt-1">Suggestions:</span>
                {US_CITIES_BY_STATE[state].map(city => {
                  const already = otherCities.split(',').map(s => s.trim().toLowerCase()).includes(city.toLowerCase())
                  return (
                    <button
                      key={city}
                      type="button"
                      disabled={already}
                      onClick={() => setOtherCities(prev => {
                        const parts = prev.split(',').map(s => s.trim()).filter(Boolean)
                        return [...parts, city].join(', ')
                      })}
                      className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${already ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-default' : 'border-gray-200 text-gray-600 hover:border-copper-400 hover:text-copper-600'}`}
                    >
                      + {city}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Job Preferences */}
        {cooksAtClientLocation && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
            <p className="text-sm font-medium text-gray-700">Job Preferences</p>
            <div>
              <p className="text-xs text-gray-500 mb-2">Job types you accept</p>
              <div className="flex flex-col gap-2">
                {JOB_CATEGORIES.map(cat => (
                  <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="job_categories" value={cat.value} defaultChecked={initial.job_categories.includes(cat.value)} className="rounded border-gray-300 text-copper-600" />
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="does_cleanup" defaultChecked={initial.does_cleanup} className="rounded border-gray-300 text-copper-600" />
              <span className="text-sm text-gray-700">I clean up after cooking</span>
            </label>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" name="grocery_pickup" checked={groceryPickup} onChange={e => setGroceryPickup(e.target.checked)} className="rounded border-gray-300 text-copper-600" />
                <span className="text-sm text-gray-700">I can pick up groceries (extra charge applies)</span>
              </label>
              {groceryPickup && (
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-sm text-gray-500">$</span>
                  <input name="grocery_pickup_charge" type="number" min={0} defaultValue={initial.grocery_pickup_charge || ''} placeholder="Extra charge" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32" />
                  <span className="text-sm text-gray-400">per trip</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={saving} className="bg-copper-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-copper-700 disabled:opacity-50 w-fit">
            {saving ? 'Saving...' : 'Save cooking details'}
          </button>
          {savedNotice && <span className="text-xs text-green-600">✓ Saved</span>}
        </div>
      </form>
    </section>
  )
}
