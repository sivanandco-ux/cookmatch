import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { sendCookWatchNotification } from '@/lib/email'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const WEAK_THRESHOLD = 3.5

const AVAILABLE_MODULES = [
  'Food Safety & Cleanliness',
  'Punctuality & Preparation',
  'Client Communication',
  'Presentation & Appearance',
  'Cooking Technique & Consistency',
]

export async function analyzeFeedback({
  cook_id,
  cook_name,
  cook_email,
  taste_avg,
  cleanliness_avg,
  punctuality_avg,
  respect_avg,
  clean_appearance_avg,
  overall_score,
  session_count,
}: {
  cook_id: string
  cook_name: string
  cook_email: string
  taste_avg: number
  cleanliness_avg: number
  punctuality_avg: number
  respect_avg: number
  clean_appearance_avg: number
  overall_score: number
  session_count: number
}) {
  console.log(`[Agent 3] Analyzing feedback for ${cook_name} (session ${session_count})`)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a coaching agent for CookMatch, a home cook marketplace.

Analyze this cook's performance and provide a personalized training plan.

Cook: ${cook_name}
Sessions completed: ${session_count}
Overall average: ${overall_score.toFixed(2)} / 5.0

Scores (1–5):
- Taste: ${taste_avg.toFixed(2)}
- Cleanliness: ${cleanliness_avg.toFixed(2)}
- Punctuality: ${punctuality_avg.toFixed(2)}
- Respect: ${respect_avg.toFixed(2)}
- Clean Appearance: ${clean_appearance_avg.toFixed(2)}

Scores below ${WEAK_THRESHOLD} need attention. Write a short, encouraging coaching plan.

Respond with ONLY this JSON — no other text:
{
  "analysis": "2–3 sentences: acknowledge what the cook does well, then clearly name what needs improvement and why it matters to clients",
  "modules": ["Module Name"]
}

You MUST choose modules only from this list: ${AVAILABLE_MODULES.map(m => `"${m}"`).join(', ')}`,
      },
    ],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    console.error('[Agent 3] No text in response')
    return
  }

  let result: { analysis: string; modules: string[] }
  try {
    result = JSON.parse(textBlock.text)
  } catch {
    console.error('[Agent 3] Failed to parse JSON:', textBlock.text)
    return
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('cook_training')
    .insert({ cook_id, analysis: result.analysis, modules: result.modules })

  if (error) {
    console.error('[Agent 3] Failed to save training plan:', error.message)
    return
  }

  console.log(`[Agent 3] Plan saved for ${cook_name} — modules: ${result.modules.join(', ')}`)

  // Notify the cook so they know what to work on before their grace session
  await sendCookWatchNotification({
    cookName: cook_name,
    cookEmail: cook_email,
    analysis: result.analysis,
    modules: result.modules,
    scores: {
      taste: taste_avg,
      cleanliness: cleanliness_avg,
      punctuality: punctuality_avg,
      respect: respect_avg,
      clean_appearance: clean_appearance_avg,
      overall: overall_score,
    },
  })
}
