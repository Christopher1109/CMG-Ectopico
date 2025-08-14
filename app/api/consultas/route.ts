import { NextResponse } from "next/server"
import { supabase } from "../../../lib/supabaseClient" // Usando el cliente existente

// GET /api/consultas?limit=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get("limit") ?? 20)

  const { data, error } = await supabase
    .from("consultas")
    .select("*")
    .order("fecha_creacion", { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/consultas
export async function POST(req: Request) {
  const body = await req.json()

  // Tu PK es VARCHAR(20); generamos uno corto si no lo mandas
  const genId = "CONS-" + Date.now().toString(36).slice(-10)

  const payload = {
    id: (body.id ?? genId).slice(0, 20),
    usuario_creador: body.usuario_creador ?? "anon",
    nombre_paciente: body.nombre_paciente ?? "N/A",
    edad_paciente: Number(body.edad_paciente ?? 0),

    frecuencia_cardiaca: body.frecuencia_cardiaca ?? null,
    presion_sistolica: body.presion_sistolica ?? null,
    presion_diastolica: body.presion_diastolica ?? null,
    estado_conciencia: body.estado_conciencia ?? null,
    prueba_embarazo_realizada: body.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: body.resultado_prueba_embarazo ?? null,
    hallazgos_exploracion: body.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: body.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: body.resultado_eco_transabdominal ?? null,
    sintomas_seleccionados: body.sintomas_seleccionados ?? [],
    factores_seleccionados: body.factores_seleccionados ?? [],
    tvus: body.tvus ?? null,
    hcg_valor: body.hcg_valor !== undefined ? Number(body.hcg_valor) : null,
    variacion_hcg: body.variacion_hcg ?? null,
    hcg_anterior: body.hcg_anterior !== undefined ? Number(body.hcg_anterior) : null,
    resultado: body.resultado !== undefined ? Number(body.resultado) : null,
  }

  const { data, error } = await supabase.from("consultas").insert(payload).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
