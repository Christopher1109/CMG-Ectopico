export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { appendRow, findRowById } from "../../../lib/sheets"
import { Paciente, pacienteToRow } from "../../../lib/mapPaciente"

export async function POST(req: Request) {
  try {
    const body: Paciente = await req.json()
    if (!body?.id) return NextResponse.json({ error: "Falta ID" }, { status: 400 })

    const { rowIndex } = await findRowById(body.id)
    if (rowIndex !== -1) return NextResponse.json({ error: "El ID ya existe" }, { status: 409 })

    const now = new Date().toISOString()
    body.fechaCreacion = body.fechaCreacion || now
    body.fechaUltimaActualizacion = now

    await appendRow(pacienteToRow(body))
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
