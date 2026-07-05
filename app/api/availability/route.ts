import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const { cook_id, dates } = await request.json()

  if (!(await verifyCookOwnership(cook_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const today = new Date().toISOString().split('T')[0]

  // Clear future availability and replace with new selection
  await supabase
    .from('cook_availability')
    .delete()
    .eq('cook_id', cook_id)
    .gte('available_date', today)

  if (dates && dates.length > 0) {
    await supabase
      .from('cook_availability')
      .insert(dates.map((d: string) => ({ cook_id, available_date: d })))
  }

  // Reset inactivity clock
  await supabase
    .from('cooks')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', cook_id)

  return NextResponse.json({ success: true })
}
