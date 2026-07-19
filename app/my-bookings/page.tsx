export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  open: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-gray-100 text-gray-500',
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default async function MyBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/client-login?redirectTo=/my-bookings')
  }

  const [{ data: conversations }, { data: bookings }, { data: jobPosts }] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, reported, created_at, cooks(name, photo_url)')
      .ilike('client_email', user.email)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, status, preferred_date, city, specific_dishes, text_description, created_at, cooks(name)')
      .ilike('client_email', user.email)
      .order('created_at', { ascending: false }),
    supabase
      .from('job_posts')
      .select('id, status, requested_date, city, text_description, created_at')
      .ilike('client_email', user.email)
      .order('created_at', { ascending: false }),
  ])

  type ConversationRow = { id: string; reported: boolean; created_at: string; cooks: { name: string; photo_url: string | null } | null }
  type BookingRow = { id: string; status: string; preferred_date: string; city: string | null; specific_dishes: string | null; text_description: string | null; created_at: string; cooks: { name: string } | null }
  type JobPostRow = { id: string; status: string; requested_date: string; city: string | null; text_description: string | null; created_at: string }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
      <p className="text-gray-600 mb-10">Everything you&apos;ve sent to cooks, in one place — signed in as {user.email}.</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
        {!conversations || conversations.length === 0 ? (
          <p className="text-sm text-gray-500">No conversations yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(conversations as unknown as ConversationRow[]).map((c) => (
              <a
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 bg-panel rounded-sm border-l-4 border-copper-600 p-4 hover:bg-copper-50 transition-colors"
              >
                {c.cooks?.photo_url ? (
                  <img src={c.cooks.photo_url} alt={c.cooks.name} className="w-10 h-10 rounded-sm object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-sm bg-copper-600 flex items-center justify-center text-paper font-display font-bold shrink-0">
                    {c.cooks?.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{c.cooks?.name ?? 'Cook'}</p>
                  <p className="text-xs text-gray-500">{c.reported ? 'Reported' : 'Message this cook'}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct Bookings</h2>
        {!bookings || bookings.length === 0 ? (
          <p className="text-sm text-gray-500">No bookings yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(bookings as unknown as BookingRow[]).map((b) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{b.specific_dishes || b.text_description || 'Cooking request'}</p>
                  <p className="text-xs text-gray-500">{b.cooks?.name ? `With ${b.cooks.name} — ` : ''}{b.preferred_date}{b.city ? `, ${b.city}` : ''}</p>
                </div>
                <StatusPill status={b.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Cravings Posts</h2>
        {!jobPosts || jobPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(jobPosts as unknown as JobPostRow[]).map((j) => (
              <a
                key={j.id}
                href={`/jobs/${j.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3 hover:border-copper-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{j.text_description || 'Community Cravings post'}</p>
                  <p className="text-xs text-gray-500">{j.requested_date}{j.city ? `, ${j.city}` : ''}</p>
                </div>
                <StatusPill status={j.status} />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
