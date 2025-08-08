import type { NextApiRequest, NextApiResponse } from "next"
import { appendRow, findRowById } from "../../../lib/sheets"
import { Paciente, pacienteToRow } from "../../../lib/mapPaciente"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

    const body: Paciente = req.body
    if (!body?.id) return res.status(400).json({ error: "Falta ID" })

    const { rowIndex } = await findRowById(body.id)
    if (rowIndex !== -1) return res.status(409).json({ error: "El ID ya existe" })

    const now = new Date().toISOString()
    body.fechaCreacion = body.fechaCreacion || now
    body.fechaUltimaActualizacion = now

    await appendRow(pacienteToRow(body))
    return res.status(201).json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: "Server error" })
  }
}
