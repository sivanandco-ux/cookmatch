import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyCookOwnership } from '@/lib/auth/verifyCookOwnership'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('document') as File | null
  const cookId = formData.get('cook_id') as string | null

  if (!file || !cookId) {
    return NextResponse.json({ error: 'Missing document or cook_id' }, { status: 400 })
  }

  if (!(await verifyCookOwnership(cookId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${cookId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = getSupabase()

  const { data: cook } = await supabase.from('cooks').select('id').eq('id', cookId).single()
  if (!cook) {
    return NextResponse.json({ error: 'Cook not found' }, { status: 404 })
  }

  const { error: uploadError } = await supabase.storage
    .from('cook-ids')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[Upload ID] Storage error:', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { error: dbError } = await supabase
    .from('cook_id_documents')
    .upsert({ cook_id: cookId, document_url: fileName, uploaded_at: new Date().toISOString() }, { onConflict: 'cook_id' })

  if (dbError) {
    console.error('[Upload ID] DB error:', dbError.message)
    return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
