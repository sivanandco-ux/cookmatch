import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Growing pool of languages cooks have actually entered — same pattern as
// /api/specialties, replacing a fixed hardcoded list so suggestions always
// reflect real cooks on the platform rather than a list someone guessed at
// up front.
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data: cooks } = await supabase.from('cooks').select('languages').in('status', ['active', 'pending'])

    const languages = new Set<string>()
    for (const cook of cooks || []) {
      for (const lang of (cook.languages as string[] | null) || []) {
        if (lang?.trim()) languages.add(lang.trim())
      }
    }

    return NextResponse.json({ items: [...languages].sort() })
  } catch (err) {
    console.error('[Languages] Error:', err)
    return NextResponse.json({ items: [] })
  }
}
