import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { transcript } = await request.json()
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 5) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Extract home cooking job details from this voice description. Return ONLY valid JSON — no prose, no markdown fences. Omit any field you cannot confidently determine.

Today's date: ${today}
Available cities: Fremont, Newark, Union City, Milpitas
Dietary options: "Vegetarian", "Non-Vegetarian"
Occasion values: "Regular Meal", "Festival / Occasion"
Grocery values: "client_has_everything", "need_grocery_pickup", "cook_brings_ingredients"

Return JSON with only the fields you can confidently extract:
{
  "client_name": "string",
  "city": "string (one of the available cities only)",
  "requested_date": "YYYY-MM-DD",
  "num_people": number,
  "occasion": "string (one of the occasion values only)",
  "dietary_restrictions": ["string array from dietary options only"],
  "grocery_situation": "string (one of the grocery values only)",
  "cleanup_needed": boolean,
  "num_dishes": number,
  "text_description": "string (rephrase the request clearly in 1-2 sentences)"
}

Voice transcript: "${transcript.trim().replace(/"/g, "'")}"`,
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? '{}'

  try {
    const match = text.match(/\{[\s\S]*\}/)
    const fields = match ? JSON.parse(match[0]) : {}
    return NextResponse.json({ fields })
  } catch {
    return NextResponse.json({ fields: {} })
  }
}
