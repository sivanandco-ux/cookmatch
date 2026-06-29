import { NextResponse } from 'next/server'
import { checkInactivity } from '@/lib/agents/inactivityAgent'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await checkInactivity()
  return NextResponse.json(result)
}
