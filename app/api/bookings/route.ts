import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendBriefReceivedToCook, sendConversationLinkToClient } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = getSupabase()

  const { data: cook } = await supabase
    .from('cooks')
    .select('id, name, email')
    .eq('id', body.cook_id)
    .single()

  if (!cook) {
    return NextResponse.json({ error: 'Cook not found' }, { status: 404 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      cook_id: body.cook_id,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
      session_type: body.recurring ? 'recurring' : 'one_time',
      preferred_date: body.preferred_date,
      preferred_time: body.preferred_time || null,
      group_size: String(body.num_people),
      occasion_type: body.occasion,
      cuisine_needs: '',
      dietary_needs: (body.dietary_restrictions || []).join(', '),
      notes: body.additional_notes || '',
      // Session brief fields
      job_category: body.job_category,
      request_type: body.request_type || 'session',
      specific_dishes: body.specific_dishes || null,
      num_dishes: body.num_dishes,
      expected_duration_hours: body.expected_duration_hours,
      num_people: body.num_people,
      grocery_situation: body.grocery_situation,
      cleanup_needed: body.cleanup_needed ?? false,
      kitchen_access_time: body.kitchen_access_time || null,
      city: body.city,
      parking_available: body.parking_available ?? false,
      language_preferred: body.language_preferred || null,
      text_description: body.text_description || null,
      voice_memo_url: body.voice_memo_url || null,
      discount_code_sent: false,
      cook_notified: true,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // A conversation is created the moment this brief is sent, so either side
  // can message before the cook has even responded — never a cold-message
  // path, always tied to this specific booking.
  const { data: conversation } = await supabase
    .from('conversations')
    .insert({
      intent_type: 'booking',
      booking_id: booking.id,
      cook_id: body.cook_id,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
    })
    .select('id')
    .single()

  await sendBriefReceivedToCook({
    cookName: cook.name,
    cookEmail: cook.email,
    cookId: cook.id,
    clientName: body.client_name,
    jobCategory: body.job_category,
    occasion: body.occasion,
    date: body.preferred_date,
    numPeople: body.num_people,
  }).catch(err => console.error('[Email] Brief notification failed:', err))

  if (conversation) {
    sendConversationLinkToClient({
      clientName: body.client_name,
      clientEmail: body.client_email,
      cookName: cook.name,
      conversationId: conversation.id,
    }).catch(err => console.error('[Email] Conversation link (client) failed:', err))
  }

  return NextResponse.json({ pending: true, booking_id: booking.id })
}
