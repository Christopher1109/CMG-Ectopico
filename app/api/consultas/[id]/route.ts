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

    console.log("PATCH recibido:", { id: params.id, visita, body }) // Para debug

    // Preparar el objeto de actualización
    const updateData: Record<string, any> = {
      fecha_ultima_actualizacion: new Date().toISOString(),
    }

    // Si es consulta de seguimiento (visita 2 o 3), mapear campos con sufijo
    if (visita === "2" || visita === "3") {
      const suffix = `_${visita}`

      // Mapear cada campo con su sufijo correspondiente
      if (body.sintomas_seleccionados !== undefined) {
        updateData[`sintomas_seleccionados${suffix}`] = Array.isArray(body.sintomas_seleccionados)
          ? body.sintomas_seleccionados
          : []
      }

      if (body.factores_seleccionados !== undefined) {
        updateData[`factores_seleccionados${suffix}`] = Array.isArray(body.factores_seleccionados)
          ? body.factores_seleccionados
          : []
      }

      if (body.tvus !== undefined) {
        updateData[`tvus${suffix}`] = body.tvus
      }

      if (body.hcg_valor !== undefined) {
        updateData[`hcg_valor${suffix}`] = body.hcg_valor != null ? Number(body.hcg_valor) : null
      }

      if (body.hcg_anterior !== undefined) {
        updateData[`hcg_anterior${suffix}`] = body.hcg_anterior != null ? Number(body.hcg_anterior) : null
      }

      if (body.variacion_hcg !== undefined) {
        updateData[`variacion_hcg${suffix}`] = body.variacion_hcg
      }

      if (body.resultado !== undefined) {
        updateData[`resultado${suffix}`] = body.resultado != null ? Number(body.resultado) : null
      }

      if (body.usuario_editor !== undefined) {
        updateData.usuario_creador = body.usuario_editor
      }
    } else {
      // Para consulta inicial, actualizar campos normales
      Object.keys(body).forEach((key) => {
        if (key !== "id") {
          updateData[key] = body[key]
        }
      })
    }

    console.log("Datos a actualizar:", updateData) // Para debug

    const { data, error } = await supabaseAdmin
      .from("consultas")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error de Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Actualización exitosa:", data) // Para debug
    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("Error en PATCH:", e)
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
