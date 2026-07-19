import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CLIENT_SCHEMA = `{
  "client_name": "string",
  "city": "string (any city/town — this is a nationwide platform, do not restrict to a fixed list)",
  "state": "string (the US state name, e.g. California — full name, not abbreviation)",
  "request_type": "\\"session\\" if they want a full home-cooked meal, \\"item\\" if they want a specific item like a jar of pickles or baked goods",
  "specific_dishes": "string — only if request_type is \\"item\\": what item they want",
  "requested_date": "YYYY-MM-DD — only if request_type is \\"session\\"; omit entirely for an item order",
  "num_people": "number — only if request_type is \\"session\\"; omit for an item order",
  "occasion": "string (one of the occasion values only)",
  "dietary_restrictions": ["string array from dietary options only"],
  "grocery_situation": "string (one of the grocery values only) — only if request_type is \\"session\\"",
  "cleanup_needed": "boolean — only if request_type is \\"session\\"",
  "num_dishes": "number — only if request_type is \\"session\\"",
  "text_description": "string (rephrase the request clearly in 1-2 sentences, in English)"
}`

const COOK_SCHEMA = `{
  "name": "string",
  "city": "string (any city/town — this is a nationwide platform, do not restrict to a fixed list)",
  "state": "string (the US state name, e.g. California — full name, not abbreviation)",
  "cooking_arrangement": ["string array — one or more of: \\"Cook at client's location\\", \\"Cook from my setup\\", or their own free-text description if neither fits"],
  "offering_types": ["string array — one or both of \\"session\\" (they cook full home-cooked meals) and \\"item\\" (they sell specific items like pickles or baked goods), inferred from context — e.g. mentions of selling jars or baked goods implies \\"item\\"; mentions of cooking full meals or delivering dinners implies \\"session\\""],
  "cuisine_types": ["string array — any cuisines, cooking styles, or food specialties mentioned, in their own words — not restricted to a fixed list"],
  "dietary_specialties": ["string array from dietary options only"],
  "years_experience": number,
  "hourly_rate": number,
  "intro": "string (2-3 sentence bio about their cooking background and style, in English)"
}`

export async function POST(request: Request) {
  const { transcript, type, language } = await request.json()
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 5) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
  }

  const isCook = type === 'cook'
  const today = new Date().toISOString().split('T')[0]
  const lang = language || 'English'

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Extract ${isCook ? 'a home cook profile' : 'a home cooking job'} from this voice description. The speaker was talking in ${lang}. Return ONLY valid JSON — no prose, no markdown fences. Omit any field you cannot confidently determine.

Today's date: ${today}
Cuisine types are NOT restricted to a fixed list — accept any real cuisine, cooking style, or food specialty the speaker mentions (e.g. "South Indian", "Baking", "Pickles", "Chettinad").
Dietary options: "Vegetarian", "Non-Vegetarian", "Eggetarian"
Occasion values: "Regular Meal", "Festival / Occasion"
Grocery values: "client_has_everything", "need_grocery_pickup", "cook_brings_ingredients"
Platform minimum hourly rate: $30 — if a rate below 30 is mentioned, still return the number they said, do not adjust it yourself.
Hourly rate only applies if the cook cooks at the client's location — if they only cook from their own setup, do not extract a rate even if one is mentioned.
${isCook ? '' : 'request_type: infer "item" if they mention buying/ordering a specific product (a jar of pickles, a batch of baked goods, etc.), or "session" if they describe a full home-cooked meal. If request_type is "item", do not extract requested_date, num_people, num_dishes, grocery_situation, or cleanup_needed — none of that applies to an item order.'}

Regardless of what language the transcript is in: dietary_specialties, occasion, grocery_situation, and cooking_arrangement (when it matches one of the two known values) must always be returned using the exact canonical English values listed above. Cuisine types and city should be returned in clear English spelling (transliterated if needed) but are NOT restricted to any fixed list. Free-text fields (intro / text_description) must be translated into clear, natural English — never return non-English text in those fields.

Return JSON matching this shape (only the fields you can confidently extract):
${isCook ? COOK_SCHEMA : CLIENT_SCHEMA}

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
