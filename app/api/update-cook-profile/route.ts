import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'
import { normalizePhone } from '@/lib/phone'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function normalizeUrl(input: unknown): { value: string | null; error?: string } {
  const trimmed = String(input || '').trim()
  if (!trimmed) return { value: null }
  if (!/^https?:\/\//i.test(trimmed)) {
    return { value: null, error: 'Links must start with http:// or https://' }
  }
  return { value: trimmed }
}

// This route serves two separate edit forms on the dashboard (profile/photo
// vs. cooking details), each sending only the fields it owns — every field
// here is optional, and an absent key means "leave unchanged," matching the
// existing photo_url convention. Only validate a field when it was actually
// sent.
export async function POST(request: Request) {
  const body = await request.json()
  const cookId = body.cook_id as string | null

  if (!cookId) {
    return NextResponse.json({ error: 'Missing cook_id' }, { status: 400 })
  }
  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update: Record<string, unknown> = {}

  if (typeof body.name !== 'undefined') {
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
    update.name = name
  }

  if (typeof body.bio !== 'undefined') {
    const bio = String(body.bio || '').trim()
    if (!bio) return NextResponse.json({ error: 'Introduction cannot be empty.' }, { status: 400 })
    update.bio = bio
  }

  if (typeof body.instagram_url !== 'undefined') {
    const instagram = normalizeUrl(body.instagram_url)
    if (instagram.error) return NextResponse.json({ error: `Instagram link: ${instagram.error}` }, { status: 400 })
    update.instagram_url = instagram.value
  }
  if (typeof body.youtube_url !== 'undefined') {
    const youtube = normalizeUrl(body.youtube_url)
    if (youtube.error) return NextResponse.json({ error: `YouTube link: ${youtube.error}` }, { status: 400 })
    update.youtube_url = youtube.value
  }
  if (typeof body.whatsapp_group_link !== 'undefined') {
    const whatsappGroup = normalizeUrl(body.whatsapp_group_link)
    if (whatsappGroup.error) return NextResponse.json({ error: `WhatsApp group link: ${whatsappGroup.error}` }, { status: 400 })
    update.whatsapp_group_link = whatsappGroup.value
  }
  if (typeof body.video_url !== 'undefined') {
    const video = normalizeUrl(body.video_url)
    if (video.error) return NextResponse.json({ error: `Video link: ${video.error}` }, { status: 400 })
    update.video_url = video.value
  }

  // photo_url comes pre-uploaded (via /api/upload-photo, which just stores
  // a blob and hands back its URL) — undefined means "leave unchanged", vs.
  // an empty string which would mean "remove the photo".
  if (typeof body.photo_url === 'string') {
    update.photo_url = body.photo_url || null
  }

  // US and India are the only supported phone formats for now.
  if (typeof body.phone !== 'undefined') {
    const normalized = normalizePhone(String(body.phone || '').trim())
    if (!normalized) return NextResponse.json({ error: 'Please enter a valid US or India phone number.' }, { status: 400 })
    update.phone = normalized
  }
  if (typeof body.whatsapp !== 'undefined') {
    const raw = String(body.whatsapp || '').trim()
    if (!raw) {
      update.whatsapp = null
    } else {
      const normalized = normalizePhone(raw)
      if (!normalized) return NextResponse.json({ error: 'WhatsApp number must be a valid US or India phone number.' }, { status: 400 })
      update.whatsapp = normalized
    }
  }

  const arrayFields = ['cuisine_types', 'offering_types', 'dietary_specialties', 'occasion_types', 'cooking_arrangement', 'languages', 'job_categories', 'service_areas']
  for (const field of arrayFields) {
    if (Array.isArray(body[field])) {
      update[field] = body[field].map(String)
    }
  }

  if (update.offering_types && (update.offering_types as string[]).length === 0) {
    return NextResponse.json({ error: 'Please select at least one thing you offer.' }, { status: 400 })
  }
  if (update.cooking_arrangement && (update.cooking_arrangement as string[]).length === 0) {
    return NextResponse.json({ error: 'Please select at least one option for how you cook.' }, { status: 400 })
  }
  if (update.service_areas && (update.service_areas as string[]).length === 0) {
    return NextResponse.json({ error: "Please enter the city you're located in." }, { status: 400 })
  }

  // Hourly rate only applies to cooks who cook at the client's location — a
  // cook who only cooks from their own setup has price_min/max of 0, which
  // should stay 0, not get floored up to the $30 platform minimum.
  if (typeof body.price_min !== 'undefined') {
    update.price_min = Number(body.price_min) > 0 ? Math.max(Number(body.price_min), 30) : 0
  }
  if (typeof body.price_max !== 'undefined') {
    update.price_max = Number(body.price_max) > 0 ? Math.max(Number(body.price_max), 30) : 0
  }
  if (typeof body.min_hours !== 'undefined') {
    update.min_hours = body.min_hours === null ? null : Number(body.min_hours)
  }
  if (typeof body.state !== 'undefined') {
    update.state = body.state || null
  }
  if (typeof body.does_cleanup !== 'undefined') {
    update.does_cleanup = !!body.does_cleanup
  }
  if (typeof body.grocery_pickup !== 'undefined') {
    update.grocery_pickup = !!body.grocery_pickup
  }
  if (typeof body.grocery_pickup_charge !== 'undefined') {
    update.grocery_pickup_charge = body.grocery_pickup_charge === null ? null : Number(body.grocery_pickup_charge)
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('cooks')
    .update(update)
    .eq('id', cookId)

  if (error) {
    console.error('[Update Cook Profile] DB error:', error.message)
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
