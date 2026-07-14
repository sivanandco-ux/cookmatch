import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyCook } from '@/lib/agents/cookVerificationAgent'

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

  // Each specialty tag is already validated client-side as it's added (see
  // /api/validate-specialty), so there's nothing left to reject here.
  const cuisineTypes: string[] = body.cuisine_types || []

  // Hourly rate only applies to cooks who cook at the client's location — a
  // cook who only cooks from their own setup (or "Other") has price_min/max
  // of 0 (no hourly pricing collected), which should stay 0, not get floored
  // up to the $30 platform minimum.
  const priceMin = Number(body.price_min) > 0 ? Math.max(Number(body.price_min), 30) : 0
  const priceMax = Number(body.price_max) > 0 ? Math.max(Number(body.price_max), 30) : 0

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
      cooking_arrangement: body.cooking_arrangement || [],
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
