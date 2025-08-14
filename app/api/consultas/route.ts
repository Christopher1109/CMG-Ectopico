// app/api/consultas/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/consultas?limit=20
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit') ?? 20)

  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .order('fecha_consulta_1', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

/**
 * POST /api/consultas
 * Crea la fila (Consulta 1). OJO: mapeamos a columnas *_1
 */
export async function POST(req: Request) {
  const body = await req.json()

  // Si no mandan id, generamos uno corto (tu PK es VARCHAR(20))
  const genId = ('CONS-' + Date.now().toString(36)).slice(0, 20)

  const payload: Record<string, any> = {
    id: (body.id ?? genId).slice(0, 20),

    // datos “base”
    usuario_creador: body.usuario_creador ?? 'anon',
    nombre_paciente: body.nombre_paciente ?? 'N/A',
    edad_paciente: body.edad_paciente != null ? Number(body.edad_paciente) : null,

    frecuencia_cardiaca: body.frecuencia_cardiaca != null ? Number(body.frecuencia_cardiaca) : null,
    presion_sistolica: body.presion_sistolica != null ? Number(body.presion_sistolica) : null,
    presion_diastolica: body.presion_diastolica != null ? Number(body.presion_diastolica) : null,
    estado_conciencia: body.estado_conciencia ?? null,
    prueba_embarazo_realizada: body.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: body.resultado_prueba_embarazo ?? null,
    hallazgos_exploracion: body.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: body.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: body.resultado_eco_transabdominal ?? null,
    sintomas_seleccionados: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados : [],
    factores_seleccionados: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados : [],

    // Consulta 1 (mapeo a columnas *_1)
    tvus_1: body.tvus ?? null,
    hcg_valor_1: body.hcg_valor != null ? Number(body.hcg_valor) : null,
    hcg_anterior_1: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
    variacion_hcg_1: body.variacion_hcg ?? null,
    resultado_1: body.resultado != null ? Number(body.resultado) : null,
    usuario_consulta_1: body.usuario_creador ?? 'anon',
    fecha_consulta_1: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('consultas')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
