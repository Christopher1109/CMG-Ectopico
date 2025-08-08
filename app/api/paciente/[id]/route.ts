import { NextResponse } from "next/server"
import { findRowById, updateRow } from "../../../../lib/sheets"
import { rowToPaciente, pacienteToRow, Paciente } from "../../../../lib/mapPaciente"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { rowIndex, row } = await findRowById(params.id)
  if (rowIndex === -1 || !row) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(rowToPaciente(row))
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { rowIndex, row } = await findRowById(params.id)
  if (rowIndex === -1 || !row) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const updates: Partial<Paciente> = await req.json()
  const current = rowToPaciente(row)
  const merged: Paciente = {
    ...current,
    ...updates,
    id: current.id,
    fechaCreacion: current.fechaCreacion || new Date().toISOString(),
    fechaUltimaActualizacion: new Date().toISOString(),
  }

  await updateRow(rowIndex, pacienteToRow(merged))
  return NextResponse.json({ ok: true })
}
