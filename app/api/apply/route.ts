import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyCook } from '@/lib/agents/cookVerificationAgent'
import Anthropic from '@anthropic-ai/sdk'

async function validateCustomCuisines(input: string): Promise<string[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are validating cuisine types for a home cook platform in the San Francisco Bay Area. A cook applicant entered these as their cuisine specialties: "${input}"

Return ONLY a JSON array of valid cuisine type names from this input. Rules:
- Include only real, recognized cuisine traditions (regional Indian cuisines, national cuisines, cultural food traditions)
- Correct obvious misspellings (e.g. "tamilian" → "Tamil", "soth indian" → "South Indian")
- Exclude anything that is not a cuisine name (gibberish, offensive words, unrelated text, emojis, numbers)
- Return an empty array [] if nothing valid is found
- No explanation, just the JSON array`,
    }],
  })
  const text = response.content.find(b => b.type === 'text')?.text || '[]'
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Please verify your email before submitting.' }, { status: 401 })
  }

  const { data: existingCook } = await supabase.from('cooks').select('id').eq('user_id', user.id).maybeSingle()
  if (existingCook) {
    return NextResponse.json({ error: 'You already have a cook profile.' }, { status: 400 })
  }

  // Validate and merge custom cuisines
  let cuisineTypes: string[] = body.cuisine_types || []
  if (body.other_cuisines?.trim()) {
    const validated = await validateCustomCuisines(body.other_cuisines.trim())
    console.log('[Cuisine validation] Input:', body.other_cuisines, '→ Valid:', validated)
    if (validated.length === 0 && cuisineTypes.length === 0) {
      return NextResponse.json(
        { error: 'The cuisines you entered could not be recognised. Please enter valid cuisine names, e.g. Chettinad, Kongunadu, Malabar.' },
        { status: 400 }
      )
    }
    if (validated.length === 0 && body.other_cuisines.trim()) {
      return NextResponse.json(
        { error: `"${body.other_cuisines}" doesn't appear to be a recognised cuisine. Please check your spelling or leave the field blank.` },
        { status: 400 }
      )
    }
    cuisineTypes = [...cuisineTypes, ...validated]
  }

  // The $30 platform minimum only applies to hourly (in-home cooking) pricing —
  // a per-item price like "$15 per dozen cookies" is a different pricing
  // model entirely and shouldn't be floored to an hourly-rate minimum.
  const isHourly = body.price_unit === 'hourly'
  const priceMin = isHourly ? Math.max(Number(body.price_min) || 0, 30) : Number(body.price_min) || 0
  const priceMax = isHourly ? Math.max(Number(body.price_max) || 0, 30) : Number(body.price_max) || 0

  // Insert cook application (status = 'pending' until verified by Agent 1 in Phase 2)
  const { data: cook, error } = await supabase
    .from('cooks')
    .insert({
      name: body.name,
      email: user.email,
      user_id: user.id,
      phone: body.phone,
      whatsapp: body.whatsapp,
      bio: body.bio,
      tagline: body.tagline,
      video_url: body.video_url,
      photo_url: body.photo_url ?? null,
      cuisine_types: cuisineTypes,
      dietary_specialties: body.dietary_specialties,
      occasion_types: body.occasion_types,
      languages: body.languages,
      price_min: priceMin,
      price_max: priceMax,
      price_unit: body.price_unit,
      min_hours: body.min_hours ?? null,
      state: body.state ?? null,
      service_areas: body.service_areas,
      group_size_min: 2,
      group_size_max: Math.min(body.group_size_max || 14, 14),
      signature_dishes: body.signature_dishes,
      years_experience: body.years_experience,
      available_recurring: body.available_recurring,
      recurring_options: body.recurring_options,
      job_categories: body.job_categories || [],
      does_cleanup: body.does_cleanup || false,
      grocery_pickup: body.grocery_pickup || false,
      grocery_pickup_charge: body.grocery_pickup_charge ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create placeholder verification and score records
  await supabase.from('cook_verifications').insert({ cook_id: cook.id })
  await supabase.from('cook_scores').insert({ cook_id: cook.id })

  // Run Agent 1 — awaited so errors surface in the terminal
  await verifyCook({ cook_id: cook.id, name: cook.name, email: cook.email })
    .catch(err => console.error('[Agent 1] Unhandled error:', err))

  return NextResponse.json({ success: true, cook_id: cook.id })
}
