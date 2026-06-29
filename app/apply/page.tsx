'use client'

import { useState, useRef } from 'react'

const CUISINES = ['South Indian', 'North Indian', 'Bengali', 'Gujarati', 'Maharashtrian', 'Hyderabadi', 'Other Indian']
const DIETARY = ['Pure Vegetarian', 'Jain / No Onion No Garlic', 'Eggetarian', 'Non-Vegetarian', 'Halal']
const OCCASIONS = ['Daily Meals / Tiffin', 'Weekend Family Cooking', 'Festival / Occasion', 'Dinner Party']
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Bengali', 'Punjabi', 'Marathi']
const AREAS = ['Fremont', 'Newark', 'Union City', 'Milpitas']
const PRICE_UNITS = [
  { value: 'per_session', label: 'Per Session' },
  { value: 'hourly', label: 'Hourly' },
]

function CheckboxGroup({ name, options, label }: { name: string; options: string[]; label: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name={name} value={opt} className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [priceUnit, setPriceUnit] = useState('per_session')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    const getChecked = (name: string) =>
      formData.getAll(name).map(String)

    const cuisineTypes = getChecked('cuisine_types')
    const otherCuisines = (formData.get('other_cuisines') as string || '').trim()
    if (cuisineTypes.length === 0 && !otherCuisines) {
      setError('Please select at least one cuisine you cook.')
      setLoading(false)
      return
    }

    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || null,
      bio: formData.get('bio'),
      tagline: formData.get('tagline'),
      video_url: formData.get('video_url') || null,
      cuisine_types: cuisineTypes,
      other_cuisines: otherCuisines || null,
      photo_url: null as string | null,
      dietary_specialties: getChecked('dietary_specialties'),
      occasion_types: getChecked('occasion_types'),
      languages: getChecked('languages'),
      price_min: Number(formData.get('price_min')),
      price_max: Number(formData.get('price_max')),
      price_unit: formData.get('price_unit'),
      min_hours: priceUnit === 'hourly' ? Number(formData.get('min_hours')) || null : null,
      service_areas: getChecked('service_areas'),
      group_size_min: Number(formData.get('group_size_min')),
      group_size_max: Number(formData.get('group_size_max')),
      signature_dishes: formData.get('signature_dishes'),
      years_experience: Number(formData.get('years_experience')),
      available_recurring: formData.get('available_recurring') === 'on',
      recurring_options: getChecked('recurring_options'),
    }

    let photo_url: string | null = null
    if (photoFile) {
      const uploadData = new FormData()
      uploadData.append('photo', photoFile)
      const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: uploadData })
      if (!uploadRes.ok) {
        setError('Photo upload failed. Please try again.')
        setLoading(false)
        return
      }
      const uploadJson = await uploadRes.json()
      photo_url = uploadJson.url
    }
    body.photo_url = photo_url

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h1>
        <p className="text-gray-600 mb-2">Thank you for applying to CookMatch. We will review your application and reach out within 2–3 business days.</p>
        <p className="text-gray-500 text-sm">You will be notified via email and SMS once your profile is verified and live.</p>
        <a href="/cooks" className="mt-8 inline-block text-orange-600 hover:underline">Browse other cooks →</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Join CookMatch as a Cook</h1>
      <p className="text-gray-600 mb-8">Fill in your details below. We will verify your information and activate your profile within 2–3 business days.</p>

      {/* Requirements */}
      <div className="flex flex-col gap-4 mb-2">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What you will need to get verified</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Government-issued photo ID (driver's license, passport, or state ID)</li>
            <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Consent to a background check</li>
            <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Valid Food Handler certification (details below)</li>
            <li className="flex gap-2"><span className="text-green-600 mt-0.5">✓</span>Two references who can vouch for your cooking</li>
          </ul>
        </section>

        <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-orange-900 mb-1">How to get your Food Handler's card</h2>
          <p className="text-sm text-orange-800 mb-4">California law requires anyone handling food to hold a valid Food Handler certification. It is valid for 3 years and costs $15–$40.</p>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Fastest option — Online</p>
              <p className="text-sm text-gray-700">
                <strong>ServSafe</strong> at{' '}
                <a href="https://www.servsafe.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline hover:text-orange-700">servsafe.com</a>
                {' '}— complete the course online and take a proctored exam. Widely accepted and takes about 2–3 hours.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">In-person options in the Bay Area</p>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span><strong>Alameda County</strong> (Fremont, Newark, Union City) — contact Alameda County Environmental Health at <a href="tel:5105676700" className="text-orange-600 underline">(510) 567-6700</a> for local testing centers</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span><strong>Santa Clara County</strong> (Milpitas) — contact Santa Clara County Public Health for approved training providers</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 overflow-hidden flex-shrink-0"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center leading-tight px-1">Add photo</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile photo</p>
              <p className="text-xs text-gray-400 mb-2">Shown on your cook tile. Max 5MB.</p>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-orange-600 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-50"
              >
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <input name="name" required placeholder="Full name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="Email address" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="phone" type="tel" required placeholder="Phone number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="whatsapp" type="tel" placeholder="WhatsApp number (optional, if different from phone)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </section>

        {/* Profile */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Your Profile</h2>
          <input name="tagline" required placeholder="One-line tagline e.g. 'South Indian home cooking specialist'" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <textarea name="bio" required placeholder="Tell clients about yourself, your cooking style, and your story" rows={4} className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          <input name="signature_dishes" required placeholder="Signature dishes e.g. Chettinad Chicken, Rasam, Pulao" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="video_url" type="url" placeholder="YouTube or Vimeo intro video URL (optional)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="years_experience" type="number" required min={0} placeholder="Years of cooking experience" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </section>

        {/* Cooking Details */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
          <h2 className="text-lg font-semibold">Cooking Details</h2>
          <CheckboxGroup name="cuisine_types" options={CUISINES} label="Cuisines you cook (select all that apply)" />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Other cuisines not listed above</p>
            <input
              name="other_cuisines"
              type="text"
              placeholder="e.g. Chettinad, Kongunadu, Malabar"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple cuisines with commas. We will verify these before publishing your profile.</p>
          </div>
          <CheckboxGroup name="dietary_specialties" options={DIETARY} label="Dietary specialties" />
          <CheckboxGroup name="occasion_types" options={OCCASIONS} label="Occasions you cook for" />
          <CheckboxGroup name="languages" options={LANGUAGES} label="Languages you speak" />
        </section>

        {/* Pricing & Availability */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Pricing &amp; Availability</h2>

          <div className="flex gap-3 items-center">
            <input name="price_min" type="number" required min={1} placeholder="Your rate ($)" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select
              name="price_unit"
              value={priceUnit}
              onChange={e => setPriceUnit(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {PRICE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          {priceUnit === 'hourly' && (
            <div className="flex flex-col gap-1">
              <input
                name="min_hours"
                type="number"
                required
                min={1}
                placeholder="Minimum hours per visit"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400">The minimum number of hours you require per visit to make the trip worthwhile</p>
            </div>
          )}

          <CheckboxGroup name="service_areas" options={AREAS} label="Areas you serve" />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="available_recurring" className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">Available for recurring bookings</span>
          </label>

          <CheckboxGroup name="recurring_options" options={['Weekly', 'Bi-weekly', 'Monthly']} label="Recurring frequency options (if applicable)" />
        </section>

        {/* Verification acknowledgement */}
        <section className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-3">Verification Requirements</h2>
          <p className="text-sm text-gray-700 mb-3">To be listed on CookMatch, you will need to provide:</p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-4">
            <li>Government-issued ID</li>
            <li>Consent to a background check</li>
            <li>Food handler certification</li>
            <li>References (at least 2)</li>
          </ul>
          <p className="text-xs text-gray-500">We will contact you via email after submission to guide you through the verification steps. Your raw documents are never stored or displayed publicly.</p>
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input type="checkbox" required className="rounded border-gray-300 text-orange-600" />
            <span className="text-sm text-gray-700">I agree to the verification process and CookMatch Terms of Service</span>
          </label>
        </section>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
