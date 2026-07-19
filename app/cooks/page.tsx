export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import CookTile from '@/components/CookTile'
import type { CookWithDetails } from '@/lib/types'
import { US_STATES } from '@/lib/usStates'

const DIETARY = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian']
const AVAILABILITY = ['Available regularly', 'Made to order', 'Seasonal or festival-only']

export default async function CooksPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; dietary?: string; occasion?: string; state?: string }>
}) {
  const filters = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('cooks')
    .select('*, cook_verifications(*), cook_scores(*), cook_ratings(*), cook_dishes(*)')
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })

  if (filters.cuisine) {
    query = query.contains('cuisine_types', [filters.cuisine])
  }
  if (filters.dietary) {
    query = query.contains('dietary_specialties', [filters.dietary])
  }
  if (filters.occasion) {
    query = query.contains('occasion_types', [filters.occasion])
  }
  if (filters.state) {
    query = query.eq('state', filters.state)
  }

  // The specialty dropdown's own options come from every cook's actual
  // entries, independent of the other filters currently selected —
  // otherwise picking a state would narrow the specialty list's own
  // options, which reads as broken rather than helpful (same principle
  // as the Community Cravings state/item filters).
  const [{ data: rawCooks }, { data: allCooks }] = await Promise.all([
    query,
    supabase.from('cooks').select('cuisine_types').in('status', ['active', 'pending']),
  ])

  const specialtyOptions = [...new Set(
    (allCooks || []).flatMap(c => (c.cuisine_types as string[] | null) || [])
  )].sort()

  // Sort by trust score descending — highest trust shown first
  const cooks = [...(rawCooks || [])].sort((a, b) => {
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
          <option value="">All Specialties</option>
          {specialtyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
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
          <option value="">All Availability</option>
          {AVAILABILITY.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <select
          name="state"
          defaultValue={filters.state || ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          type="submit"
          className="bg-copper-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-copper-700"
        >
          Filter
        </button>

        {(filters.cuisine || filters.dietary || filters.occasion || filters.state) && (
          <a href="/cooks" className="text-sm text-gray-500 px-3 py-2 hover:text-copper-600">
            Clear filters
          </a>
        )}
      </form>

      {/* Cook grid */}
      {!cooks || cooks.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No cooks found. Check back soon — we are onboarding cooks now.</p>
          <a href="/apply" className="mt-4 inline-block bg-copper-600 text-white px-6 py-3 rounded-lg hover:bg-copper-700">
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
