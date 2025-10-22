import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

type Params = { params: { id: string } }

function toNumericId(id: string): number | null {
  const s = String(id).trim()
  if (/^\d+$/.test(s)) return Number(s)
  const m = s.match(/^ID-0*(\d+)$/i)
  return m ? Number(m[1]) : null
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
// GET: Obtiene todas las consultas de seguimiento de un paciente
// ==================================================
export async function GET(_req: Request, { params }: Params) {
  try {
    const idNum = toNumericId(params.id)
    if (idNum === null) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Buscar todas las consultas de seguimiento ordenadas por número
    const { data, error } = await supabaseAdmin
      .from("consultas_seguimiento")
      .select("*")
      .eq("folio_paciente", idNum)
      .order("numero_consulta", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar los datos
    const consultasNormalizadas = (data || []).map((consulta) => ({
      id: consulta.id,
      folio_paciente: consulta.folio_paciente,
      numero_consulta: consulta.numero_consulta,
      sintomas_seleccionados: consulta.sintomas ? String(consulta.sintomas).split(", ").filter(Boolean) : [],
      factores_seleccionados: consulta.factores_riesgo
        ? String(consulta.factores_riesgo).split(", ").filter(Boolean)
        : [],
      tvus: consulta.tvus ?? null,
      hcg_valor: asNumOrNull(consulta.hcg_valor),
      variacion_hcg: consulta.variacion_hcg ?? null,
      resultado: parsePctToProb(consulta.pronostico),
      fecha_consulta: consulta.fecha_consulta,
    }))

    return NextResponse.json({ data: consultasNormalizadas })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

// ==================================================
// POST: Crea una nueva consulta de seguimiento
// ==================================================
export async function POST(req: Request, { params }: Params) {
  try {
    const idNum = toNumericId(params.id)
    if (idNum === null) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()

    // Obtener el número de consulta actual (contar las existentes + 1)
    const { data: existentes, error: countError } = await supabaseAdmin
      .from("consultas_seguimiento")
      .select("numero_consulta")
      .eq("folio_paciente", idNum)
      .order("numero_consulta", { ascending: false })
      .limit(1)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // El número de consulta es el siguiente al último registrado
    // La primera consulta de seguimiento es la número 2 (la 1 está en la tabla principal)
    const numeroConsulta = existentes && existentes.length > 0 ? existentes[0].numero_consulta + 1 : 2

    const insertData = {
      folio_paciente: idNum,
      numero_consulta: numeroConsulta,
      sintomas: Array.isArray(body.sintomas_seleccionados) ? body.sintomas_seleccionados.join(", ") : null,
      factores_riesgo: Array.isArray(body.factores_seleccionados) ? body.factores_seleccionados.join(", ") : null,
      tvus: body.tvus ?? null,
      hcg_valor: body.hcg_valor != null ? Number(body.hcg_valor) : null,
      variacion_hcg: body.variacion_hcg ?? null,
      pronostico: body.resultado != null ? `${(Number(body.resultado) * 100).toFixed(1)}%` : null,
      fecha_consulta: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("consultas_seguimiento").insert(insertData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, numero_consulta: numeroConsulta })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}
