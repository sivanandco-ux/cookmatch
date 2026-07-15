'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isValidUsPhone } from '@/lib/phone'
import { renderMarkdown } from '@/lib/renderMarkdown'
import EducationChat from '@/components/EducationChat'
import BecomeCookTimeline from '@/components/BecomeCookTimeline'
import CityInput from '@/components/CityInput'
import { US_STATES } from '@/lib/usStates'

type View = 'home' | 'mode' | 'cook' | 'client' | 'cook-verify' | 'voice-chat' | 'review' | 'done' | 'learn'
type PathType = 'cook' | 'client'
type ChatPhase = 'idle' | 'listening' | 'thinking' | 'speaking'

const CUISINES = ['South Indian', 'North Indian', 'Tamil', 'Gujarati', 'Punjabi', 'Bengali', 'Maharashtrian', 'Hyderabadi', 'Rajasthani', 'Goan']
const DIETARY = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
const OCCASIONS = ['Regular Meal', 'Festival / Occasion']
const GROCERY = [
  { value: 'client_has_everything', label: 'I have everything ready' },
  { value: 'need_grocery_pickup', label: 'Cook picks up groceries' },
  { value: 'cook_brings_ingredients', label: 'Cook brings everything' },
]
const VOICE_LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
]

const ic = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper-400 w-full bg-white'

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-copper-600 text-white border-copper-600' : 'border-gray-200 text-gray-600 hover:border-copper-400'}`}>
      {label}
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 leading-snug">{value}</span>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{children}</span>
}

function ModeCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="border border-gray-200 rounded-xl px-4 py-3.5 text-left hover:border-copper-400 hover:bg-copper-50 transition-colors w-full">
      <p className="font-semibold text-gray-800 text-sm">{icon} {title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </button>
  )
}

const DEFAULT_HOURLY_RATE = 30
const COOKING_ARRANGEMENTS = ["Cook at client's location", 'Cook from my setup']
const initCook = { name: '', email: '', phone: '', city: '', state: '', cooking_arrangement: [] as string[], cooking_arrangement_other: '', cuisine_types: [] as string[], dietary_specialties: [] as string[], years_experience: '', hourly_rate: String(DEFAULT_HOURLY_RATE), intro: '' }
const initClient = { client_name: '', client_email: '', client_phone: '', city: '', requested_date: '', num_people: '', occasion: '', dietary_restrictions: [] as string[], grocery_situation: '', cleanup_needed: null as boolean | null, num_dishes: '', text_description: '' }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const [path, setPath] = useState<PathType>('cook')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cook, setCook] = useState(initCook)
  const [client, setClient] = useState(initClient)
  const [polishingCook, setPolishingCook] = useState(false)
  const [polishingClient, setPolishingClient] = useState(false)
  const [matchingCooks, setMatchingCooks] = useState<Array<{ id: string; name: string; phone: string; whatsapp?: string; cuisine_types: string[]; dietary_specialties: string[] }>>([])

  // Voice memo
  const [voiceActive, setVoiceActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [parsing, setParsing] = useState(false)
  const [voicePrefilled, setVoicePrefilled] = useState(false)

  // Voice conversation
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [chatPhase, setChatPhase] = useState<ChatPhase>('idle')
  const [chatTranscript, setChatTranscript] = useState('')

  // Voice language (applies to both voice memo and voice conversation modes)
  const [language, setLanguage] = useState('en-US')
  const languageLabel = VOICE_LANGUAGES.find(l => l.code === language)?.label ?? 'English'

  // Cook email verification gate — a cook profile can't be created until the
  // email is confirmed via magic link, so identity is proven up front.
  const [cookAuthState, setCookAuthState] = useState<'unknown' | 'unverified' | 'verified'>('unknown')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [sendingLink, setSendingLink] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [authError, setAuthError] = useState('')

  const recRef = useRef<any>(null)
  const chatMsgRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setVerifiedEmail(user.email)
          setCookAuthState('verified')
          setCook(p => ({ ...p, email: user.email! }))
        } else {
          setCookAuthState('unverified')
        }

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          if (params.get('opencookwidget') === '1' && user?.email) {
            setOpen(true); setPath('cook'); setView('mode')
            params.delete('opencookwidget')
            const query = params.toString()
            window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
          }
        }
      }).catch(() => setCookAuthState('unverified'))
    } catch {
      setCookAuthState('unverified')
    }
  }, [])

  async function handleSendVerifyLink(e: FormEvent) {
    e.preventDefault()
    setSendingLink(true); setAuthError('')
    try {
      const supabase = createClient()
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('intent', 'signup')
      callbackUrl.searchParams.set('redirectTo', window.location.pathname + '?opencookwidget=1')
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: signupEmail,
        options: { emailRedirectTo: callbackUrl.toString() },
      })
      if (otpError) {
        setAuthError(`Something went wrong: ${otpError.message}`)
      } else {
        setLinkSent(true)
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setSendingLink(false)
    }
  }


  function reset() {
    setView('home'); setCook(initCook); setClient(initClient); setError(''); setMatchingCooks([])
    setVoiceActive(false); setRecording(false); setVoiceTranscript(''); setVoicePrefilled(false)
    setChatMessages([]); chatMsgRef.current = []; setChatPhase('idle'); setChatTranscript('')
  }

  function stopAll() {
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    setRecording(false)
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }

  function handleBack() {
    stopAll()
    if (voiceActive) { setVoiceActive(false); return }
    if (view === 'voice-chat') { setChatMessages([]); setChatPhase('idle'); setChatTranscript(''); setView('mode'); return }
    if (view === 'review') { setView(path as View); return }
    if (view === 'cook' || view === 'client') { setView('mode'); return }
    setView('home')
  }

  // ── Voice memo ───────────────────────────────────────────────
  function hasSpeech() {
    if (typeof window === 'undefined') return false
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }

  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    try {
      const rec = new SR()
      rec.continuous = true; rec.interimResults = true; rec.lang = language
      rec.onresult = (e: any) => {
        let full = ''
        for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript + ' '
        setVoiceTranscript(full.trim())
      }
      rec.onend = () => setRecording(false)
      rec.onerror = () => setRecording(false)
      rec.start(); recRef.current = rec; setRecording(true)
    } catch { setRecording(false) }
  }

  function stopRecording() {
    if (recRef.current) { recRef.current.stop(); recRef.current = null }
    setRecording(false)
  }

  async function parseVoice() {
    if (!voiceTranscript.trim()) return
    stopRecording(); setParsing(true)
    try {
      const res = await fetch('/api/chat/parse-voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: voiceTranscript, type: path, language: languageLabel }) })
      const data = await res.json()
      const f = data.fields ?? {}
      if (Object.keys(f).length > 0) {
        if (path === 'cook') {
          setCook(prev => ({
            ...prev,
            ...(f.name !== undefined ? { name: f.name } : {}),
            ...(f.city !== undefined ? { city: f.city } : {}),
            ...(f.state !== undefined ? { state: f.state } : {}),
            ...(f.cooking_arrangement !== undefined ? { cooking_arrangement: f.cooking_arrangement } : {}),
            ...(f.cuisine_types !== undefined ? { cuisine_types: f.cuisine_types } : {}),
            ...(f.dietary_specialties !== undefined ? { dietary_specialties: f.dietary_specialties } : {}),
            ...(f.years_experience !== undefined ? { years_experience: String(f.years_experience) } : {}),
            ...(f.hourly_rate !== undefined ? { hourly_rate: String(Math.max(Number(f.hourly_rate) || 0, DEFAULT_HOURLY_RATE)) } : {}),
            ...(f.intro !== undefined ? { intro: f.intro } : {}),
          }))
        } else {
          setClient(prev => ({
            ...prev,
            ...(f.client_name !== undefined ? { client_name: f.client_name } : {}),
            ...(f.city !== undefined ? { city: f.city } : {}),
            ...(f.requested_date !== undefined ? { requested_date: f.requested_date } : {}),
            ...(f.num_people !== undefined ? { num_people: String(f.num_people) } : {}),
            ...(f.occasion !== undefined ? { occasion: f.occasion } : {}),
            ...(f.dietary_restrictions !== undefined ? { dietary_restrictions: f.dietary_restrictions } : {}),
            ...(f.grocery_situation !== undefined ? { grocery_situation: f.grocery_situation } : {}),
            ...(f.cleanup_needed !== undefined ? { cleanup_needed: f.cleanup_needed } : {}),
            ...(f.num_dishes !== undefined ? { num_dishes: String(f.num_dishes) } : {}),
            ...(f.text_description !== undefined ? { text_description: f.text_description } : {}),
          }))
        }
        setVoicePrefilled(true)
      }
      setVoiceActive(false); setVoiceTranscript('')
    } catch { setVoiceActive(false) }
    finally { setParsing(false) }
  }

  // ── Voice conversation ───────────────────────────────────────
  // Browser TTS has no SSML support and reads a raw 10-digit string as a huge
  // cardinal number ("five billion...") instead of a phone number. Spacing the
  // digits out makes every mainstream engine read them one at a time instead.
  function spellOutPhoneNumbers(text: string): string {
    const phoneRe = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    return text.replace(phoneRe, match => match.replace(/\D/g, '').split('').join(' '))
  }

  function speakText(text: string, lang: string, onEnd: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) { onEnd(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(spellOutPhoneNumbers(text))
    utt.rate = 1.0; utt.lang = lang
    utt.onend = onEnd; utt.onerror = onEnd
    window.speechSynthesis.speak(utt)
  }

  function startConvListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setChatPhase('idle'); return }
    try {
      const rec = new SR()
      rec.continuous = false; rec.interimResults = true; rec.lang = language
      let finalText = ''
      rec.onresult = (e: any) => {
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' '
          else interim += e.results[i][0].transcript
        }
        setChatTranscript((finalText + interim).trim())
      }
      rec.onend = () => {
        recRef.current = null
        const text = finalText.trim()
        if (text) sendChatMessage(text)
        else setChatPhase('idle')
      }
      rec.onerror = () => { recRef.current = null; setChatPhase('idle') }
      rec.start(); recRef.current = rec; setChatPhase('listening')
    } catch { setChatPhase('idle') }
  }

  async function startConversation() {
    setView('voice-chat')
    chatMsgRef.current = []; setChatMessages([]); setChatTranscript(''); setChatPhase('thinking')
    try {
      const res = await fetch('/api/chat/voice-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: path, messages: [], language: languageLabel }) })
      const data = await res.json()
      const greeting = [{ role: 'assistant' as const, content: data.response }]
      chatMsgRef.current = greeting; setChatMessages(greeting)
      setChatPhase('speaking')
      speakText(data.response, language, () => startConvListening())
    } catch { setChatPhase('idle') }
  }

  async function sendChatMessage(userText: string) {
    // Read from ref — always current even inside stale closures
    const newMessages = [...chatMsgRef.current, { role: 'user' as const, content: userText }]
    chatMsgRef.current = newMessages; setChatMessages(newMessages)
    setChatTranscript(''); setChatPhase('thinking')
    try {
      const res = await fetch('/api/chat/voice-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: path, messages: newMessages, language: languageLabel }) })
      const data = await res.json()
      const reply = data.response as string
      const withReply = [...chatMsgRef.current, { role: 'assistant' as const, content: reply }]
      chatMsgRef.current = withReply; setChatMessages(withReply)

      if (data.done && data.submitData) {
        setChatPhase('speaking')
        speakText(reply, language, async () => {
          setChatPhase('thinking')
          try {
            const submitRes = await fetch('/api/chat/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.submitData) })
            const sd = await submitRes.json()
            if (!submitRes.ok || sd.error) {
              const errMsg = sd.error || "Something went wrong on our end and I couldn't submit this — let's try again."
              const withError = [...chatMsgRef.current, { role: 'assistant' as const, content: errMsg }]
              chatMsgRef.current = withError; setChatMessages(withError)
              setChatPhase('speaking')
              speakText(errMsg, language, () => startConvListening())
              return
            }
            if (sd.matchingCooks) setMatchingCooks(sd.matchingCooks)
            setChatPhase('idle'); setView('done')
          } catch {
            const errMsg = "I couldn't reach the server to submit this — let's try again."
            const withError = [...chatMsgRef.current, { role: 'assistant' as const, content: errMsg }]
            chatMsgRef.current = withError; setChatMessages(withError)
            setChatPhase('speaking')
            speakText(errMsg, language, () => startConvListening())
          }
        })
      } else {
        setChatPhase('speaking')
        speakText(reply, language, () => startConvListening())
      }
    } catch { setChatPhase('idle') }
  }

  // ── Form helpers ─────────────────────────────────────────────
  function toggleCook(field: 'cuisine_types' | 'dietary_specialties', v: string) {
    setCook(p => ({ ...p, [field]: p[field].includes(v) ? p[field].filter(x => x !== v) : [...p[field], v] }))
  }
  function toggleCookingArrangement(v: string) {
    setCook(p => ({ ...p, cooking_arrangement: p.cooking_arrangement.includes(v) ? p.cooking_arrangement.filter(x => x !== v) : [...p.cooking_arrangement, v] }))
  }
  function toggleClient(v: string) {
    setClient(p => ({ ...p, dietary_restrictions: p.dietary_restrictions.includes(v) ? p.dietary_restrictions.filter(x => x !== v) : [...p.dietary_restrictions, v] }))
  }

  async function polish(context: 'cook' | 'client') {
    const text = context === 'cook' ? cook.intro : client.text_description
    if (!text.trim()) return
    context === 'cook' ? setPolishingCook(true) : setPolishingClient(true)
    try {
      const res = await fetch('/api/polish-intro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, context }) })
      const data = await res.json()
      if (data.polished) context === 'cook' ? setCook(p => ({ ...p, intro: data.polished })) : setClient(p => ({ ...p, text_description: data.polished }))
    } finally { context === 'cook' ? setPolishingCook(false) : setPolishingClient(false) }
  }

  function goReview(e: FormEvent) {
    e.preventDefault(); setError('')
    const phone = path === 'cook' ? cook.phone : client.client_phone
    if (!isValidUsPhone(phone)) { setError('Please enter a valid 10-digit US phone number.'); return }
    if (path === 'cook' && cook.cooking_arrangement.length === 0 && !cook.cooking_arrangement_other.trim()) {
      setError('Please select at least one option for how you cook.'); return
    }
    if (path === 'client' && client.cleanup_needed === null) { setError('Please select Yes or No for cleanup.'); return }
    setView('review')
  }

  async function submit() {
    setLoading(true); setError('')
    try {
      const cookData = {
        ...cook,
        cooking_arrangement: [...new Set([
          ...cook.cooking_arrangement,
          ...(cook.cooking_arrangement_other.trim() ? [cook.cooking_arrangement_other.trim()] : []),
        ])],
      }
      const res = await fetch('/api/chat/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: path, data: path === 'cook' ? cookData : client, language: languageLabel }) })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Something went wrong.'); return }
      if (data.matchingCooks) setMatchingCooks(data.matchingCooks)
      setView('done')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  const numPeople = Number(client.num_people)
  const categoryLabel = numPeople <= 5 ? 'Family Cooking' : numPeople <= 10 ? 'Small Event' : 'Medium Event'
  const groceryLabel = GROCERY.find(g => g.value === client.grocery_situation)?.label ?? ''
  const dateLabel = client.requested_date ? new Date(client.requested_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  const headerTitle = voiceActive ? 'Voice Description'
    : view === 'home' ? 'Sivan Spices Home Cooks'
    : view === 'mode' ? (path === 'cook' ? 'Sign Up as a Cook' : 'Hire a Cook')
    : view === 'cook-verify' ? 'Verify Your Email'
    : view === 'cook' ? 'Cook Sign Up'
    : view === 'client' ? 'Post Your Craving'
    : view === 'voice-chat' ? (path === 'cook' ? 'Cook Sign Up' : 'Post Your Craving')
    : view === 'review' ? 'Review & Confirm'
    : view === 'learn' ? 'Cook & Sell Food'
    : 'All Done!'

  const showBack = view !== 'home' && view !== 'done'

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: 'min(600px, calc(100vh - 96px))' }}>

          {/* Header */}
          <div className="bg-copper-600 px-4 py-3 flex items-center gap-2 shrink-0">
            {showBack && (
              <button onClick={handleBack} className="text-copper-200 hover:text-white text-sm shrink-0">←</button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{headerTitle}</p>
              {view === 'home' && <p className="text-copper-200 text-xs mt-0.5">Sign up as a cook or post a job</p>}
            </div>
            <button onClick={() => { stopAll(); setOpen(false) }} className="text-copper-200 hover:text-white text-base leading-none shrink-0 ml-1">✕</button>
          </div>

          {/* Home */}
          {view === 'home' && (
            <div className="flex-1 flex flex-col justify-center px-6 gap-4">
              <p className="text-sm text-gray-500 text-center">What brings you here today?</p>
              <button onClick={() => { setPath('client'); setView('mode') }}
                className="border-2 border-copper-200 rounded-xl px-4 py-4 text-left hover:border-copper-400 hover:bg-copper-50 transition-colors">
                <p className="font-semibold text-gray-800 text-sm">🏠 Hire a Cook</p>
                <p className="text-xs text-gray-500 mt-1">Post a job and connect with home cooks in your area</p>
              </button>
              <button onClick={() => {
                  setPath('cook')
                  if (cookAuthState === 'verified') { setCook(p => ({ ...p, email: verifiedEmail })); setView('mode') }
                  else { setLinkSent(false); setAuthError(''); setView('cook-verify') }
                }}
                className="border-2 border-copper-200 rounded-xl px-4 py-4 text-left hover:border-copper-400 hover:bg-copper-50 transition-colors">
                <p className="font-semibold text-gray-800 text-sm">👨‍🍳 Sign Up as a Cook</p>
                <p className="text-xs text-gray-500 mt-1">Create your cook profile and start getting hired</p>
              </button>
              <button onClick={() => setView('learn')}
                className="border-2 border-copper-200 rounded-xl px-4 py-4 text-left hover:border-copper-400 hover:bg-copper-50 transition-colors">
                <p className="font-semibold text-gray-800 text-sm">📚 Learn How to Cook & Sell Food</p>
                <p className="text-xs text-gray-500 mt-1">Certification, selling food from home, and getting paid</p>
              </button>
            </div>
          )}

          {view === 'learn' && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <BecomeCookTimeline compact />
              </div>
              <div className="flex-1 flex flex-col min-h-[360px]">
                <EducationChat compact />
              </div>
            </div>
          )}

          {/* Mode picker */}
          {view === 'mode' && (
            <div className="flex-1 flex flex-col justify-center px-5 gap-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide text-center font-semibold mb-1">
                How would you like to proceed?
              </p>
              <ModeCard icon="📝" title="Fill a form"
                desc="Fill in your details at your own pace"
                onClick={() => setView(path as View)} />
              <ModeCard icon="🎤" title="Describe by voice"
                desc="Speak once — we fill the form for you"
                onClick={() => { setVoiceActive(true); setVoiceTranscript(''); setView(path as View) }} />
              <ModeCard icon="💬" title="Talk to our assistant"
                desc="Back-and-forth voice conversation"
                onClick={startConversation} />
              <div className="flex items-center gap-2 justify-center mt-1">
                <label className="text-xs text-gray-400">🌐 Voice language:</label>
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-copper-400"
                  value={language} onChange={e => setLanguage(e.target.value)}>
                  {VOICE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Cook email verification gate */}
          {view === 'cook-verify' && (
            <div className="flex-1 overflow-y-auto flex flex-col px-5 py-8 gap-4">
              <p className="text-sm text-gray-500 text-center">First, verify your email — we'll send a link to confirm it's really you before you fill out your cook profile.</p>
              {linkSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 text-center">
                  Check your email — we sent a verification link to <strong>{signupEmail}</strong>. Click it to continue, then come back here.
                </div>
              ) : (
                <form onSubmit={handleSendVerifyLink} className="flex flex-col gap-3">
                  <input type="email" required value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="you@email.com" className={ic} />
                  {authError && <p className="text-xs text-red-600 text-center">{authError}</p>}
                  <button type="submit" disabled={sendingLink}
                    className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-50">
                    {sendingLink ? 'Sending...' : 'Send verification link'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Cook form */}
          {view === 'cook' && !voiceActive && (
            <form onSubmit={goReview} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {voicePrefilled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Form pre-filled from your voice — review and adjust below.</span>
                  <button type="button" onClick={() => setVoicePrefilled(false)} className="ml-auto text-green-400 hover:text-green-600 leading-none">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => { setVoiceActive(true); setVoiceTranscript(''); setRecording(false) }}
                  className="w-full border-2 border-dashed border-copper-200 rounded-xl py-3 px-4 text-sm text-copper-600 hover:bg-copper-50 hover:border-copper-300 transition-colors flex items-center justify-center gap-2 font-medium">
                  🎤 Describe yourself by voice instead
                </button>
              )}
              <div className="flex flex-col gap-1.5">
                <Label>Full Name</Label>
                <input className={ic} value={cook.name} onChange={e => setCook(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Email</Label>
                  <input className={`${ic} ${verifiedEmail ? 'bg-gray-50 text-gray-500' : ''}`} type="email" value={cook.email} readOnly={!!verifiedEmail} onChange={e => setCook(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Phone</Label>
                  <input className={ic} type="tel" value={cook.phone} onChange={e => setCook(p => ({ ...p, phone: e.target.value }))} placeholder="(510) 000-0000" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>City</Label>
                  <CityInput className={ic} value={cook.city} onChange={v => setCook(p => ({ ...p, city: v }))} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>State</Label>
                  <select className={ic} value={cook.state} onChange={e => setCook(p => ({ ...p, state: e.target.value }))} required>
                    <option value="">Select...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>How do you cook?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COOKING_ARRANGEMENTS.map(a => <Chip key={a} label={a} active={cook.cooking_arrangement.includes(a)} onClick={() => toggleCookingArrangement(a)} />)}
                </div>
                <input className={ic} value={cook.cooking_arrangement_other} onChange={e => setCook(p => ({ ...p, cooking_arrangement_other: e.target.value }))} placeholder="Other (describe how you cook)" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cuisines you cook</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINES.map(c => <Chip key={c} label={c} active={cook.cuisine_types.includes(c)} onClick={() => toggleCook('cuisine_types', c)} />)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Dietary specialties</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY.map(d => <Chip key={d} label={d} active={cook.dietary_specialties.includes(d)} onClick={() => toggleCook('dietary_specialties', d)} />)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Years of experience</Label>
                <input className={ic} type="number" min="1" value={cook.years_experience} onChange={e => setCook(p => ({ ...p, years_experience: e.target.value }))} placeholder="e.g. 5" required />
              </div>
              {cook.cooking_arrangement.includes("Cook at client's location") && (
                <div className="flex flex-col gap-1.5">
                  <Label>Your hourly rate ($)</Label>
                  <input className={ic} type="number" min={DEFAULT_HOURLY_RATE} value={cook.hourly_rate} onChange={e => setCook(p => ({ ...p, hourly_rate: e.target.value }))} placeholder="e.g. 35" required />
                  <p className="text-xs text-gray-400">Starts at the platform minimum of {`$${DEFAULT_HOURLY_RATE}`}/hr — raise it if you'd like</p>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>About you</Label>
                  <button type="button" onClick={() => polish('cook')} disabled={polishingCook || !cook.intro.trim()}
                    className="text-xs text-copper-600 hover:text-copper-700 disabled:opacity-40 transition-opacity">
                    {polishingCook ? 'Polishing...' : '✨ Polish'}
                  </button>
                </div>
                <textarea className={`${ic} resize-none`} rows={3} value={cook.intro} onChange={e => setCook(p => ({ ...p, intro: e.target.value }))} placeholder="e.g. I am a cook from East India and have 10 years of cooking experience. I grew up in Kolkata and learned to cook from my mother, and I love making food that tastes like home." required />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 mt-1">
                Review Application →
              </button>
            </form>
          )}

          {/* Voice memo screen — cook or client */}
          {(view === 'cook' || view === 'client') && voiceActive && (
            <div className="flex-1 overflow-y-auto flex flex-col px-4 py-5 gap-5">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                {path === 'cook'
                  ? "Speak naturally — mention your name, city, cuisines you cook, years of experience, your rate, and a bit about yourself."
                  : "Speak naturally — mention the date, number of people, dietary needs, and what you'd like cooked."}
              </p>
              <p className="text-xs text-gray-400 text-center -mt-3">Speaking in {languageLabel}</p>
              {hasSpeech() ? (
                <div className="flex flex-col items-center gap-3">
                  <button type="button" onClick={recording ? stopRecording : startRecording} disabled={parsing}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${recording ? 'bg-red-500 shadow-lg shadow-red-200 scale-105 ring-4 ring-red-200 animate-pulse' : 'bg-copper-600 hover:bg-copper-700 shadow-md shadow-copper-200 hover:scale-105'}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    {recording ? '🔴 Listening — tap to stop' : voiceTranscript ? 'Tap mic to add more' : 'Tap to start speaking'}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <p className="text-sm font-medium text-amber-800">Voice input requires Chrome or Edge.</p>
                </div>
              )}
              {voiceTranscript && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 max-h-28 overflow-y-auto leading-relaxed">
                  {voiceTranscript}
                </div>
              )}
              {voiceTranscript.length > 10 && (
                <button type="button" onClick={parseVoice} disabled={parsing}
                  className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-50 transition-opacity">
                  {parsing ? 'Filling form...' : 'Fill form from my voice →'}
                </button>
              )}
              <button type="button" onClick={() => { stopRecording(); setVoiceActive(false) }} className="text-xs text-gray-400 hover:text-gray-600 text-center">
                Type instead →
              </button>
            </div>
          )}

          {/* Client — form */}
          {view === 'client' && !voiceActive && (
            <form onSubmit={goReview} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {voicePrefilled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Form pre-filled from your voice — review and adjust below.</span>
                  <button type="button" onClick={() => setVoicePrefilled(false)} className="ml-auto text-green-400 hover:text-green-600 leading-none">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => { setVoiceActive(true); setVoiceTranscript(''); setRecording(false) }}
                  className="w-full border-2 border-dashed border-copper-200 rounded-xl py-3 px-4 text-sm text-copper-600 hover:bg-copper-50 hover:border-copper-300 transition-colors flex items-center justify-center gap-2 font-medium">
                  🎤 Describe what you need by voice instead
                </button>
              )}
              <div className="flex flex-col gap-1.5">
                <Label>Your Name</Label>
                <input className={ic} value={client.client_name} onChange={e => setClient(p => ({ ...p, client_name: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Email</Label>
                  <input className={ic} type="email" value={client.client_email} onChange={e => setClient(p => ({ ...p, client_email: e.target.value }))} placeholder="you@email.com" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Phone</Label>
                  <input className={ic} type="tel" value={client.client_phone} onChange={e => setClient(p => ({ ...p, client_phone: e.target.value }))} placeholder="(510) 000-0000" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>City</Label>
                  <CityInput className={ic} value={client.city} onChange={v => setClient(p => ({ ...p, city: v }))} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Date needed</Label>
                  <input className={ic} type="date" value={client.requested_date} onChange={e => setClient(p => ({ ...p, requested_date: e.target.value }))} required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Occasion</Label>
                <div className="flex gap-2">
                  {OCCASIONS.map(o => <Chip key={o} label={o} active={client.occasion === o} onClick={() => setClient(p => ({ ...p, occasion: o }))} />)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Number of people</Label>
                  <input className={ic} type="number" min="2" max="14" value={client.num_people} onChange={e => setClient(p => ({ ...p, num_people: e.target.value }))} placeholder="2–14" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Number of dishes</Label>
                  <input className={ic} type="number" min="1" value={client.num_dishes} onChange={e => setClient(p => ({ ...p, num_dishes: e.target.value }))} placeholder="e.g. 3" required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Dietary requirements</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY.map(d => <Chip key={d} label={d} active={client.dietary_restrictions.includes(d)} onClick={() => toggleClient(d)} />)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Groceries</Label>
                <div className="flex flex-col gap-1.5">
                  {GROCERY.map(g => <Chip key={g.value} label={g.label} active={client.grocery_situation === g.value} onClick={() => setClient(p => ({ ...p, grocery_situation: g.value }))} />)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cleanup needed?</Label>
                <div className="flex gap-2">
                  {['Yes', 'No'].map(v => (
                    <Chip key={v} label={v}
                      active={client.cleanup_needed !== null && (v === 'Yes') === client.cleanup_needed}
                      onClick={() => setClient(p => ({ ...p, cleanup_needed: v === 'Yes' }))} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label>What should the cook prepare? (optional)</Label>
                  <button type="button" onClick={() => polish('client')} disabled={polishingClient || !client.text_description.trim()}
                    className="text-xs text-copper-600 hover:text-copper-700 disabled:opacity-40 transition-opacity">
                    {polishingClient ? 'Polishing...' : '✨ Polish'}
                  </button>
                </div>
                <textarea className={`${ic} resize-none`} rows={3} value={client.text_description} onChange={e => setClient(p => ({ ...p, text_description: e.target.value }))} placeholder="Describe dishes, cuisine style, any preferences..." />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 mt-1">
                Review Job Post →
              </button>
            </form>
          )}

          {/* Voice conversation */}
          {view === 'voice-chat' && (
            <div className="flex-1 flex flex-col px-4 py-5 gap-4">
              <p className="text-xs text-gray-400 text-center">Speaking in {languageLabel}</p>
              {/* Orb */}
              <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                  chatPhase === 'listening' ? 'bg-green-500 shadow-xl shadow-green-200 scale-110 ring-8 ring-green-100 animate-pulse'
                  : chatPhase === 'speaking' ? 'bg-copper-500 shadow-xl shadow-copper-200 ring-8 ring-copper-100 animate-pulse'
                  : chatPhase === 'thinking' ? 'bg-blue-500 shadow-lg shadow-blue-200 animate-pulse'
                  : 'bg-gray-200 shadow-md'
                }`}>
                  {(chatPhase === 'listening' || chatPhase === 'idle') && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-10 h-10 ${chatPhase === 'idle' ? 'text-gray-400' : 'text-white'}`}>
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H3v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
                    </svg>
                  )}
                  {chatPhase === 'speaking' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                  {chatPhase === 'thinking' && (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white opacity-80">
                      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {chatPhase === 'listening' ? 'Listening...' : chatPhase === 'speaking' ? 'Speaking...' : chatPhase === 'thinking' ? 'Thinking...' : 'Tap to speak'}
                </p>
              </div>

              {/* Last assistant message */}
              {chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'assistant' && (
                <div className="bg-copper-50 border border-copper-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 leading-relaxed">
                  {renderMarkdown(chatMessages[chatMessages.length - 1].content)}
                </div>
              )}

              {/* Live transcript */}
              {chatTranscript && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-500 italic">
                  "{chatTranscript}"
                </div>
              )}

              {/* Manual tap when idle */}
              {chatPhase === 'idle' && (
                <button onClick={startConvListening}
                  className="w-full bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 transition-colors">
                  Tap to speak
                </button>
              )}

              <button onClick={() => { stopAll(); chatMsgRef.current = []; setChatMessages([]); setChatPhase('idle'); setChatTranscript(''); setView('mode') }}
                className="text-xs text-gray-400 hover:text-gray-600 text-center">
                End conversation →
              </button>
            </div>
          )}

          {/* Review */}
          {view === 'review' && (
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <p className="text-xs text-gray-400">
                {path === 'cook' ? 'Check your application before submitting.' : 'Check your job post before publishing.'}
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                {path === 'cook' ? (
                  <>
                    <Row label="Name" value={cook.name} />
                    <Row label="Email" value={cook.email} />
                    <Row label="Phone" value={cook.phone} />
                    <Row label="City" value={cook.city} />
                    <Row label="State" value={cook.state} />
                    <Row label="How" value={[...cook.cooking_arrangement, cook.cooking_arrangement_other.trim()].filter(Boolean).join(', ')} />
                    <Row label="Cuisines" value={cook.cuisine_types.join(', ')} />
                    <Row label="Dietary" value={cook.dietary_specialties.join(', ') || 'None'} />
                    <Row label="Exp." value={cook.years_experience ? `${cook.years_experience} years` : ''} />
                    {cook.cooking_arrangement.includes("Cook at client's location") && (
                      <Row label="Rate" value={cook.hourly_rate ? `$${cook.hourly_rate}/hr` : ''} />
                    )}
                    <Row label="About" value={cook.intro} />
                  </>
                ) : (
                  <>
                    <Row label="Name" value={client.client_name} />
                    <Row label="Email" value={client.client_email} />
                    <Row label="Phone" value={client.client_phone} />
                    <Row label="City" value={client.city} />
                    <Row label="Date" value={dateLabel} />
                    <Row label="People" value={client.num_people ? `${client.num_people} · ${categoryLabel}` : ''} />
                    <Row label="Occasion" value={client.occasion} />
                    <Row label="Dietary" value={client.dietary_restrictions.join(', ') || 'None'} />
                    <Row label="Groceries" value={groceryLabel} />
                    <Row label="Cleanup" value={client.cleanup_needed === null ? '' : client.cleanup_needed ? 'Yes' : 'No'} />
                    <Row label="Dishes" value={client.num_dishes} />
                    {client.text_description && <Row label="Notes" value={client.text_description} />}
                  </>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setView(path as View)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:border-copper-400 hover:text-copper-600 transition-colors">Edit</button>
                <button onClick={submit} disabled={loading} className="flex-1 bg-copper-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-50 transition-opacity">
                  {loading ? 'Submitting...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {view === 'done' && (
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-600" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{path === 'cook' ? 'Application submitted!' : 'Job posted!'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {path === 'cook'
                      ? cook.email ? `We'll review and reach out to ${cook.email}.` : `We'll review your application and be in touch.`
                      : `We've notified all active cooks by email.`}
                  </p>
                </div>
              </div>

              {path === 'client' && matchingCooks.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-gray-700">
                    {client.city ? `Cooks available in ${client.city}` : 'Available cooks'} — reach out directly:
                  </p>
                  <div className="flex flex-col gap-3">
                    {matchingCooks.map(c => (
                      <div key={c.id} className="border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.cuisine_types.slice(0, 3).join(' · ')}</p>
                          {c.dietary_specialties.length > 0 && <p className="text-xs text-copper-600 mt-0.5">{c.dietary_specialties.join(' · ')}</p>}
                        </div>
                        <div className="flex gap-2">
                          <a href={`tel:${c.phone}`} className="flex-1 text-center text-xs border border-gray-300 rounded-lg py-1.5 px-1 text-gray-700 hover:border-copper-400 hover:text-copper-600 transition-colors truncate">
                            📞 {c.phone}
                          </a>
                          <a href={`https://wa.me/${(c.whatsapp || c.phone).replace(/\D/g, '').replace(/^([^1])/, '1$1')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-center text-xs border border-gray-300 rounded-lg py-1.5 px-3 text-gray-700 hover:border-green-400 hover:text-green-600 transition-colors">
                            💬 WhatsApp
                          </a>
                          <a href={`/cooks/${c.id}`} className="shrink-0 text-center text-xs border border-gray-300 rounded-lg py-1.5 px-3 text-gray-700 hover:border-copper-400 hover:text-copper-600 transition-colors">
                            Profile →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {path === 'client' && matchingCooks.length === 0 && (
                <p className="text-sm text-gray-500">
                  No cooks are available in {client.city || 'your area'} right now. We've notified them by email — you'll hear back soon.
                </p>
              )}

              <button onClick={() => { reset(); setOpen(false) }} className="text-sm text-copper-600 hover:underline text-center mt-auto pt-2">Close</button>
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <button onClick={() => setOpen(o => !o)}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${open ? 'bg-gray-700 hover:bg-gray-800' : 'bg-copper-600 hover:bg-copper-700'}`}
        aria-label={open ? 'Close' : 'Chat with us'}>
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
