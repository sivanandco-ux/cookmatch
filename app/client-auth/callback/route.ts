import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Only allow redirecting back to a same-origin relative path — never a
// protocol-relative or absolute URL, to avoid an open-redirect vector.
function safeRedirectPath(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  // Google redirects back with `error` (e.g. access_denied) instead of a
  // code when the user cancels the consent screen.
  if (searchParams.get('error')) {
    return NextResponse.redirect(`${origin}/client-login?error=oauth_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/client-login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/client-login?error=missing_code`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.redirect(`${origin}/client-login?error=no_user`)
  }

  const service = getServiceSupabase()

  // Unlike cooks (which pre-exist from an application and get *claimed* on
  // first login), a client has no prior row to match — every booking/
  // conversation just stores client_email inline. So this is a plain
  // find-or-create keyed on the authenticated Google account, not a claim.
  const { data: existing } = await service
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const name = (user.user_metadata?.full_name || user.user_metadata?.name || null) as string | null
    await service
      .from('clients')
      .upsert(
        { user_id: user.id, email: user.email, name },
        { onConflict: 'email', ignoreDuplicates: false }
      )
  }

  return NextResponse.redirect(`${origin}${redirectTo || '/my-bookings'}`)
}
