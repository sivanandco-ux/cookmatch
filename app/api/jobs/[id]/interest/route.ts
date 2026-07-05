import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendCookInterestedToClient, sendCookInterestNotification } from '@/lib/email'
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
  const { cook_id } = await request.json()

  if (!(await verifyCookOwnership(cook_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const [{ data: job }, { data: cook }] = await Promise.all([
    supabase.from('job_posts').select('*').eq('id', id).eq('status', 'open').single(),
    supabase.from('cooks').select('id, name, email, phone, whatsapp, status').eq('id', cook_id).single(),
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

  // Email the client with cook's contact details
  sendCookInterestedToClient({
    clientName: job.client_name,
    clientEmail: job.client_email,
    cookName: cook.name,
    cookPhone: cook.phone,
    cookEmail: cook.email,
    cookWhatsapp: cook.whatsapp ?? null,
    jobPostId: id,
    interestId: interest.id,
    jobCategory: job.job_category,
    occasion: job.occasion,
    date: job.requested_date,
  }).catch(err => console.error('[Email] Cook interested (client) failed:', err))

  // Email the cook with client's contact details
  sendCookInterestNotification({
    cookName: cook.name,
    cookEmail: cook.email,
    cookId: cook.id,
    clientName: job.client_name,
    clientPhone: job.client_phone,
    clientEmail: job.client_email,
    jobId: id,
    jobCategory: job.job_category,
    occasion: job.occasion,
    date: job.requested_date,
    numPeople: job.num_people,
    city: job.city,
  }).catch(err => console.error('[Email] Cook interest notification failed:', err))

  return NextResponse.json({ success: true, interest_id: interest.id })
}
