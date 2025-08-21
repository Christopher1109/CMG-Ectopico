// lib/api/consultas.ts - Adaptado al nuevo esquema
export async function crearConsulta(payload: any) {
  const res = await fetch("/api/consultas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function actualizarConsulta(id: string, visitaNo: 2 | 3, patch: any) {
  try {
    const url = `/api/consultas/${encodeURIComponent(id)}?visita=${visitaNo}`
    console.log("Actualizando consulta:", { url, patch })

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const result = await res.json()
    console.log("Respuesta del servidor:", result)

    if (!res.ok) {
      throw new Error(result.error || `HTTP ${res.status}`)
    }

    return result
  } catch (error) {
    console.error("Error en actualizarConsulta:", error)
    return { error: error.message }
  }
}

export async function obtenerConsulta(id: string) {
  const res = await fetch(`/api/consultas/${encodeURIComponent(id)}`)
  return res.json()
}

// Función helper para convertir del nuevo esquema al formato que usa el frontend
export function normalizarDesdeNuevoEsquema(data: any) {
  return {
    id: data.id,
    fecha_creacion: data.created_at,
    fecha_ultima_actualizacion: data.updated_at,
    usuario_creador: data.dr,
    nombre_paciente: data.px,
    edad_paciente: data.edad_px,
    frecuencia_cardiaca: data.fc,
    presion_sistolica: data.ps,
    presion_diastolica: data.pd,
    estado_conciencia: data.ec,
    prueba_embarazo_realizada: data.prueba_emb,
    resultado_prueba_embarazo: data.resultado_emb,
    hallazgos_exploracion: data.hallazgos,
    tiene_eco_transabdominal: data.eco_abdominal,
    resultado_eco_transabdominal: data.resultado_ecoabd,
    sintomas_seleccionados: data.sintomas ? data.sintomas.split(", ").filter(Boolean) : [],
    factores_seleccionados: data.fac_riesg ? data.fac_riesg.split(", ").filter(Boolean) : [],
    tvus: data.tvus_1,
    hcg_valor: data.hcg_1,
    resultado: data.pronostico_1 ? Number.parseFloat(data.pronostico_1.replace("%", "")) / 100 : null,
    // Consulta 2
    sintomas_seleccionados_2: data.sintomas_2 ? data.sintomas_2.split(", ").filter(Boolean) : [],
    factores_seleccionados_2: data.factores_2 ? data.factores_2.split(", ").filter(Boolean) : [],
    tvus_2: data.tvus_2,
    hcg_valor_2: data.hcg_2,
    variacion_hcg_2: data.variacion_hcg_2,
    resultado_2: data.pronostico_2 ? Number.parseFloat(data.pronostico_2.replace("%", "")) / 100 : null,
    fecha_visita_2: data.consulta_2_date,
    // Consulta 3
    sintomas_seleccionados_3: data.sintomas_3 ? data.sintomas_3.split(", ").filter(Boolean) : [],
    factores_seleccionados_3: data.factores_3 ? data.factores_3.split(", ").filter(Boolean) : [],
    tvus_3: data.tvus_3,
    hcg_valor_3: data.hcg_3,
    variacion_hcg_3: data.variacion_hcg_3,
    resultado_3: data.pronostico_3 ? Number.parseFloat(data.pronostico_3.replace("%", "")) / 100 : null,
    fecha_visita_3: data.consulta_3_date,
  }
}
