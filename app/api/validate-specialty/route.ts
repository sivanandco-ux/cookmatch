import { NextResponse } from 'next/server'
import { validateSpecialty } from '@/lib/validateSpecialty'

export async function POST(request: Request) {
  const { text } = await request.json()
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ valid: false })
  }
  const result = await validateSpecialty(text)
  return NextResponse.json(result)
}
