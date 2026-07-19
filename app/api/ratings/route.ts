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
  const { booking_id, cook_id, rating_category, taste, cleanliness, punctuality, respect, clean_appearance, packaging, notes } = body

  if (rating_category !== 'session' && rating_category !== 'item') {
    return NextResponse.json({ error: 'Invalid rating category.' }, { status: 400 })
  }
  const isSession = rating_category === 'session'

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

  // Only the dimensions that apply to this category feed the average — a
  // cook who was never physically in the client's home isn't judged on
  // Cleanliness/Clean Appearance, and vice versa for Packaging.
  const dims = isSession
    ? { taste, cleanliness, punctuality, respect, clean_appearance }
    : { taste, packaging, punctuality, respect }
  const dimValues = Object.values(dims).filter((v): v is number => typeof v === 'number')
  const overall_avg = dimValues.reduce((a, b) => a + b, 0) / dimValues.length

  const { error: ratingErr } = await supabase
    .from('cook_ratings')
    .insert({
      booking_id,
      cook_id,
      rating_category,
      taste,
      punctuality,
      respect,
      cleanliness: isSession ? cleanliness : null,
      clean_appearance: isSession ? clean_appearance : null,
      packaging: isSession ? null : packaging,
      overall_avg,
      notes: notes || '',
    })

  if (ratingErr) {
    return NextResponse.json({ error: ratingErr.message }, { status: 500 })
  }

  // Recalculate averages within THIS category only — a cook's item-selling
  // reputation and in-home cooking reputation are tracked independently.
  const { data: categoryRatings } = await supabase
    .from('cook_ratings')
    .select('taste, cleanliness, punctuality, respect, clean_appearance, packaging, overall_avg, created_at')
    .eq('cook_id', cook_id)
    .eq('rating_category', rating_category)
    .order('created_at', { ascending: true })

  if (!categoryRatings || categoryRatings.length === 0) {
    return NextResponse.json({ success: true })
  }

  const count = categoryRatings.length
  const avgOf = (field: string) => {
    const nums = categoryRatings.map(r => r[field as keyof typeof r]).filter((v): v is number => typeof v === 'number')
    return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  }
  const newCategoryOverall = avgOf('overall_avg')

  const categoryUpdate = isSession
    ? {
        overall_score: newCategoryOverall,
        taste_avg: avgOf('taste'),
        cleanliness_avg: avgOf('cleanliness'),
        punctuality_avg: avgOf('punctuality'),
        respect_avg: avgOf('respect'),
        clean_appearance_avg: avgOf('clean_appearance'),
        session_count: count,
      }
    : {
        item_overall_score: newCategoryOverall,
        item_taste_avg: avgOf('taste'),
        item_packaging_avg: avgOf('packaging'),
        item_punctuality_avg: avgOf('punctuality'),
        item_respect_avg: avgOf('respect'),
        item_count: count,
      }

  await supabase.from('cook_scores').update(categoryUpdate).eq('cook_id', cook_id)

  // ── State machine ────────────────────────────────────────────────────────
  const [{ data: cook }, { data: scores }, { data: allRatings }] = await Promise.all([
    supabase.from('cooks').select('status, name, email').eq('id', cook_id).single(),
    supabase.from('cook_scores').select('*').eq('cook_id', cook_id).single(),
    supabase.from('cook_ratings').select('overall_avg, created_at').eq('cook_id', cook_id).order('created_at', { ascending: true }),
  ])

  if (!cook || !scores || !allRatings || allRatings.length === 0) return NextResponse.json({ success: true })

  // Held to standard on both categories — use the worse of whichever
  // category(ies) the cook actually has ratings in, so weak item packaging
  // can't hide behind strong in-home sessions or vice versa.
  const trackScores: number[] = []
  if (scores.session_count > 0) trackScores.push(scores.overall_score)
  if (scores.item_count > 0) trackScores.push(scores.item_overall_score)
  const effectiveScore = trackScores.length > 0 ? Math.min(...trackScores) : newCategoryOverall

  const lastRating = allRatings[allRatings.length - 1]
  const lastAvg = lastRating.overall_avg as number

  let movedToWatch = false

  if (cook.status === 'active' && effectiveScore < TRAINING_THRESHOLD) {
    // First bad signal — give a grace session, don't restrict yet
    await supabase.from('cooks').update({ status: 'watch' }).eq('id', cook_id)
    console.log(`[Ratings] ${cook.name} → watch (effective: ${effectiveScore.toFixed(2)})`)
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
  // Fires when a cook moves to watch — session-category only for now, since
  // this agent's coaching modules (cleanliness, appearance, etc.) are
  // specific to in-home cooking. Item/packaging coaching is a separate
  // follow-up, not built here — firing this with null dimensions would
  // produce garbage coaching output.
  if (movedToWatch && isSession) {
    analyzeFeedback({
      cook_id,
      cook_name: cook.name,
      cook_email: cook.email,
      taste_avg: avgOf('taste'),
      cleanliness_avg: avgOf('cleanliness'),
      punctuality_avg: avgOf('punctuality'),
      respect_avg: avgOf('respect'),
      clean_appearance_avg: avgOf('clean_appearance'),
      overall_score: newCategoryOverall,
      session_count: count,
    }).catch(err => console.error('[Agent 3] Error:', err))
  }

  // ── Agent 5: Profile Scoring ─────────────────────────────────────────────
  scoreProfile(cook_id).catch(err => console.error('[Agent 5] Error:', err))

  return NextResponse.json({ success: true })
}
