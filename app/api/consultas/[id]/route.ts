import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

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
export async function GET(_req: Request, { params }: Params) {
  try {
    const idNum = toNumericId(params.id)
    if (idNum === null) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { searchParams } = new URL(_req.url)
    const scope = searchParams.get("scope")

    console.log("[v0 API] GET /api/consultas/[id] - Buscando consulta:", { idNum, scope })

    // Buscar por folio primero, luego por id si no se encuentra
    let data = null
    let error = null

    // Intentar buscar por folio
    const folioResult = await supabaseAdmin.from("consultas").select("*").eq("folio", idNum).single()

    console.log("[v0 API] Búsqueda por folio:", { folio: idNum, found: !!folioResult.data, error: folioResult.error })

    if (folioResult.data) {
      data = folioResult.data
      console.log("[v0 API] Datos encontrados por folio:", {
        folio: data.folio,
        TVUS_1: data.TVUS_1,
        hCG_1: data.hCG_1,
        Pronostico_1: data.Pronostico_1,
        TVUS_2: data.TVUS_2,
        hCG_2: data.hCG_2,
        Pronostico_2: data.Pronostico_2,
        TVUS_3: data.TVUS_3,
        hCG_3: data.hCG_3,
        Pronostico_3: data.Pronostico_3,
      })
    } else {
      // Si no se encuentra por folio, buscar por id
      const idResult = await supabaseAdmin.from("consultas").select("*").eq("id", idNum).single()

      console.log("[v0 API] Búsqueda por id:", { id: idNum, found: !!idResult.data, error: idResult.error })

      data = idResult.data
      error = idResult.error
    }

    if (error || !data) {
      console.log("[v0 API] No se encontró consulta:", { error: error?.message })
      return NextResponse.json({ error: error?.message || "Consulta no encontrada" }, { status: 404 })
    }

    if (scope === "previous") {
      // Determine which is the last completed visit
      let lastVisit = 1
      let lastVisitData: any = {
        visit_number: 1,
        tvus: data.TVUS_1,
        hcg: asNumOrNull(data.hCG_1),
        resultado: parsePctToProb(data.Pronostico_1),
      }

      if (data.TVUS_2 || data.hCG_2 || data.Pronostico_2) {
        lastVisit = 2
        lastVisitData = {
          visit_number: 2,
          tvus: data.TVUS_2,
          hcg: asNumOrNull(data.hCG_2),
          resultado: parsePctToProb(data.Pronostico_2),
          variacion_hcg: data.Variacion_hCG_2,
        }
      }

      if (data.TVUS_3 || data.hCG_3 || data.Pronostico_3) {
        lastVisit = 3
        lastVisitData = {
          visit_number: 3,
          tvus: data.TVUS_3,
          hcg: asNumOrNull(data.hCG_3),
          resultado: parsePctToProb(data.Pronostico_3),
          variacion_hcg: data.Variacion_hCG_3,
        }
      }

      console.log("[v0 API] Returning previous visit:", lastVisitData)
      return NextResponse.json(lastVisitData)
    }

    // Normaliza campos hacia el formato que usa tu frontend
    const consultaNormalizada = {
      id: data.id,
      folio: data.folio,
      id_publico: toPublicId(data.folio), // Usar folio para el ID público

      fecha_creacion: data.created_at,
      fecha_ultima_actualizacion: data.updated_at,

      usuario_creador: data.Dr,
      nombre_paciente: data.Px,
      edad_paciente: data.Edad_Px,

      frecuencia_cardiaca: data.FC,
      presion_sistolica: data.PS,
      presion_diastolica: data.PD,
      estado_conciencia: data.EC,

      prueba_embarazo_realizada: data.Prueba_Emb,
      resultado_prueba_embarazo: data.Resultado_Emb,

      hallazgos_exploracion: data.Hallazgos,
      tiene_eco_transabdominal: data.Eco_abdominal,
      resultado_eco_transabdominal: data.Resultado_EcoAbd,

      // 1ª consulta
      sintomas_seleccionados: data.Sintomas ? String(data.Sintomas).split(", ").filter(Boolean) : [],
      factores_seleccionados: data.Fac_Riesg ? String(data.Fac_Riesg).split(", ").filter(Boolean) : [],
      tvus: data.TVUS_1 ?? null,
      hcg_valor: asNumOrNull(data.hCG_1),
      resultado: parsePctToProb(data.Pronostico_1),

      // 2ª consulta
      sintomas_seleccionados_2: data.Sintomas_2 ? String(data.Sintomas_2).split(", ").filter(Boolean) : null,
      factores_seleccionados_2: data.Factores_2 ? String(data.Factores_2).split(", ").filter(Boolean) : null,
      tvus_2: data.TVUS_2 ?? null,
      hcg_valor_2: asNumOrNull(data.hCG_2),
      variacion_hcg_2: data.Variacion_hCG_2 ?? null,
      resultado_2: parsePctToProb(data.Pronostico_2),

      // 3ª consulta
      sintomas_seleccionados_3: data.Sintomas_3 ? String(data.Sintomas_3).split(", ").filter(Boolean) : null,
      factores_seleccionados_3: data.Factores_3 ? String(data.Factores_3).split(", ").filter(Boolean) : null,
      tvus_3: data.TVUS_3 ?? null,
      hcg_valor_3: asNumOrNull(data.hCG_3),
      variacion_hcg_3: data.Variacion_hCG_3 ?? null,
      resultado_3: parsePctToProb(data.Pronostico_3),
    }

    console.log("[v0 API] Consulta normalizada:", {
      folio: consultaNormalizada.folio,
      tvus: consultaNormalizada.tvus,
      hcg_valor: consultaNormalizada.hcg_valor,
      resultado: consultaNormalizada.resultado,
      tvus_2: consultaNormalizada.tvus_2,
      hcg_valor_2: consultaNormalizada.hcg_valor_2,
      resultado_2: consultaNormalizada.resultado_2,
      tvus_3: consultaNormalizada.tvus_3,
      hcg_valor_3: consultaNormalizada.hcg_valor_3,
      resultado_3: consultaNormalizada.resultado_3,
    })

    return NextResponse.json({ data: consultaNormalizada })
  } catch (e: any) {
    console.error("[v0 API] Error en GET /api/consultas/[id]:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
  }
}

// ==================================================
// PATCH: Actualiza una consulta (visita 2 o 3)
// ==================================================
export async function PATCH(req: Request, { params }: Params) {
  try {
    const idNum = toNumericId(params.id)
    if (idNum === null) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const visitaRaw = searchParams.get("visita") ?? ""
    const visita = Number(visitaRaw)

    console.log("[v0 API] PATCH /api/consultas/[id] - Actualizando consulta:", { idNum, visita })

    // Valida visita estrictamente como 2 o 3 (evita "2:1")
    if (![2, 3].includes(visita)) {
      return NextResponse.json({ error: "Parámetro 'visita' inválido (use 2 o 3)" }, { status: 400 })
    }

    const body = await req.json()
    console.log("[v0 API] Body recibido:", body)

    const updateData: Record<string, any> = {}

    if (visita === 2) {
      updateData.Sintomas_2 = Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : (body.sintomas_seleccionados ?? null)

      updateData.Factores_2 = Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : (body.factores_seleccionados ?? null)

      updateData.TVUS_2 = body.tvus ?? null
      updateData.hCG_2 = body.hcg_valor != null ? Number(body.hcg_valor) : null
      updateData.Variacion_hCG_2 = body.variacion_hcg ?? null

      // cuidado con 0: acepta 0 como valor válido
      updateData.Pronostico_2 = body.resultado != null ? `${(Number(body.resultado) * 100).toFixed(1)}%` : null

      updateData.Consulta_2_Date = new Date().toISOString()

      console.log("[v0 API] Update data para visita 2:", updateData)
    } else if (visita === 3) {
      updateData.Sintomas_3 = Array.isArray(body.sintomas_seleccionados)
        ? body.sintomas_seleccionados.join(", ")
        : (body.sintomas_seleccionados ?? null)

      updateData.Factores_3 = Array.isArray(body.factores_seleccionados)
        ? body.factores_seleccionados.join(", ")
        : (body.factores_seleccionados ?? null)

      updateData.TVUS_3 = body.tvus ?? null
      updateData.hCG_3 = body.hcg_valor != null ? Number(body.hcg_valor) : null
      updateData.Variacion_hCG_3 = body.variacion_hcg ?? null

      updateData.Pronostico_3 = body.resultado != null ? `${(Number(body.resultado) * 100).toFixed(1)}%` : null

      updateData.Consulta_3_Date = new Date().toISOString()

      console.log("[v0 API] Update data para visita 3:", updateData)
    }

    // Buscar por folio primero, luego por id
    let targetId = null
    const folioResult = await supabaseAdmin.from("consultas").select("id").eq("folio", idNum).single()

    if (folioResult.data) {
      targetId = folioResult.data.id
      console.log("[v0 API] Encontrado por folio, usando id:", targetId)
    } else {
      // Si no se encuentra por folio, usar el idNum como id directo
      targetId = idNum
      console.log("[v0 API] No encontrado por folio, usando idNum como id:", targetId)
    }

    const { data, error } = await supabaseAdmin
      .from("consultas")
      .update(updateData)
      .eq("id", targetId)
      .select()
      .single()

    if (error) {
      console.error("[v0 API] Error al actualizar:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0 API] Consulta actualizada exitosamente:", {
      id: data.id,
      folio: data.folio,
      TVUS_2: data.TVUS_2,
      hCG_2: data.hCG_2,
      Pronostico_2: data.Pronostico_2,
    })

    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("[v0 API] Error en PATCH /api/consultas/[id]:", e)
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 })
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
