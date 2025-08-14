import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role en el servidor
  { auth: { persistSession: false, autoRefreshToken: false } }
)

type Params = { params: { id: string } }

// GET /api/consultas/:id
export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase.from("consultas").select("*").eq("id", params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/consultas/:id?visita=2|3   (Consultas 2 y 3)
export async function PATCH(req: Request, { params }: Params) {
  const url = new URL(req.url)
  const visita = Number(url.searchParams.get("visita"))
  const body = await req.json()

  if (![2, 3].includes(visita)) {
    return NextResponse.json({ error: "Parámetro 'visita' debe ser 2 o 3" }, { status: 400 })
  }

  // Mapea campos genéricos -> columnas *_2 o *_3
  const suffix = `_${visita}`

  const patch: Record<string, any> = {
    // campos comunes que también podrías actualizar
    nombre_paciente: body.nombre_paciente ?? null,
    edad_paciente: body.edad_paciente != null ? Number(body.edad_paciente) : null,

    // campos de la visita n
    [`sintomas_seleccionados${suffix}`]: body.sintomas_seleccionados ?? [],
    [`factores_seleccionados${suffix}`]: body.factores_seleccionados ?? [],
    [`tvus${suffix}`]: body.tvus ?? null,
    [`hcg_valor${suffix}`]: body.hcg_valor != null ? Number(body.hcg_valor) : null,
    [`hcg_anterior${suffix}`]: body.hcg_anterior != null ? Number(body.hcg_anterior) : null,
    [`variacion_hcg${suffix}`]: body.variacion_hcg ?? null,
    [`resultado${suffix}`]: body.resultado != null ? Number(body.resultado) : null,

    // opcional meta
    usuario_editor: body.usuario_editor ?? "anon",
  }

  const { data, error } = await supabase
    .from("consultas")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/consultas/:id  (opcional)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("consultas").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
