import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  const ext = audio.name.endsWith('mp4') ? 'mp4' : 'webm'
  const filename = `${randomUUID()}.${ext}`
  const bytes = await audio.arrayBuffer()

  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from('voice-memo')
    .upload(filename, new Uint8Array(bytes), {
      contentType: ext === 'webm' ? 'audio/webm;codecs=opus' : 'audio/mp4',
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage
    .from('voice-memo')
    .getPublicUrl(filename)

  return NextResponse.json({ url: data.publicUrl })
}
