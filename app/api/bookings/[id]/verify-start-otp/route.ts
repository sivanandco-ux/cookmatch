import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'
import { hashOtp, isOtpExpired, isOtpLocked } from '@/lib/otp'

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
  const { cook_id, code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Enter the code the client gave you.' }, { status: 400 })
  }

  if (!(await verifyCookOwnership(cook_id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, cook_id, status, start_otp_hash, start_otp_expires_at, start_otp_attempts')
    .eq('id', id)
    .eq('cook_id', cook_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'This booking is not ready to start.' }, { status: 400 })
  }
  if (!booking.start_otp_hash) {
    return NextResponse.json({ error: 'Request a code first.' }, { status: 400 })
  }
  if (isOtpLocked(booking.start_otp_attempts)) {
    return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 429 })
  }
  if (isOtpExpired(booking.start_otp_expires_at)) {
    return NextResponse.json({ error: 'This code has expired. Request a new one.' }, { status: 400 })
  }

  if (hashOtp(code.trim()) !== booking.start_otp_hash) {
    await supabase
      .from('bookings')
      .update({ start_otp_attempts: booking.start_otp_attempts + 1 })
      .eq('id', id)
    const remaining = 5 - (booking.start_otp_attempts + 1)
    return NextResponse.json({ error: remaining > 0 ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` : 'Too many incorrect attempts. Request a new code.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      start_otp_hash: null,
      start_otp_expires_at: null,
      start_otp_attempts: 0,
    })
    .eq('id', id)

  if (error) {
    console.error('[verify-start-otp] Failed to mark booking in_progress:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
