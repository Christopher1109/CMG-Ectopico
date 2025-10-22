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
    // Convertir a número si es string
    const numericId = typeof folioOrId === "string" ? Number.parseInt(folioOrId.replace(/^ID-0*/, ""), 10) : folioOrId

    const qs = new URLSearchParams({ visita: String(visitaNo) }).toString()
    const url = `/api/consultas/${numericId}?${qs}`

    console.log("[v0] 🔧 actualizarConsulta llamada con:", { folioOrId, numericId, visitaNo, url })
    console.log("[v0] 📦 Patch a enviar:", JSON.stringify(patch, null, 2))

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const json = await res.json().catch(() => ({}))

    console.log("[v0] 📨 Respuesta HTTP:", { status: res.status, ok: res.ok })
    console.log("[v0] 📨 JSON respuesta:", JSON.stringify(json, null, 2))

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("[v0] ❌ API actualizarConsulta error:", error)
    return { error: error?.message ?? "Error al actualizar consulta" }
  }
}

/**
 * Obtiene una consulta por folio o id.
 */
export async function obtenerConsulta(folioOrId: string | number) {
  try {
    // Convertir a número si es string
    const numericId = typeof folioOrId === "string" ? Number.parseInt(folioOrId.replace(/^ID-0*/, ""), 10) : folioOrId

    const url = `/api/consultas/${numericId}`

    console.log("[v0] 🔧 obtenerConsulta llamada con:", { folioOrId, numericId, url })

    const res = await fetch(url, { method: "GET" })
    const json = await res.json().catch(() => ({}))

    console.log("[v0] 📨 Respuesta HTTP:", { status: res.status, ok: res.ok })
    console.log("[v0] 📨 JSON respuesta:", JSON.stringify(json, null, 2))

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("[v0] ❌ API obtenerConsulta error:", error)
    return { error: error?.message ?? "Error al obtener consulta" }
  }
}
