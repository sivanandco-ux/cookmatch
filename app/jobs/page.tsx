export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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

const GROCERY_LABELS: Record<string, string> = {
  client_has_everything: 'Ingredients ready',
  need_grocery_pickup: 'Needs grocery pickup',
  cook_brings_ingredients: 'Cook brings ingredients',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface JobTile {
  id: string
  job_category: string
  occasion: string
  requested_date: string
  requested_time: string | null
  expected_duration_hours: number
  num_people: number
  dietary_restrictions: string[]
  grocery_situation: string
  cleanup_needed: boolean
  city: string
  recurring: boolean
  status: string
  created_at: string
  // Full brief fields (cook view only)
  text_description?: string | null
  voice_memo_url?: string | null
  specific_dishes?: string | null
  num_dishes?: number | null
  kitchen_access_time?: string | null
  language_preferred?: string | null
  parking_available?: boolean | null
  additional_notes?: string | null
}

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ cook_id?: string }>
}) {
  const { cook_id } = await searchParams
  const supabase = getSupabase()

  // Verify cook_id if provided
  let isCook = false
  let cookName = ''
  if (cook_id) {
    const { data: cook } = await supabase
      .from('cooks')
      .select('name, status')
      .eq('id', cook_id)
      .single()
    if (cook && cook.status === 'active') {
      isCook = true
      cookName = cook.name
    }
  }

  const selectFields = isCook
    ? '*'
    : 'id, job_category, occasion, requested_date, requested_time, expected_duration_hours, num_people, dietary_restrictions, grocery_situation, cleanup_needed, city, recurring, status, created_at'

  const { data: jobs } = await supabase
    .from('job_posts')
    .select(selectFields)
    .eq('status', 'open')
    .order('requested_date', { ascending: true })

  const jobList = (jobs || []) as unknown as JobTile[]

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Board</h1>
          <p className="text-gray-600">
            {isCook
              ? `Welcome ${cookName} — these clients are looking for a cook. Express interest in jobs that match your skills.`
              : 'Clients looking for a home cook. Post your own job or browse available cooks.'}
          </p>
        </div>
        <Link
          href="/jobs/post"
          className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 whitespace-nowrap"
        >
          Post a Job
        </Link>
      </div>

      {!isCook && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          Are you a verified cook? Access the full job brief and express interest from your{' '}
          <span className="font-medium">cook dashboard</span>.
        </div>
      )}

      {jobList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No open jobs right now.</p>
          <Link href="/jobs/post" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 inline-block">
            Post a Job
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobList.map(job => (
            <JobCard key={job.id} job={job} isCook={isCook} cookId={cook_id} />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, isCook, cookId }: { job: JobTile; isCook: boolean; cookId?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">
            {CATEGORY_LABELS[job.job_category] ?? job.job_category} · {job.occasion}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {formatDate(job.requested_date)}
            {job.requested_time ? ` at ${job.requested_time}` : ''}
            {' · '}{job.num_people} people{' · '}{job.expected_duration_hours}+ hrs
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {job.city}
            {job.cleanup_needed ? ' · Cleanup needed' : ''}
            {job.parking_available ? ' · Parking available' : ''}
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full whitespace-nowrap">Open</span>
      </div>

      {/* Dietary */}
      {job.dietary_restrictions?.length > 0 && (
        <p className="text-sm text-gray-600">{job.dietary_restrictions.join(', ')}</p>
      )}

      {/* Grocery */}
      <p className="text-sm text-gray-500">{GROCERY_LABELS[job.grocery_situation] ?? job.grocery_situation}</p>

      {/* Cook-only: full brief */}
      {isCook && (
        <>
          {job.text_description && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Written description</p>
              <p className="text-sm text-gray-800">{job.text_description}</p>
            </div>
          )}
          {job.voice_memo_url && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Voice memo</p>
              <audio src={job.voice_memo_url} controls className="w-full h-10" />
            </div>
          )}
          {job.specific_dishes && (
            <p className="text-sm text-gray-600"><span className="font-medium">Dishes: </span>{job.specific_dishes}</p>
          )}
          {job.language_preferred && (
            <p className="text-sm text-gray-500">Language preferred: {job.language_preferred}</p>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link
          href={`/jobs/${job.id}${cookId ? `?cook_id=${cookId}` : ''}`}
          className="text-sm text-orange-600 hover:underline"
        >
          View details →
        </Link>
        {isCook && cookId && (
          <Link
            href={`/jobs/${job.id}?cook_id=${cookId}#interest`}
            className="ml-auto text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700"
          >
            I want this job
          </Link>
        )}
      </div>
    </div>
  )
}
