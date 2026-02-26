import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// GET /api/cases?hospital_id=CMG&status=ACTIVE
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const hospital_id = searchParams.get("hospital_id") ?? "CMG"
    const status = searchParams.get("status")

    let query = supabaseAdmin
      .from("cases")
      .select("*")
      .eq("hospital_id", hospital_id)
      .order("last_consult_finished_at", { ascending: true, nullsFirst: true })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

// POST /api/cases — crea o actualiza un caso al iniciar una consulta
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      folio,
      patient_name,
      patient_age,
      hospital_id = "CMG",
      doctor_name,
      consulta_id,
    } = body

    if (!folio || !patient_name) {
      return NextResponse.json({ error: "folio y patient_name son requeridos" }, { status: 400 })
    }

    // Verificar si ya existe el caso
    const { data: existing } = await supabaseAdmin
      .from("cases")
      .select("id, status")
      .eq("folio", folio)
      .single()

    if (existing) {
      // Actualizar caso existente: inicio de consulta
      const { data, error } = await supabaseAdmin
        .from("cases")
        .update({
          last_consult_started_at: new Date().toISOString(),
          status: existing.status === "ACTIVE" ? "ACTIVE" : existing.status,
          doctor_name: doctor_name ?? undefined,
          consulta_id: consulta_id ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("folio", folio)
        .select("*")
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data, created: false })
    }

    // Crear nuevo caso
    const { data, error } = await supabaseAdmin
      .from("cases")
      .insert({
        folio,
        patient_name,
        patient_age: patient_age ?? null,
        hospital_id,
        doctor_name: doctor_name ?? null,
        consulta_id: consulta_id ?? null,
        last_consult_started_at: new Date().toISOString(),
        status: "ACTIVE",
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, created: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
