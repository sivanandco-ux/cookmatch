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

function formatName(fullName: string) {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return fullName
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${parts[0]} ${lastInitial}.`
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
  }[cook.price_unit] ?? '/session'

  const isPending = cook.status === 'pending'

  return (
    <Link href={`/cooks/${cook.id}`} className="block">
      <div className={`bg-white rounded-xl border hover:shadow-md transition-all overflow-hidden h-full flex flex-col ${isPending ? 'border-amber-300 opacity-80' : 'border-gray-200 hover:border-orange-300'}`}>

        {/* Pending banner */}
        {isPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-medium text-center">
            Profile under review — pending approval
          </div>
        )}

        {/* Hero gradient + overlapping photo */}
        <div className="relative h-24 bg-gradient-to-br from-amber-100 via-orange-100 to-orange-200 flex-shrink-0">
          <div className="absolute -bottom-7 left-4">
            {cook.photo_url ? (
              <img
                src={cook.photo_url}
                alt={cook.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-md">
                {cook.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Card content */}
        <div className="pt-10 px-4 pb-4 flex flex-col gap-3 flex-1">

          {/* Name + tagline */}
          <div>
            <h3 className="font-semibold text-gray-900">{formatName(cook.name)}</h3>
            <p className="text-xs text-gray-500">{cook.tagline}</p>
          </div>

          {/* Rating */}
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
          {cook.price_min > 0 ? (
            <p className="text-sm font-medium text-gray-900">
              ${cook.price_min}
              <span className="text-gray-400 font-normal">{priceLabel}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">Rate negotiable</p>
          )}

          {/* Verified badges */}
          <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
            {verification?.id_verified && <VerifiedBadge label="ID" />}
            {verification?.background_check_passed && <VerifiedBadge label="Background" />}
            {verification?.food_handler_certified && <VerifiedBadge label="Food Handler" />}
            {verification?.references_verified && <VerifiedBadge label="References" />}
          </div>

          {cook.available_recurring && (
            <p className="text-xs text-green-600">Available for recurring bookings</p>
          )}
        </div>
      </div>
    </Link>
  )
}
