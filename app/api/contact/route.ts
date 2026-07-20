import { NextResponse } from 'next/server'
import { sendContactMessage } from '@/lib/email'

const MESSAGE_LIMIT = 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const email = String(body.email || '').trim()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const message = String(body.message || '').trim()
  if (!message) {
    return NextResponse.json({ error: 'Please enter a message.' }, { status: 400 })
  }
  if (message.length > MESSAGE_LIMIT) {
    return NextResponse.json({ error: `Message must be under ${MESSAGE_LIMIT} characters.` }, { status: 400 })
  }

  await sendContactMessage({ fromEmail: email, message })
    .catch(err => console.error('[Contact] Email failed:', err))

  return NextResponse.json({ success: true })
}
