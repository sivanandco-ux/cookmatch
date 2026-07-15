export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import DashboardActions from './DashboardActions'
import JobInterestActions from './JobInterestActions'
import CookProfileUploads from './CookProfileUploads'
import LogoutButton from './LogoutButton'
import StartJobActions from './StartJobActions'
import { getRequestLabel } from '@/lib/jobLabels'

interface DashboardBooking {
  id: string
  status: string
  client_name: string
  client_email: string
  client_phone: string
  preferred_date: string
  preferred_time: string | null
  job_category: string | null
  request_type: string | null
  occasion_type: string | null
  num_dishes: number | null
  num_people: number | null
  expected_duration_hours: number | null
  city: string | null
  cleanup_needed: boolean | null
  parking_available: boolean | null
  grocery_situation: string | null
  text_description: string | null
  voice_memo_url: string | null
  specific_dishes: string | null
  notes: string | null
  started_at: string | null
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GROCERY_LABELS: Record<string, string> = {
  client_has_everything: 'Client has all ingredients',
  need_grocery_pickup: 'Client needs grocery pickup',
  cook_brings_ingredients: 'Cook brings ingredients',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.')
}

export default async function CookDashboardPage({
  params,
}: {
  params: Promise<{ cook_id: string }>
}) {
  const { cook_id } = await params
  const supabase = getSupabase()

  const { data: cook } = await supabase
    .from('cooks')
    .select('id, name, status, bio, instagram_url, youtube_url')
    .eq('id', cook_id)
    .single()

  if (!cook || cook.status === 'dormant') notFound()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: bookings }, { data: openJobs }, { data: myInterests }, { data: idDocument }, { data: dishes }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .eq('cook_id', cook_id)
      .in('status', ['pending', 'cook_interested', 'confirmed', 'in_progress'])
      .order('preferred_date', { ascending: true }),
    supabase
      .from('job_posts')
      .select('id, job_category, request_type, occasion, requested_date, num_people, num_dishes, specific_dishes, city, client_name, grocery_situation, cleanup_needed, created_at, status')
      .in('status', ['open', 'taken'])
      .gte('requested_date', today)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('job_interests')
      .select('id, cook_confirmed, client_confirmed, created_at, job_posts(id, job_category, request_type, occasion, requested_date, num_people, num_dishes, specific_dishes, city, client_name, client_phone, client_email)')
      .eq('cook_id', cook_id)
      .eq('status', 'pending'),
    supabase
      .from('cook_id_documents')
      .select('cook_id')
      .eq('cook_id', cook_id)
      .maybeSingle(),
    supabase
      .from('cook_dishes')
      .select('*')
      .eq('cook_id', cook_id)
      .order('sort_order', { ascending: true }),
  ])

  const allBookings = (bookings || []) as DashboardBooking[]

  interface MyInterest {
    id: string
    cook_confirmed: boolean
    client_confirmed: boolean
    created_at: string
    job_posts: {
      id: string
      job_category: string
      request_type: string
      occasion: string
      requested_date: string
      num_people: number
      num_dishes: number | null
      specific_dishes: string | null
      city: string
      client_name: string
      client_phone: string
      client_email: string
    } | null
  }

  const activeInterests = ((myInterests || []) as unknown as MyInterest[]).filter(
    i => i.job_posts && i.job_posts.requested_date >= today
  )

  // Batch-load cancellation counts for all client emails across pending + accepted bookings
  const clientEmails = [...new Set(
    allBookings
      .filter(b => b.status === 'pending' || b.status === 'cook_interested')
      .map(b => b.client_email)
      .filter(Boolean)
  )]
  const cancellationCounts: Record<string, number> = {}
  if (clientEmails.length > 0) {
    const { data: cancellations } = await supabase
      .from('client_cancellations')
      .select('client_email')
      .in('client_email', clientEmails)
      .eq('within_48hrs', true)
    for (const row of cancellations || []) {
      cancellationCounts[row.client_email] = (cancellationCounts[row.client_email] || 0) + 1
    }
  }

  const pending = allBookings.filter(b => b.status === 'pending')
  const accepted = allBookings.filter(b => b.status === 'cook_interested')
  const confirmed = allBookings.filter(b => b.status === 'confirmed')
  const inProgress = allBookings.filter(b => b.status === 'in_progress')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Hi {cook.name} — review session briefs and manage your bookings here.</p>
        </div>
        <LogoutButton />
      </div>

      <CookProfileUploads
        cookId={cook_id}
        idUploaded={!!idDocument}
        initialDishes={dishes || []}
        initialBio={cook.bio || ''}
        initialInstagramUrl={cook.instagram_url}
        initialYoutubeUrl={cook.youtube_url}
      />

      {/* Pending — needs action */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          New Session Briefs
          {pending.length > 0 && (
            <span className="ml-2 text-sm font-normal bg-copper-100 text-copper-700 px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">No new briefs right now. Check back soon.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map(booking => (
              <BriefCard
                key={booking.id}
                booking={booking}
                cookId={cook_id}
                mode="pending"
                cancellationCount={cancellationCounts[booking.client_email] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* Waiting for client confirmation */}
      {accepted.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Waiting for Client Confirmation</h2>
          <div className="flex flex-col gap-4">
            {accepted.map(booking => (
              <BriefCard
                key={booking.id}
                booking={booking}
                cookId={cook_id}
                mode="accepted"
                cancellationCount={cancellationCounts[booking.client_email] ?? 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">In Progress</h2>
          <div className="flex flex-col gap-4">
            {inProgress.map(booking => (
              <BriefCard
                key={booking.id}
                booking={booking}
                cookId={cook_id}
                mode="in_progress"
                cancellationCount={0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirmed Sessions</h2>
          <div className="flex flex-col gap-4">
            {confirmed.map(booking => (
              <BriefCard
                key={booking.id}
                booking={booking}
                cookId={cook_id}
                mode="confirmed"
                cancellationCount={0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Jobs the cook has applied for */}
      {activeInterests.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Job Applications</h2>
          <div className="flex flex-col gap-4">
            {activeInterests.map(interest => {
              const job = interest.job_posts!
              const requestedDate = new Date(job.requested_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const categoryLabel = getRequestLabel(job.job_category, job.request_type, job.specific_dishes)
              const isItem = job.request_type === 'item'
              return (
                <div key={interest.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{categoryLabel}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{requestedDate}{isItem ? (job.num_dishes ? ` · Qty ${job.num_dishes}` : '') : ` · ${job.num_people} people`} · {job.city}</p>
                    </div>
                    <span className="text-xs bg-copper-100 text-copper-700 font-medium px-2 py-1 rounded-full whitespace-nowrap">Applied</span>
                  </div>

                  {/* Client contact */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-2">Client contact</p>
                    <p className="text-sm font-medium text-blue-900">{job.client_name}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <a href={`tel:${job.client_phone}`} className="text-sm text-blue-800 hover:underline">📞 {job.client_phone}</a>
                      <a href={`mailto:${job.client_email}`} className="text-sm text-blue-800 hover:underline">✉️ {job.client_email}</a>
                    </div>
                  </div>

                  <JobInterestActions
                    jobId={job.id}
                    interestId={interest.id}
                    cookId={cook_id}
                    cookConfirmed={interest.cook_confirmed}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Available job posts */}
      {openJobs && openJobs.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Community Cravings</h2>
            <a href={`/jobs?cook_id=${cook_id}`} className="text-sm text-copper-600 hover:underline">See all →</a>
          </div>
          <div className="flex flex-col gap-3">
            {(openJobs as { id: string; job_category: string; request_type: string; occasion: string; requested_date: string; num_people: number; num_dishes: number | null; specific_dishes: string | null; city: string; client_name: string | null; grocery_situation: string; cleanup_needed: boolean; created_at: string; status: string }[]).map(job => {
              const requestedDate = new Date(job.requested_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const categoryLabel = getRequestLabel(job.job_category, job.request_type, job.specific_dishes)
              const isItem = job.request_type === 'item'
              const isTaken = job.status === 'taken'
              const postedAt = new Date(job.created_at)
              const postedLabel = postedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }) +
                ' at ' + postedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }) + ' PST'
              return (
                <a
                  key={job.id}
                  href={`/jobs/${job.id}?cook_id=${cook_id}`}
                  className={`border rounded-xl p-4 flex flex-col gap-2 transition-colors ${isTaken ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-copper-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium ${isTaken ? 'text-gray-500' : 'text-gray-900'}`}>
                        {job.client_name ? `Posted by ${getInitials(job.client_name)} for ${categoryLabel}` : categoryLabel}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{requestedDate}{isItem ? (job.num_dishes ? ` · Qty ${job.num_dishes}` : '') : ` · ${job.num_people} people`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Posted {postedLabel}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isTaken
                        ? <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Cook assigned</span>
                        : <span className="text-xs text-copper-600 font-medium">View →</span>
                      }
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">📍 {job.city}</span>
                    {job.grocery_situation === 'need_grocery_pickup' && (
                      <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-full">🛒 Grocery pickup</span>
                    )}
                    {job.cleanup_needed && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🧹 Cleanup</span>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <a href={`/availability/${cook_id}`} className="text-sm text-copper-600 hover:underline">
          Update your availability →
        </a>
      </div>
    </div>
  )
}

function BriefCard({ booking, cookId, mode, cancellationCount }: { booking: DashboardBooking; cookId: string; mode: 'pending' | 'accepted' | 'confirmed' | 'in_progress'; cancellationCount: number }) {
  const statusColors = {
    pending: 'bg-amber-50 border-amber-200',
    accepted: 'bg-blue-50 border-blue-200',
    confirmed: 'bg-green-50 border-green-200',
    in_progress: 'bg-copper-50 border-copper-200',
  }

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-4 ${statusColors[mode]}`}>
      {/* Summary row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">
            {getRequestLabel(booking.job_category, booking.request_type, booking.specific_dishes)}
            {' · '}
            {booking.occasion_type}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {formatDate(booking.preferred_date)}
            {booking.preferred_time ? ` at ${booking.preferred_time}` : ''}
            {booking.request_type === 'item'
              ? (booking.num_dishes ? ` · Qty ${booking.num_dishes}` : '')
              : <>{' · '}{booking.num_people} people{' · '}{booking.expected_duration_hours}+ hrs</>}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {booking.city}
            {booking.cleanup_needed ? ' · Cleanup included' : ''}
            {booking.parking_available ? ' · Parking available' : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
          mode === 'pending' ? 'bg-amber-100 text-amber-700' :
          mode === 'accepted' ? 'bg-blue-100 text-blue-700' :
          mode === 'in_progress' ? 'bg-copper-100 text-copper-700' :
          'bg-green-100 text-green-700'
        }`}>
          {mode === 'pending' ? 'Needs response' : mode === 'accepted' ? 'Awaiting client' : mode === 'in_progress' ? 'In progress' : 'Confirmed'}
        </span>
      </div>

      {/* Grocery situation — not meaningful for a specific-item order, only
          for a cooking session where ingredients need to come from somewhere */}
      {booking.request_type !== 'item' && (
        <p className="text-sm text-gray-600">
          {GROCERY_LABELS[booking.grocery_situation ?? ''] ?? booking.grocery_situation}
        </p>
      )}

      {/* Written description */}
      {booking.text_description && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Written description</p>
          <p className="text-sm text-gray-800">{booking.text_description}</p>
        </div>
      )}

      {/* Voice memo */}
      {booking.voice_memo_url && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Voice memo</p>
          <audio src={booking.voice_memo_url} controls className="w-full h-10" />
        </div>
      )}

      {/* Specific dishes — for an item order this is already the header
          title, so showing it again here would be redundant */}
      {booking.request_type !== 'item' && booking.specific_dishes && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Dishes: </span>{booking.specific_dishes}
        </p>
      )}

      {/* Additional notes */}
      {booking.notes && (
        <p className="text-sm text-gray-500 italic">{booking.notes}</p>
      )}

      {/* Confirmed / in progress — show client contact */}
      {(mode === 'confirmed' || mode === 'in_progress') && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Client contact</p>
          <p className="text-sm font-medium">{booking.client_name}</p>
          <p className="text-sm text-gray-600">{booking.client_phone}</p>
        </div>
      )}

      {mode === 'in_progress' && booking.started_at && (
        <p className="text-xs text-gray-500">
          Started {new Date(booking.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </p>
      )}

      {/* Client cancellation history */}
      {cancellationCount > 0 && mode !== 'confirmed' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800 font-medium">
            This client has cancelled within 48 hours on {cancellationCount} previous {cancellationCount === 1 ? 'occasion' : 'occasions'}.
          </p>
        </div>
      )}

      {/* Actions */}
      {mode === 'pending' && (
        <DashboardActions bookingId={booking.id as string} cookId={cookId} />
      )}

      {mode === 'accepted' && (
        <p className="text-xs text-gray-500">Waiting for the client to confirm. You will be notified when they do.</p>
      )}

      {mode === 'confirmed' && (
        <StartJobActions bookingId={booking.id as string} cookId={cookId} />
      )}
    </div>
  )
}
