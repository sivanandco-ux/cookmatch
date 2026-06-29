import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { analyzeFeedback } from '@/lib/agents/feedbackAnalysisAgent'
import { scoreProfile } from '@/lib/agents/profileScoringAgent'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const TRAINING_THRESHOLD = 3.6
const CONSECUTIVE_NEEDED = 3

export async function POST(request: Request) {
  const body = await request.json()
  const { booking_id, cook_id, taste, cleanliness, punctuality, respect, clean_appearance, notes } = body

  const supabase = getSupabase()

  // Guard: already rated?
  const { data: existing } = await supabase
    .from('cook_ratings')
    .select('id')
    .eq('booking_id', booking_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Feedback already submitted for this session.' }, { status: 409 })
  }

  // Save rating
  const { error: ratingErr } = await supabase
    .from('cook_ratings')
    .insert({ booking_id, cook_id, taste, cleanliness, punctuality, respect, clean_appearance, notes: notes || '' })

  if (ratingErr) {
    return NextResponse.json({ error: ratingErr.message }, { status: 500 })
  }

  // Recalculate averages across all sessions for this cook
  const { data: allRatings } = await supabase
    .from('cook_ratings')
    .select('taste, cleanliness, punctuality, respect, clean_appearance, overall_avg')
    .eq('cook_id', cook_id)
    .order('created_at', { ascending: true })

  if (!allRatings || allRatings.length === 0) {
    return NextResponse.json({ success: true })
  }

  const count = allRatings.length
  const sum = (field: keyof typeof allRatings[0]) =>
    allRatings.reduce((acc, r) => acc + (r[field] as number), 0)

  const newOverall = sum('overall_avg') / count

  await supabase
    .from('cook_scores')
    .update({
      overall_score: newOverall,
      taste_avg: sum('taste') / count,
      cleanliness_avg: sum('cleanliness') / count,
      punctuality_avg: sum('punctuality') / count,
      respect_avg: sum('respect') / count,
      clean_appearance_avg: sum('clean_appearance') / count,
      session_count: count,
    })
    .eq('cook_id', cook_id)

  // ── State machine ────────────────────────────────────────────────────────
  const { data: cook } = await supabase
    .from('cooks')
    .select('status, name, email')
    .eq('id', cook_id)
    .single()

  if (!cook) return NextResponse.json({ success: true })

  const lastRating = allRatings[allRatings.length - 1]
  const lastAvg = lastRating.overall_avg as number

  let movedToWatch = false

  if (cook.status === 'active' && newOverall < TRAINING_THRESHOLD) {
    // First bad signal — give a grace session, don't restrict yet
    await supabase.from('cooks').update({ status: 'watch' }).eq('id', cook_id)
    console.log(`[Ratings] ${cook.name} → watch (avg: ${newOverall.toFixed(2)})`)
    movedToWatch = true
  } else if (cook.status === 'watch') {
    if (lastAvg >= TRAINING_THRESHOLD) {
      // Grace session went well — back to active
      await supabase.from('cooks').update({ status: 'active' }).eq('id', cook_id)
      console.log(`[Ratings] ${cook.name} → active (grace session passed)`)
    } else {
      // Grace session also bad — move to training
      await supabase.from('cooks').update({ status: 'training' }).eq('id', cook_id)
      console.log(`[Ratings] ${cook.name} → training (grace session also poor)`)
    }
  } else if (cook.status === 'training') {
    const last = allRatings.slice(-CONSECUTIVE_NEEDED)
    const consecutiveGood = last.length === CONSECUTIVE_NEEDED &&
      last.every(r => (r.overall_avg as number) >= TRAINING_THRESHOLD)

    if (consecutiveGood) {
      await supabase.from('cooks').update({ status: 'active' }).eq('id', cook_id)
      console.log(`[Ratings] ${cook.name} → active (${CONSECUTIVE_NEEDED} consecutive good ratings)`)
    }
  }

  // ── Agent 3: Feedback Analysis ───────────────────────────────────────────
  // Fires when a cook moves to watch — analyzes scores and emails the cook
  if (movedToWatch) {
    const tasteAvg  = sum('taste') / count
    const cleanAvg  = sum('cleanliness') / count
    const punctAvg  = sum('punctuality') / count
    const respectAvg = sum('respect') / count
    const appearAvg = sum('clean_appearance') / count

    analyzeFeedback({
      cook_id,
      cook_name: cook.name,
      cook_email: cook.email,
      taste_avg: tasteAvg,
      cleanliness_avg: cleanAvg,
      punctuality_avg: punctAvg,
      respect_avg: respectAvg,
      clean_appearance_avg: appearAvg,
      overall_score: newOverall,
      session_count: count,
    }).catch(err => console.error('[Agent 3] Error:', err))
  }

  // ── Agent 5: Profile Scoring ─────────────────────────────────────────────
  scoreProfile(cook_id).catch(err => console.error('[Agent 5] Error:', err))

  return NextResponse.json({ success: true })
}
