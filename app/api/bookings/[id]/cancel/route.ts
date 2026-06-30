import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FROM = 'CookMatch <onboarding@resend.dev>'

function to(email: string) {
  return process.env.RESEND_TEST_EMAIL || email
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getSupabase()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, cooks(name, email)')
    .eq('id', id)
    .in('status', ['cook_interested', 'confirmed'])
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const now = new Date()
  const sessionDate = new Date(booking.preferred_date + 'T00:00:00')
  const hoursBeforeSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: now.toISOString(),
      cancelled_by: 'client',
    })
    .eq('id', id)

  // Log cancellation so cook can see client history before accepting future bookings
  if (booking.client_email) {
    supabase.from('client_cancellations').insert({
      client_email: booking.client_email,
      booking_id: id,
      session_date: booking.preferred_date,
      hours_before_session: Math.max(0, hoursBeforeSession),
    }).then(({ error: e }) => { if (e) console.error('[DB] Cancellation log failed:', e.message) })
  }

  const cook = booking.cooks as { name: string; email: string } | null
  if (cook) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: FROM,
      to: to(cook.email),
      subject: `Booking cancelled by client`,
      html: `
        <p>Hi ${cook.name},</p>
        <p>The client has cancelled their booking for <strong>${booking.preferred_date}</strong>.</p>
        <p>Your availability for that date has been freed up.</p>
        <p>— CookMatch Team</p>
      `,
    }).catch(err => console.error('[Email] Client cancel cook notify failed:', err))
  }

  return NextResponse.json({ success: true })
}
