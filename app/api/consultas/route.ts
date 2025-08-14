// app/api/consultas/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Usa SIEMPRE la service_role SOLO en el servidor (rutas /api)
 * NO importes el cliente de lib/supabaseClient.ts aquí.
 */
function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, serviceKey)
}

// GET /api/consultas?limit=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') ?? 20)

    const supabase = supabaseServer()
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('GET /api/consultas error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

// POST /api/consultas
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // NO generes ID si ya viene desde el front (ID-00001, etc.)
    const id: string =
      typeof body.id === 'string' && body.id.trim().length > 0
        ? body.id.trim().slice(0, 32) // PK VARCHAR(32) por seguridad
        : ('CONS-' + Date.now().toString(36)).slice(0, 32)

    // Normaliza tipos para evitar errores de validación
    const payload = {
      id,
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

      sintomas_seleccionados: Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados
        : [],
      factores_seleccionados: Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados
        : [],

      tvus: body.tvus ?? null,

      // Consulta 1
      hcg_valor: body.hcg_valor != null ? Number(body.hcg_valor) : null,
      variacion_hcg: body.variacion_hcg ?? null,
      hcg_anterior: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
      resultado: body.resultado != null ? Number(body.resultado) : null,

      // Campos para Consulta 2 / 3 (pueden venir nulos en la primera)
      tvus_c2: body.tvus_c2 ?? null,
      hcg_c2: body.hcg_c2 != null ? Number(body.hcg_c2) : null,
      variacion_hcg_c2: body.variacion_hcg_c2 ?? null,
      resultado_c2: body.resultado_c2 != null ? Number(body.resultado_c2) : null,
      usuario_c2: body.usuario_c2 ?? null,
      fecha_c2: body.fecha_c2 ?? null,

      tvus_c3: body.tvus_c3 ?? null,
      hcg_c3: body.hcg_c3 != null ? Number(body.hcg_c3) : null,
      variacion_hcg_c3: body.variacion_hcg_c3 ?? null,
      resultado_c3: body.resultado_c3 != null ? Number(body.resultado_c3) : null,
      usuario_c3: body.usuario_c3 ?? null,
      fecha_c3: body.fecha_c3 ?? null,
    }

    const supabase = supabaseServer()
    const { data, error } = await supabase.from('consultas').insert(payload).select().single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/consultas error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
