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

    const payload = {
      Dr: body.usuario_creador || body.medico_nombre || "Dr. Sistema",
      Px: body.nombre_paciente ?? "N/A",
      Edad_Px: body.edad_paciente != null ? Number(body.edad_paciente) : null,
      FC: body.frecuencia_cardiaca != null ? Number(body.frecuencia_cardiaca) : null,
      PS: body.presion_sistolica != null ? Number(body.presion_sistolica) : null,
      PD: body.presion_diastolica != null ? Number(body.presion_diastolica) : null,
      EC: body.estado_conciencia ?? null,
      Prueba_Emb: body.prueba_embarazo_realizada ?? null,
      Resultado_Emb: body.resultado_prueba_embarazo ?? null,
      Hallazgos: body.hallazgos_exploracion ?? null,
      Eco_abdominal: body.tiene_eco_transabdominal ?? null,
      Resultado_EcoAbd: body.resultado_eco_transabdominal ?? null,
      Sintomas: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados.join(", ") : null,
      Fac_Riesg: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados.join(", ") : null,
      TVUS_1: body.tvus ?? null,
      hCG_1: body.hcg_valor != null ? Number(body.hcg_valor) : null,
      Pronostico_1: body.resultado != null ? `${(body.resultado * 100).toFixed(1)}%` : null,
      Consulta_1_Date: new Date().toISOString(),
    }

    console.log("Enviando payload adaptado a tu esquema:", payload)

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
