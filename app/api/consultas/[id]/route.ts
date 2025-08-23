import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { obtenerConsulta, actualizarConsulta } from "@/lib/api/consultas"

type Params = { params: { id: string } }

// ---------- Helpers ----------
function toNumericId(id: string): number | null {
  const s = String(id).trim()
  if (/^\d+$/.test(s)) return Number(s) // "98" -> 98
  const m = s.match(/^ID-0*(\d+)$/i) // "ID-00098" -> 98
  return m ? Number(m[1]) : null
}

function toPublicId(folio: number): string {
  return `ID-${String(folio).padStart(5, "0")}`
}

function parsePctToProb(x: unknown): number | null {
  if (x == null) return null
  if (typeof x === "number") return x
  if (typeof x === "string") {
    const num = Number.parseFloat(x.replace("%", ""))
    return Number.isFinite(num) ? num / 100 : null
  }
  return null
}

function asNumOrNull(x: unknown): number | null {
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}

// ==================================================
// GET: Obtiene una consulta por ID o folio
// ==================================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resultado = await obtenerConsulta(params.id)

    if (resultado.error) {
      return NextResponse.json({ error: resultado.error }, { status: 404 })
    }

    return NextResponse.json({ data: resultado.data })
  } catch (error) {
    console.error("Error en GET /api/consultas/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ==================================================
// PATCH: Actualiza una consulta (visita 2 o 3)
// ==================================================
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datos = await request.json()
    const { visitaNo, ...datosConsulta } = datos

    if (!visitaNo || (visitaNo !== 2 && visitaNo !== 3)) {
      return NextResponse.json({ error: "visitaNo debe ser 2 o 3" }, { status: 400 })
    }

    const resultado = await actualizarConsulta(params.id, visitaNo, datosConsulta)

    if (resultado.error) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({ data: resultado.data })
  } catch (error) {
    console.error("Error en PATCH /api/consultas/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// ==================================================
// DELETE: Elimina una consulta por ID o folio
// ==================================================
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const idNum = toNumericId(params.id)
    if (idNum === null) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Buscar por folio primero, luego por id
    let targetId = null
    const folioResult = await supabaseAdmin.from("consultas").select("id").eq("folio", idNum).single()

    if (folioResult.data) {
      targetId = folioResult.data.id
    } else {
      targetId = idNum
    }

    const { error } = await supabaseAdmin.from("consultas").delete().eq("id", targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
