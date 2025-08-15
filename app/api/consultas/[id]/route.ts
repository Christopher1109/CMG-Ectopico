// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server'
import { sb } from '@/lib/supabaseAdmin'

// Normalizadores
const toNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const toJsonArray = (v: any) => {
  if (Array.isArray(v)) return v
  if (v == null || v === '') return []
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

// GET /api/consultas/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data, error } = await sb.from('consultas').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/consultas/:id
// Acepta tanto columnas en snake_case como camelCase y decide qué actualizar
// según el visit=1|2|3 (también acepta consulta/consulta_num/visit en el body).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const b = await req.json()

    // Deducción de visita
    let visit =
      Number(b.visit ?? b.consulta ?? b.consulta_num ?? b.consulta_numero) || 0
    if (![1, 2, 3].includes(visit)) {
      // Si no llega visit, inferimos por las claves
      if ('tvus_3' in b || 'hcg_valor_3' in b || 'variacion_hcg_3' in b || 'resultado_3' in b) visit = 3
      else if ('tvus_2' in b || 'hcg_valor_2' in b || 'variacion_hcg_2' in b || 'resultado_2' in b) visit = 2
      else visit = 1
    }

    const patch: Record<string, any> = {}

    if (visit === 1) {
      // Solo campos permitidos de C1
      patch.usuario_creador              = b.usuario_creador ?? undefined
      patch.nombre_paciente              = b.nombre_paciente ?? undefined
      patch.edad_paciente                = toNum(b.edad_paciente)
      patch.frecuencia_cardiaca          = toNum(b.frecuencia_cardiaca)
      patch.presion_sistolica            = toNum(b.presion_sistolica)
      patch.presion_diastolica           = toNum(b.presion_diastolica)
      patch.estado_conciencia            = b.estado_conciencia ?? undefined
      patch.prueba_embarazo_realizada    = b.prueba_embarazo_realizada ?? undefined
      patch.resultado_prueba_embarazo    = b.resultado_prueba_embarazo ?? undefined
      patch.hallazgos_exploracion        = b.hallazgos_exploracion ?? undefined
      patch.tiene_eco_transabdominal     = b.tiene_eco_transabdominal ?? undefined
      patch.resultado_eco_transabdominal = b.resultado_eco_transabdominal ?? undefined
      patch.sintomas_seleccionados       = toJsonArray(b.sintomas_seleccionados)
      patch.factores_seleccionados       = toJsonArray(b.factores_seleccionados)
      patch.tvus                         = b.tvus ?? undefined
      patch.hcg_valor                    = toNum(b.hcg_valor)
      // NOTA: No guardamos "resultado" de C1 porque no está en tu lista actual.
    }

    if (visit === 2) {
      patch.tvus_2           = b.tvus_2 ?? b.tvus2 ?? undefined
      patch.hcg_valor_2      = toNum(b.hcg_valor_2 ?? b.hcg2 ?? b.hcg_valor2)
      patch.variacion_hcg_2  = b.variacion_hcg_2 ?? b.variacion2 ?? undefined
      patch.resultado_2      = toNum(b.resultado_2 ?? b.resultado2)
      patch.usuario_visita_2 = b.usuario_visita_2 ?? b.usuario2 ?? b.usuario_creador ?? undefined
      patch.fecha_visita_2   = b.fecha_visita_2 ?? new Date().toISOString()
    }

    if (visit === 3) {
      patch.tvus_3           = b.tvus_3 ?? b.tvus3 ?? undefined
      patch.hcg_valor_3      = toNum(b.hcg_valor_3 ?? b.hcg3 ?? b.hcg_valor3)
      patch.variacion_hcg_3  = b.variacion_hcg_3 ?? b.variacion3 ?? undefined
      patch.resultado_3      = toNum(b.resultado_3 ?? b.resultado3)
      patch.usuario_visita_3 = b.usuario_visita_3 ?? b.usuario3 ?? b.usuario_creador ?? undefined
      patch.fecha_visita_3   = b.fecha_visita_3 ?? new Date().toISOString()
    }

    // Elimina claves undefined (no actualizan)
    Object.keys(patch).forEach(k => patch[k] === undefined && delete patch[k])

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
    }

    const { data, error } = await sb
      .from('consultas')
      .update(patch)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error inesperado' }, { status: 500 })
  }
}
