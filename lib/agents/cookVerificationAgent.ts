import { createClient } from '@supabase/supabase-js'
import { scoreProfile } from '@/lib/agents/profileScoringAgent'
import { sendCheckinEmail, sendNewCookPendingReview, sendWelcomeEmail } from '@/lib/email'
import { AUTO_APPROVE_LIMIT, shouldAutoApprove } from '@/lib/cookCap'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// There is no automated ID or background-check service wired up here — an
// earlier version of this function faked one (mock functions that always
// returned "verified"/"passed" regardless of who applied), which wrote
// false data into cook_verifications and auto-activated every cook
// unconditionally. Replaced with an honest, simple rule: the founder's
// first AUTO_APPROVE_LIMIT cooks (a personally-curated batch) go live
// instantly; every cook after that is held pending for a real manual
// review in /admin, with an email notification so it doesn't get missed.
export async function verifyCook({
  cook_id,
  name,
  email,
}: {
  cook_id: string
  name: string
  email: string
}) {
  const supabase = getSupabase()

  if (!(await shouldAutoApprove())) {
    console.log(`[Cook Review] ${name} (${cook_id}) held for manual review — past the first ${AUTO_APPROVE_LIMIT} cooks`)
    await sendNewCookPendingReview({ cookName: name, cookEmail: email, cookId: cook_id })
      .catch(err => console.error('[Cook Review] Notification email failed:', err))
    return
  }

  const { error } = await supabase.from('cooks').update({ status: 'active' }).eq('id', cook_id)
  if (error) {
    console.error('[Cook Review] Failed to activate cook:', error.message)
    return
  }

  console.log(`[Cook Review] ${name} auto-activated (within the first ${AUTO_APPROVE_LIMIT} cooks)`)
  scoreProfile(cook_id).catch(err => console.error('[Cook Review] scoreProfile failed:', err))
  await sendWelcomeEmail({ cookName: name, cookEmail: email, cookId: cook_id })
    .catch(err => console.error('[Cook Review] Welcome email failed:', err))
  await sendCheckinEmail({
    cookName: name,
    cookEmail: email,
    availabilityUrl: `${SITE_URL}/availability/${cook_id}`,
  }).catch(err => console.error('[Cook Review] Check-in email failed:', err))
}
