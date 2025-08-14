// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Params = { params: { id: string } }

function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, serviceKey)
}

// GET /api/consultas/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = supabaseServer()
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('GET /api/consultas/:id error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 404 })
  }
}

// PATCH /api/consultas/:id
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const patch: Record<string, any> = { ...body }
    delete patch.id // no permitir cambiar PK

    // Normaliza arrays y números por si vienen como string
    if ('sintomas_seleccionados' in patch && !Array.isArray(patch.sintomas_seleccionados)) {
      patch.sintomas_seleccionados = []
    }
    if ('factores_seleccionados' in patch && !Array.isArray(patch.factores_seleccionados)) {
      patch.factores_seleccionados = []
    }
    ;[
      'edad_paciente',
      'frecuencia_cardiaca',
      'presion_sistolica',
      'presion_diastolica',
      'hcg_valor',
      'hcg_anterior',
      'resultado',
      'hcg_c2',
      'resultado_c2',
      'hcg_c3',
      'resultado_c3',
    ].forEach((k) => {
      if (k in patch && patch[k] != null) patch[k] = Number(patch[k])
    })

    const supabase = supabaseServer()
    const { data, error } = await supabase
      .from('consultas')
      .update(patch) // tu trigger/updated_at se encargará de la fecha
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('PATCH /api/consultas/:id error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}

// DELETE /api/consultas/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const supabase = supabaseServer()
    const { error } = await supabase.from('consultas').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/consultas/:id error:', err?.message || err)
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 })
  }
}
