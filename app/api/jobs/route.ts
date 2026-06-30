import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendNewJobNotification } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('job_posts')
    .select('id, job_category, occasion, requested_date, requested_time, expected_duration_hours, num_people, dietary_restrictions, grocery_situation, cleanup_needed, city, recurring, status, created_at')
    .eq('status', 'open')
    .order('requested_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = getSupabase()

  if (!body.voice_memo_url && !body.text_description?.trim()) {
    return NextResponse.json(
      { error: 'Please provide a voice memo, a written description, or both.' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('job_posts')
    .insert({
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
      job_category: body.job_category,
      occasion: body.occasion,
      specific_dishes: body.specific_dishes || null,
      num_dishes: body.num_dishes,
      requested_date: body.preferred_date,
      requested_time: body.preferred_time || null,
      expected_duration_hours: body.expected_duration_hours,
      num_people: body.num_people,
      dietary_restrictions: body.dietary_restrictions || [],
      grocery_situation: body.grocery_situation,
      cleanup_needed: body.cleanup_needed ?? false,
      kitchen_access_time: body.kitchen_access_time || null,
      city: body.city,
      parking_available: body.parking_available ?? false,
      language_preferred: body.language_preferred || null,
      recurring: body.recurring ?? false,
      text_description: body.text_description || null,
      voice_memo_url: body.voice_memo_url || null,
      additional_notes: body.additional_notes || null,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify all active cooks in the background
  const { data: cooks } = await supabase
    .from('cooks')
    .select('id, name, email')
    .eq('status', 'active')

  for (const cook of cooks || []) {
    await sendNewJobNotification({
      cookName: cook.name,
      cookEmail: cook.email,
      cookId: cook.id,
      jobId: data.id,
      jobCategory: body.job_category,
      occasion: body.occasion,
      city: body.city,
      numPeople: body.num_people,
      needsGrocery: body.grocery_situation === 'need_grocery_pickup',
      needsCleanup: body.cleanup_needed ?? false,
    })
  }

  return NextResponse.json({ success: true, job_id: data.id })
}
