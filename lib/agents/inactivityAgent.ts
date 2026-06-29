import { createClient } from '@supabase/supabase-js'
import { sendDormantNotification } from '@/lib/email'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DORMANT_DAYS = 60

export async function checkInactivity() {
  const supabase = getSupabase()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DORMANT_DAYS)

  console.log(`[Agent 4] Checking for cooks inactive since ${cutoff.toISOString().split('T')[0]}`)

  const { data: inactiveCooks, error } = await supabase
    .from('cooks')
    .select('id, name, email, last_active_at')
    .in('status', ['active', 'watch', 'training'])
    .lt('last_active_at', cutoff.toISOString())

  if (error) {
    console.error('[Agent 4] Query failed:', error.message)
    return { dormanted: 0 }
  }

  if (!inactiveCooks || inactiveCooks.length === 0) {
    console.log('[Agent 4] No inactive cooks found')
    return { dormanted: 0 }
  }

  let dormanted = 0
  for (const cook of inactiveCooks) {
    await supabase
      .from('cooks')
      .update({ status: 'dormant' })
      .eq('id', cook.id)

    await sendDormantNotification({ cookName: cook.name, cookEmail: cook.email })
    console.log(`[Agent 4] ${cook.name} → dormant (last active: ${cook.last_active_at?.split('T')[0]})`)
    dormanted++
  }

  return { dormanted }
}
