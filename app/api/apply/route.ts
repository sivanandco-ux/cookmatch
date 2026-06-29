import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { verifyCook } from '@/lib/agents/cookVerificationAgent'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  // Insert cook application (status = 'pending' until verified by Agent 1 in Phase 2)
  const { data: cook, error } = await supabase
    .from('cooks')
    .insert({
      name: body.name,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      bio: body.bio,
      tagline: body.tagline,
      video_url: body.video_url,
      cuisine_types: body.cuisine_types,
      dietary_specialties: body.dietary_specialties,
      occasion_types: body.occasion_types,
      languages: body.languages,
      price_min: body.price_min,
      price_max: body.price_max,
      price_unit: body.price_unit,
      service_areas: body.service_areas,
      group_size_min: body.group_size_min,
      group_size_max: body.group_size_max,
      signature_dishes: body.signature_dishes,
      years_experience: body.years_experience,
      available_recurring: body.available_recurring,
      recurring_options: body.recurring_options,
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
