import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

  const { data: expired, error } = await supabase
    .from('job_posts')
    .update({ status: 'expired', expired_at: new Date().toISOString() })
    .eq('status', 'open')
    .lt('requested_date', today)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  console.log(`[Cron] Expired ${expired?.length ?? 0} job posts`)
  return NextResponse.json({ expired: expired?.length ?? 0 })
}
