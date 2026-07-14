import { createClient } from '@supabase/supabase-js'
import { sendSessionConfirmedToBoth } from './email'

const DISCOUNT_CODE = 'COOKMATCH20'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function confirmJobBooking(jobId: string, interestId: string) {
  const supabase = getSupabase()

  const [{ data: job }, { data: interest }] = await Promise.all([
    supabase.from('job_posts').select('*').eq('id', jobId).single(),
    supabase
      .from('job_interests')
      .select('*, cooks(name, email, phone, whatsapp)')
      .eq('id', interestId)
      .single(),
  ])

  if (!job || !interest) {
    console.error('[confirmJobBooking] job or interest not found', { jobId, interestId })
    throw new Error('Job or interest not found')
  }

  const [jobUpdateResult, interestUpdateResult] = await Promise.all([
    supabase.from('job_posts').update({ status: 'taken', assigned_cook_id: interest.cook_id, confirmed_at: new Date().toISOString() }).eq('id', jobId),
    supabase.from('job_interests').update({ status: 'accepted' }).eq('id', interestId),
    supabase.from('job_interests').update({ status: 'rejected' }).eq('job_post_id', jobId).neq('id', interestId),
  ])

  if (jobUpdateResult.error) {
    console.error('[confirmJobBooking] Failed to update job status:', jobUpdateResult.error)
    throw new Error('Failed to mark job as taken')
  }
  if (interestUpdateResult.error) {
    console.error('[confirmJobBooking] Failed to update interest status:', interestUpdateResult.error)
  }

  const { error: bookingError } = await supabase.from('bookings').insert({
    cook_id: interest.cook_id,
    client_name: job.client_name,
    client_email: job.client_email,
    client_phone: job.client_phone,
    session_type: job.recurring ? 'recurring' : 'one_time',
    preferred_date: job.requested_date,
    preferred_time: job.requested_time || null,
    group_size: String(job.num_people),
    occasion_type: job.occasion,
    cuisine_needs: '',
    dietary_needs: (job.dietary_restrictions || []).join(', '),
    notes: job.additional_notes || '',
    job_category: job.job_category,
    request_type: job.request_type || 'session',
    specific_dishes: job.specific_dishes || null,
    num_dishes: job.num_dishes || null,
    expected_duration_hours: job.expected_duration_hours,
    num_people: job.num_people,
    grocery_situation: job.grocery_situation,
    cleanup_needed: job.cleanup_needed ?? false,
    kitchen_access_time: job.kitchen_access_time || null,
    city: job.city,
    parking_available: job.parking_available ?? false,
    language_preferred: job.language_preferred || null,
    text_description: job.text_description || null,
    voice_memo_url: job.voice_memo_url || null,
    discount_code_sent: false,
    cook_notified: true,
    status: 'confirmed',
  })

  if (bookingError) {
    console.error('[confirmJobBooking] Booking insert failed:', bookingError)
  }

  const cook = interest.cooks as { name: string; email: string; phone: string; whatsapp: string | null }
  if (cook) {
    await sendSessionConfirmedToBoth({
      clientName: job.client_name,
      clientEmail: job.client_email,
      cookName: cook.name,
      cookEmail: cook.email,
      cookPhone: cook.phone,
      cookWhatsapp: cook.whatsapp,
      clientPhone: job.client_phone,
      date: job.requested_date,
      discountCode: DISCOUNT_CODE,
    }).catch(err => console.error('[confirmJobBooking] Email failed:', err))
  }
}
