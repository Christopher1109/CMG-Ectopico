// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

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

/**
 * PATCH /api/consultas/:id
 * Actualiza la Consulta 2 o 3 según body.visita_no (2|3)
 * Solo mapeamos columnas que SÍ existen en la tabla.
 */
export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json()
  const visita_no = Number(body.visita_no ?? 2) // por defecto, 2

  // Campos base que opcionalmente podrías permitir actualizar
  const basePatch: Record<string, any> = {}
  if (Array.isArray(body.sintomas_seleccionados)) basePatch.sintomas_seleccionados = body.sintomas_seleccionados
  if (Array.isArray(body.factores_seleccionados)) basePatch.factores_seleccionados = body.factores_seleccionados

  // Campos de la visita (2 o 3) -> mapeo a *_2 o *_3
  const suf = visita_no === 3 ? '_3' : '_2'
  const patchVisita: Record<string, any> = {
    [`tvus${suf}`]: body.tvus ?? null,
    [`hcg_valor${suf}`]: body.hcg_valor != null ? Number(body.hcg_valor) : null,
    [`hcg_anterior${suf}`]: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
    [`variacion_hcg${suf}`]: body.variacion_hcg ?? null,
    [`resultado${suf}`]: body.resultado != null ? Number(body.resultado) : null,
    [`usuario_consulta${suf}`]: body.usuario_editor ?? body.usuario_creador ?? 'anon',
    [`fecha_consulta${suf}`]: new Date().toISOString(),
  }

  const patch = { ...basePatch, ...patchVisita }

  const { data, error } = await supabase
    .from('consultas')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE opcional
export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await supabase.from('consultas').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
