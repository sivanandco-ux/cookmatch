'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { readSessionCookie } from '@/lib/supabase/readSessionCookie'
import { US_STATES } from '@/lib/usStates'
import { US_CITIES_BY_STATE } from '@/lib/usCitiesByState'
import { makeTagline } from '@/lib/tagline'
import CityInput from '@/components/CityInput'
import SpecialtyTagInput from '@/components/SpecialtyTagInput'
import GoogleIcon from '@/components/GoogleIcon'
import { useFileDrop } from '@/lib/hooks/useFileDrop'

const DIETARY = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
const AVAILABILITY = ['Available regularly', 'Made to order', 'Seasonal or festival-only']
const JOB_CATEGORIES = [
  { value: 'family_cooking', label: 'Family Cooking (2–5 people)' },
  { value: 'small_event', label: 'Small Event (6–10 people)' },
  { value: 'medium_event', label: 'Medium Event (11–14 people)' },
]

function CheckboxGroup({ name, options, label }: { name: string; options: string[]; label: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" name={name} value={opt} className="rounded border-gray-300 text-copper-600" />
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
  const [groceryPickup, setGroceryPickup] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [minHours, setMinHours] = useState(2)
  const [state, setState] = useState('')
  const [otherCities, setOtherCities] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtySuggestions, setSpecialtySuggestions] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([])
  const [offeringTypes, setOfferingTypes] = useState<string[]>([])
  const [cooksAtClientLocation, setCooksAtClientLocation] = useState(false)
  const [arrangementOtherChecked, setArrangementOtherChecked] = useState(false)
  const [occasionOtherChecked, setOccasionOtherChecked] = useState(false)
  const [intro, setIntro] = useState('')
  const [polishing, setPolishing] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const INTRO_LIMIT = 280

  // Email verification gate — a cook profile can't be created until the
  // Google account is confirmed, so identity is proven up front.
  const [authState, setAuthState] = useState<'checking' | 'unverified' | 'verified' | 'waitlist'>('checking')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState('')
  const [waitlistName, setWaitlistName] = useState('')
  const [waitlistJoining, setWaitlistJoining] = useState(false)
  const [waitlistJoined, setWaitlistJoined] = useState(false)
  const [waitlistError, setWaitlistError] = useState('')
  const router = useRouter()

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
    // Read the session cookie directly rather than calling
    // supabase.auth.getSession() — that call has been observed taking
    // 4-6+ seconds on this project (likely a network round-trip to the auth
    // server), which is far too slow right after the Google sign-in
    // redirect lands back here. This is only a cosmetic "should I show the
    // form or the sign-in gate" check — the actual submit still goes through
    // a server API route that re-verifies via getUser(), so nothing
    // security-sensitive depends on this being tamper-proof.
    const sessionUser = readSessionCookie()
    if (!sessionUser?.email) {
      setAuthState('unverified')
      return
    }
    setVerifiedEmail(sessionUser.email)

    async function resolve() {
      // A signed-in visitor landing directly on /apply (not via the fresh
      // OAuth redirect, which already handles this server-side) might
      // already have a cook profile — send them to their dashboard instead
      // of showing a blank application. Uses a plain fetch against
      // PostgREST (cooks is publicly readable) rather than the Supabase
      // client's .from(), which has shown unreliable multi-second-or-hung
      // behavior on this project (see lib/supabase/readSessionCookie.ts).
      const cookRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cooks?user_id=eq.${sessionUser!.id}&select=id`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      )
      const cookRows = cookRes.ok ? await cookRes.json() : []
      if (cookRows[0]?.id) {
        router.replace(`/dashboard/${cookRows[0].id}`)
        return
      }

      // Only a genuinely new applicant is subject to the cap — check it
      // last so an existing cook's redirect above never gets delayed by it.
      const capRes = await fetch('/api/cook-cap')
      const capData = capRes.ok ? await capRes.json() : { full: false }
      setAuthState(capData.full ? 'waitlist' : 'verified')
    }

    resolve().catch(() => setAuthState('verified'))
  }, [router])

  async function handleJoinWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setWaitlistError('')
    setWaitlistJoining(true)
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: waitlistName }),
    })
    setWaitlistJoining(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setWaitlistError(data.error || 'Something went wrong. Please try again.')
      return
    }
    setWaitlistJoined(true)
  }

  async function handleGoogleSignIn() {
    setSigningIn(true)
    setAuthError('')
    try {
      const supabase = createClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('intent', 'signup')
      callbackUrl.searchParams.set('redirectTo', '/apply')
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() },
      })
      if (oauthError) {
        setAuthError('Something went wrong starting Google sign-in. Please try again.')
        setSigningIn(false)
      }
      // On success the browser navigates away to Google — nothing else to do here.
    } catch {
      setAuthError('Something went wrong starting Google sign-in. Please try again.')
      setSigningIn(false)
    }
  }

  async function handlePolish() {
    if (intro.trim().length < 10) return
    setPolishing(true)
    const res = await fetch('/api/polish-intro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: intro }),
    })
    const data = await res.json()
    if (data.polished) setIntro(data.polished.slice(0, INTRO_LIMIT))
    setPolishing(false)
  }

  function processPhotoFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processPhotoFile(file)
  }

  const photoDrag = useFileDrop(files => processPhotoFile(files[0]))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const getChecked = (name: string) => formData.getAll(name).map(String)

    if (specialties.length === 0) {
      setError('Please add at least one thing you make.')
      setLoading(false)
      return
    }

    if (offeringTypes.length === 0) {
      setError('Please select what you offer.')
      setLoading(false)
      return
    }

    const intro = (formData.get('intro') as string || '').trim()
    const tagline = makeTagline(intro)

    // Hourly rate only applies when the cook actually cooks at the client's
    // location — a cook who only cooks from their own setup, or does
    // something else entirely ("Other"), isn't billing by the hour.
    const priceValue = cooksAtClientLocation ? Number(formData.get('hourly_rate')) : 0

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
      setLoading(false)
      return
    }

    const primaryCity = String(formData.get('primary_city') || '').trim()
    if (!primaryCity) {
      setError('Please enter the city you\'re located in.')
      setLoading(false)
      return
    }

    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      whatsapp: formData.get('whatsapp') || null,
      bio: intro,
      tagline,
      video_url: formData.get('video_url') || null,
      cuisine_types: specialties,
      offering_types: offeringTypes,
      photo_url: null as string | null,
      dietary_specialties: getChecked('dietary_specialties'),
      occasion_types: occasionTypes,
      cooking_arrangement: cookingArrangement,
      languages,
      price_min: priceValue,
      price_max: priceValue,
      price_unit: 'hourly',
      min_hours: cooksAtClientLocation ? minHours : null,
      state: state || null,
      service_areas: [...new Set([
        primaryCity,
        ...otherCities.split(',').map(s => s.trim()).filter(Boolean),
      ])],
      group_size_min: 2,
      group_size_max: 14,
      signature_dishes: '',
      years_experience: 0,
      available_recurring: false,
      recurring_options: [],
      job_categories: getChecked('job_categories'),
      does_cleanup: formData.get('does_cleanup') === 'on',
      grocery_pickup: formData.get('grocery_pickup') === 'on',
      grocery_pickup_charge: groceryPickup ? Number(formData.get('grocery_pickup_charge')) || null : null,
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

  if (authState === 'checking') {
    return <div className="max-w-sm mx-auto px-6 py-20 text-center text-sm text-gray-400">Loading...</div>
  }

  if (authState === 'unverified') {
    return (
      <div className="max-w-sm mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cook Sign In</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with Google — returning cooks go straight to their dashboard, new cooks fill out a quick application.</p>

        {authError && <p className="text-sm text-red-600 mb-4">{authError}</p>}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <GoogleIcon />
          {signingIn ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>
    )
  }

  if (authState === 'waitlist') {
    return (
      <div className="max-w-sm mx-auto px-6 py-16">
        {waitlistJoined ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h1>
            <p className="text-sm text-gray-600">
              We're at our cook capacity right now, but we'll reach out at <strong>{verifiedEmail}</strong> as soon as a spot opens up.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">We're full right now</h1>
            <p className="text-sm text-gray-500 mb-6">
              Sivan Cooks is limited to a small number of cooks while we're just getting started. Join the waitlist and we'll reach out the moment a spot opens up.
            </p>
            <form onSubmit={handleJoinWaitlist} className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={waitlistName}
                onChange={e => setWaitlistName(e.target.value)}
                placeholder="Your name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input type="email" disabled value={verifiedEmail} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
              {waitlistError && <p className="text-sm text-red-600">{waitlistError}</p>}
              <button
                type="submit"
                disabled={waitlistJoining}
                className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-50"
              >
                {waitlistJoining ? 'Joining...' : 'Join the waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h1>
        <p className="text-gray-600 mb-2">Thank you for applying to Sivan Cooks. We will review your application and reach out within 2–3 business days.</p>
        <p className="text-gray-500 text-sm">You will be notified via email once your profile is verified and live.</p>
        <a href="/cooks" className="mt-8 inline-block text-copper-600 hover:underline">Browse other cooks →</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Sivan Cooks as a Cook</h1>
      <p className="text-gray-600 mb-8">Share your love of cooking and get discovered by families in your area.</p>

      {/* Platform benefits */}
      <div className="bg-copper-50 border border-copper-200 rounded-xl p-6 mb-8">
        <h2 className="text-base font-semibold text-copper-900 mb-3">Why join Sivan Cooks?</h2>
        <ul className="space-y-2 text-sm text-copper-800">
          <li className="flex gap-2"><span className="mt-0.5">✓</span>Get discovered by families looking for home-cooked Indian meals</li>
          <li className="flex gap-2"><span className="mt-0.5">✓</span>Set your own hourly rate — no bidding, no rate cuts</li>
          <li className="flex gap-2"><span className="mt-0.5">✓</span>Clients come to you with a clear brief — no guessing what they need</li>
          <li className="flex gap-2"><span className="mt-0.5">✓</span>Your profile stays live so clients can find and book you any time</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Personal Info */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>

          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div
              onClick={() => photoInputRef.current?.click()}
              {...photoDrag.dragHandlers}
              className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-colors ${photoDrag.isDragging ? 'border-copper-500 bg-copper-50' : 'border-gray-300 hover:border-copper-400'}`}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center leading-tight px-1">Add or drop photo</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile photo</p>
              <p className="text-xs text-gray-400 mb-2">Shown on your cook tile. Max 5MB. Click or drag & drop.</p>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-copper-600 border border-copper-300 rounded-lg px-3 py-1.5 hover:bg-copper-50"
              >
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          <input name="name" required placeholder="Full name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="email" type="email" required readOnly defaultValue={verifiedEmail} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
          <input name="phone" type="tel" required placeholder="Phone number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input name="whatsapp" type="tel" placeholder="WhatsApp number (optional, if different from phone)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </section>

        {/* Profile */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Introduce Yourself</h2>
            <p className="text-sm text-gray-500 mt-1">This is the first thing clients read on your profile.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Where are you from and how did you learn to cook?
            </label>
            <textarea
              name="intro"
              required
              rows={4}
              maxLength={INTRO_LIMIT}
              value={intro}
              onChange={e => setIntro(e.target.value.slice(0, INTRO_LIMIT))}
              placeholder="e.g. I am a cook from East India and have 10 years of cooking experience. I grew up in Kolkata and learned to cook from my mother, and I love making food that tastes like home."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className={`text-xs ${intro.length >= INTRO_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
                {intro.length} / {INTRO_LIMIT} characters
              </p>
              <button
                type="button"
                onClick={handlePolish}
                disabled={polishing || intro.trim().length < 10}
                className="text-xs text-copper-600 border border-copper-300 rounded-lg px-3 py-1.5 hover:bg-copper-50 disabled:opacity-40"
              >
                {polishing ? 'Polishing...' : '✦ Polish my intro'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">YouTube intro video (optional)</label>
            <input
              name="video_url"
              type="url"
              placeholder="Paste your YouTube video link — a short cooking video builds trust"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </section>

        {/* Cooking Details */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-5">
          <h2 className="text-lg font-semibold">Cooking Details</h2>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              What do you offer? <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offeringTypes.includes('session')}
                  onChange={e => setOfferingTypes(prev =>
                    e.target.checked ? [...prev, 'session'] : prev.filter(t => t !== 'session')
                  )}
                  className="rounded border-gray-300 text-copper-600"
                />
                <span className="text-sm text-gray-700">Home-cooked meals — cooked in your home, delivered, or picked up</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={offeringTypes.includes('item')}
                  onChange={e => setOfferingTypes(prev =>
                    e.target.checked ? [...prev, 'item'] : prev.filter(t => t !== 'item')
                  )}
                  className="rounded border-gray-300 text-copper-600"
                />
                <span className="text-sm text-gray-700">Specific items — like pickles or baked goods</span>
              </label>
            </div>
          </div>
          <SpecialtyTagInput
            value={specialties}
            onChange={setSpecialties}
            suggestions={specialtySuggestions}
            label="What do you make?"
          />
          <CheckboxGroup name="dietary_specialties" options={DIETARY} label="Dietary specialties" />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">When can clients get this from you?</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY.map(opt => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="occasion_types" value={opt} className="rounded border-gray-300 text-copper-600" />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={occasionOtherChecked}
                  onChange={e => setOccasionOtherChecked(e.target.checked)}
                  className="rounded border-gray-300 text-copper-600"
                />
                <span className="text-sm text-gray-700">Other</span>
              </label>
            </div>
            {occasionOtherChecked && (
              <input
                name="occasion_types_other"
                type="text"
                placeholder="Describe your availability"
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
          <SpecialtyTagInput
            value={languages}
            onChange={setLanguages}
            suggestions={languageSuggestions}
            label="Languages you speak"
            placeholder="e.g. Hindi, Tamil, English"
            skipValidation
          />
        </section>

        {/* Cooking Arrangement */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">How Do You Cook?</h2>
            <p className="text-sm text-gray-500 mt-1">Select all that apply — you can cook at a client's home and prepare something else too.</p>
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
                <input type="checkbox" name="cooking_arrangement" value="Cook from my setup" className="rounded border-gray-300 text-copper-600" />
                <span className="text-sm text-gray-700">Cook from my setup</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arrangementOtherChecked}
                  onChange={e => setArrangementOtherChecked(e.target.checked)}
                  className="rounded border-gray-300 text-copper-600"
                />
                <span className="text-sm text-gray-700">Other</span>
              </label>
            </div>
            {arrangementOtherChecked && (
              <input
                name="cooking_arrangement_other"
                type="text"
                placeholder="Describe your arrangement"
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>
        </section>

        {/* Pricing / Location */}
        <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">{cooksAtClientLocation ? 'Pricing' : 'Location'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {cooksAtClientLocation
                ? 'Sessions cooking at a client\'s location are billed hourly with a minimum of 2 hours.'
                : 'Hourly pricing applies once you select "Cook at client\'s location" above.'}
            </p>
          </div>

          {cooksAtClientLocation && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Your hourly rate ($)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    name="hourly_rate"
                    type="number"
                    required
                    min={30}
                    defaultValue={30}
                    placeholder="e.g. 35"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                  <span className="text-sm text-gray-500">per hour</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Starts at the platform minimum of $30/hr — raise it if you'd like</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Minimum hours per visit: <span className="text-copper-600 font-semibold">{minHours} hours</span>
                </label>
                <input
                  type="range"
                  min={2}
                  max={6}
                  value={minHours}
                  onChange={e => setMinHours(Number(e.target.value))}
                  className="w-full accent-copper-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>2 hrs (minimum)</span>
                  <span>6 hrs (maximum)</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Set the minimum hours you require to make the trip worthwhile. Platform minimum is 2 hours.</p>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">State</label>
              <select
                name="state"
                required
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="" disabled>Select your state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
              <CityInput name="primary_city" required placeholder="Enter your city" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Other cities you serve (optional)</label>
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
        </section>

        {/* Job Preferences — only relevant when cooking at a client's location */}
        {cooksAtClientLocation && (
          <section className="bg-panel rounded-sm border-l-4 border-copper-600 p-6 flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Job Preferences</h2>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Job types you accept</p>
              <div className="flex flex-col gap-2">
                {JOB_CATEGORIES.map(cat => (
                  <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="job_categories" value={cat.value} className="rounded border-gray-300 text-copper-600" />
                    <span className="text-sm text-gray-700">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="does_cleanup" className="rounded border-gray-300 text-copper-600" />
              <span className="text-sm text-gray-700">I clean up after cooking</span>
            </label>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  name="grocery_pickup"
                  className="rounded border-gray-300 text-copper-600"
                  onChange={e => setGroceryPickup(e.target.checked)}
                />
                <span className="text-sm text-gray-700">I can pick up groceries (extra charge applies)</span>
              </label>
              {groceryPickup && (
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    name="grocery_pickup_charge"
                    type="number"
                    min={0}
                    placeholder="Extra charge"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32"
                  />
                  <span className="text-sm text-gray-400">per trip</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Approval */}
        <section className="bg-copper-50 border border-copper-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-copper-900 mb-2">Approval</h2>
          <p className="text-sm text-gray-700 mb-3">At this time, Sivan Cooks approves cooks by checking references. We may follow up with you after you apply.</p>
          <ul className="text-sm text-gray-700 mb-3 list-disc pl-5 space-y-1">
            <li>Sivan Cooks does not negotiate prices or handle payments — pricing and payment are worked out directly between you and the client.</li>
            <li>Sivan Cooks does not provide insurance or liability coverage for cooking services — carrying any insurance you need is your own responsibility.</li>
          </ul>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" required className="rounded border-gray-300 text-copper-600" />
            <span className="text-sm text-gray-700">I understand and accept the Sivan Cooks Terms of Service</span>
          </label>
        </section>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-copper-600 text-white py-3 rounded-lg font-medium hover:bg-copper-700 disabled:opacity-60"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
