import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

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
