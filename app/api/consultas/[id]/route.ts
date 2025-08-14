import { NextResponse } from "next/server"
import { supabase } from "../../../../lib/supabaseClient" // Usando el cliente existente

type Params = { params: { id: string } }

// GET /api/consultas/CONS-xxxx
export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase.from("consultas").select("*").eq("id", params.id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/consultas/CONS-xxxx
export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json()
  const patch: Record<string, any> = { ...body }
  delete patch.id // no permitir cambiar la PK

  const { data, error } = await supabase
    .from("consultas")
    .update(patch) // tu trigger actualizará las fechas si lo agregaste
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("consultas").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
