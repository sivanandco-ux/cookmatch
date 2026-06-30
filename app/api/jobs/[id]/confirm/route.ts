import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendSessionConfirmedToBoth } from '@/lib/email'

const DISCOUNT_CODE = 'COOKMATCH20'

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
  const { interest_id } = await request.json()
  const supabase = getSupabase()

  const { data: interest } = await supabase
    .from('job_interests')
    .select('*, cooks(name, email, phone, whatsapp)')
    .eq('id', interest_id)
    .eq('job_post_id', id)
    .eq('status', 'pending')
    .single()

  if (!interest) return NextResponse.json({ error: 'Interest not found' }, { status: 404 })

  const { data: job } = await supabase
    .from('job_posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'open')
    .single()

  if (!job) return NextResponse.json({ error: 'Job no longer open' }, { status: 409 })

  // Mark job as taken
  await supabase
    .from('job_posts')
    .update({ status: 'taken', assigned_cook_id: interest.cook_id, confirmed_at: new Date().toISOString() })
    .eq('id', id)

  // Accept this interest, reject all others
  await supabase.from('job_interests').update({ status: 'accepted' }).eq('id', interest_id)
  await supabase.from('job_interests').update({ status: 'rejected' }).eq('job_post_id', id).neq('id', interest_id)

  const cook = interest.cooks as { name: string; email: string; phone: string; whatsapp: string | null } | null
  if (cook) {
    await sendSessionConfirmedToBoth({
      clientName: job.client_name,
      clientEmail: job.client_email,
      cookName: cook.name,
      cookEmail: cook.email,
      cookPhone: cook.phone,
      cookWhatsapp: cook.whatsapp,
      clientPhone: job.client_phone,
      date: job.requested_date,
      discountCode: DISCOUNT_CODE,
    }).catch(err => console.error('[Email] Job confirm failed:', err))
  }

  return NextResponse.json({ success: true })
}
