import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendNewJobNotification } from '@/lib/email'
import { normalizePhone, normalizeUsPhone } from '@/lib/phone'
import { makeTagline } from '@/lib/tagline'
import { isCookCapReached } from '@/lib/cookCap'

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
      const sessionSupabase = await createServerClient()
      const { data: { user } } = await sessionSupabase.auth.getUser()
      if (!user || !user.email) {
        return NextResponse.json({ error: 'Please verify your email before submitting.' }, { status: 401 })
      }

      const { data: existingCook } = await supabase.from('cooks').select('id').eq('user_id', user.id).maybeSingle()
      if (existingCook) {
        return NextResponse.json({ error: 'You already have a cook profile.' }, { status: 400 })
      }

      if (await isCookCapReached()) {
        return NextResponse.json({ error: "We're at capacity right now. Please apply at /apply to join the waitlist." }, { status: 400 })
      }

      const cookPhone = normalizePhone(String(data.phone || ''))
      if (!cookPhone) {
        return NextResponse.json({ error: 'Please provide a valid US or India phone number.' }, { status: 400 })
      }

      const bio = String(data.intro || '')
      const tagline = makeTagline(bio, 120, `Home Cook in ${data.city}`)

      // Hourly rate only applies to cooks who cook at the client's location —
      // a cook who only cooks from their own setup (or "Other") has
      // price_min/max of 0, matching the /apply page's behavior.
      const cooksAtClientLocation = (data.cooking_arrangement || []).includes("Cook at client's location")
      const rate = cooksAtClientLocation ? Math.max(Number(data.hourly_rate) || 0, 30) : 0

      const { data: cook, error } = await supabase
        .from('cooks')
        .insert({
          name: data.name,
          email: user.email,
          user_id: user.id,
          phone: cookPhone,
          whatsapp: cookPhone,
          bio,
          tagline,
          video_url: null,
          photo_url: null,
          cuisine_types: data.cuisine_types || [],
          offering_types: data.offering_types && data.offering_types.length > 0 ? data.offering_types : ['session'],
          dietary_specialties: data.dietary_specialties || [],
          occasion_types: ['Daily Meals / Tiffin', 'Festival / Occasion'],
          cooking_arrangement: data.cooking_arrangement || [],
          languages: [language || 'English'],
          price_min: rate,
          price_max: rate,
          price_unit: 'hourly',
          min_hours: null,
          state: data.state || null,
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
      const clientPhone = normalizeUsPhone(String(data.client_phone || ''))
      if (!clientPhone) {
        return NextResponse.json({ error: 'Please provide a valid 10-digit US phone number.' }, { status: 400 })
      }

      const isItem = data.request_type === 'item'

      if (isItem && !String(data.specific_dishes || '').trim()) {
        return NextResponse.json({ error: 'Please describe the item you need.' }, { status: 400 })
      }

      // Item orders don't have a party size or session date — sizing/date
      // fields don't apply to buying a jar of pickles, so placeholders are
      // stored instead of asking the client something irrelevant.
      const numPeople = isItem ? 2 : Number(data.num_people)
      const numDishes = isItem ? 0 : Number(data.num_dishes)
      if (!isItem && (!Number.isFinite(numPeople) || numPeople < 2 || numPeople > 14)) {
        return NextResponse.json({ error: 'Number of people must be between 2 and 14.' }, { status: 400 })
      }
      if (!isItem && (!Number.isFinite(numDishes) || numDishes < 1)) {
        return NextResponse.json({ error: 'Number of dishes is missing or invalid.' }, { status: 400 })
      }
      if (!isItem && (!data.requested_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.requested_date)))) {
        return NextResponse.json({ error: 'Requested date is missing or invalid.' }, { status: 400 })
      }
      const requestedDate = isItem ? new Date().toISOString().split('T')[0] : data.requested_date

      const jobCategory =
        isItem ? 'family_cooking' : numPeople <= 5 ? 'family_cooking' : numPeople <= 10 ? 'small_event' : 'medium_event'

      const { data: job, error } = await supabase
        .from('job_posts')
        .insert({
          client_name: data.client_name,
          client_email: data.client_email,
          client_phone: clientPhone,
          job_category: jobCategory,
          request_type: isItem ? 'item' : 'session',
          occasion: data.occasion,
          specific_dishes: isItem ? String(data.specific_dishes).trim() : null,
          num_dishes: numDishes,
          requested_date: requestedDate,
          requested_time: null,
          expected_duration_hours: Number(data.expected_duration_hours) || 3,
          num_people: numPeople,
          dietary_restrictions: data.dietary_restrictions || [],
          grocery_situation: isItem ? 'client_has_everything' : data.grocery_situation,
          cleanup_needed: isItem ? false : Boolean(data.cleanup_needed),
          kitchen_access_time: null,
          city: data.city,
          state: data.state || null,
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

      // Find cooks matching the request for the client to contact directly.
      // Item orders match on offering_types (does this cook sell items at
      // all?) rather than job_categories, which is a session-sizing concept
      // that doesn't apply to buying a jar of pickles.
      let matchQuery = supabase
        .from('cooks')
        .select('id, name, phone, whatsapp, cuisine_types, dietary_specialties')
        .eq('status', 'active')
        .contains('service_areas', [data.city])

      matchQuery = isItem
        ? matchQuery.contains('offering_types', ['item'])
        : matchQuery.contains('job_categories', [jobCategory])

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
