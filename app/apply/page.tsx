'use client'

import { useState } from 'react'

const CUISINES = ['South Indian', 'North Indian', 'Bengali', 'Gujarati', 'Maharashtrian', 'Hyderabadi', 'Other Indian']
const DIETARY = ['Pure Vegetarian', 'Jain / No Onion No Garlic', 'Eggetarian', 'Non-Vegetarian', 'Halal']
const OCCASIONS = ['Daily Meals / Tiffin', 'Weekend Family Cooking', 'Festival / Occasion', 'Dinner Party']
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Bengali', 'Punjabi', 'Marathi']
const AREAS = ['Fremont', 'Newark', 'Union City', 'Milpitas']
const PRICE_UNITS = [
  { value: 'per_session', label: 'Per Session' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'monthly', label: 'Monthly' },
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    const getChecked = (name: string) =>
      formData.getAll(name).map(String)

    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || null,
      bio: formData.get('bio'),
      tagline: formData.get('tagline'),
      video_url: formData.get('video_url') || null,
      cuisine_types: getChecked('cuisine_types'),
      dietary_specialties: getChecked('dietary_specialties'),
      occasion_types: getChecked('occasion_types'),
      languages: getChecked('languages'),
      price_min: Number(formData.get('price_min')),
      price_max: Number(formData.get('price_max')),
      price_unit: formData.get('price_unit'),
      service_areas: getChecked('service_areas'),
      group_size_min: Number(formData.get('group_size_min')),
      group_size_max: Number(formData.get('group_size_max')),
      signature_dishes: formData.get('signature_dishes'),
      years_experience: Number(formData.get('years_experience')),
      available_recurring: formData.get('available_recurring') === 'on',
      recurring_options: getChecked('recurring_options'),
    }

    const res = await fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
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
          <CheckboxGroup name="dietary_specialties" options={DIETARY} label="Dietary specialties" />
          <CheckboxGroup name="occasion_types" options={OCCASIONS} label="Occasions you cook for" />
          <CheckboxGroup name="languages" options={LANGUAGES} label="Languages you speak" />
        </section>

        {/* Pricing & Availability */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Pricing &amp; Availability</h2>

          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input name="price_min" type="number" required min={1} placeholder="Min price ($)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <span className="text-gray-400">–</span>
            <div className="flex-1">
              <input name="price_max" type="number" required min={1} placeholder="Max price ($)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <select name="price_unit" className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {PRICE_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>

          <div className="flex gap-3 items-center">
            <input name="group_size_min" type="number" required min={1} placeholder="Min group size" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">–</span>
            <input name="group_size_max" type="number" required min={1} placeholder="Max group size" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

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
