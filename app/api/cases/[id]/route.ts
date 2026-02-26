import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// PATCH /api/cases/:id — actualiza estado, riesgo o cierre del caso
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()

    const allowed = [
      "status",
      "closure_reason",
      "closed_at",
      "last_risk_probability",
      "last_consult_finished_at",
      "last_consult_started_at",
      "doctor_name",
      "consulta_id",
    ]

    const patch: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) patch[key] = body[key]
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 })
    }

    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("cases")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

// GET /api/cases/:id — detalle de un caso
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data, error } = await supabaseAdmin
      .from("cases")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
