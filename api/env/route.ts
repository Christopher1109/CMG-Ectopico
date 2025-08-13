import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return NextResponse.json({
    urlSet: !!url,
    anonSet: !!anon,
    urlPreview: url.slice(0, 30) + '...',
    anonPreview: anon ? anon.slice(0, 8) + '...' + anon.slice(-6) : null,
  })
}
