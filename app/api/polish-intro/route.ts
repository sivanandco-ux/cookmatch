import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(request: Request) {
  const { text } = await request.json()
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return NextResponse.json({ error: 'Please write at least a sentence first.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are helping a home cook write a profile introduction for CookMatch, a platform connecting Indian home cooks with local families.

Fix any grammatical mistakes, improve sentence flow, and make it sound warm and professional — but keep the cook's own voice and every fact they mentioned. Do NOT invent new facts. Do NOT make it longer. Keep it under 280 characters if possible.

Return ONLY the polished text, nothing else.

Cook's original text:
${text.trim()}`,
      },
    ],
  })

  const polished = message.content[0].type === 'text' ? message.content[0].text.trim() : text
  return NextResponse.json({ polished })
}
