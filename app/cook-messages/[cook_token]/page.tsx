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

// Cook-side access mirrors the client side exactly — a private, unguessable
// link (this conversation's cook_token), no login required. Reached via the
// "new message" email or the cook's dashboard, but works standalone either way.
export default async function CookMessagesPage({
  params,
}: {
  params: Promise<{ cook_token: string }>
}) {
  const { cook_token } = await params
  const supabase = getSupabase()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, cooks(name)')
    .eq('cook_token', cook_token)
    .maybeSingle()

  if (!conversation) notFound()

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{conversation.client_name}</h1>
        <p className="text-sm text-gray-500">Your conversation</p>
      </div>

      <div className="mb-4">
        <ConductBanner />
      </div>

      <MessageThread
        conversationId={conversation.id}
        senderType="cook"
        cookToken={cook_token}
        otherPartyName={conversation.client_name}
      />

      <MessageReportButton conversationId={conversation.id} cookToken={cook_token} />
    </div>
  )
}
