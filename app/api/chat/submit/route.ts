import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNewJobNotification } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const { type, data, language } = await request.json()
    const supabase = getSupabase()

    if (type === 'cook') {
      const bio = String(data.intro || '')
      const tagline = bio.split(/[.!?]/)[0].trim().substring(0, 120) || `Home Cook in ${data.city}`

      const { data: cook, error } = await supabase
        .from('cooks')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.phone,
          bio,
          tagline,
          video_url: null,
          photo_url: null,
          cuisine_types: data.cuisine_types || [],
          dietary_specialties: data.dietary_specialties || [],
          occasion_types: ['Daily Meals / Tiffin', 'Weekend Family Cooking', 'Festival / Occasion', 'Dinner Party'],
          languages: [language || 'English'],
          price_min: Math.max(Number(data.hourly_rate) || 0, 30),
          price_max: Math.max(Number(data.hourly_rate) || 0, 30),
          price_unit: 'hourly',
          min_hours: null,
          service_areas: [data.city],
          group_size_min: 2,
          group_size_max: 14,
          signature_dishes: '',
          years_experience: Number(data.years_experience),
          available_recurring: false,
          recurring_options: [],
          job_categories: ['family_cooking', 'small_event', 'medium_event'],
          does_cleanup: true,
          grocery_pickup: false,
          grocery_pickup_charge: null,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        console.error('[Submit] Cook insert failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await Promise.all([
        supabase.from('cook_verifications').insert({ cook_id: cook.id }),
        supabase.from('cook_scores').insert({ cook_id: cook.id }),
      ])

      return NextResponse.json({ success: true })
    }

    if (type === 'client') {
      const numPeople = Number(data.num_people)
      const jobCategory =
        numPeople <= 5 ? 'family_cooking' : numPeople <= 10 ? 'small_event' : 'medium_event'

      const { data: job, error } = await supabase
        .from('job_posts')
        .insert({
          client_name: data.client_name,
          client_email: data.client_email,
          client_phone: data.client_phone,
          job_category: jobCategory,
          occasion: data.occasion,
          specific_dishes: null,
          num_dishes: Number(data.num_dishes),
          requested_date: data.requested_date,
          requested_time: null,
          expected_duration_hours: Number(data.expected_duration_hours) || 3,
          num_people: numPeople,
          dietary_restrictions: data.dietary_restrictions || [],
          grocery_situation: data.grocery_situation,
          cleanup_needed: Boolean(data.cleanup_needed),
          kitchen_access_time: null,
          city: data.city,
          parking_available: false,
          language_preferred: null,
          recurring: false,
          text_description: data.text_description || '',
          voice_memo_url: null,
          additional_notes: null,
          status: 'open',
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Submit] Job insert failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Notify all active cooks
      const { data: allCooks } = await supabase
        .from('cooks')
        .select('id, name, email')
        .eq('status', 'active')

      for (const cook of allCooks || []) {
        sendNewJobNotification({
          cookName: cook.name,
          cookEmail: cook.email,
          cookId: cook.id,
          jobId: job.id,
          jobCategory,
          occasion: data.occasion,
          city: data.city,
          numPeople,
          needsGrocery: data.grocery_situation === 'need_grocery_pickup',
          needsCleanup: Boolean(data.cleanup_needed),
        }).catch(err => console.error(`[Submit] Cook notification failed:`, err))
      }

      // Find cooks matching the job for the client to contact directly
      let matchQuery = supabase
        .from('cooks')
        .select('id, name, phone, whatsapp, cuisine_types, dietary_specialties')
        .eq('status', 'active')
        .contains('service_areas', [data.city])
        .contains('job_categories', [jobCategory])

      for (const diet of (data.dietary_restrictions as string[] || [])) {
        matchQuery = matchQuery.contains('dietary_specialties', [diet])
      }

      const { data: matchingCooks } = await matchQuery.limit(5)

      return NextResponse.json({ success: true, matchingCooks: matchingCooks || [] })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    console.error('[Submit] Error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
