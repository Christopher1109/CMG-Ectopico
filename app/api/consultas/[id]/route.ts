import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { data, error } = await supabaseAdmin.from("consultas").select("*").eq("id", params.id).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    // Mapear del esquema de base de datos al formato frontend
    const consultaNormalizada = {
      id: data.id,
      fecha_creacion: data.created_at,
      fecha_ultima_actualizacion: data.updated_at,
      usuario_creador: data.Dr,
      nombre_paciente: data.Px,
      edad_paciente: data.Edad_Px,
      frecuencia_cardiaca: data.FC,
      presion_sistolica: data.PS,
      presion_diastolica: data.PD,
      estado_conciencia: data.EC,
      prueba_embarazo_realizada: data.Prueba_Emb,
      resultado_prueba_embarazo: data.Resultado_Emb,
      hallazgos_exploracion: data.Hallazgos,
      tiene_eco_transabdominal: data.Eco_abdominal,
      resultado_eco_transabdominal: data.Resultado_EcoAbd,

      // Primera consulta
      sintomas_seleccionados: data.Sintomas ? data.Sintomas.split(", ") : [],
      factores_seleccionados: data.Fac_Riesg ? data.Fac_Riesg.split(", ") : [],
      tvus: data.TVUS_1,
      hcg_valor: data.hCG_1,
      resultado: data.Pronostico_1 ? Number.parseFloat(data.Pronostico_1.replace("%", "")) / 100 : null,

      // Segunda consulta
      sintomas_seleccionados_2: data.Sintomas_2 ? data.Sintomas_2.split(", ") : null,
      factores_seleccionados_2: data.Factores_2 ? data.Factores_2.split(", ") : null,
      tvus_2: data.TVUS_2,
      hcg_valor_2: data.hCG_2,
      variacion_hcg_2: data.Variacion_hCG_2,
      resultado_2: data.Pronostico_2 ? Number.parseFloat(data.Pronostico_2.replace("%", "")) / 100 : null,

      // Tercera consulta
      sintomas_seleccionados_3: data.Sintomas_3 ? data.Sintomas_3.split(", ") : null,
      factores_seleccionados_3: data.Factores_3 ? data.Factores_3.split(", ") : null,
      tvus_3: data.TVUS_3,
      hcg_valor_3: data.hCG_3,
      variacion_hcg_3: data.Variacion_hCG_3,
      resultado_3: data.Pronostico_3 ? Number.parseFloat(data.Pronostico_3.replace("%", "")) / 100 : null,
    }

    return NextResponse.json({ data: consultaNormalizada })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const visita = searchParams.get("visita") // 2 o 3

    console.log("PATCH recibido:", { id: params.id, visita, body })

    // Preparar el objeto de actualización usando TU esquema
    const updateData: Record<string, any> = {}

    // Si es consulta de seguimiento (visita 2 o 3), mapear campos con sufijo
    if (visita === "2") {
      updateData.Sintomas_2 = Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : body.sintomas_seleccionados || null
      updateData.Factores_2 = Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : body.factores_seleccionados || null
      updateData.TVUS_2 = body.tvus || null
      updateData.hCG_2 = body.hcg_valor != null ? Number(body.hcg_valor) : null
      updateData.Variacion_hCG_2 = body.variacion_hcg || null
      updateData.Pronostico_2 = body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null
      updateData.Consulta_2_Date = new Date().toISOString()
    } else if (visita === "3") {
      updateData.Sintomas_3 = Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : body.sintomas_seleccionados || null
      updateData.Factores_3 = Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : body.factores_seleccionados || null
      updateData.TVUS_3 = body.tvus || null
      updateData.hCG_3 = body.hcg_valor != null ? Number(body.hcg_valor) : null
      updateData.Variacion_hCG_3 = body.variacion_hcg || null
      updateData.Pronostico_3 = body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null
      updateData.Consulta_3_Date = new Date().toISOString()
    }

    console.log("Datos a actualizar:", updateData)

    // CORREGIR: Usar el ID como string, no intentar convertir a número
    const { data, error } = await supabaseAdmin
      .from("consultas")
      .update(updateData)
      .eq("id", params.id) // Mantener como string
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Actualización exitosa:", data)
    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("Error en PATCH:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { error } = await supabaseAdmin.from("consultas").delete().eq("id", params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
