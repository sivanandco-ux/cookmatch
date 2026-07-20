import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Please sign in with Google first.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const name = String(body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  }
  const city = String(body.city || '').trim()
  if (!city) {
    return NextResponse.json({ error: 'Please enter the city you\'d serve.' }, { status: 400 })
  }
  const state = String(body.state || '').trim()
  if (!state) {
    return NextResponse.json({ error: 'Please select your state.' }, { status: 400 })
  }
  const cookingInterest = String(body.cooking_interest || '').trim()
  if (!cookingInterest) {
    return NextResponse.json({ error: 'Please tell us what kind of cooking you do.' }, { status: 400 })
  }

  const service = getServiceSupabase()
  // Upsert on email — joining again (e.g. a second visit) just updates the
  // details instead of erroring on the unique constraint.
  const { error } = await service
    .from('cook_waitlist')
    .upsert({ user_id: user.id, email: user.email, name, city, state, cooking_interest: cookingInterest }, { onConflict: 'email' })

  if (error) {
    console.error('[Waitlist] DB error:', error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
