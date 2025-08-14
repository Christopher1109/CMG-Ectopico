// app/api/consultas/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⛑️ IMPORTANTE: en el SERVIDOR usamos la SERVICE ROLE KEY (bypassea RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // <- ESTA es la clave del servidor
  { auth: { persistSession: false } }
)

// GET /api/consultas?limit=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') ?? 20)

    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .order('created_at', { ascending: false }) // usa created_at para evitar columnas que no existen
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'GET failed' }, { status: 500 })
  }
}

// POST /api/consultas
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Genera PK si no viene
    const genId = 'CONS-' + Date.now().toString(36).slice(-10)

    const payload = {
      id: (body.id ?? genId).slice(0, 20),
      usuario_creador: body.usuario_creador ?? 'anon',
      nombre_paciente: body.nombre_paciente ?? 'N/A',
      edad_paciente: body.edad_paciente != null ? Number(body.edad_paciente) : null,

      frecuencia_cardiaca: body.frecuencia_cardiaca ?? null,
      presion_sistolica: body.presion_sistolica ?? null,
      presion_diastolica: body.presion_diastolica ?? null,
      estado_conciencia: body.estado_conciencia ?? null,
      prueba_embarazo_realizada: body.prueba_embarazo_realizada ?? null,
      resultado_pru_
