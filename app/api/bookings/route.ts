import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendCookNotification, sendClientConfirmation } from '@/lib/email'

const DISCOUNT_CODE = 'COOKMATCH20'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()

  // Save booking
  const { error } = await supabase
    .from('bookings')
    .insert({
      cook_id: body.cook_id,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
      session_type: body.session_type,
      recurring_frequency: body.recurring_frequency,
      preferred_date: body.preferred_date,
      group_size: body.group_size,
      cuisine_needs: body.cuisine_needs || '',
      dietary_needs: body.dietary_needs || '',
      occasion_type: body.occasion_type,
      notes: body.notes || '',
      discount_code_sent: true,
      cook_notified: true,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch cook contact info
  const { data: cook } = await supabase
    .from('cooks')
    .select('phone, email, whatsapp, name')
    .eq('id', body.cook_id)
    .single()

  if (!cook) {
    return NextResponse.json({ error: 'Cook not found' }, { status: 404 })
  }

  // Send emails — fire both in parallel, don't block the response on failures
  await Promise.all([
    sendCookNotification({
      cookName: cook.name,
      cookEmail: cook.email,
      clientName: body.client_name,
      clientPhone: body.client_phone,
      date: body.preferred_date,
      occasion: body.occasion_type,
      groupSize: body.group_size,
      notes: body.notes || '',
      discountCode: DISCOUNT_CODE,
    }),
    sendClientConfirmation({
      clientName: body.client_name,
      clientEmail: body.client_email,
      cookName: cook.name,
      cookPhone: cook.phone,
      cookEmail: cook.email,
      cookWhatsapp: cook.whatsapp,
      discountCode: DISCOUNT_CODE,
    }),
  ])

  // Return contact info + discount code to client
  return NextResponse.json({
    contact: {
      phone: cook.phone,
      email: cook.email,
      whatsapp: cook.whatsapp,
      discountCode: DISCOUNT_CODE,
    },
  })
}
