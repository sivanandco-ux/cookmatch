export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import JobInterestButton from './JobInterestButton'
import ReportButton from './ReportButton'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { getRequestLabel } from '@/lib/jobLabels'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const GROCERY_LABELS: Record<string, string> = {
  client_has_everything: 'Client has all ingredients ready',
  need_grocery_pickup: 'Client needs grocery pickup',
  cook_brings_ingredients: 'Cook brings ingredients',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cook_id?: string }>
}) {
  const { id } = await params
  const { cook_id: cookIdParam } = await searchParams
  const supabase = getSupabase()
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()

  // A cook_id in the URL claims to identify a specific cook — verify the
  // logged-in session actually owns that cook, so a stale/guessed/foreign
  // cook_id can't be used to impersonate. The cook view itself is always
  // driven by the session below, never by this param, so it also works
  // when someone reaches this page without a cook_id in the URL at all
  // (e.g. via the top nav, a bookmark, or an email link).
  if (cookIdParam) {
    const currentPath = `/jobs/${id}?cook_id=${cookIdParam}`

    if (!user) {
      redirect(`/login?error=not_authorized&redirectTo=${encodeURIComponent(currentPath)}`)
    }

    const { data: ownedCook } = await supabase
      .from('cooks')
      .select('user_id')
      .eq('id', cookIdParam)
      .maybeSingle()

    if (!ownedCook || ownedCook.user_id !== user.id) {
      redirect(`/login?error=not_authorized&redirectTo=${encodeURIComponent(currentPath)}`)
    }
  }

  const [{ data: job }, cookResult] = await Promise.all([
    supabase.from('job_posts').select('*').eq('id', id).single(),
    user
      ? supabase.from('cooks').select('id, name, status').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!job) notFound()

  const cook = cookResult.data
  const isCook = !!(cook && cook.status === 'active')
  const cook_id = cook?.id

  // Check if cook already expressed interest and get full status
  let existingInterest: { id: string; cook_confirmed: boolean; client_confirmed: boolean } | null = null
  if (isCook && cook_id) {
    const { data: existing } = await supabase
      .from('job_interests')
      .select('id, cook_confirmed, client_confirmed')
      .eq('job_post_id', id)
      .eq('cook_id', cook_id)
      .single()
    existingInterest = existing ?? null
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <a href={`/jobs${cook_id ? `?cook_id=${cook_id}` : ''}`} className="text-sm text-copper-600 hover:underline mb-6 inline-block">
        ← Back to job board
      </a>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getRequestLabel(job.job_category, job.request_type, job.specific_dishes)}
          </h1>
          {job.client_name && <p className="text-gray-600 mt-1">Posted by {job.client_name}</p>}
          <p className="text-gray-500 mt-1">{job.city}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          job.status === 'open' ? 'bg-green-100 text-green-700' :
          job.status === 'taken' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{formatDate(job.requested_date)}</p>
          </div>
          {job.requested_time && (
            <div>
              <p className="text-gray-500">Time</p>
              <p className="font-medium">{job.requested_time}</p>
            </div>
          )}
          {job.request_type !== 'item' && (
            <>
              <div>
                <p className="text-gray-500">People</p>
                <p className="font-medium">{job.num_people}</p>
              </div>
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-medium">{job.expected_duration_hours}+ hours</p>
              </div>
            </>
          )}
          {job.request_type !== 'item' && !!job.num_dishes && (
            <div>
              <p className="text-gray-500">Dishes</p>
              <p className="font-medium">{job.num_dishes}</p>
            </div>
          )}
          {job.request_type === 'item' && (
            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="font-medium">Set by cook</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Session</p>
            <p className="font-medium">{job.recurring ? 'Recurring' : 'One-time'}</p>
          </div>
        </div>

        {job.dietary_restrictions?.length > 0 && (
          <div>
            <p className="text-sm text-gray-500">Dietary</p>
            <p className="text-sm font-medium">{job.dietary_restrictions.join(', ')}</p>
          </div>
        )}

        {job.request_type !== 'item' && (
          <p className="text-sm text-gray-600">{GROCERY_LABELS[job.grocery_situation] ?? job.grocery_situation}</p>
        )}

        <div className="flex gap-4 text-sm text-gray-500">
          {job.cleanup_needed && <span>Cleanup needed</span>}
          {job.parking_available && <span>Parking available</span>}
        </div>
      </div>

      {/* Cook-only: full brief */}
      {isCook && (
        <div className="flex flex-col gap-4 mb-6">
          {job.text_description && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">Written description</p>
              <p className="text-sm text-gray-800 leading-relaxed">{job.text_description}</p>
            </div>
          )}
          {job.voice_memo_url && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-2">Voice memo</p>
              <audio src={job.voice_memo_url} controls className="w-full" />
            </div>
          )}
          {job.request_type !== 'item' && job.specific_dishes && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">Specific dishes requested</p>
              <p className="text-sm text-gray-800">{job.specific_dishes}</p>
            </div>
          )}
          {job.language_preferred && (
            <p className="text-sm text-gray-500">Language preferred: <span className="font-medium text-gray-800">{job.language_preferred}</span></p>
          )}
          {job.additional_notes && (
            <p className="text-sm text-gray-500 italic">{job.additional_notes}</p>
          )}
        </div>
      )}

      {!isCook && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          Full brief — including voice memo and description — is visible to cooks only.
          Access this page from your cook dashboard to see all details.
        </div>
      )}

      {/* Interest button — cook view, job still open */}
      {isCook && cook_id && job.status === 'open' && (
        <div id="interest">
          <JobInterestButton
            jobId={id}
            cookId={cook_id}
            existingInterest={existingInterest}
          />
        </div>
      )}

      {/* Report button — cook only */}
      {isCook && cook_id && (
        <ReportButton jobId={id} cookId={cook_id} />
      )}
    </div>
  )
}
