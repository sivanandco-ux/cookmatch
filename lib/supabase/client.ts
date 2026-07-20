import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Multiple components on the same page (SiteNav, ChatWidget, etc.) each call
// createClient() — without caching, that spins up a separate GoTrueClient
// per call, all sharing the same session storage key. Supabase's cross-tab
// session lock (Web Locks API) then serializes across those instances, and
// concurrent calls can deadlock, leaving auth.getSession() pending forever.
// A single shared instance avoids the deadlock entirely.
let client: SupabaseClient | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
