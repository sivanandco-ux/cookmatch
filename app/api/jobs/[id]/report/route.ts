import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendJobReport } from '@/lib/email'
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
  const { id: jobId } = await params
  const body = await request.json()
  const { cook_id, reason, details } = body

  if (!cook_id || !reason) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (!(await verifyCookOwnership(cook_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data: cook } = await supabase
    .from('cooks')
    .select('name, status')
    .eq('id', cook_id)
    .single()

  if (!cook || cook.status !== 'active') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
  }

  await sendJobReport({
    jobId,
    cookId: cook_id,
    cookName: cook.name,
    reason,
    details: details || '',
  })

  return NextResponse.json({ success: true })
}
