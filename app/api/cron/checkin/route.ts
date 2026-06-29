import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCheckinEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

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

  const { data: cooks, error } = await supabase
    .from('cooks')
    .select('id, name, email')
    .in('status', ['active', 'watch', 'training'])

  if (error) {
    console.error('[Cron/checkin] Query failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!cooks || cooks.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const cook of cooks) {
    await sendCheckinEmail({
      cookName: cook.name,
      cookEmail: cook.email,
      availabilityUrl: `${SITE_URL}/availability/${cook.id}`,
    })
    sent++
  }

  console.log(`[Cron/checkin] Sent ${sent} check-in emails`)
  return NextResponse.json({ sent })
}
