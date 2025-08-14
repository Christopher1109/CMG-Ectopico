// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

type Params = { params: { id: string } }

// GET /api/consultas/:id
export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/consultas/:id?visita=2|3
export async function PATCH(req: Request, { params }: Params) {
  const url = new URL(req.url)
  const visitaParam = url.searchParams.get('visita')
  const visita = visitaParam ? Number(visitaParam) : 1

  const body = await req.json()

  // Nunca permitimos cambiar la PK
  delete (body as any).id

  let mapped: Record<string, any> = {}

  if (visita === 2 || visita === 3) {
    // mapear a *_2 o *_3
    const suf = `_${visita}` // "_2" o "_3"

    // Sólo adjuntamos lo que venga en el body:
    if ('sintomas_seleccionados' in body) mapped[`sintomas_seleccionados${suf}`] = body.sintomas_seleccionados
    if ('factores_seleccionados' in body) mapped[`factores_seleccionados${suf}`] = body.factores_seleccionados
    if ('tvus' in body) mapped[`tvus${suf}`] = body.tvus
    if ('hcg_valor' in body) mapped[`hcg_valor${suf}`] = body.hcg_valor
    if ('hcg_anterior' in body) mapped[`hcg_anterior${suf}`] = body.hcg_anterior
    if ('variacion_hcg' in body) mapped[`variacion_hcg${suf}`] = body.variacion_hcg
    if ('resultado' in body) mapped[`resultado${suf}`] = body.resultado
    if ('usuario_editor' in body) mapped[`usuario_editor${suf}`] = body.usuario_editor
    if (visita === 2) mapped['fecha_consulta_2'] = new Date().toISOString()
    if (visita === 3) mapped['fecha_consulta_3'] = new Date().toISOString()
  } else {
    // (no lo usamos para visita 1; la visita 1 se crea con POST)
    mapped = { ...body }
  }

  // Si no llegó nada mapeable, devolvemos 400
  if (!Object.keys(mapped).length) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('consultas')
    .update(mapped)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/consultas/:id  (opcional)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('consultas').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

