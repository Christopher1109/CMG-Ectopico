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
      dr: body.usuarioCreador || body.dr || "Dr. Sistema",
      px: body.nombrePaciente || body.px || "N/A",
      edad_px: body.edadPaciente != null ? Number(body.edadPaciente) : null,
      fc: body.frecuenciaCardiaca != null ? Number(body.frecuenciaCardiaca) : null,
      ps: body.presionSistolica != null ? Number(body.presionSistolica) : null,
      pd: body.presionDiastolica != null ? Number(body.presionDiastolica) : null,
      ec: body.estadoConciencia ?? null,
      prueba_emb: body.pruebaEmbarazoRealizada ?? null,
      resultado_emb: body.resultadoPruebaEmbarazo ?? null,
      hallazgos: body.hallazgosExploracion ?? null,
      eco_abdominal: body.tieneEcoTransabdominal ?? null,
      resultado_ecoabd: body.resultadoEcoTransabdominal ?? null,
      sintomas: Array.isArray(body.sintomasSeleccionados) ? body.sintomasSeleccionados.join(", ") : "",
      fac_riesg: Array.isArray(body.factoresSeleccionados) ? body.factoresSeleccionados.join(", ") : "",
      tvus_1: body.tvus ?? null,
      hcg_1: body.hcgValor != null ? Number(body.hcgValor) : null,
      pronostico_1: body.resultado != null ? `${(Number(body.resultado) * 100).toFixed(1)}%` : null,
      consulta_1_date: new Date().toISOString(),
    }

    console.log("Enviando payload adaptado al nuevo esquema:", payload)

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
