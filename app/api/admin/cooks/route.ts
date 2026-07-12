import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { scoreProfile } from '@/lib/agents/profileScoringAgent'
import { sendWelcomeEmail, sendCheckinEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cookmatch-flame.vercel.app'

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

  // Delete related records in order
  await supabase.from('job_interests').delete().in('cook_id', ids)
  await supabase.from('cook_availability').delete().in('cook_id', ids)
  await supabase.from('cook_ratings').delete().in('cook_id', ids)
  await supabase.from('cook_scores').delete().in('cook_id', ids)
  await supabase.from('cook_training').delete().in('cook_id', ids)
  await supabase.from('cook_verifications').delete().in('cook_id', ids)
  await supabase.from('bookings').delete().in('cook_id', ids)
  const { error } = await supabase.from('cooks').delete().in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'No cook ID provided' }, { status: 400 })

  const supabase = getSupabase()

  const { data: cook, error } = await supabase
    .from('cooks')
    .update({ status: 'active' })
    .eq('id', id)
    .select('id, name, email')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  scoreProfile(cook.id).catch(err => console.error('[Admin activate] scoreProfile failed:', err))
  await sendWelcomeEmail({ cookName: cook.name, cookEmail: cook.email, cookId: cook.id })
    .catch(err => console.error('[Admin activate] Welcome email failed:', err))
  await sendCheckinEmail({
    cookName: cook.name,
    cookEmail: cook.email,
    availabilityUrl: `${SITE_URL}/availability/${cook.id}`,
  }).catch(err => console.error('[Admin activate] Check-in email failed:', err))

  return NextResponse.json({ success: true })
}
