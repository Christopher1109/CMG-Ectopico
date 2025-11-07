/**
 * Utilidades locales
 */
function normalizaId(folioOrId: string | number): number {
  if (typeof folioOrId === "string") {
    // Permite formatos "ID-000123" o "123"
    const limpio = folioOrId.replace(/^ID-0*/, "")
    const n = Number.parseInt(limpio, 10)
    if (Number.isNaN(n)) throw new Error(`ID inválido: ${folioOrId}`)
    return n
  }
  return folioOrId
}

/**
 * Tipos útiles (opcional)
 */
export interface ConsultaAnterior {
  visit_number: number // 1, 2, ...
  visit_date: string // ISO
  hcg: number | null
  postprob: number | null // 0..1
  sintomas?: string | null
  factores?: string | null
  tvus?: string | null
}

/**
 * Crea una consulta.
 * NO envía el campo id - se genera automáticamente en la base de datos.
 */
export async function crearConsulta(payload: any) {
  try {
    const dbPayload = { ...payload }

    // Eliminar el campo id si existe - la base de datos lo genera automáticamente
    delete dbPayload.id

    const res = await fetch("/api/consultas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dbPayload),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("API crearConsulta:", error)
    return { error: error?.message ?? "Error al crear consulta" }
  }
}

/**
 * Actualiza la consulta (visita 2 o 3).
 * Usa el folio para identificar la consulta.
 */
export async function actualizarConsulta(folioOrId: string | number, visitaNo: 2 | 3, patch: any) {
  try {
    const numericId = normalizaId(folioOrId)

    // Validar que numericId sea un número válido
    if (!Number.isFinite(numericId) || numericId <= 0) {
      throw new Error(`ID numérico inválido: ${numericId} (original: ${folioOrId})`)
    }

    // Validar que visitaNo sea 2 o 3
    if (![2, 3].includes(visitaNo)) {
      throw new Error(`Número de visita inválido: ${visitaNo} (debe ser 2 o 3)`)
    }

    const url = `/api/consultas/${numericId}?visita=${visitaNo}`

    console.log("[fix] actualizarConsulta:", { folioOrId, numericId, visitaNo, url, patch })

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error("[fix] actualizarConsulta error response:", { status: res.status, json })
      throw new Error(json?.error || `HTTP ${res.status}`)
    }

    console.log("[fix] actualizarConsulta success:", json)
    return json
  } catch (error: any) {
    console.error("[fix] actualizarConsulta error:", error)
    return { error: error?.message ?? "Error al actualizar consulta" }
  }
}

/**
 * Obtiene una consulta por folio o id (detalle completo del caso).
 */
export async function obtenerConsulta(folioOrId: string | number) {
  try {
    const numericId = normalizaId(folioOrId)
    const url = `/api/consultas/${numericId}`

    console.log("[fix] obtenerConsulta:", { numericId, url })

    const res = await fetch(url, { method: "GET" })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("[fix] obtenerConsulta error:", error)
    return { error: error?.message ?? "Error al obtener consulta" }
  }
}

/**
 * Obtiene una consulta por CURP (detalle completo del caso).
 * El parámetro `curp` debe ser la clave CURP de 18 caracteres. La función la normaliza a mayúsculas
 * y realiza una petición GET al endpoint `/api/consultas/{CURP}`. Devuelve el JSON con la consulta
 * normalizada o un objeto con `error` si la petición falla.
 */
export async function obtenerConsultaPorCurp(curp: string) {
  try {
    // Normalizar el CURP a mayúsculas y trim
    const curpUpper = String(curp || "").trim().toUpperCase()
    const url = `/api/consultas/${encodeURIComponent(curpUpper)}`
    console.log("[fix] obtenerConsultaPorCurp:", { curp: curpUpper, url })
    const res = await fetch(url, { method: "GET" })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error("[fix] obtenerConsultaPorCurp error response:", { status: res.status, json })
      throw new Error(json?.error || `HTTP ${res.status}`)
    }
    return json
  } catch (error: any) {
    console.error("[fix] obtenerConsultaPorCurp error:", error)
    return { error: error?.message ?? "Error al obtener consulta por CURP" }
  }
}

/**
 * 🔥 NUEVA: Obtiene SOLO la consulta anterior (última visita existente) por folio/id.
 * Requiere que exista el endpoint GET /api/consultas/:id?scope=previous
 * que haga SELECT desde public.consultas_visitas ORDER BY visit_number DESC LIMIT 1
 */
export async function obtenerConsultaAnterior(
  folioOrId: string | number,
): Promise<ConsultaAnterior | { error: string }> {
  try {
    const numericId = normalizaId(folioOrId)
    const url = `/api/consultas/${numericId}?scope=previous`

    console.log("[fix] obtenerConsultaAnterior:", { numericId, url })

    const res = await fetch(url, { method: "GET" })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)

    // Validación suave del shape
    if (json == null || typeof json !== "object" || typeof json.visit_number !== "number") {
      return { error: "Respuesta inválida del servidor (consulta anterior)" }
    }

    return json as ConsultaAnterior
  } catch (error: any) {
    console.error("[fix] obtenerConsultaAnterior error:", error)
    return { error: error?.message ?? "Error al obtener consulta anterior" }
  }
}
