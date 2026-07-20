import { createClient } from '@supabase/supabase-js'

// Cook signups are capped while the platform is still small — raise this
// (or remove the cap entirely by deleting its call sites) once ready to
// grow past it.
export const MAX_COOKS = 20

// The first AUTO_APPROVE_LIMIT cooks are the founder's personally-curated
// initial batch and get activated instantly. Every cook after that requires
// a manual look in /admin before going live — there's no automated ID or
// background-check service wired up (see lib/agents/cookVerificationAgent.ts),
// so past the initial batch, a real signup requires a real human glance
// rather than instant auto-activation. Deliberately a separate constant
// from MAX_COOKS: raising the signup cap later shouldn't silently also
// raise how many cooks skip manual review.
export const AUTO_APPROVE_LIMIT = 20

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function nonDormantCookCount(): Promise<number> {
  const supabase = getServiceSupabase()
  const { count } = await supabase
    .from('cooks')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'dormant')
  return count ?? 0
}

// Dormant cooks have gone inactive and freed up their slot — every other
// status (pending, active, watch, training) still counts against the cap,
// since they're all still occupying a real spot on the roster.
export async function isCookCapReached(): Promise<boolean> {
  return (await nonDormantCookCount()) >= MAX_COOKS
}

export async function shouldAutoApprove(): Promise<boolean> {
  return (await nonDormantCookCount()) < AUTO_APPROVE_LIMIT
}
