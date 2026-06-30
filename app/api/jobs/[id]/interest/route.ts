import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCookInterestedToClient } from '@/lib/email'

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
  const { cook_id } = await request.json()
  const supabase = getSupabase()

  const [{ data: job }, { data: cook }] = await Promise.all([
    supabase.from('job_posts').select('*').eq('id', id).eq('status', 'open').single(),
    supabase.from('cooks').select('id, name, status').eq('id', cook_id).single(),
  ])

  if (!job) return NextResponse.json({ error: 'Job not found or no longer open' }, { status: 404 })
  if (!cook || cook.status !== 'active') return NextResponse.json({ error: 'Cook not found or not active' }, { status: 403 })

  const { data: interest, error } = await supabase
    .from('job_interests')
    .insert({ job_post_id: id, cook_id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Already expressed interest' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sendCookInterestedToClient({
    clientName: job.client_name,
    clientEmail: job.client_email,
    cookName: cook.name,
    jobPostId: id,
    interestId: interest.id,
    jobCategory: job.job_category,
    occasion: job.occasion,
    date: job.requested_date,
  }).catch(err => console.error('[Email] Cook interested notification failed:', err))

  return NextResponse.json({ success: true, interest_id: interest.id })
}
