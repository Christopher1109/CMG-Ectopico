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

    console.log("PATCH recibido:", { id: params.id, visita, body })

    // Preparar el objeto de actualización usando el NUEVO esquema
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Si es consulta de seguimiento (visita 2 o 3), mapear campos con sufijo
    if (visita === "2" || visita === "3") {
      const suffix = `_${visita}`

      if (body.sintomasSeleccionados !== undefined) {
        updateData[`sintomas${suffix}`] = Array.isArray(body.sintomasSeleccionados)
          ? body.sintomasSeleccionados.join(", ")
          : ""
      }

      if (body.factoresSeleccionados !== undefined) {
        updateData[`factores${suffix}`] = Array.isArray(body.factoresSeleccionados)
          ? body.factoresSeleccionados.join(", ")
          : ""
      }

      if (body.tvus !== undefined) {
        updateData[`tvus${suffix}`] = body.tvus
      }

      if (body.hcgValor !== undefined) {
        updateData[`hcg${suffix}`] = body.hcgValor != null ? Number(body.hcgValor) : null
      }

      if (body.variacionHcg !== undefined) {
        updateData[`variacion_hcg${suffix}`] = body.variacionHcg
      }

      if (body.resultado !== undefined) {
        updateData[`pronostico${suffix}`] =
          body.resultado != null ? `${(Number(body.resultado) * 100).toFixed(1)}%` : null
      }

      updateData[`consulta${suffix}_date`] = new Date().toISOString()
    } else {
      // Para consulta inicial, actualizar campos normales
      if (body.nombrePaciente !== undefined) updateData.px = body.nombrePaciente
      if (body.edadPaciente !== undefined) updateData.edad_px = Number(body.edadPaciente)
      if (body.sintomasSeleccionados !== undefined) {
        updateData.sintomas = Array.isArray(body.sintomasSeleccionados) ? body.sintomasSeleccionados.join(", ") : ""
      }
      if (body.factoresSeleccionados !== undefined) {
        updateData.fac_riesg = Array.isArray(body.factoresSeleccionados) ? body.factoresSeleccionados.join(", ") : ""
      }
      if (body.tvus !== undefined) updateData.tvus_1 = body.tvus
      if (body.hcgValor !== undefined) updateData.hcg_1 = Number(body.hcgValor)
      if (body.resultado !== undefined) {
        updateData.pronostico_1 = `${(Number(body.resultado) * 100).toFixed(1)}%`
      }
    }

    console.log("Datos a actualizar:", updateData)

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

    console.log("Actualización exitosa:", data)
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
