import Anthropic from '@anthropic-ai/sdk'

export interface MessageModeration {
  allowed: boolean
}

// Screens a single chat message between a client and cook who already have
// a real booking/job pairing (they are expected to freely exchange contact
// info, pricing, logistics — never flag any of that). Only flags clearly
// abusive content: harassment, threats, hate speech, sexual content.
//
// Unlike validateSpecialty (which fails CLOSED on any API/parse error,
// because it's a one-time profile field and a retry costs nothing), this
// fails OPEN: if the Anthropic call errors or returns unparseable JSON, the
// message is delivered. This is a supplementary safety net on top of the
// Report button and per-sender rate limiting, which are the primary
// defenses — blocking a legitimate negotiation message mid-conversation
// because of a transient AI/API hiccup would be worse than an occasional
// missed screen, and would make live chat feel broken.
export async function moderateMessage(body: string): Promise<MessageModeration> {
  const trimmed = body.trim()
  if (!trimmed) return { allowed: true }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `A client and a home cook on a cooking marketplace already have a confirmed booking/job pairing and are chatting to coordinate. They are allowed to freely share contact info, pricing, scheduling, and logistics — never flag any of that.

Message: "${trimmed}"

Flag this ONLY if it contains harassment, threats, hate speech, or sexual content/solicitation.

Return ONLY a JSON object: {"allowed": true} if the message is fine, or {"allowed": false} if it must be blocked. No explanation.`,
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || '{"allowed":true}'
    const parsed = JSON.parse(text)
    return { allowed: parsed.allowed !== false }
  } catch (err) {
    console.error('[moderateMessage] Moderation call failed, delivering message (fail-open):', err)
    return { allowed: true }
  }
}
