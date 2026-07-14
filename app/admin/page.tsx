export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import AdminPanel from './AdminPanel'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams

  if (!key || !process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-400 text-sm">Access denied.</p>
      </div>
    )
  }

  const supabase = getSupabase()

  const [{ data: jobs }, { data: cooks }] = await Promise.all([
    supabase
      .from('job_posts')
      .select('id, job_category, request_type, occasion, city, requested_date, status, created_at, client_name, client_email')
      .order('created_at', { ascending: false }),
    supabase
      .from('cooks')
      .select('id, name, email, status, service_areas, created_at')
      .order('created_at', { ascending: false }),
  ])

  return <AdminPanel jobs={jobs ?? []} cooks={cooks ?? []} adminKey={key} />
}
