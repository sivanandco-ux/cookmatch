import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'
import { generateOtp, hashOtp, otpExpiresAt, sendStartJobOtp } from '@/lib/otp'

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
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, cook_id, status, client_phone')
    .eq('id', id)
    .eq('cook_id', cook_id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'This booking is not ready to start.' }, { status: 400 })
  }

  const code = generateOtp()

  const { error } = await supabase
    .from('bookings')
    .update({
      start_otp_hash: hashOtp(code),
      start_otp_expires_at: otpExpiresAt(),
      start_otp_attempts: 0,
    })
    .eq('id', id)

  if (error) {
    console.error('[request-start-otp] Failed to store OTP:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  try {
    await sendStartJobOtp(booking.client_phone, code)
  } catch (err) {
    console.error('[request-start-otp] Failed to send SMS:', err)
    return NextResponse.json({ error: 'Could not send the code. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
