import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { confirmJobBooking } from '@/lib/confirmJobBooking'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { interest_id, cook_id } = await request.json()

  if (!(await verifyCookOwnership(cook_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  // Verify the cook
  const { data: cook } = await supabase
    .from('cooks')
    .select('id, status')
    .eq('id', cook_id)
    .single()

  if (!cook || cook.status !== 'active') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data: interest, error } = await supabase
    .from('job_interests')
    .select('id, cook_id, cook_confirmed, client_confirmed, status')
    .eq('id', interest_id)
    .eq('job_post_id', id)
    .eq('cook_id', cook_id)
    .eq('status', 'pending')
    .single()

  if (!interest || error) return NextResponse.json({ error: 'Interest not found or no longer active' }, { status: 404 })
  if (interest.cook_confirmed) return NextResponse.json({ already: true })

  await supabase
    .from('job_interests')
    .update({ cook_confirmed: true })
    .eq('id', interest_id)

  if (interest.client_confirmed) {
    await confirmJobBooking(id, interest_id)
    return NextResponse.json({ success: true, bothConfirmed: true })
  }

  return NextResponse.json({ success: true, bothConfirmed: false })
}
