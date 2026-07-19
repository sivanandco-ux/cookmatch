import Anthropic from '@anthropic-ai/sdk'

export interface DishPhotoValidation {
  isFood: boolean
}

const SUPPORTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Dish photos are what clients actually judge a cook by, so a non-food
// upload (a selfie, a screenshot, something unrelated) shouldn't make it
// onto a public profile. Fails CLOSED like validateSpecialty — a one-time
// upload where a retry costs nothing, so an API hiccup should block rather
// than silently let through something ungated.
export async function validateDishPhoto(buffer: Buffer, mediaType: string): Promise<DishPhotoValidation> {
  if (!SUPPORTED_MEDIA_TYPES.includes(mediaType)) {
    return { isFood: false }
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: buffer.toString('base64') },
          },
          {
            type: 'text',
            text: 'A home cook is uploading this as a photo of a dish they made, for their public profile on a home-cooking marketplace. Is this actually a photo of prepared food (a meal, snack, baked good, pickle, sweet, drink, etc.)? Return ONLY a JSON object: {"isFood": true} or {"isFood": false}. No explanation.',
          },
        ],
      }],
    })

    const text = response.content.find(b => b.type === 'text')?.text || '{"isFood":false}'
    const parsed = JSON.parse(text)
    return { isFood: !!parsed.isFood }
  } catch (err) {
    console.error('[validateDishPhoto] Validation call failed, rejecting (fail-closed):', err)
    return { isFood: false }
  }
}
