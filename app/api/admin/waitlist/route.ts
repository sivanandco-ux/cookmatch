import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function authorized(request: Request) {
  return request.headers.get('x-admin-key') === process.env.ADMIN_SECRET
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })

  const supabase = getSupabase()
  const { error } = await supabase.from('cook_waitlist').delete().in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
