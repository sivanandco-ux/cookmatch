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

function formatName(fullName: string) {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return fullName
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${parts[0]} ${lastInitial}.`
}

export default function CookTile({ cook }: { cook: CookWithDetails }) {
  const score = cook.cook_scores
  const sessionCount = score?.session_count ?? 0
  const hasRating = sessionCount >= 3
  const isTraining = cook.status === 'training'

  const priceLabel = cook.price_unit === 'hourly' ? '/hr'
    : cook.price_unit === 'per_session' ? '/session'
    : cook.price_unit ? ` / ${cook.price_unit}` : '/session'

  const isPending = cook.status === 'pending'

  return (
    <Link href={`/cooks/${cook.id}`} className="block">
      <div className={`bg-panel rounded-sm border-l-4 hover:shadow-sm transition-all overflow-hidden h-full flex flex-col ${isPending ? 'border-l-amber-400 opacity-80' : 'border-l-copper-600 hover:border-l-copper-800'}`}>

        {/* Pending banner */}
        {isPending && (
          <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-medium text-center">
            Profile under review — pending approval
          </div>
        )}

        {/* Card content */}
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Avatar */}
          {cook.photo_url ? (
            <img
              src={cook.photo_url}
              alt={cook.name}
              className="w-10 h-10 rounded-sm object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-sm bg-copper-600 flex items-center justify-center text-paper text-base font-display font-bold">
              {cook.name.charAt(0)}
            </div>
          )}

          {/* Name + tagline */}
          <div>
            <h3 className="font-display font-bold text-gray-900">{formatName(cook.name)}</h3>
            <p className="text-sm text-gray-600">{cook.tagline}</p>
            {(cook.service_areas[0] || cook.state) && (
              <p className="text-sm text-gray-600 mt-0.5">
                📍 {[cook.service_areas[0], cook.state].filter(Boolean).join(', ')}
              </p>
            )}
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
          <div className="flex flex-wrap gap-1.5">
            {cook.cuisine_types.slice(0, 3).map((c) => (
              <span key={c} className="text-xs font-semibold bg-brass/20 text-copper-800 rounded-sm px-2 py-0.5">
                {c}
              </span>
            ))}
          </div>

          {/* Dietary */}
          <p className="text-sm text-gray-600">{cook.dietary_specialties.join(' · ')}</p>

          {/* Dish photos */}
          {cook.cook_dishes && cook.cook_dishes.length > 0 && (
            <div className="flex gap-2">
              {cook.cook_dishes.slice(0, 3).map(dish => (
                <img
                  key={dish.id}
                  src={dish.photo_url}
                  alt={dish.description || 'Dish photo'}
                  className="flex-1 min-w-0 aspect-square rounded-sm object-cover border border-copper-100"
                />
              ))}
              {cook.cook_dishes.length > 3 && (
                <div className="flex-1 min-w-0 aspect-square rounded-sm bg-copper-50 border border-copper-100 flex items-center justify-center text-sm text-gray-400 font-medium">
                  +{cook.cook_dishes.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Price */}
          {cook.price_min > 0 ? (
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">${cook.price_min}</span>{priceLabel}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Rate negotiable</p>
          )}

          {cook.available_recurring && (
            <p className="text-xs text-green-600">Available for recurring bookings</p>
          )}
        </div>
      </div>
    </Link>
  )
}
