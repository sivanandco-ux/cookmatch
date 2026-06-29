import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function scoreProfile(cook_id: string) {
  const supabase = getSupabase()

  // Gather all signals in parallel
  const [cookRes, scoreRes, verRes] = await Promise.all([
    supabase.from('cooks').select('name, bio, photo_url, video_url, languages, status').eq('id', cook_id).single(),
    supabase.from('cook_scores').select('overall_score, session_count').eq('cook_id', cook_id).single(),
    supabase.from('cook_verifications').select('id_verified, background_check_passed, food_handler_certified').eq('cook_id', cook_id).single(),
  ])

  const cook = cookRes.data
  const score = scoreRes.data
  const verification = verRes.data

  if (!cook || !score || !verification) {
    console.error('[Agent 5] Missing data for cook:', cook_id)
    return
  }

  const profileComplete = [cook.bio, cook.photo_url, cook.video_url, cook.languages?.length > 0].filter(Boolean).length
  const verifiedCount   = [verification.id_verified, verification.background_check_passed, verification.food_handler_certified].filter(Boolean).length
  const sessionCount    = score.session_count ?? 0
  const overallScore    = score.overall_score ?? 0

  console.log(`[Agent 5] Scoring ${cook.name} — sessions: ${sessionCount}, verified: ${verifiedCount}/3, profile: ${profileComplete}/4`)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a trust scoring agent for CookMatch, a home cook marketplace.

Calculate a trust score (0–100) for this cook using the signals and weights below.

Signals:
- Rating average: ${overallScore.toFixed(2)} / 5.0
- Sessions completed: ${sessionCount}
- Verification: ${verifiedCount} of 3 passed (ID, background check, food handler cert)
- Profile completeness: ${profileComplete} of 4 filled (bio, photo, video, languages)
- Status: ${cook.status}

Weights:
- Ratings 40%: (rating_avg / 5) × 40  — use 0 if no sessions yet
- Verification 30%: (verified / 3) × 30
- Experience 20%: (min(sessions, 20) / 20) × 20
- Profile 10%: (complete / 4) × 10

If status is "watch" subtract 10. If status is "training" subtract 15. Minimum score is 0.

Respond with ONLY this JSON — no other text:
{"trust_score": 74, "rationale": "one sentence explanation"}`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return

  let result: { trust_score: number; rationale: string }
  try {
    result = JSON.parse(textBlock.text)
  } catch {
    console.error('[Agent 5] Failed to parse response:', textBlock.text)
    return
  }

  const { error } = await supabase
    .from('cook_scores')
    .update({ trust_score: result.trust_score })
    .eq('cook_id', cook_id)

  if (error) console.error('[Agent 5] Failed to save trust score:', error.message)
  else console.log(`[Agent 5] ${cook.name} → trust score: ${result.trust_score} — ${result.rationale}`)
}
