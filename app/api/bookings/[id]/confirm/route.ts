import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendSessionConfirmedToBoth } from '@/lib/email'

const DISCOUNT_CODE = 'COOKMATCH20'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, cooks(name, email, phone, whatsapp)')
    .eq('id', id)
    .eq('status', 'cook_interested')
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found or not ready to confirm' }, { status: 404 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), discount_code_sent: true })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cook = booking.cooks as { name: string; email: string; phone: string; whatsapp: string | null } | null

  if (cook) {
    await sendSessionConfirmedToBoth({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      cookName: cook.name,
      cookEmail: cook.email,
      cookPhone: cook.phone,
      cookWhatsapp: cook.whatsapp,
      clientPhone: booking.client_phone,
      date: booking.preferred_date,
      discountCode: DISCOUNT_CODE,
    }).catch(err => console.error('[Email] Session confirmed failed:', err))
  }

  return NextResponse.json({ success: true })
}
