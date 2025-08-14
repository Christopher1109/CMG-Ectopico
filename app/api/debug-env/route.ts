import { NextResponse } from 'next/server';

export async function GET() {
  const hasSrv = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: hasUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon,
    SUPABASE_SERVICE_ROLE_KEY: hasSrv, // debe salir true en servidor
  });
}
