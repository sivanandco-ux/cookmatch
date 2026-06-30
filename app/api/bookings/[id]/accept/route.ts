import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCookAcceptedToClient } from '@/lib/email'

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
    .select('*, cooks(name)')
    .eq('id', id)
    .eq('status', 'pending')
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found or already responded to' }, { status: 404 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cook_interested', cook_interested_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cookName = (booking.cooks as { name: string } | null)?.name ?? 'Your cook'

  await sendCookAcceptedToClient({
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    cookName,
    bookingId: id,
    date: booking.preferred_date,
  }).catch(err => console.error('[Email] Cook accepted notification failed:', err))

  return NextResponse.json({ success: true })
}
