import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get("limit") ?? 20)

    const { data, error } = await supabaseAdmin
      .from("consultas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Generar UUID simple para created_by (ya que tu esquema lo requiere)
    const fakeUUID = "00000000-0000-0000-0000-000000000000"

    const payload = {
      id: (body.id ?? "ID-" + Math.random().toString(36).slice(2, 7).toUpperCase()).slice(0, 20),
      created_by: fakeUUID, // Tu esquema requiere UUID
      nombre_paciente: body.nombre_paciente ?? "N/A",
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
      tvus: body.tvus ?? null,
      hcg_valor: body.hcg_valor != null ? Number(body.hcg_valor) : null,
      variacion_hcg: body.variacion_hcg ?? null,
      hcg_anterior: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
      resultado: body.resultado != null ? Number(body.resultado) : null,
    }

    console.log("Enviando payload adaptado:", payload)

    const { data, error } = await supabaseAdmin.from("consultas").insert(payload).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Consulta creada exitosamente:", data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    console.error("Error en POST:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
