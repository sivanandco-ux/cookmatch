import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'
import { validateDishPhoto } from '@/lib/validateDishPhoto'

const MAX_DISHES = 10

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('photo') as File | null
  const cookId = formData.get('cook_id') as string | null
  const description = (formData.get('description') as string | null)?.trim() || ''

  if (!file || !cookId) {
    return NextResponse.json({ error: 'Missing photo or cook_id' }, { status: 400 })
  }

  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 })
  }

  const supabase = getSupabase()

  const { count } = await supabase
    .from('cook_dishes')
    .select('id', { count: 'exact', head: true })
    .eq('cook_id', cookId)

  if ((count ?? 0) >= MAX_DISHES) {
    return NextResponse.json({ error: `You can only add up to ${MAX_DISHES} dish photos` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${cookId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { isFood } = await validateDishPhoto(buffer, file.type)
  if (!isFood) {
    return NextResponse.json({ error: "That doesn't look like a photo of food — please upload a photo of a dish you've made." }, { status: 400 })
  }

  const { error: uploadError } = await supabase.storage
    .from('cook-dishes')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[Upload Dish] Storage error:', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from('cook-dishes').getPublicUrl(fileName)

  const { data: dish, error: dbError } = await supabase
    .from('cook_dishes')
    .insert({
      cook_id: cookId,
      photo_url: publicUrlData.publicUrl,
      description,
      sort_order: count ?? 0,
    })
    .select()
    .single()

  if (dbError) {
    console.error('[Upload Dish] DB error:', dbError.message)
    return NextResponse.json({ error: 'Failed to save dish record' }, { status: 500 })
  }

  return NextResponse.json({ success: true, dish })
}
