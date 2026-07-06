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
  const intent = searchParams.get('intent') // 'signup' when verifying email to create a new cook profile

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  const service = getServiceSupabase()

  // Resolve which cook this session belongs to — either already linked, or
  // first login, in which case we claim the cook profile matching this email.
  let cookId: string | null = null

  const { data: existingByUserId } = await service
    .from('cooks')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingByUserId) {
    cookId = existingByUserId.id
  } else {
    const { data: cookByEmail } = await service
      .from('cooks')
      .select('id, user_id')
      .ilike('email', user.email)
      .maybeSingle()

    if (!cookByEmail) {
      // No existing profile. For a plain login this is an error — but if this
      // link was requested to verify an email ahead of a brand-new signup,
      // the session is now established and there's simply no profile yet.
      if (intent === 'signup') {
        return NextResponse.redirect(`${origin}${redirectTo || '/apply'}`)
      }
      return NextResponse.redirect(`${origin}/login?error=no_application`)
    }
    if (cookByEmail.user_id && cookByEmail.user_id !== user.id) {
      return NextResponse.redirect(`${origin}/login?error=email_mismatch`)
    }
    if (!cookByEmail.user_id) {
      await service.from('cooks').update({ user_id: user.id }).eq('id', cookByEmail.id)
    }
    cookId = cookByEmail.id
  }

  return NextResponse.redirect(`${origin}${redirectTo || `/dashboard/${cookId}`}`)
}
