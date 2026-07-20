import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FROM = 'CookMatch <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function to(email: string) {
  return process.env.RESEND_TEST_EMAIL || email
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

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, cooks(name)')
    .eq('id', id)
    .eq('cook_id', cook_id)
    .eq('status', 'pending')
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found or already responded to' }, { status: 404 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_by: 'cook' })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cookName = (booking.cooks as { name: string } | null)?.name ?? 'The cook'

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to: to(booking.client_email),
    subject: `Update on your session brief`,
    html: `
      <p>Hi ${booking.client_name},</p>
      <p>Unfortunately, <strong>${cookName}</strong> is not available for your requested date.</p>
      <p>You can browse other cooks on CookMatch and submit a new brief.</p>
      <p style="margin-top:24px;">
        <a href="${SITE_URL}/cooks"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Browse Cooks
        </a>
      </p>
      <p>— CookMatch Team</p>
    `,
  }).catch(err => console.error('[Email] Decline notification failed:', err))

  return NextResponse.json({ success: true })
}
