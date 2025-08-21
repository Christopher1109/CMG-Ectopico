import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// Función auxiliar para extraer el número del ID
function extractNumericId(id: string): number | null {
  // Si el ID tiene formato "ID-00098", extraer solo la parte numérica
  if (id.startsWith("ID-")) {
    const numericPart = id.replace("ID-", "")
    const parsedId = Number.parseInt(numericPart, 10)
    return isNaN(parsedId) ? null : parsedId
  }
  // Si ya es numérico, intentar convertirlo
  const parsedId = Number.parseInt(id, 10)
  return isNaN(parsedId) ? null : parsedId
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Extraer el ID numérico si es necesario
    let dbId = body.id
    if (typeof body.id === "string" && body.id.startsWith("ID-")) {
      const numericId = extractNumericId(body.id)
      if (numericId !== null) {
        dbId = numericId
      }
    }

    // Mapear los datos al formato de la base de datos
    const dbData = {
      id: dbId,
      Dr: body.usuario_creador,
      Px: body.nombre_paciente,
      Edad_Px: body.edad_paciente,
      FC: body.frecuencia_cardiaca,
      PS: body.presion_sistolica,
      PD: body.presion_diastolica,
      EC: body.estado_conciencia,
      Prueba_Emb: body.prueba_embarazo_realizada,
      Resultado_Emb: body.resultado_prueba_embarazo,
      Hallazgos: body.hallazgos_exploracion,
      Eco_abdominal: body.tiene_eco_transabdominal,
      Resultado_EcoAbd: body.resultado_eco_transabdominal,
      Sintomas: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados.join(", ") : null,
      Fac_Riesg: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados.join(", ") : null,
      TVUS_1: body.tvus,
      hCG_1: body.hcg_valor,
      Variacion_hCG_1: body.variacion_hcg,
      Pronostico_1: body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null,
    }

    console.log("Datos a insertar:", dbData)

    const { data, error } = await supabaseAdmin.from("consultas").upsert(dbData).select().single()

    if (error) {
      console.error("Error de Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Devolver el ID en el formato original para el frontend
    return NextResponse.json({ data: { ...data, id: body.id } })
  } catch (e: any) {
    console.error("Error en POST:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("consultas").select("*").order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Transformar los IDs numéricos a formato "ID-XXXXX" para el frontend
    const consultasNormalizadas = data.map((consulta) => ({
      ...consulta,
      id: typeof consulta.id === "number" ? `ID-${consulta.id.toString().padStart(5, "0")}` : consulta.id,
    }))

    return NextResponse.json({ data: consultasNormalizadas })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
