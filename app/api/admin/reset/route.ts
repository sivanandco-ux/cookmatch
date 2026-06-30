import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const tables = [
    'cook_availability',
    'cook_ratings',
    'cook_scores',
    'cook_training',
    'cook_verifications',
    'bookings',
    'cooks',
  ]

  const results: Record<string, string> = {}
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    results[table] = error ? `error: ${error.message}` : 'cleared'
  }

  return NextResponse.json({ success: true, results })
}
