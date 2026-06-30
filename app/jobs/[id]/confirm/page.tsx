export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ConfirmJobActions from './ConfirmJobActions'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  family_cooking: 'Family Cooking',
  small_event: 'Small Event',
  medium_event: 'Medium Event',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function ConfirmJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ interest_id?: string }>
}) {
  const { id } = await params
  const { interest_id } = await searchParams
  const supabase = getSupabase()

  if (!interest_id) notFound()

  const [{ data: job }, { data: interest }] = await Promise.all([
    supabase.from('job_posts').select('*').eq('id', id).single(),
    supabase
      .from('job_interests')
      .select('*, cooks(id, name, tagline, photo_url, cuisine_types, years_experience, cook_scores(overall_score, session_count))')
      .eq('id', interest_id)
      .eq('job_post_id', id)
      .single(),
  ])

  if (!job || !interest) notFound()

  const cook = interest.cooks as {
    id: string
    name: string
    tagline: string
    photo_url: string | null
    cuisine_types: string[]
    years_experience: number
    cook_scores: { overall_score: number; session_count: number } | null
  } | null

  if (job.status === 'taken') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Already confirmed</h1>
        <p className="text-gray-600">This job has been filled. Check your email for contact details.</p>
      </div>
    )
  }

  if (job.status !== 'open' || interest.status !== 'pending') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">This confirmation link is no longer active.</p>
        <a href="/jobs" className="mt-4 inline-block text-orange-600 hover:underline text-sm">View job board →</a>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">A cook wants your job</h1>
      <p className="text-gray-500 text-sm mb-8">Review their profile and confirm to complete the booking.</p>

      {/* Cook profile summary */}
      {cook && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-start gap-4">
          {cook.photo_url ? (
            <img src={cook.photo_url} alt={cook.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl font-bold flex-shrink-0">
              {cook.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{cook.name}</p>
            <p className="text-sm text-gray-500">{cook.tagline}</p>
            <p className="text-sm text-gray-500 mt-1">{cook.cuisine_types.join(', ')}</p>
            {cook.cook_scores && cook.cook_scores.session_count >= 3 && (
              <p className="text-sm text-yellow-600 mt-1">
                ★ {cook.cook_scores.overall_score.toFixed(1)} · {cook.cook_scores.session_count} sessions
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">{cook.years_experience} years experience</p>
          </div>
        </div>
      )}

      {/* Job summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Job</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Type</span>
            <span className="font-medium text-gray-900">{CATEGORY_LABELS[job.job_category] ?? job.job_category}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-gray-900">{formatDate(job.requested_date)}</span>
          </div>
          <div className="flex justify-between">
            <span>People</span>
            <span className="font-medium text-gray-900">{job.num_people}</span>
          </div>
          <div className="flex justify-between">
            <span>Location</span>
            <span className="font-medium text-gray-900">{job.city}</span>
          </div>
        </div>
      </div>

      {/* Commitment statement */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-orange-900 mb-2">Before you confirm</p>
        <p className="text-sm text-orange-800">
          {cook?.name} is ready to cook for you on {formatDate(job.requested_date)}.
          By confirming, you commit to be home and ready at the agreed time. Last-minute cancellations affect the cook&apos;s livelihood.
        </p>
        <p className="text-xs text-orange-700 mt-2">
          Free cancellation up to 48 hours before. Cancellations within 48 hours are logged on your profile.
        </p>
      </div>

      <ConfirmJobActions jobId={id} interestId={interest_id} />
    </div>
  )
}
