export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ConductBanner from '@/components/ConductBanner'
import MessageThread from '@/components/MessageThread'
import MessageReportButton from '@/components/MessageReportButton'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ClientMessagesPage({
  params,
}: {
  params: Promise<{ conversation_id: string }>
}) {
  const { conversation_id } = await params
  const supabase = getSupabase()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, cooks(name, photo_url)')
    .eq('id', conversation_id)
    .maybeSingle()

  if (!conversation) notFound()

  const cook = conversation.cooks as { name: string; photo_url: string | null } | null

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        {cook?.photo_url ? (
          <img src={cook.photo_url} alt={cook.name} className="w-12 h-12 rounded-sm object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-sm bg-copper-600 flex items-center justify-center text-paper font-display font-bold">
            {cook?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{cook?.name ?? 'Cook'}</h1>
          <p className="text-sm text-gray-500">Your conversation</p>
        </div>
      </div>

      <div className="mb-4">
        <ConductBanner />
      </div>

      <MessageThread
        conversationId={conversation_id}
        senderType="client"
        otherPartyName={cook?.name ?? 'the cook'}
      />

      <MessageReportButton conversationId={conversation_id} />
    </div>
  )
}
