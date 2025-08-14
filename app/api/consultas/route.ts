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
      resultado_prueba_embarazo: body.resultado_prueba_embarazo ?? null,
      hallazgos_exploracion: body.hallazgos_exploracion ?? null,
      tiene_eco_transabdominal: body.tiene_eco_transabdominal ?? null,
      resultado_eco_transabdominal: body.resultado_eco_transabdominal ?? null,
      sintomas_seleccionados: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados : [],
      factores_seleccionados: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados : [],
      tvus: body.tvus ?? null,
      hcg_valor: body.hcg_valor != null ? Number(body.hcg_valor) : null,
      variacion_hcg: body.variacion_hcg ?? null,
      hcg_anterior: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
      resultado: body.resultado != null ? Number(body.resultado) : null,

      // campos de tracking de la consulta actual (1/2/3)
      consulta_numero: body.consulta_numero ?? 1,
      consulta2_tvus: body.consulta2_tvus ?? null,
      consulta2_hcg: body.consulta2_hcg != null ? Number(body.consulta2_hcg) : null,
      consulta2_var_hcg: body.consulta2_var_hcg ?? null,
      consulta2_resultado: body.consulta2_resultado != null ? Number(body.consulta2_resultado) : null,
      consulta2_fecha: body.consulta2_fecha ?? null,

      consulta3_tvus: body.consulta3_tvus ?? null,
      consulta3_hcg: body.consulta3_hcg != null ? Number(body.consulta3_hcg) : null,
      consulta3_var_hcg: body.consulta3_var_hcg ?? null,
      consulta3_resultado: body.consulta3_resultado != null ? Number(body.consulta3_resultado) : null,
      consulta3_fecha: body.consulta3_fecha ?? null,
    }

    const { data, error } = await supabase
      .from('consultas')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'POST failed' }, { status: 500 })
  }
}
