// lib/api/consultas.ts
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
    // IMPORTANTE: pasamos la visita por query (?visita=2|3)
    const url = `/api/consultas/${encodeURIComponent(id)}?visita=${visitaNo}`
    console.log("Actualizando consulta:", { url, patch }) // Para debug

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const result = await res.json()
    console.log("Respuesta del servidor:", result) // Para debug

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
