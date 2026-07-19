export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import FeedbackForm from './FeedbackForm'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  const { booking: bookingId } = await searchParams

  if (!bookingId) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">Invalid feedback link.</p>
      </div>
    )
  }

  const supabase = getSupabase()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, client_name, cook_id, request_type, cooks(id, name, cooking_arrangement)')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">Booking not found.</p>
      </div>
    )
  }

  // Already rated?
  const { data: existing } = await supabase
    .from('cook_ratings')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existing) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Feedback already submitted</h1>
        <p className="text-gray-500">You have already rated this session. Thank you!</p>
      </div>
    )
  }

  const cook = booking.cooks as unknown as { id: string; name: string; cooking_arrangement: string[] }

  // 'session' only when this was a home-cooked-meal booking with a cook who
  // actually cooks at the client's location — everything else (a specific
  // item, or a session from a cook who only cooks from their own setup and
  // delivers) never had the cook physically working in the client's space,
  // so Cleanliness/Clean Appearance don't apply and Packaging does instead.
  const ratingCategory: 'session' | 'item' =
    booking.request_type === 'session' && cook.cooking_arrangement?.includes("Cook at client's location")
      ? 'session'
      : 'item'

  return (
    <FeedbackForm
      bookingId={bookingId}
      cookId={cook.id}
      cookName={cook.name}
      clientName={booking.client_name}
      ratingCategory={ratingCategory}
    />
  )
}
