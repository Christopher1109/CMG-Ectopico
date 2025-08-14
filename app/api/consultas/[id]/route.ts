// app/api/consultas/[id]/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { data, error } = await supabaseAdmin.from("consultas").select("*").eq("id", params.id).single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const visita = searchParams.get("visita") // 2 o 3

    const patch: Record<string, any> = { ...body }
    delete patch.id // no cambiar PK

    // Si es consulta de seguimiento (visita 2 o 3), mapear campos
    if (visita === "2" || visita === "3") {
      const suffix = `_${visita}`

      // Mapear campos de seguimiento
      if (patch.sintomas_seleccionados !== undefined) {
        patch[`sintomas_seleccionados${suffix}`] = Array.isArray(patch.sintomas_seleccionados)
          ? patch.sintomas_seleccionados
          : []
        delete patch.sintomas_seleccionados
      }

      if (patch.factores_seleccionados !== undefined) {
        patch[`factores_seleccionados${suffix}`] = Array.isArray(patch.factores_seleccionados)
          ? patch.factores_seleccionados
          : []
        delete patch.factores_seleccionados
      }

      if (patch.tvus !== undefined) {
        patch[`tvus${suffix}`] = patch.tvus
        delete patch.tvus
      }

      if (patch.hcg_valor !== undefined) {
        patch[`hcg_valor${suffix}`] = patch.hcg_valor != null ? Number(patch.hcg_valor) : null
        delete patch.hcg_valor
      }

      if (patch.hcg_anterior !== undefined) {
        patch[`hcg_anterior${suffix}`] = patch.hcg_anterior != null ? Number(patch.hcg_anterior) : null
        delete patch.hcg_anterior
      }

      if (patch.variacion_hcg !== undefined) {
        patch[`variacion_hcg${suffix}`] = patch.variacion_hcg
        delete patch.variacion_hcg
      }

      if (patch.resultado !== undefined) {
        patch[`resultado${suffix}`] = patch.resultado != null ? Number(patch.resultado) : null
        delete patch.resultado
      }
    } else {
      // Normaliza arrays para jsonb en consulta inicial
      if (patch.sintomas_seleccionados && !Array.isArray(patch.sintomas_seleccionados)) {
        patch.sintomas_seleccionados = []
      }
      if (patch.factores_seleccionados && !Array.isArray(patch.factores_seleccionados)) {
        patch.factores_seleccionados = []
      }
    }

    // Actualizar fecha de última actualización
    patch.fecha_ultima_actualizacion = new Date().toISOString()

    const { data, error } = await supabaseAdmin.from("consultas").update(patch).eq("id", params.id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { error } = await supabaseAdmin.from("consultas").delete().eq("id", params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
