export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import ConfirmActions from './ConfirmActions'

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

export default async function ConfirmBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabase()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, cooks(name, email, phone, whatsapp)')
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const cook = booking.cooks as { name: string; email: string; phone: string; whatsapp: string | null } | null

  if (booking.status === 'confirmed') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Already confirmed</h1>
        <p className="text-gray-600">This session is confirmed. Check your email for contact details.</p>
      </div>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">This booking was cancelled</h1>
        <p className="text-gray-600 mb-6">Browse other cooks to find a new match.</p>
        <a href="/cooks" className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 inline-block">
          Browse Cooks
        </a>
      </div>
    )
  }

  if (booking.status !== 'cook_interested') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">This confirmation link is not active yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{cook?.name} accepted your brief</h1>
      <p className="text-gray-500 text-sm mb-8">Review the session details and confirm to complete the booking.</p>

      {/* Session summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Summary</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Cook</span>
            <span className="font-medium text-gray-900">{cook?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Job type</span>
            <span className="font-medium text-gray-900">{CATEGORY_LABELS[booking.job_category] ?? booking.job_category}</span>
          </div>
          <div className="flex justify-between">
            <span>Date</span>
            <span className="font-medium text-gray-900">{formatDate(booking.preferred_date)}</span>
          </div>
          {booking.preferred_time && (
            <div className="flex justify-between">
              <span>Time</span>
              <span className="font-medium text-gray-900">{booking.preferred_time}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>People</span>
            <span className="font-medium text-gray-900">{booking.num_people}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-medium text-gray-900">{booking.expected_duration_hours}+ hours</span>
          </div>
          <div className="flex justify-between">
            <span>Location</span>
            <span className="font-medium text-gray-900">{booking.city}</span>
          </div>
        </div>
      </div>

      {/* Commitment statement */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
        <p className="text-sm font-semibold text-orange-900 mb-2">Before you confirm</p>
        <p className="text-sm text-orange-800">
          {cook?.name} is reserving time specifically for you on {formatDate(booking.preferred_date)}.
          Last-minute cancellations directly affect their income. Please only confirm if you are fully committed to this session.
        </p>
        <p className="text-xs text-orange-700 mt-2">
          Free cancellation is available up to 48 hours before the session. Cancellations after that will be logged on your profile.
        </p>
      </div>

      <ConfirmActions bookingId={id} />
    </div>
  )
}
