import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Growing pool of specific items/specialties cooks have actually entered —
// replaces a fixed hardcoded suggestion list. Starts empty on a fresh
// platform and grows as cooks sign up, so suggestions always reflect real
// things someone can actually make, never a category invented up front.
//
// ?type=item scopes the pool to only cooks who offer 'item' (specific
// products, not full sessions) — used for client-facing "what item do you
// want" suggestions, where a session-only cook's specialty tags (meal-
// cooking skills, not sellable products) wouldn't make sense to suggest.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const supabase = getSupabase()
    let query = supabase.from('cooks').select('cuisine_types').in('status', ['active', 'pending'])
    if (type === 'item') query = query.contains('offering_types', ['item'])

    const { data: cooks } = await query

    const items = new Set<string>()
    for (const cook of cooks || []) {
      for (const item of (cook.cuisine_types as string[] | null) || []) {
        if (item?.trim()) items.add(item.trim())
      }
    }

    return NextResponse.json({ items: [...items].sort() })
  } catch (err) {
    console.error('[Specialties] Error:', err)
    return NextResponse.json({ items: [] })
  }
}
