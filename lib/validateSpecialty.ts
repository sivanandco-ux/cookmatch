import Anthropic from '@anthropic-ai/sdk'

export interface SpecialtyValidation {
  valid: boolean
  corrected?: string
  // Set when the entry is a specific perishable dish/item (needs
  // refrigeration because of dairy, egg, cream, custard, meat, or moisture
  // content) rather than a shelf-stable one — most states' cottage food
  // laws only cover shelf-stable goods, so this is a different legal
  // category than "hot vs. cold," and isn't set for cuisine/style/category
  // entries since those aren't a single dish to classify.
  perishableNote?: string
}

// Dietary category, not a specialty — cooks already set this via the
// dedicated Vegetarian/Non-Vegetarian/Eggetarian checkboxes (dietary_specialties),
// so letting it through here would duplicate it into cuisine_types and
// pollute the specialty filter dropdown with a non-cuisine entry.
const DIETARY_TERMS = new Set(['vegetarian', 'nonvegetarian', 'eggetarian', 'veg', 'nonveg'])
function isDietaryTerm(text: string): boolean {
  return DIETARY_TERMS.has(text.toLowerCase().replace(/[\s-]/g, ''))
}

// Validates a single cook-entered specialty (one cuisine, cooking style, or
// food item at a time) — used for inline validation as each tag is added,
// rather than validating a whole batch at form-submit time.
export async function validateSpecialty(input: string): Promise<SpecialtyValidation> {
  const trimmed = input.trim()
  if (!trimmed) return { valid: false }
  if (isDietaryTerm(trimmed)) return { valid: false }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `A home cook entered this as one of their specialties on a home-cook platform: "${trimmed}"

Is this a real, recognizable cuisine tradition or cooking style (e.g. "Chettinad" — a region in Tamil Nadu known for a distinct cooking style, "Thai"), a food category (e.g. "Baking", "Jams & Jellies", "Pickles & Preserves"), or a specific edible food item/dish (e.g. "Dhokla", "Chicken Curry")?

If — and only if — it is a specific edible food item/dish (not a cuisine, style, or category), also decide: does it typically require refrigeration to remain safe, because it contains dairy, egg, cream, custard, or meat, or has high moisture content (e.g. "Tiramisu", "Cheesecake", "Cream Pie", "Chicken Curry")? Or is it typically shelf-stable at room temperature (e.g. "Baklava", "Banana Bread", "Sugar Cookies", dry spice mixes)? Many home-cook platforms' legal category for "packaged food items" only covers the shelf-stable kind — a food needing refrigeration is a meaningfully different legal category even if it's never served hot.

Return ONLY a JSON object like {"valid": true, "corrected": "...", "perishable": true} with obvious misspellings/casing fixed (e.g. "tamilian" -> "Tamil", "soth indian" -> "South Indian"). Include "perishable" (true or false) only when this is a specific dish/item — omit it entirely for a cuisine, style, or category entry. Return {"valid": false} if it is not a real cuisine/style/category/dish (non-food items/crafts, gibberish, offensive words, unrelated text, emojis, numbers). No explanation, just the JSON object.`,
    }],
  })

  const text = response.content.find(b => b.type === 'text')?.text || '{"valid":false}'
  try {
    const parsed = JSON.parse(text)
    return {
      valid: !!parsed.valid,
      corrected: typeof parsed.corrected === 'string' ? parsed.corrected : undefined,
      perishableNote: parsed.perishable === true
        ? 'This typically needs refrigeration — most cottage food laws only cover shelf-stable items, so check your state\'s rules before selling it without a proper permit.'
        : undefined,
    }
  } catch {
    return { valid: false }
  }
}
