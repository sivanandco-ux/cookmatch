export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingForm from '@/components/BookingForm'
import type { CookWithDetails } from '@/lib/types'

function VerifiedBadge({ label, detail }: { label: string; detail?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-1.5">
      <span>✓</span> {label}{detail ? ` — ${detail}` : ''}
    </span>
  )
}

export default async function CookProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cook } = await supabase
    .from('cooks')
    .select('*, cook_verifications(*), cook_scores(*), cook_ratings(*), cook_dishes(*)')
    .eq('id', id)
    .single()

  if (!cook) notFound()

  // Only show dates strictly after the 48-hour cutoff — clients cannot book within 48hrs
  const cutoff = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const minBookableDate = cutoff.toISOString().split('T')[0]

  const { data: availabilityRows } = await supabase
    .from('cook_availability')
    .select('available_date')
    .eq('cook_id', id)
    .gt('available_date', minBookableDate)
    .order('available_date', { ascending: true })

  const availableDates = (availabilityRows || []).map(r => r.available_date as string)

  const c = cook as CookWithDetails
  const score = c.cook_scores
  const verification = c.cook_verifications
  const sessionCount = score?.session_count ?? 0
  const hasRating = sessionCount >= 3

  const priceLabel = c.price_unit === 'hourly' ? '/hr'
    : c.price_unit === 'per_session' ? '/session'
    : c.price_unit ? ` / ${c.price_unit}` : '/session'

  // The session-booking form (date, headcount, grocery situation, cleanup...)
  // only makes sense for a cook who cooks at the client's home or from their
  // own setup. A cook whose only arrangement is a custom "Other" description
  // doesn't fit that shape — an empty/missing arrangement (cooks created
  // before this field existed) defaults to showing the normal form.
  const KNOWN_ARRANGEMENTS = ["Cook at client's location", "Cook from my setup"]
  const arrangement = c.cooking_arrangement || []
  const isOtherOnly = arrangement.length > 0 && !arrangement.some(a => KNOWN_ARRANGEMENTS.includes(a))

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <a href="/cooks" className="text-sm text-orange-600 hover:underline mb-6 inline-block">
        ← Back to all cooks
      </a>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left column — profile */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-start gap-4">
            {c.photo_url ? (
              <img src={c.photo_url} alt={c.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-3xl font-bold">
                {c.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
              <p className="text-gray-500">{c.tagline}</p>
              {hasRating && score ? (
                <p className="mt-1 text-yellow-500 font-medium">
                  ★ {score.overall_score.toFixed(1)} <span className="text-gray-400 font-normal text-sm">({sessionCount} sessions)</span>
                </p>
              ) : (
                <span className="mt-1 inline-block text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  New Cook
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-700 leading-relaxed">{c.bio}</p>
          </div>

          {/* Video */}
          {c.video_url && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Introduction Video</h2>
              <a href={c.video_url} target="_blank" rel="noopener noreferrer"
                className="text-orange-600 hover:underline text-sm">
                Watch {c.name}'s introduction video →
              </a>
            </div>
          )}

          {/* Social links */}
          {(c.instagram_url || c.youtube_url) && (
            <div className="flex flex-wrap gap-3">
              {c.instagram_url && (
                <a href={c.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="text-orange-600 hover:underline text-sm">
                  📸 Instagram →
                </a>
              )}
              {c.youtube_url && (
                <a href={c.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="text-orange-600 hover:underline text-sm">
                  ▶️ YouTube →
                </a>
              )}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Specialties</p>
              <p className="font-medium">{c.cuisine_types.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Dietary</p>
              <p className="font-medium">{c.dietary_specialties.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Availability</p>
              <p className="font-medium">{c.occasion_types.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Languages</p>
              <p className="font-medium">{c.languages.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Signature Dishes</p>
              <p className="font-medium">{c.signature_dishes}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Service Areas</p>
              <p className="font-medium">{c.service_areas.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Experience</p>
              <p className="font-medium">{c.years_experience} years</p>
            </div>
          </div>

          {/* Dish photos */}
          {c.cook_dishes && c.cook_dishes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Dishes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {c.cook_dishes.map(dish => (
                  <div key={dish.id}>
                    <img src={dish.photo_url} alt={dish.description || 'Dish photo'} className="w-full aspect-square object-cover rounded-lg" />
                    {dish.description && <p className="text-xs text-gray-600 mt-1">{dish.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification badges */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Verified</h2>
            <div className="flex flex-wrap gap-2">
              {verification?.food_handler_certified && (
                <VerifiedBadge
                  label="Food Handler Certified"
                  detail={verification.food_handler_expiry ? `expires ${verification.food_handler_expiry}` : undefined}
                />
              )}
              {verification?.references_verified && <VerifiedBadge label="References Verified" />}
            </div>
          </div>

          {/* Ratings breakdown */}
          {hasRating && score && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Rating Breakdown</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['Taste', score.taste_avg],
                  ['Cleanliness', score.cleanliness_avg],
                  ['Punctuality', score.punctuality_avg],
                  ['Respect', score.respect_avg],
                  ['Clean Appearance', score.clean_appearance_avg],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <span className="w-36 text-gray-500">{label as string}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full"
                        style={{ width: `${((val as number) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{(val as number).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — booking form */}
        <div className="md:col-span-1">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            {c.status === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-amber-800 mb-1">Profile under review</p>
                <p className="text-xs text-amber-700">This cook's application is being reviewed. Bookings will open once approved.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  {c.price_min > 0 ? (
                    <p className="text-2xl font-bold text-gray-900">
                      ${c.price_min}
                      <span className="text-sm font-normal text-gray-400">{priceLabel}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Rate negotiable — discuss directly with the cook</p>
                  )}
                  {c.price_min > 0 && c.price_unit === 'hourly' && c.min_hours && (
                    <p className="text-xs text-amber-700 mt-1">Minimum {c.min_hours} hour{c.min_hours > 1 ? 's' : ''} per visit</p>
                  )}
                  {c.available_recurring && (
                    <p className="text-xs text-green-600 mt-1">Available for recurring bookings</p>
                  )}
                </div>
                {isOtherOnly ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-600">
                      This cook has a custom arrangement — reach out directly to discuss what they offer.
                    </p>
                    <div className="flex flex-col gap-2">
                      <a href={`tel:${c.phone}`} className="text-center text-sm border border-gray-300 rounded-lg py-2 text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-colors">
                        📞 {c.phone}
                      </a>
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, '').replace(/^([^1])/, '1$1')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center text-sm border border-gray-300 rounded-lg py-2 text-gray-700 hover:border-green-400 hover:text-green-600 transition-colors"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                      <a href={`mailto:${c.email}`} className="text-center text-sm border border-gray-300 rounded-lg py-2 text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-colors">
                        ✉️ {c.email}
                      </a>
                    </div>
                  </div>
                ) : (
                  <BookingForm cookId={c.id} cookName={c.name} availableDates={availableDates} cookDietarySpecialties={c.dietary_specialties} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
