export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import AvailabilityCalendar from './AvailabilityCalendar'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ cook_id: string }>
}) {
  const { cook_id } = await params
  const supabase = getSupabase()

  const { data: cook } = await supabase
    .from('cooks')
    .select('id, name, status')
    .eq('id', cook_id)
    .single()

  if (!cook || cook.status === 'dormant') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-gray-500">This availability link is no longer active.</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('cook_availability')
    .select('available_date')
    .eq('cook_id', cook_id)
    .gte('available_date', today)

  const existingDates = (existing || []).map(r => r.available_date as string)

  return (
    <AvailabilityCalendar
      cookId={cook_id}
      cookName={cook.name}
      existingDates={existingDates}
    />
  )
}
