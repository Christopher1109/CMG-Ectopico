// app/api/consultas/route.ts
import { NextResponse } from 'next/server'
import { sb } from '@/lib/supabaseAdmin'

// Helpers
const toNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const toJsonArray = (v: any) => {
  if (Array.isArray(v)) return v
  if (v == null || v === '') return []
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p : []
    } catch { return [] }
  }
  return []
}
const genId = () => 'ID-' + Math.random().toString(36).slice(2, 7).toUpperCase()

// GET /api/consultas?limit=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 20)

  const { data, error } = await sb
    .from('consultas')
    .select('*')
    .order('id', { ascending: false })
    .limit(Number.isFinite(limit) ? limit : 20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/consultas  -> crea Consulta 1 (y opcionalmente C2/C3 si mandas esos campos)
export async function POST(req: Request) {
  try {
    const b = await req.json()

    // Mapeo SOLO de los campos que pediste (Consulta 1)
    const payload: Record<string, any> = {
      id: (b.id ?? genId()).toString(),
      usuario_creador: b.usuario_creador ?? null,
      nombre_paciente: b.nombre_paciente ?? null,
      edad_paciente: toNum(b.edad_paciente),
      frecuencia_cardiaca: toNum(b.frecuencia_cardiaca),
      presion_sistolica: toNum(b.presion_sistolica),
      presion_diastolica: toNum(b.presion_diastolica),
      estado_conciencia: b.estado_conciencia ?? null,
      prueba_embarazo_realizada: b.prueba_embarazo_realizada ?? null,
      resultado_prueba_embarazo: b.resultado_prueba_embarazo ?? null,
      hallazgos_exploracion: b.hallazgos_exploracion ?? null,
      tiene_eco_transabdominal: b.tiene_eco_transabdominal ?? null,
      resultado_eco_transabdominal: b.resultado_eco_transabdominal ?? null,
      sintomas_seleccionados: toJsonArray(b.sintomas_seleccionados),
      factores_seleccionados: toJsonArray(b.factores_seleccionados),
      tvus: b.tvus ?? null,
      hcg_valor: toNum(b.hcg_valor),

      // Si te llega info de C2/C3 al crear, la aceptamos (opcional)
      tvus_2: b.tvus_2 ?? null,
      hcg_valor_2: toNum(b.hcg_valor_2),
      variacion_hcg_2: b.variacion_hcg_2 ?? null,
      resultado_2: toNum(b.resultado_2),
      fecha_visita_2: b.fecha_visita_2 ?? null,
      usuario_visita_2: b.usuario_visita_2 ?? null,

      tvus_3: b.tvus_3 ?? null,
      hcg_valor_3: toNum(b.hcg_valor_3),
      variacion_hcg_3: b.variacion_hcg_3 ?? null,
      resultado_3: toNum(b.resultado_3),
      fecha_visita_3: b.fecha_visita_3 ?? null,
      usuario_visita_3: b.usuario_visita_3 ?? null,
    }

    const { data, error } = await sb.from('consultas').insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error inesperado' }, { status: 500 })
  }
}
