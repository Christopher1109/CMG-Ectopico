import { supabaseAdmin } from "@/lib/supabaseAdmin"

export interface ConsultaData {
  usuario_creador?: string | null
  nombre_paciente?: string | null
  edad_paciente?: number | null
  frecuencia_cardiaca?: number | null
  presion_sistolica?: number | null
  presion_diastolica?: number | null
  estado_conciencia?: string | null
  prueba_embarazo_realizada?: string | null
  resultado_prueba_embarazo?: string | null
  hallazgos_exploracion?: string | null
  tiene_eco_transabdominal?: string | null
  resultado_eco_transabdominal?: string | null
  sintomas_seleccionados?: string[]
  factores_seleccionados?: string[]
  tvus?: string | null
  hcg_valor?: number | null
  variacion_hcg?: string | null
  hcg_anterior?: number | null
  resultado?: number | null
}

export interface ConsultaResponse {
  data?: any
  error?: string
}

export async function crearConsulta(datos: ConsultaData): Promise<ConsultaResponse> {
  try {
    // Mapear los campos al esquema de la base de datos
    const payload = {
      Dr: datos.usuario_creador,
      Px: datos.nombre_paciente,
      Edad_Px: datos.edad_paciente,
      FC: datos.frecuencia_cardiaca,
      PS: datos.presion_sistolica,
      PD: datos.presion_diastolica,
      EC: datos.estado_conciencia,
      Prueba_Emb: datos.prueba_embarazo_realizada,
      Resultado_Emb: datos.resultado_prueba_embarazo,
      Hallazgos: datos.hallazgos_exploracion,
      Eco_abdominal: datos.tiene_eco_transabdominal,
      Resultado_EcoAbd: datos.resultado_eco_transabdominal,
      Sintomas: JSON.stringify(datos.sintomas_seleccionados || []),
      Fac_Riesg: JSON.stringify(datos.factores_seleccionados || []),
      TVUS_1: datos.tvus,
      hCG_1: datos.hcg_valor,
      Pronostico_1: datos.resultado?.toString(),
      Consulta_1_Date: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("consultas").insert(payload).select("*").single()

    if (error) {
      console.error("Error al crear consulta:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error("Error en crearConsulta:", error)
    return { error: "Error interno del servidor" }
  }
}

export async function actualizarConsulta(
  folioOrId: string,
  visitaNo: 2 | 3,
  datos: ConsultaData,
): Promise<ConsultaResponse> {
  try {
    // Determinar si es folio (número) o ID completo
    const isNumeric = /^\d+$/.test(folioOrId)
    const whereClause = isNumeric ? { folio: Number.parseInt(folioOrId) } : { id: folioOrId }

    // Mapear campos según el número de visita
    const payload: any = {}

    if (visitaNo === 2) {
      payload["Sintomas_2"] = JSON.stringify(datos.sintomas_seleccionados || [])
      payload["Factores_2"] = JSON.stringify(datos.factores_seleccionados || [])
      payload["TVUS_2"] = datos.tvus
      payload["hCG_2"] = datos.hcg_valor
      payload["Variacion_hCG_2"] = datos.variacion_hcg
      payload["Pronostico_2"] = datos.resultado?.toString()
      payload["Consulta_2_Date"] = new Date().toISOString()
    } else if (visitaNo === 3) {
      payload["Sintomas_3"] = JSON.stringify(datos.sintomas_seleccionados || [])
      payload["Factores_3"] = JSON.stringify(datos.factores_seleccionados || [])
      payload["TVUS_3"] = datos.tvus
      payload["hCG_3"] = datos.hcg_valor
      payload["Variacion_hCG_3"] = datos.variacion_hcg
      payload["Pronostico_3"] = datos.resultado?.toString()
      payload["Consulta_3_Date"] = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from("consultas")
      .update(payload)
      .match(whereClause)
      .select("*")
      .single()

    if (error) {
      console.error("Error al actualizar consulta:", error)
      return { error: error.message }
    }

    return { data }
  } catch (error) {
    console.error("Error en actualizarConsulta:", error)
    return { error: "Error interno del servidor" }
  }
}

export async function obtenerConsulta(folioOrId: string): Promise<ConsultaResponse> {
  try {
    // Determinar si es folio (número) o ID completo
    const isNumeric = /^\d+$/.test(folioOrId)
    const whereClause = isNumeric ? { folio: Number.parseInt(folioOrId) } : { id: folioOrId }

    const { data, error } = await supabaseAdmin.from("consultas").select("*").match(whereClause).single()

    if (error) {
      console.error("Error al obtener consulta:", error)
      return { error: error.message }
    }

    if (!data) {
      return { error: "Consulta no encontrada" }
    }

    // Normalizar los datos para el frontend
    const consultaNormalizada = {
      id: data.id,
      folio: data.folio,
      id_publico: `ID-${String(data.folio).padStart(5, "0")}`,
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
      sintomas_seleccionados: data.Sintomas ? JSON.parse(data.Sintomas) : [],
      factores_seleccionados: data.Fac_Riesg ? JSON.parse(data.Fac_Riesg) : [],
      tvus: data.TVUS_1,
      hcg_valor: data.hCG_1,
      variacion_hcg: data.Pronostico_1,
      resultado: data.Pronostico_1 ? Number.parseFloat(data.Pronostico_1) : null,

      // Segunda consulta
      sintomas_seleccionados_2: data.Sintomas_2 ? JSON.parse(data.Sintomas_2) : null,
      factores_seleccionados_2: data.Factores_2 ? JSON.parse(data.Factores_2) : null,
      tvus_2: data.TVUS_2,
      hcg_valor_2: data.hCG_2,
      hcg_anterior_2: data.hCG_1, // El anterior de la segunda es el primero
      variacion_hcg_2: data.Variacion_hCG_2,
      resultado_2: data.Pronostico_2 ? Number.parseFloat(data.Pronostico_2) : null,

      // Tercera consulta
      sintomas_seleccionados_3: data.Sintomas_3 ? JSON.parse(data.Sintomas_3) : null,
      factores_seleccionados_3: data.Factores_3 ? JSON.parse(data.Factores_3) : null,
      tvus_3: data.TVUS_3,
      hcg_valor_3: data.hCG_3,
      hcg_anterior_3: data.hCG_2 || data.hCG_1, // El anterior de la tercera es el segundo o primero
      variacion_hcg_3: data.Variacion_hCG_3,
      resultado_3: data.Pronostico_3 ? Number.parseFloat(data.Pronostico_3) : null,
    }

    return { data: consultaNormalizada }
  } catch (error) {
    console.error("Error en obtenerConsulta:", error)
    return { error: "Error interno del servidor" }
  }
}
