import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendConversationReported } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversation_id: string }> }
) {
  const { conversation_id } = await params
  const body = await request.json()
  const cookToken = body.cook_token || null
  const { reason, details } = body

  if (!reason) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, cooks(name)')
    .eq('id', conversation_id)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  if (cookToken && cookToken !== conversation.cook_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reporterType: 'client' | 'cook' = cookToken ? 'cook' : 'client'

  await supabase
    .from('conversations')
    .update({ reported: true, reported_at: new Date().toISOString(), reported_by: reporterType })
    .eq('id', conversation_id)

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('sender_type, body')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: false })
    .limit(20)

  await sendConversationReported({
    conversationId: conversation_id,
    reporterType,
    reason,
    details: details || '',
    clientName: conversation.client_name,
    clientEmail: conversation.client_email,
    clientPhone: conversation.client_phone,
    cookName: conversation.cooks?.name ?? 'Unknown cook',
    recentMessages: (recentMessages || []).reverse(),
  })

  return NextResponse.json({ success: true })
}
