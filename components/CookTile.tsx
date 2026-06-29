'use client'

import Link from 'next/link'
import type { CookWithDetails } from '@/lib/types'

function StarRating({ score, count }: { score: number; count: number }) {
  return (
    <span className="flex items-center gap-1 text-sm">
      <span className="text-yellow-500">★</span>
      <span className="font-medium">{score.toFixed(1)}</span>
      <span className="text-gray-400">({count} sessions)</span>
    </span>
  )
}

function VerifiedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
      <span>✓</span> {label}
    </span>
  )
}

export default function CookTile({ cook }: { cook: CookWithDetails }) {
  const verification = cook.cook_verifications
  const score = cook.cook_scores
  const sessionCount = score?.session_count ?? 0
  const hasRating = sessionCount >= 3
  const isTraining = cook.status === 'training'

  const priceLabel = {
    hourly: '/hr',
    per_session: '/session',
    per_person: '/person',
    monthly: '/month',
  }[cook.price_unit] ?? '/session'

  return (
    <Link href={`/cooks/${cook.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all p-5 h-full flex flex-col gap-3">

        {/* Photo + name */}
        <div className="flex items-center gap-3">
          {cook.photo_url ? (
            <img src={cook.photo_url} alt={cook.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xl font-bold">
              {cook.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{cook.name}</h3>
            <p className="text-sm text-gray-500">{cook.tagline}</p>
          </div>
        </div>

        {/* Rating or New Cook badge */}
        <div>
          {hasRating && score ? (
            <StarRating score={score.overall_score} count={sessionCount} />
          ) : (
            <span className="inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
              {isTraining ? 'Waiting for Opportunities' : 'New Cook'}
            </span>
          )}
        </div>

        {/* Cuisine tags */}
        <div className="flex flex-wrap gap-1">
          {cook.cuisine_types.slice(0, 3).map((c) => (
            <span key={c} className="text-xs bg-orange-50 text-orange-700 rounded-full px-2 py-0.5">
              {c}
            </span>
          ))}
        </div>

        {/* Dietary */}
        <p className="text-xs text-gray-500">{cook.dietary_specialties.join(' · ')}</p>

        {/* Price */}
        <p className="text-sm font-medium text-gray-900">
          ${cook.price_min}–${cook.price_max}
          <span className="text-gray-400 font-normal">{priceLabel}</span>
        </p>

        {/* Verified badges */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
          {verification?.id_verified && <VerifiedBadge label="ID" />}
          {verification?.background_check_passed && <VerifiedBadge label="Background" />}
          {verification?.food_handler_certified && <VerifiedBadge label="Food Handler" />}
          {verification?.references_verified && <VerifiedBadge label="References" />}
        </div>

        {/* Availability */}
        {cook.available_recurring && (
          <p className="text-xs text-green-600">Available for recurring bookings</p>
        )}
      </div>
    </Link>
  )
}
