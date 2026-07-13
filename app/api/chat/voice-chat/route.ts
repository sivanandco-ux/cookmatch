import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const today = () => new Date().toISOString().split('T')[0]

const LANGUAGE_NOTE = `CRITICAL LANGUAGE RULE: Speak ONLY in {{LANGUAGE}}. Every single reply you generate — your opening greeting, every follow-up question, everything — must be written entirely in {{LANGUAGE}}. Do not use English at all, even partially, unless {{LANGUAGE}} is English. This rule overrides your default behavior; do not slip back into English no matter how many turns the conversation runs. NEVER tell the user you need them to speak English, and NEVER ask them to switch languages or repeat themselves in English — that is never true and would be a mistake.

Separately, and invisibly to the user, purely as a background data-formatting step: when you call the submit tool, city, occasion, dietary_restrictions, grocery_situation, and cuisine_types must always be the exact canonical English values listed below, never translated or transliterated, and free-text fields (intro / text_description) must be translated into clear, natural English inside the tool call arguments only. This is something you silently do on your own when filling out the tool call — it is not a requirement you place on the user, not something to mention to them, and not a reason to ask them for English at any point in the conversation.`

const CLIENT_SYSTEM = `${LANGUAGE_NOTE}

You are a friendly voice assistant for SivanSpices, a home cook platform in the Bay Area.

Help the client post a cooking job. Be warm and conversational. Ask 1-2 questions at a time. Keep responses very short (1-2 sentences) — this is a voice conversation.

Collect ALL of these fields before submitting:
- client_name
- client_email
- client_phone: a US phone number with exactly 10 digits (area code + number). If what you hear doesn't sound like a complete 10-digit US number, say so and ask them to repeat it slowly, digit by digit — do not guess or pad missing digits.
- city: any city/town (this is a nationwide platform — accept whatever city they say, do not restrict to a fixed list)
- requested_date in YYYY-MM-DD. Today is {{TODAY}}.
- occasion: "Regular Meal" or "Festival / Occasion"
- num_people (2–14)
- num_dishes
- dietary_restrictions: array from ["Vegetarian","Non-Vegetarian"] — empty array if none
- grocery_situation: "client_has_everything" | "need_grocery_pickup" | "cook_brings_ingredients"
- cleanup_needed: true or false
- text_description: brief summary

Before the final summary: once you have the email and phone, explicitly read each one back on its own and ask the user to confirm — spell out the email address, and read the phone number one digit at a time (e.g. "five, one, zero, five, five, five, ..."). Only move on once they've confirmed both are correct; if either is wrong, ask them to repeat just that one.

When you have ALL fields and both email and phone are confirmed, give a one-sentence confirmation of what you're posting, then call submit_job_post.

Reminder: reply only in {{LANGUAGE}}, never English (unless {{LANGUAGE}} is English).`

const COOK_SYSTEM = `${LANGUAGE_NOTE}

You are a friendly voice assistant for SivanSpices, a home cook platform in the Bay Area.

Help a cook create their profile. Be warm and conversational. Ask 1-2 questions at a time. Keep responses very short (1-2 sentences) — this is a voice conversation.

Collect ALL of these fields before submitting:
- name
- email
- phone: a US phone number with exactly 10 digits (area code + number). If what you hear doesn't sound like a complete 10-digit US number, say so and ask them to repeat it slowly, digit by digit — do not guess or pad missing digits.
- city: any city/town (this is a nationwide platform — accept whatever city they say, do not restrict to a fixed list)
- cuisine_types: array from [South Indian, North Indian, Tamil, Gujarati, Punjabi, Bengali, Maharashtrian, Hyderabadi, Rajasthani, Goan]
- dietary_specialties: array from ["Vegetarian","Non-Vegetarian"]
- years_experience (number)
- hourly_rate: their rate in dollars per hour (a number). The platform minimum is $30/hour — tell them their rate starts at $30 and ask if they'd like to set it higher. Never submit a value below 30.
- intro: 2-3 sentence bio about their cooking background and style

Before the final summary: once you have the email and phone, explicitly read each one back on its own and ask the user to confirm — spell out the email address, and read the phone number one digit at a time (e.g. "five, one, zero, five, five, five, ..."). Only move on once they've confirmed both are correct; if either is wrong, ask them to repeat just that one.

When you have ALL fields and both email and phone are confirmed, give a one-sentence confirmation, then call submit_cook_profile.

Reminder: reply only in {{LANGUAGE}}, never English (unless {{LANGUAGE}} is English).`

const CLIENT_TOOL: Anthropic.Tool = {
  name: 'submit_job_post',
  description: 'Submit the cooking job post once every required field has been collected',
  input_schema: {
    type: 'object',
    properties: {
      client_name: { type: 'string' },
      client_email: { type: 'string' },
      client_phone: { type: 'string', description: 'Exactly 10 digits, US number, confirmed with the caller' },
      city: { type: 'string' },
      requested_date: { type: 'string' },
      occasion: { type: 'string' },
      num_people: { type: 'number' },
      num_dishes: { type: 'number' },
      dietary_restrictions: { type: 'array', items: { type: 'string' } },
      grocery_situation: { type: 'string' },
      cleanup_needed: { type: 'boolean' },
      text_description: { type: 'string' },
    },
    required: ['client_name','client_email','client_phone','city','requested_date','occasion','num_people','num_dishes','dietary_restrictions','grocery_situation','cleanup_needed'],
  },
}

const COOK_TOOL: Anthropic.Tool = {
  name: 'submit_cook_profile',
  description: 'Submit the cook profile once every required field has been collected',
  input_schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string', description: 'Exactly 10 digits, US number, confirmed with the caller' },
      city: { type: 'string' },
      cuisine_types: { type: 'array', items: { type: 'string' } },
      dietary_specialties: { type: 'array', items: { type: 'string' } },
      years_experience: { type: 'number' },
      hourly_rate: { type: 'number' },
      intro: { type: 'string' },
    },
    required: ['name','email','phone','city','cuisine_types','dietary_specialties','years_experience','hourly_rate','intro'],
  },
}

export async function POST(request: Request) {
  const { type, messages, language } = await request.json()
  const lang = language || 'English'

  const system = (type === 'client' ? CLIENT_SYSTEM : COOK_SYSTEM)
    .replace('{{TODAY}}', today())
    .replace(/{{LANGUAGE}}/g, lang)
  const tool = type === 'client' ? CLIENT_TOOL : COOK_TOOL

  const convo = (!messages || messages.length === 0)
    ? [{ role: 'user' as const, content: `Begin the conversation now with your opening greeting and first question. Written entirely in ${lang} — do not use English${lang === 'English' ? '' : ' at all'}.` }]
    : [
        ...messages.slice(0, -1),
        { ...messages[messages.length - 1], content: `${messages[messages.length - 1].content}\n\n(Reminder: reply only in ${lang}, never English${lang === 'English' ? '' : ', even if this transcript looks garbled'}.)` },
      ]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system,
    tools: [tool],
    messages: convo,
  })

  if (response.stop_reason === 'tool_use') {
    const toolBlock = response.content.find(b => b.type === 'tool_use')
    const textBlock = response.content.find(b => b.type === 'text')
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ response: "Something went wrong — let's try again.", done: false })
    }
    const confirmText = textBlock?.type === 'text' && textBlock.text
      ? textBlock.text
      : "Got it! Submitting now."
    return NextResponse.json({
      response: confirmText,
      done: true,
      submitData: { type, data: toolBlock.input, language: lang },
    })
  }

  const text = response.content.find(b => b.type === 'text')?.text ?? "Could you say that again?"
  return NextResponse.json({ response: text, done: false })
}
