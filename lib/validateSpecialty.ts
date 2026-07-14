import Anthropic from '@anthropic-ai/sdk'

export interface SpecialtyValidation {
  valid: boolean
  corrected?: string
}

// Validates a single cook-entered specialty (one cuisine, cooking style, or
// food item at a time) — used for inline validation as each tag is added,
// rather than validating a whole batch at form-submit time.
export async function validateSpecialty(input: string): Promise<SpecialtyValidation> {
  const trimmed = input.trim()
  if (!trimmed) return { valid: false }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `A home cook entered this as one of their specialties on a home-cook platform: "${trimmed}"

Is this a real, recognizable cuisine tradition or cooking style (e.g. "Chettinad" — a region in Tamil Nadu known for a distinct cooking style, "Thai"), a food category (e.g. "Baking", "Jams & Jellies", "Pickles & Preserves"), or a specific edible food item/dish (e.g. "Dhokla", "Chicken Curry")?

Return ONLY a JSON object: {"valid": true, "corrected": "..."} with obvious misspellings/casing fixed (e.g. "tamilian" -> "Tamil", "soth indian" -> "South Indian") if it is one of these, or {"valid": false} if it is not (non-food items/crafts, gibberish, offensive words, unrelated text, emojis, numbers). No explanation, just the JSON object.`,
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text || '{"valid":false}'
  try {
    const parsed = JSON.parse(text)
    return {
      valid: !!parsed.valid,
      corrected: typeof parsed.corrected === 'string' ? parsed.corrected : undefined,
    }
  } catch {
    return { valid: false }
  }
}
