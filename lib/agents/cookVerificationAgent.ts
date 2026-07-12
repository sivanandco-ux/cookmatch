import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { scoreProfile } from '@/lib/agents/profileScoringAgent'
import { sendCheckinEmail, sendWelcomeEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Demo mode mocks ──────────────────────────────────────────────────────────
// Swap these for real Checkr / Persona API calls in production.
// The agent code above does not change — only these two functions.

function mockVerifyGovernmentId(cookId: string, name: string) {
  console.log(`[Agent 1] verify_government_id → ${name} (${cookId})`)
  return { verified: true, checked_at: new Date().toISOString() }
}

function mockRunBackgroundCheck(cookId: string, name: string) {
  console.log(`[Agent 1] run_background_check → ${name} (${cookId})`)
  return { passed: true, checked_at: new Date().toISOString() }
}

// ── Tool definitions Claude can call ────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'verify_government_id',
    description: "Verify a cook's government-issued ID. Returns whether the ID is valid.",
    input_schema: {
      type: 'object',
      properties: {
        cook_id: { type: 'string', description: "The cook's unique ID" },
        name:    { type: 'string', description: "The cook's full name" },
        email:   { type: 'string', description: "The cook's email address" },
      },
      required: ['cook_id', 'name', 'email'],
    },
  },
  {
    name: 'run_background_check',
    description: "Run a background check on a cook. Returns whether they passed.",
    input_schema: {
      type: 'object',
      properties: {
        cook_id: { type: 'string', description: "The cook's unique ID" },
        name:    { type: 'string', description: "The cook's full name" },
        email:   { type: 'string', description: "The cook's email address" },
      },
      required: ['cook_id', 'name', 'email'],
    },
  },
]

function executeTool(name: string, input: Record<string, string>) {
  if (name === 'verify_government_id') return mockVerifyGovernmentId(input.cook_id, input.name)
  if (name === 'run_background_check')  return mockRunBackgroundCheck(input.cook_id, input.name)
  throw new Error(`Unknown tool: ${name}`)
}

// ── The agent ────────────────────────────────────────────────────────────────

export async function verifyCook({
  cook_id,
  name,
  email,
}: {
  cook_id: string
  name: string
  email: string
}) {
  const supabase = getSupabase()
  console.log(`[Agent 1] Starting verification for ${name} (${cook_id})`)

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `You are a verification agent for CookMatch, a home cook marketplace.

A new cook has applied. Your job:
1. Call verify_government_id for this cook
2. Call run_background_check for this cook
3. After both results, reply with ONLY this JSON — no other text:
   {"decision":"approved","id_verified":true,"background_passed":true,"reason":"All checks passed"}
   or, if a check failed:
   {"decision":"pending","id_verified":false,"background_passed":false,"reason":"Explain which check failed"}

Cook:
- ID: ${cook_id}
- Name: ${name}
- Email: ${email}`,
    },
  ]

  // Tool use loop — runs until Claude issues end_turn (its final decision)
  for (let turn = 0; turn < 10; turn++) {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 512,
      tools: TOOLS,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        console.error('[Agent 1] No text in final response')
        return
      }

      let decision: { decision: string; id_verified: boolean; background_passed: boolean; reason: string }
      try {
        decision = JSON.parse(textBlock.text)
      } catch {
        console.error('[Agent 1] Could not parse decision JSON:', textBlock.text)
        return
      }

      // Write verification results
      const { error: verErr } = await supabase
        .from('cook_verifications')
        .update({
          id_verified: decision.id_verified,
          background_check_passed: decision.background_passed,
        })
        .eq('cook_id', cook_id)

      if (verErr) console.error('[Agent 1] cook_verifications update error:', verErr.message)

      if (decision.decision === 'approved') {
        const { error: cookErr } = await supabase
          .from('cooks')
          .update({ status: 'active' })
          .eq('id', cook_id)

        if (cookErr) console.error('[Agent 1] cooks status update error:', cookErr.message)
        else {
          console.log(`[Agent 1] APPROVED — ${name} is now active`)
          scoreProfile(cook_id).catch(err => console.error('[Agent 5] Error from Agent 1:', err))
          await sendWelcomeEmail({
            cookName: name,
            cookEmail: email,
            cookId: cook_id,
          }).catch(err => console.error('[Agent 1] Welcome email failed:', err))
          await sendCheckinEmail({
            cookName: name,
            cookEmail: email,
            availabilityUrl: `${SITE_URL}/availability/${cook_id}`,
          }).catch(err => console.error('[Agent 1] Check-in email failed:', err))
        }
      } else {
        console.log(`[Agent 1] PENDING — ${name} kept pending. Reason: ${decision.reason}`)
      }

      return
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter(b => b.type === 'tool_use')
        .map(block => {
          if (block.type !== 'tool_use') throw new Error('unreachable')
          const result = executeTool(block.name, block.input as Record<string, string>)
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(result),
          }
        })

      messages.push({ role: 'user', content: toolResults })
    }
  }

  console.error('[Agent 1] Exceeded max turns without a decision')
}
