import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SEED_CITIES = ['Fremont', 'Newark', 'Union City', 'Milpitas']

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const [{ data: cooks }, { data: jobs }] = await Promise.all([
      supabase.from('cooks').select('service_areas'),
      supabase.from('job_posts').select('city'),
    ])

    const cities = new Set<string>(SEED_CITIES)
    for (const cook of cooks || []) {
      for (const area of (cook.service_areas as string[] | null) || []) {
        if (area?.trim()) cities.add(area.trim())
      }
    }
    for (const job of jobs || []) {
      if (job.city?.trim()) cities.add(job.city.trim())
    }

    return NextResponse.json({ cities: [...cities].sort() })
  } catch (err) {
    console.error('[Cities] Error:', err)
    return NextResponse.json({ cities: SEED_CITIES })
  }
}
