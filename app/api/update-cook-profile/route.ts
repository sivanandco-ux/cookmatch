import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

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

export async function POST(request: Request) {
  const body = await request.json()
  const cookId = body.cook_id as string | null

  if (!cookId) {
    return NextResponse.json({ error: 'Missing cook_id' }, { status: 400 })
  }
  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const name = String(body.name || '').trim()
  if (!name) {
    return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 })
  }

  const bio = String(body.bio || '').trim()
  if (!bio) {
    return NextResponse.json({ error: 'Introduction cannot be empty.' }, { status: 400 })
  }

  const instagram = normalizeUrl(body.instagram_url)
  if (instagram.error) {
    return NextResponse.json({ error: `Instagram link: ${instagram.error}` }, { status: 400 })
  }
  const youtube = normalizeUrl(body.youtube_url)
  if (youtube.error) {
    return NextResponse.json({ error: `YouTube link: ${youtube.error}` }, { status: 400 })
  }
  const whatsappGroup = normalizeUrl(body.whatsapp_group_link)
  if (whatsappGroup.error) {
    return NextResponse.json({ error: `WhatsApp group link: ${whatsappGroup.error}` }, { status: 400 })
  }

  // photo_url comes pre-uploaded (via /api/upload-photo, which just stores
  // a blob and hands back its URL) — undefined means "leave unchanged", vs.
  // an empty string which would mean "remove the photo".
  const photoUrl = typeof body.photo_url === 'string' ? body.photo_url : undefined

  const supabase = getSupabase()
  const { error } = await supabase
    .from('cooks')
    .update({
      name,
      bio,
      instagram_url: instagram.value,
      youtube_url: youtube.value,
      whatsapp_group_link: whatsappGroup.value,
      ...(photoUrl !== undefined ? { photo_url: photoUrl || null } : {}),
    })
    .eq('id', cookId)

  if (error) {
    console.error('[Update Cook Profile] DB error:', error.message)
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
