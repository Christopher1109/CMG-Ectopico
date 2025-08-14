import { NextResponse } from "next/server"
import { supabase } from "../../../../lib/supabaseClient"

type Params = { params: { id: string } }

// GET /api/consultas/ID-00001
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = decodeURIComponent(params.id)
    const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

// PATCH /api/consultas/ID-00001   (guarda Consulta 2 o 3)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = decodeURIComponent(params.id)
    const body = await req.json()

    // Verifica que exista la fila
    const { data: exists, error: e1 } = await supabase.from("consultas").select("id").eq("id", id).single()

    if (e1 || !exists) {
      return NextResponse.json({ error: "No existe ese ID" }, { status: 404 })
    }

    // Construye el update
    const update: Record<string, any> = {}

    // (Opcional) Campos base si decides actualizar algo del expediente
    const baseFields = [
      "nombre_paciente",
      "edad_paciente",
      "frecuencia_cardiaca",
      "presion_sistolica",
      "presion_diastolica",
      "estado_conciencia",
      "prueba_embarazo_realizada",
      "resultado_prueba_embarazo",
      "hallazgos_exploracion",
      "tiene_eco_transabdominal",
      "resultado_eco_transabdominal",
      "sintomas_seleccionados",
      "factores_seleccionados",
    ]
    for (const f of baseFields) {
      if (body[f] !== undefined) update[f] = body[f]
    }

    // Cierre temprano (por si el algoritmo concluye)
    if (typeof body.es_finalizado === "boolean") update.es_finalizado = body.es_finalizado
    if (body.motivo_finalizacion !== undefined) update.motivo_finalizacion = body.motivo_finalizacion

    // === Consulta 2 ===
    if (Number(body.consulta_num) === 2) {
      update.tvus_2 = body.tvus_2 ?? body.tvus ?? null
      update.hcg_valor_2 = body.hcg_valor_2 ?? body.hcg_valor ?? null
      update.variacion_hcg_2 = body.variacion_hcg_2 ?? body.variacion_hcg ?? null
      update.resultado_2 = body.resultado_2 ?? body.resultado ?? null
      update.fecha_consulta_2 = body.fecha_consulta_2 ?? new Date().toISOString()
      update.usuario_consulta_2 = body.usuario_consulta_2 ?? body.usuario_creador ?? null
    }

    // === Consulta 3 ===
    if (Number(body.consulta_num) === 3) {
      update.tvus_3 = body.tvus_3 ?? body.tvus ?? null
      update.hcg_valor_3 = body.hcg_valor_3 ?? body.hcg_valor ?? null
      update.variacion_hcg_3 = body.variacion_hcg_3 ?? body.variacion_hcg ?? null
      update.resultado_3 = body.resultado_3 ?? body.resultado ?? null
      update.fecha_consulta_3 = body.fecha_consulta_3 ?? new Date().toISOString()
      update.usuario_consulta_3 = body.usuario_consulta_3 ?? body.usuario_creador ?? null
    }

    const { data, error } = await supabase.from("consultas").update(update).eq("id", id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

// (Opcional) DELETE /api/consultas/ID-00001
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = decodeURIComponent(params.id)
    const { error } = await supabase.from("consultas").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
