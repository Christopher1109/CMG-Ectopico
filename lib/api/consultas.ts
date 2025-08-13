export type ConsultaPatch = Record<string, any>

export async function listarConsultas(limit = 20) {
  const r = await fetch(`/api/consultas?limit=${limit}`, { cache: "no-store" })
  return r.json() // { data } | { error }
}

export async function crearConsulta(payload: Record<string, any>) {
  const r = await fetch("/api/consultas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return r.json() // { data } | { error }
}

export async function obtenerConsulta(id: string) {
  const r = await fetch(`/api/consultas/${id}`, { cache: "no-store" })
  return r.json()
}

export async function actualizarConsulta(id: string, patch: ConsultaPatch) {
  const r = await fetch(`/api/consultas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  return r.json()
}

export async function borrarConsulta(id: string) {
  const r = await fetch(`/api/consultas/${id}`, { method: "DELETE" })
  return r.json()
}
