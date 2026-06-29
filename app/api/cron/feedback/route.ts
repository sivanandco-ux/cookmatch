import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendFeedbackRequest } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const today = new Date().toISOString().split('T')[0]

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, client_name, client_email, cooks(name)')
    .eq('preferred_date', today)
    .eq('feedback_requested', false)

  if (error) {
    console.error('[Cron] Bookings query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    console.log(`[Cron] No sessions today (${today})`)
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const booking of bookings) {
    const cooks = booking.cooks as unknown as { name: string } | null
    const cookName = cooks?.name ?? 'your cook'
    try {
      await sendFeedbackRequest({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        cookName,
        bookingId: booking.id,
      })
      await supabase
        .from('bookings')
        .update({ feedback_requested: true })
        .eq('id', booking.id)
      sent++
    } catch (err) {
      console.error(`[Cron] Feedback email failed for booking ${booking.id}:`, err)
    }
  }

  console.log(`[Cron] Sent ${sent} feedback emails for ${today}`)
  return NextResponse.json({ sent })
}
