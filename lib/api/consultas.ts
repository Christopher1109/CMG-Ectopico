// lib/api/consultas.ts - Adaptado a tu esquema
export async function crearConsulta(payload: any) {
  // Si el ID tiene formato "ID-00098", extraer solo la parte numérica para la base de datos
  const dbPayload = { ...payload }
  if (typeof dbPayload.id === "string" && dbPayload.id.startsWith("ID-")) {
    const numericId = Number.parseInt(dbPayload.id.replace("ID-", ""), 10)
    if (!isNaN(numericId)) {
      dbPayload.id = numericId
    }
  }

  const res = await fetch("/api/consultas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dbPayload),
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
