// lib/api/consultas.ts
import { normalizaId } from "@/lib/utils"

/**
 * Crea una consulta.
 * Si llega un id con formato "ID-00098", se normaliza a 98 antes de enviarlo al backend.
 */
export async function crearConsulta(payload: any) {
  try {
    const dbPayload = { ...payload }

    if (dbPayload?.id !== undefined) {
      try {
        dbPayload.id = normalizaId(dbPayload.id)
      } catch {
        // si no aplica (id no viene o no es convertible), lo ignoramos
      }
    }

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
 * Convierte el id a numérico y arma la URL de forma segura (?visita=2 | 3).
 */
export async function actualizarConsulta(
  id: string | number,
  visitaNo: 2 | 3,
  patch: any,
) {
  try {
    const idNum = normalizaId(id)
    const qs = new URLSearchParams({ visita: String(visitaNo) }).toString()
    const url = `/api/consultas/${idNum}?${qs}`

    console.log("Actualizando consulta:", { url, patch })

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })

    const json = await res.json().catch(() => ({}))
    console.log("Respuesta del servidor:", json)

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("API actualizarConsulta:", error)
    return { error: error?.message ?? "Error al actualizar consulta" }
  }
}

/**
 * Obtiene una consulta por id.
 * Convierte "ID-00098" a 98 antes de consultar.
 */
export async function obtenerConsulta(id: string | number) {
  try {
    const idNum = normalizaId(id)
    const res = await fetch(`/api/consultas/${idNum}`, { method: "GET" })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  } catch (error: any) {
    console.error("API obtenerConsulta:", error)
    return { error: error?.message ?? "Error al obtener consulta" }
  }
}
