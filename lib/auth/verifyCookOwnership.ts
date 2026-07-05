import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Confirms the logged-in session (via cookies) belongs to the cook identified
 * by cookId. Used in API routes that mutate a specific cook's data, since the
 * cook_id in a request body can't be trusted on its own.
 */
export async function verifyCookOwnership(cookId: string): Promise<boolean> {
  if (!cookId) return false

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const service = getServiceSupabase()
  const { data: cook } = await service
    .from('cooks')
    .select('user_id')
    .eq('id', cookId)
    .maybeSingle()

  return !!cook && cook.user_id === user.id
}
