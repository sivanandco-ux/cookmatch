import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const match = request.nextUrl.pathname.match(/^\/(dashboard|availability)\/([^/]+)/)
  if (match) {
    const cookId = match[2]
    const redirectTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)

    if (!user) {
      return NextResponse.redirect(new URL(`/login?error=not_authorized&redirectTo=${redirectTo}`, request.url))
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: cook } = await service.from('cooks').select('user_id').eq('id', cookId).maybeSingle()

    if (!cook || cook.user_id !== user.id) {
      return NextResponse.redirect(new URL(`/login?error=not_authorized&redirectTo=${redirectTo}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/availability/:path*'],
}
