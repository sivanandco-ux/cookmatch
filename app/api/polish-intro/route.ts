import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: Request) {
  const { text, context } = await request.json()
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return NextResponse.json({ error: 'Please write at least a sentence first.' }, { status: 400 })
  }

  const prompt = context === 'client'
    ? `Fix any grammatical mistakes and improve the clarity of this job description for a home cooking platform. Keep every detail exactly as stated — do not add, remove, or change any facts. Return ONLY the polished text, nothing else.\n\nOriginal:\n${text.trim()}`
    : context === 'menu'
    ? `You are helping a home cook write a clear menu listing for their profile on Sivan Spices, a platform connecting home cooks with local families. This lists the items they sell and their prices (e.g. "Chocolate chip cookies $12/dozen, samosas $1.50 each").\n\nFix any grammatical mistakes, tidy up formatting so each item and price reads clearly, and improve flow — but keep every item name and every price exactly as stated. Do NOT invent new items or prices, do NOT drop any that were mentioned. Return ONLY the polished text, nothing else.\n\nCook's original text:\n${text.trim()}`
    : `You are helping a home cook write a profile introduction for CookMatch, a platform connecting Indian home cooks with local families.\n\nFix any grammatical mistakes, improve sentence flow, and make it sound warm and professional — but keep the cook's own voice and every fact they mentioned. Do NOT invent new facts. Do NOT make it longer. Keep it under 280 characters if possible.\n\nReturn ONLY the polished text, nothing else.\n\nCook's original text:\n${text.trim()}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const polished = message.content[0].type === 'text' ? message.content[0].text.trim() : text
  return NextResponse.json({ polished })
}
