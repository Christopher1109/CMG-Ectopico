// lib/api/consultas.ts
export async function crearConsulta(payload: any) {
  const res = await fetch('/api/consultas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  try {
    const json = await res.json()
    if (!res.ok) return { error: json?.error || 'Error en POST /api/consultas' }
    return { data: json.data }
  } catch {
    return { error: 'Error parseando respuesta de POST /api/consultas' }
  }
}

export async function actualizarConsulta(id: string, visita_no: 2 | 3, patch: any) {
  const res = await fetch(`/api/consultas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visita_no, ...patch }),
  })
  try {
    const json = await res.json()
    if (!res.ok) return { error: json?.error || 'Error en PATCH /api/consultas/:id' }
    return { data: json.data }
  } catch {
    return { error: 'Error parseando respuesta de PATCH /api/consultas/:id' }
  }
}

export async function obtenerConsulta(id: string) {
  const res = await fetch(`/api/consultas/${encodeURIComponent(id)}`)
  try {
    const json = await res.json()
    if (!res.ok) return { error: json?.error || 'No encontrada' }
    return { data: json.data }
  } catch {
    return { error: 'Error parseando respuesta de GET /api/consultas/:id' }
  }
}
