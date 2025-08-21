import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from("consultas").select("*").eq("id", params.id).single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

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
  } catch (error) {
    console.error("Error in GET /api/consultas/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const visitaNo = body.visitaNo || 2 // Por defecto segunda consulta

    let updateData: any = {}

    if (visitaNo === 2) {
      updateData = {
        Sintomas_2: Array.isArray(body.sintomas_seleccionados)
          ? body.sintomas_seleccionados.join(", ")
          : body.sintomas_seleccionados || null,
        Factores_2: Array.isArray(body.factores_seleccionados)
          ? body.factores_seleccionados.join(", ")
          : body.factores_seleccionados || null,
        TVUS_2: body.tvus || null,
        hCG_2: body.hcg_valor || null,
        Variacion_hCG_2: body.variacion_hcg || null,
        Pronostico_2: body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null,
        Consulta_2_Date: new Date().toISOString(),
      }
    } else if (visitaNo === 3) {
      updateData = {
        Sintomas_3: Array.isArray(body.sintomas_seleccionados)
          ? body.sintomas_seleccionados.join(", ")
          : body.sintomas_seleccionados || null,
        Factores_3: Array.isArray(body.factores_seleccionados)
          ? body.factores_seleccionados.join(", ")
          : body.factores_seleccionados || null,
        TVUS_3: body.tvus || null,
        hCG_3: body.hcg_valor || null,
        Variacion_hCG_3: body.variacion_hcg || null,
        Pronostico_3: body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null,
        Consulta_3_Date: new Date().toISOString(),
      }
    }

    const { data, error } = await supabase.from("consultas").update(updateData).eq("id", params.id).select()

    if (error) {
      console.error("Error updating consulta:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error("Error in PATCH /api/consultas/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("consultas").delete().eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Consulta deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/consultas/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
