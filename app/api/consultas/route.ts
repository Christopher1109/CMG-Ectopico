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
      CURP: body.curp ?? null,
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    // Validate that id is provided
    if (!body.id) {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 })
    }

    const consultaId = body.id

    // Build update object with only provided fields
    const updateData: Record<string, any> = {}

    // Map body fields to database columns (only if provided)
    if (body.usuario_creador !== undefined) updateData.Dr = body.usuario_creador
    if (body.nombre_paciente !== undefined) updateData.Px = body.nombre_paciente
    if (body.curp !== undefined) updateData.CURP = body.curp
    if (body.edad_paciente !== undefined) updateData.Edad_Px = body.edad_paciente
    if (body.frecuencia_cardiaca !== undefined) updateData.FC = body.frecuencia_cardiaca
    if (body.presion_sistolica !== undefined) updateData.PS = body.presion_sistolica
    if (body.presion_diastolica !== undefined) updateData.PD = body.presion_diastolica
    if (body.estado_conciencia !== undefined) updateData.EC = body.estado_conciencia
    if (body.prueba_embarazo_realizada !== undefined) updateData.Prueba_Emb = body.prueba_embarazo_realizada
    if (body.resultado_prueba_embarazo !== undefined) updateData.Resultado_Emb = body.resultado_prueba_embarazo
    if (body.hallazgos_exploracion !== undefined) updateData.Hallazgos = body.hallazgos_exploracion
    if (body.tiene_eco_transabdominal !== undefined) updateData.Eco_abdominal = body.tiene_eco_transabdominal
    if (body.resultado_eco_transabdominal !== undefined) updateData.Resultado_EcoAbd = body.resultado_eco_transabdominal

    // Consulta 1 fields
    if (body.sintomas_seleccionados !== undefined) {
      updateData.Sintomas = Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : body.sintomas_seleccionados
    }
    if (body.factores_seleccionados !== undefined) {
      updateData.Fac_Riesg = Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : body.factores_seleccionados
    }
    if (body.tvus !== undefined) updateData.TVUS_1 = body.tvus
    if (body.hcg_valor !== undefined) updateData.hCG_1 = body.hcg_valor
    if (body.resultado !== undefined) {
      updateData.Pronostico_1 =
        typeof body.resultado === "number" ? `${(body.resultado * 100).toFixed(1)}%` : body.resultado
    }

    // Consulta 2 fields
    if (body.tvus_2 !== undefined) updateData.TVUS_2 = body.tvus_2
    if (body.hcg_valor_2 !== undefined) updateData.hCG_2 = body.hcg_valor_2
    if (body.resultado_2 !== undefined) {
      updateData.Pronostico_2 =
        typeof body.resultado_2 === "number" ? `${(body.resultado_2 * 100).toFixed(1)}%` : body.resultado_2
    }
    if (body.consulta_2_date !== undefined) updateData.Consulta_2_Date = body.consulta_2_date

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Update the record
    const { data, error } = await supabaseAdmin
      .from("consultas")
      .update(updateData)
      .eq("id", consultaId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!data) {
      return NextResponse.json({ error: "Consulta not found" }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
