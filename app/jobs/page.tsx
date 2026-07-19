export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { getRequestLabel } from '@/lib/jobLabels'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

function getInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).join('.')
}

interface JobTile {
  id: string
  job_category: string
  request_type: string
  occasion: string
  client_name?: string
  requested_date: string
  requested_time: string | null
  expected_duration_hours: number
  num_people: number
  dietary_restrictions: string[]
  grocery_situation: string
  cleanup_needed: boolean
  city: string
  state: string | null
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
  searchParams: Promise<{ state?: string; item?: string }>
}) {
  const filters = await searchParams
  const supabase = getSupabase()

  // Cook identity is derived from the actual login session, never from a URL
  // param — otherwise anyone could see the cook-only view by pasting a
  // guessed ?cook_id= into the URL, and a genuinely logged-in cook would lose
  // that view the moment a link (or a bookmark, or an email link) didn't
  // happen to carry it.
  let isCook = false
  let cookName = ''
  let cook_id: string | undefined

  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (user) {
    const { data: cook } = await supabase
      .from('cooks')
      .select('id, name, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (cook && cook.status === 'active') {
      isCook = true
      cookName = cook.name
      cook_id = cook.id
    }
  }

  const selectFields = isCook
    ? '*'
    : 'id, job_category, request_type, occasion, requested_date, requested_time, expected_duration_hours, num_people, num_dishes, specific_dishes, dietary_restrictions, grocery_situation, cleanup_needed, city, state, recurring, status, created_at, voice_memo_url, client_name'

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('job_posts')
    .select(selectFields)
    .in('status', ['open', 'taken'])
    .gte('requested_date', today)
    .order('created_at', { ascending: false })

  if (filters.state) query = query.eq('state', filters.state)
  if (filters.item) query = query.eq('specific_dishes', filters.item)

  const { data: jobs } = await query
  const jobList = (jobs || []) as unknown as JobTile[]

  // State options come from the open/upcoming board itself — independent of
  // the current filter selections, otherwise picking an item would narrow
  // the state dropdown's own options, which reads as broken rather than
  // helpful. Item options are different: they come from what cooks have
  // actually entered as sellable items (same source as /api/specialties?
  // type=item), not from job_posts.specific_dishes — that reflects only
  // whatever's currently been requested, which is sparse/empty early on and
  // says nothing about what cooks can actually make.
  const [{ data: facetRows }, { data: itemCooks }] = await Promise.all([
    supabase
      .from('job_posts')
      .select('state')
      .in('status', ['open', 'taken'])
      .gte('requested_date', today),
    supabase
      .from('cooks')
      .select('cuisine_types')
      .in('status', ['active', 'pending'])
      .contains('offering_types', ['item']),
  ])

  const stateOptions = [...new Set((facetRows || []).map(r => r.state).filter((s): s is string => !!s))].sort()
  const itemOptions = [...new Set(
    (itemCooks || []).flatMap(c => (c.cuisine_types as string[] | null) || [])
  )].sort()

  return (
    <div className={`${isCook ? 'max-w-4xl' : 'max-w-7xl'} mx-auto px-6 py-10`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Cravings</h1>
          <p className="text-gray-600">
            {isCook
              ? `Welcome ${cookName} — these clients are looking for a cook. Express interest in cravings that match your skills.`
              : 'Clients looking for a home cook. Post your own craving or browse available cooks.'}
          </p>
        </div>
        <Link
          href="/jobs/post"
          className="bg-copper-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-copper-700 whitespace-nowrap self-start"
        >
          Post Your Craving
        </Link>
      </div>

      {!isCook && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-800">
          Are you an approved cook? Access the full craving details and express interest from your{' '}
          <span className="font-medium">cook dashboard</span>.
        </div>
      )}

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-8">
        <select
          name="state"
          defaultValue={filters.state || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All States</option>
          {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          name="item"
          defaultValue={filters.item || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Items</option>
          {itemOptions.map(i => <option key={i} value={i}>{i}</option>)}
        </select>

        <button
          type="submit"
          className="bg-copper-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-copper-700"
        >
          Filter
        </button>

        {(filters.state || filters.item) && (
          <a href="/jobs" className="text-sm text-gray-500 px-3 py-2 hover:text-copper-600">
            Clear filters
          </a>
        )}
      </form>

      {jobList.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">No open cravings right now.</p>
          <Link href="/jobs/post" className="bg-copper-600 text-white px-6 py-3 rounded-lg hover:bg-copper-700 inline-block">
            Post Your Craving
          </Link>
        </div>
      ) : isCook ? (
        <div className="flex flex-col gap-4">
          {jobList.map(job => (
            <JobCard key={job.id} job={job} isCook={isCook} cookId={cook_id} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobList.map(job => (
            <JobCard key={job.id} job={job} isCook={isCook} cookId={cook_id} />
          ))}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, isCook, cookId }: { job: JobTile; isCook: boolean; cookId?: string }) {
  const postedAt = new Date(job.created_at)
  const postedLabel = postedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' }) +
    ' at ' + postedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' }) + ' PST'
  const needsGrocery = job.grocery_situation === 'need_grocery_pickup'
  const isTaken = job.status === 'taken'
  const isItem = job.request_type === 'item'
  const categoryLabel = getRequestLabel(job.job_category, job.request_type, job.specific_dishes)

  return (
    <div className={`bg-panel rounded-sm border-l-4 p-5 flex flex-col gap-3 h-full ${isTaken ? 'border-l-amber-400 opacity-80' : 'border-l-copper-600'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`font-display font-bold ${isTaken ? 'text-gray-500' : 'text-gray-900'}`}>
            {job.client_name ? `Posted by ${getInitials(job.client_name)} for ${categoryLabel}` : categoryLabel}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(job.requested_date)}{isItem ? (job.num_dishes ? ` · Qty ${job.num_dishes}` : '') : ` · ${job.num_people} people`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isTaken
            ? <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded-full">Cook assigned</span>
            : <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full">Open</span>
          }
          <span className="text-xs text-gray-400">Posted {postedLabel}</span>
        </div>
      </div>

      {/* Key highlights */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10.5px] font-semibold bg-brass/20 text-copper-800 rounded-sm px-2 py-0.5">📍 {[job.city, job.state].filter(Boolean).join(', ')}</span>
        {job.voice_memo_url && (
          <span className="text-xs bg-copper-50 text-copper-700 border border-copper-200 px-2.5 py-1 rounded-full">🎙 Voice memo</span>
        )}
        {needsGrocery && (
          <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-full">🛒 Grocery pickup needed</span>
        )}
        {job.cleanup_needed && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">🧹 Cleanup needed</span>
        )}
        {job.parking_available && (
          <span className="text-[10.5px] font-semibold bg-brass/20 text-copper-800 rounded-sm px-2 py-0.5">🅿️ Parking available</span>
        )}
        {job.dietary_restrictions?.length > 0 && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">{job.dietary_restrictions.join(', ')}</span>
        )}
      </div>

      {/* Cook-only: full brief */}
      {isCook && (
        <>
          {job.text_description && (
            <div className="bg-paper rounded-sm p-3 border border-copper-100">
              <p className="text-xs text-gray-500 mb-1">Written description</p>
              <p className="text-sm text-gray-800">{job.text_description}</p>
            </div>
          )}
          {job.voice_memo_url && (
            <div className="bg-paper rounded-sm p-3 border border-copper-100">
              <p className="text-xs text-gray-500 mb-2">Voice memo</p>
              <audio src={job.voice_memo_url} controls className="w-full h-10" />
            </div>
          )}
          {job.request_type !== 'item' && job.specific_dishes && (
            <p className="text-sm text-gray-600"><span className="font-medium">Dishes: </span>{job.specific_dishes}</p>
          )}
          {job.language_preferred && (
            <p className="text-sm text-gray-500">Language preferred: {job.language_preferred}</p>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1 mt-auto">
        <Link
          href={`/jobs/${job.id}${cookId ? `?cook_id=${cookId}` : ''}`}
          className="text-sm text-copper-600 hover:underline"
        >
          View details →
        </Link>
        {isCook && cookId && !isTaken && (
          <Link
            href={`/jobs/${job.id}?cook_id=${cookId}#interest`}
            className="ml-auto text-sm bg-copper-600 text-white px-4 py-1.5 rounded-lg hover:bg-copper-700"
          >
            I want this job
          </Link>
        )}
      </div>
    </div>
  )
}
