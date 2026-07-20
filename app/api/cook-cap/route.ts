import { NextResponse } from 'next/server'
import { isCookCapReached } from '@/lib/cookCap'

export async function GET() {
  const full = await isCookCapReached()
  return NextResponse.json({ full })
}
