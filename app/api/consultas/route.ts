import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mapear del formato frontend al nuevo esquema de base de datos
    const consultaData = {
      id: body.id || body.idTemporal, // USAR EL ID GENERADO EN EL FRONTEND
      Dr: body.usuario_creador || "anon",
      Px: body.nombre_paciente || "N/A",
      Edad_Px: body.edad_paciente || null,
      FC: body.frecuencia_cardiaca || null,
      PS: body.presion_sistolica || null,
      PD: body.presion_diastolica || null,
      EC: body.estado_conciencia || null,
      Prueba_Emb: body.prueba_embarazo_realizada || null,
      Resultado_Emb: body.resultado_prueba_embarazo || null,
      Hallazgos: body.hallazgos_exploracion || null,
      Eco_abdominal: body.tiene_eco_transabdominal || null,
      Resultado_EcoAbd: body.resultado_eco_transabdominal || null,

      // Primera consulta
      Sintomas: Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : body.sintomas_seleccionados || null,
      Fac_Riesg: Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : body.factores_seleccionados || null,
      TVUS_1: body.tvus || null,
      hCG_1: body.hcg_valor || null,
      Pronostico_1: body.resultado ? `${(body.resultado * 100).toFixed(1)}%` : null,
      Consulta_1_Date: new Date().toISOString(),
    }

    console.log("Intentando insertar consulta con ID:", consultaData.id)

    const { data, error } = await supabase.from("consultas").insert([consultaData]).select()

    if (error) {
      console.error("Error inserting consulta:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Consulta insertada exitosamente:", data[0])
    return NextResponse.json({ data: data[0] }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/consultas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      // Buscar consulta específica por ID
      const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()

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
    } else {
      // Listar todas las consultas
      const { data, error } = await supabase.from("consultas").select("*").order("created_at", { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error("Error in GET /api/consultas:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
