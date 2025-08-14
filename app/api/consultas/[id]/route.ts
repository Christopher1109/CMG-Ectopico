// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // <- SERVICE ROLE aquí también
  { auth: { persistSession: false } }
)

type Params = { params: { id: string } }

// GET /api/consultas/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { data, error } = await supabase
      .from('consultas')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Not found' }, { status: 404 })
  }
}

// PATCH /api/consultas/:id
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()

    // No permitimos cambiar la PK
    const patch: Record<string, any> = { ...body }
    delete patch.id

    const { data, error } = await supabase
      .from('consultas')
      .update(patch)              // tu trigger actualizará updated_at/fecha_ultima_actualizacion
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'PATCH failed' }, { status: 500 })
  }
}

// DELETE /api/consultas/:id  (opcional)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { error } = await supabase.from('consultas').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'DELETE failed' }, { status: 500 })
  }
}

