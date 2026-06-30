import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendSessionReminder } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Returns YYYY-MM-DD n days from now
function offsetDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Current hour in UTC (0-23)
function currentHour() {
  return new Date().getUTCHours()
}

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const tomorrow = offsetDate(1)
  const today = offsetDate(0)
  const now = new Date()
  let sent24 = 0
  let sent2 = 0

  // ── 24-hour reminders ──────────────────────────────────────────
  // Run between 9-10am UTC so clients and cooks get morning notice
  if (currentHour() === 9) {
    const { data: sessions } = await supabase
      .from('bookings')
      .select('id, client_name, client_email, preferred_date, preferred_time, cooks(name, email)')
      .eq('status', 'confirmed')
      .eq('preferred_date', tomorrow)
      .eq('reminder_24hr_sent', false)

    for (const session of sessions || []) {
      const cook = (session.cooks as unknown) as { name: string; email: string } | null
      if (!cook || !session.client_email) continue
      await sendSessionReminder({
        clientName: session.client_name,
        clientEmail: session.client_email,
        cookName: cook.name,
        cookEmail: cook.email,
        date: session.preferred_date,
        time: session.preferred_time ?? null,
        type: '24hr',
      })
      await supabase.from('bookings').update({ reminder_24hr_sent: true }).eq('id', session.id)
      sent24++
    }
  }

  // ── 2-hour reminders ──────────────────────────────────────────
  // Sessions today where preferred_time is set and within 2-3 hours from now
  {
    const { data: todaySessions } = await supabase
      .from('bookings')
      .select('id, client_name, client_email, preferred_date, preferred_time, cooks(name, email)')
      .eq('status', 'confirmed')
      .eq('preferred_date', today)
      .eq('reminder_2hr_sent', false)
      .not('preferred_time', 'is', null)

    for (const session of todaySessions || []) {
      if (!session.preferred_time) continue
      const [hh, mm] = session.preferred_time.split(':').map(Number)
      const sessionTime = new Date()
      sessionTime.setUTCHours(hh, mm, 0, 0)
      const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (hoursUntil < 1 || hoursUntil > 3) continue

      const cook = (session.cooks as unknown) as { name: string; email: string } | null
      if (!cook || !session.client_email) continue
      await sendSessionReminder({
        clientName: session.client_name,
        clientEmail: session.client_email,
        cookName: cook.name,
        cookEmail: cook.email,
        date: session.preferred_date,
        time: session.preferred_time,
        type: '2hr',
      })
      await supabase.from('bookings').update({ reminder_2hr_sent: true }).eq('id', session.id)
      sent2++
    }
  }

  return NextResponse.json({ sent_24hr: sent24, sent_2hr: sent2 })
}
