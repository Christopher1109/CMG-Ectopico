
// lib/api/consultas.ts
export async function crearConsulta(payload: any) {
  const res = await fetch('/api/consultas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function actualizarConsulta(id: string, visitaNo: 2 | 3, patch: any) {
  // IMPORTANTE: pasamos la visita por query (?visita=2|3)
  const res = await fetch(`/api/consultas/${encodeURIComponent(id)}?visita=${visitaNo}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return res.json()
}

export async function obtenerConsulta(id: string) {
  const res = await fetch(`/api/consultas/${encodeURIComponent(id)}`)
  return res.json()
}
