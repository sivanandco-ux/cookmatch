import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { moderateMessage } from '@/lib/moderateMessage'
import { sendNewMessageNotification } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const RATE_LIMIT_PER_HOUR = 30
const NOTIFY_DEBOUNCE_MINUTES = 30

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Both sides access a conversation the same way — an unguessable token in
// the URL, no login required. The client's token is the conversation's own
// id; the cook's is a separate cook_token column, so each side has its own
// private link and the server tells them apart by which token was
// presented, never by an easily-spoofed flag.
async function loadConversationForRequest(conversationId: string, cookToken: string | null) {
  const supabase = getSupabase()
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, cooks(name, photo_url, phone, email, whatsapp)')
    .eq('id', conversationId)
    .maybeSingle()

  if (!conversation) return { error: NextResponse.json({ error: 'Conversation not found' }, { status: 404 }) }

  if (cookToken && cookToken !== conversation.cook_token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { supabase, conversation, senderType: (cookToken ? 'cook' : 'client') as 'cook' | 'client' }
}

async function isRateLimited(
  supabase: ReturnType<typeof getSupabase>,
  conversationId: string,
  senderType: 'client' | 'cook'
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('sender_type', senderType)
    .gte('created_at', oneHourAgo)
  return (count ?? 0) >= RATE_LIMIT_PER_HOUR
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversation_id: string }> }
) {
  const { conversation_id } = await params
  const { searchParams } = new URL(request.url)
  const cookToken = searchParams.get('cook_token')

  const result = await loadConversationForRequest(conversation_id, cookToken)
  if (result.error) return result.error
  const { supabase, conversation } = result

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_type, body, created_at')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      reported: conversation.reported,
      client_name: conversation.client_name,
      cook_name: conversation.cooks?.name,
      cook_photo_url: conversation.cooks?.photo_url ?? null,
    },
    messages: messages || [],
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversation_id: string }> }
) {
  const { conversation_id } = await params
  const body = await request.json()
  const cookToken = body.cook_token || null
  const messageBody = String(body.body || '').trim()

  if (!messageBody) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const result = await loadConversationForRequest(conversation_id, cookToken)
  if (result.error) return result.error
  const { supabase, conversation, senderType } = result

  if (await isRateLimited(supabase, conversation_id, senderType)) {
    return NextResponse.json(
      { error: 'You are sending messages too quickly. Please wait a bit and try again.' },
      { status: 429 }
    )
  }

  const moderation = await moderateMessage(messageBody)
  if (!moderation.allowed) {
    return NextResponse.json(
      { error: 'That message could not be sent. Please keep the conversation respectful.' },
      { status: 400 }
    )
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id, sender_type: senderType, body: messageBody })
    .select('id, sender_type, body, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Debounced email ping to whichever side didn't just send this message —
  // at most one per NOTIFY_DEBOUNCE_MINUTES per recipient, so an active
  // back-and-forth doesn't turn into an email flood.
  const recipientIsCook = senderType === 'client'
  const lastNotifiedAt = recipientIsCook ? conversation.cook_last_notified_at : conversation.client_last_notified_at
  const debounceElapsed = !lastNotifiedAt || Date.now() - new Date(lastNotifiedAt).getTime() > NOTIFY_DEBOUNCE_MINUTES * 60 * 1000

  if (debounceElapsed) {
    const conversationUrl = recipientIsCook
      ? `${SITE_URL}/cook-messages/${conversation.cook_token}`
      : `${SITE_URL}/messages/${conversation_id}`

    sendNewMessageNotification({
      recipientEmail: recipientIsCook ? conversation.cooks?.email : conversation.client_email,
      recipientName: recipientIsCook ? conversation.cooks?.name : conversation.client_name,
      senderName: recipientIsCook ? conversation.client_name : conversation.cooks?.name,
      conversationUrl,
    }).catch(err => console.error('[Email] New message notification failed:', err))

    await supabase
      .from('conversations')
      .update(recipientIsCook ? { cook_last_notified_at: new Date().toISOString() } : { client_last_notified_at: new Date().toISOString() })
      .eq('id', conversation_id)
  }

  return NextResponse.json({ message })
}
