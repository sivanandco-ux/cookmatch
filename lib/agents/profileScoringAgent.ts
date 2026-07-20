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
  const [cookRes, scoreRes] = await Promise.all([
    supabase.from('cooks').select('name, bio, photo_url, video_url, languages, status').eq('id', cook_id).single(),
    supabase.from('cook_scores').select('overall_score, session_count, item_overall_score, item_count').eq('cook_id', cook_id).single(),
  ])

  const cook = cookRes.data
  const score = scoreRes.data

  if (!cook || !score) {
    console.error('[Agent 5] Missing data for cook:', cook_id)
    return
  }

  const profileComplete = [cook.bio, cook.photo_url, cook.video_url, cook.languages?.length > 0].filter(Boolean).length

  // A cook can be rated on two independent tracks — in-home sessions and
  // sold items — since the skills genuinely differ (conduct in someone's
  // kitchen vs. packaging/logistics). Blend them weighted by how many
  // ratings each track actually has, so a cook who does only one isn't
  // penalized for having "0" in the other.
  const sessionCount = score.session_count ?? 0
  const itemCount = score.item_count ?? 0
  const totalEngagements = sessionCount + itemCount
  const blendedRating = totalEngagements > 0
    ? ((score.overall_score ?? 0) * sessionCount + (score.item_overall_score ?? 0) * itemCount) / totalEngagements
    : 0

  console.log(`[Agent 5] Scoring ${cook.name} — sessions: ${sessionCount}, items: ${itemCount}, profile: ${profileComplete}/4`)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a trust scoring agent for CookMatch, a home cook marketplace.

Calculate a trust score (0–100) for this cook using the signals and weights below.

Signals:
- Blended rating average: ${blendedRating.toFixed(2)} / 5.0 (across both in-home sessions and sold items, weighted by how many ratings each has)
${sessionCount > 0 ? `- In-home session rating: ${(score.overall_score ?? 0).toFixed(2)} / 5.0 (${sessionCount} rated)\n` : ''}${itemCount > 0 ? `- Item rating: ${(score.item_overall_score ?? 0).toFixed(2)} / 5.0 (${itemCount} rated)\n` : ''}- Engagements completed (sessions + items): ${totalEngagements}
- Profile completeness: ${profileComplete} of 4 filled (bio, photo, video, languages)
- Status: ${cook.status}

Weights:
- Ratings 50%: (blended_rating_avg / 5) × 50  — use 0 if no ratings yet
- Experience 35%: (min(engagements, 20) / 20) × 35
- Profile 15%: (complete / 4) × 15

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
