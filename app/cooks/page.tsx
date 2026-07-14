export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import CookTile from '@/components/CookTile'
import type { CookWithDetails } from '@/lib/types'

const CUISINES = ['South Indian', 'North Indian', 'Bengali', 'Gujarati', 'Maharashtrian', 'Hyderabadi']
const DIETARY = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
const OCCASIONS = ['Daily Meals / Tiffin', 'Festival / Occasion']

export default async function CooksPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; dietary?: string; occasion?: string }>
}) {
  const filters = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('cooks')
    .select('*, cook_verifications(*), cook_scores(*), cook_ratings(*)')
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })

  // "Other" isn't a real stored cuisine value — cooks describe their own
  // food specialty as free text (e.g. "Baking", "Jams & Jellies") instead of
  // picking one literal tag, so filtering for it means matching anything
  // outside the known cuisine list rather than an exact .contains() match.
  const isOtherCuisine = filters.cuisine === 'Other'
  if (filters.cuisine && !isOtherCuisine) {
    query = query.contains('cuisine_types', [filters.cuisine])
  }
  if (filters.dietary) {
    query = query.contains('dietary_specialties', [filters.dietary])
  }
  if (filters.occasion) {
    query = query.contains('occasion_types', [filters.occasion])
  }

  const { data: rawCooks } = await query

  const filteredCooks = isOtherCuisine
    ? (rawCooks || []).filter(c => (c.cuisine_types || []).some((ct: string) => !CUISINES.includes(ct)))
    : (rawCooks || [])

  // Sort by trust score descending — highest trust shown first
  const cooks = [...filteredCooks].sort((a, b) => {
    const scoreA = (a as CookWithDetails).cook_scores?.trust_score ?? 0
    const scoreB = (b as CookWithDetails).cook_scores?.trust_score ?? 0
    return scoreB - scoreA
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find a Home Cook</h1>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-8">
        <select
          name="cuisine"
          defaultValue={filters.cuisine || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Cuisines</option>
          {CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="Other">Other</option>
        </select>

        <select
          name="dietary"
          defaultValue={filters.dietary || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Dietary</option>
          {DIETARY.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          name="occasion"
          defaultValue={filters.occasion || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Occasions</option>
          {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700"
        >
          Filter
        </button>

        {(filters.cuisine || filters.dietary || filters.occasion) && (
          <a href="/cooks" className="text-sm text-gray-500 px-3 py-2 hover:text-orange-600">
            Clear filters
          </a>
        )}
      </form>

      {/* Cook grid */}
      {!cooks || cooks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No cooks found. Check back soon — we are onboarding cooks now.</p>
          <a href="/apply" className="mt-4 inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
            Are you a cook? Apply here
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(cooks as CookWithDetails[]).map((cook) => (
            <CookTile key={cook.id} cook={cook} />
          ))}

        </div>
      )}
    </div>
  )
}
