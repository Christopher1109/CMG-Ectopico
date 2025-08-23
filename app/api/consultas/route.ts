// app/api/consultas/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // --- Mapeo a columnas REALES de tu tabla (SIN incluir id) ---
    const insertData: Record<string, any> = {
      // NO incluimos id - se genera automáticamente
      Dr: body.usuario_creador ?? null,
      Px: body.nombre_paciente ?? null,
      Edad_Px: body.edad_paciente ?? null,
      FC: body.frecuencia_cardiaca ?? null,
      PS: body.presion_sistolica ?? null,
      PD: body.presion_diastolica ?? null,
      EC: body.estado_conciencia ?? null,
      Prueba_Emb: body.prueba_embarazo_realizada ?? null,
      Resultado_Emb: body.resultado_prueba_embarazo ?? null,
      Hallazgos: body.hallazgos_exploracion ?? null,
      Eco_abdominal: body.tiene_eco_transabdominal ?? null,
      Resultado_EcoAbd: body.resultado_eco_transabdominal ?? null,

      // Consulta 1
      Sintomas: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados.join(", ") : null,
      Fac_Riesg: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados.join(", ") : null,
      TVUS_1: body.tvus ?? null,
      hCG_1: body.hcg_valor ?? null,
      Pronostico_1: typeof body.resultado === "number" ? `${(body.resultado * 100).toFixed(1)}%` : null,
      Consulta_1_Date: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("consultas").insert(insertData).select("*").single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
