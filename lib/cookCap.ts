import { createClient } from '@supabase/supabase-js'

// Cook signups are capped while the platform is still small — raise this
// (or remove the cap entirely by deleting its call sites) once ready to
// grow past it.
// TEMPORARY: set to 3 to test the waitlist flow against the current cook
// count — revert to 20 once confirmed working.
export const MAX_COOKS = 3

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Dormant cooks have gone inactive and freed up their slot — every other
// status (pending, active, watch, training) still counts against the cap,
// since they're all still occupying a real spot on the roster.
export async function isCookCapReached(): Promise<boolean> {
  const supabase = getServiceSupabase()
  const { count } = await supabase
    .from('cooks')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'dormant')
  return (count ?? 0) >= MAX_COOKS
}
