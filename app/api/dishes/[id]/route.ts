import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'
import { validateDishPhoto } from '@/lib/validateDishPhoto'
import { convertHeicIfNeeded } from '@/lib/convertHeicIfNeeded'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { cook_id: cookId } = await request.json()

  if (!cookId) {
    return NextResponse.json({ error: 'Missing cook_id' }, { status: 400 })
  }

  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data: dish } = await supabase
    .from('cook_dishes')
    .select('id, cook_id, photo_url')
    .eq('id', id)
    .single()

  if (!dish || dish.cook_id !== cookId) {
    return NextResponse.json({ error: 'Dish not found' }, { status: 404 })
  }

  const fileName = dish.photo_url.split('/').pop()
  if (fileName) {
    await supabase.storage.from('cook-dishes').remove([fileName])
  }

  const { error } = await supabase.from('cook_dishes').delete().eq('id', id)
  if (error) {
    console.error('[Delete Dish] DB error:', error.message)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const formData = await request.formData()
  const cookId = formData.get('cook_id') as string | null
  const file = formData.get('photo') as File | null
  const description = (formData.get('description') as string | null)?.trim() ?? undefined

  if (!cookId) {
    return NextResponse.json({ error: 'Missing cook_id' }, { status: 400 })
  }
  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  const { data: dish } = await supabase
    .from('cook_dishes')
    .select('id, cook_id, photo_url')
    .eq('id', id)
    .single()

  if (!dish || dish.cook_id !== cookId) {
    return NextResponse.json({ error: 'Dish not found' }, { status: 404 })
  }

  const updates: { photo_url?: string; description?: string } = {}
  if (description !== undefined) updates.description = description

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo must be under 5MB' }, { status: 400 })
    }
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const { buffer, mediaType, ext } = await convertHeicIfNeeded(rawBuffer, file.type, file.name)
    const fileName = `${cookId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { isFood } = await validateDishPhoto(buffer, mediaType)
    if (!isFood) {
      return NextResponse.json({ error: "That doesn't look like a photo of food — please upload a photo of a dish you've made." }, { status: 400 })
    }

    const { error: uploadError } = await supabase.storage
      .from('cook-dishes')
      .upload(fileName, buffer, { contentType: mediaType, upsert: false })

    if (uploadError) {
      console.error('[Edit Dish] Storage error:', uploadError.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from('cook-dishes').getPublicUrl(fileName)
    updates.photo_url = publicUrlData.publicUrl

    const oldFileName = dish.photo_url.split('/').pop()
    if (oldFileName) {
      await supabase.storage.from('cook-dishes').remove([oldFileName])
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('cook_dishes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[Edit Dish] DB error:', error.message)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, dish: updated })
}
