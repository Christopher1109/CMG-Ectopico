import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

// ================== Auth ==================
function verificarToken(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  try {
    const token = authHeader.substring(7)
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// ================== Tablas del paper (Tabla 1) ==================
const PROBABILIDADES_SIN_FACTORES = {
  asintomatica: 0.017,
  sangrado: 0.03,
  dolor: 0.13,
  dolor_sangrado: 0.15,
}
const PROBABILIDADES_CON_FACTORES = {
  asintomatica: 0.05,
  sangrado: 0.08,
  dolor: 0.4,
  dolor_sangrado: 0.46,
}
const TVUS_MAP = {
  normal: 0.07,
  libre: 2.4,        // cualquier cantidad de líquido libre
  masa: 38,          // masa anexial extraovárica
  masa_libre: 47,    // masa + líquido libre
}
const HCG_MAP = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}
const VARIACION_HCG_MAP = {
  reduccion_1_35: 16.6,
  reduccion_35_50: 0.8,
  reduccion_mayor_50: 0.0,
  aumento: 3.3,
  no_disponible: 1,
}
const DZ_HCG = 2000 // mUI/mL
const UMBRAL_ALTO = 0.95
const UMBRAL_BAJO = 0.01

// ================== Utilidades ==================
function toNumero(x: unknown): number | null {
  const n = Number.parseFloat(String(x ?? ""))
  return Number.isFinite(n) ? n : null
}

function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) odds *= LR
  const p = odds / (1 + odds)
  return Number.isFinite(p) ? +(p.toFixed(4)) : 0
}

/**
 * Clasifica variación de hCG según paper.
 * Cambios absolutos <1% -> "no_disponible" (LR=1) para no sobredimensionar ruido.
 */
function clasificarVariacionHcg(previo: string | number | null | undefined, actual: string | number | null | undefined) {
  const a = toNumero(previo)
  const b = toNumero(actual)
  if (a === null || b === null || a <= 0) return "no_disponible"
  const delta = b - a
  const cambioRel = (delta / a) * 100

  // Zona muerta ±<1% => no_disponible
  if (Math.abs(cambioRel) < 1) return "no_disponible"

  if (b > a) return "aumento"
  const reduccionPorc = ((a - b) / a) * 100
  if (reduccionPorc >= 50) return "reduccion_mayor_50"
  if (reduccionPorc >= 35) return "reduccion_35_50"
  if (reduccionPorc >= 1) return "reduccion_1_35"
  return "aumento"
}

function seleccionarClaveSintoma(sintomas: string[]) {
  // binario según paper
  if (sintomas.includes("dolor_sangrado")) return "dolor_sangrado"
  if (sintomas.includes("sangrado") && sintomas.includes("dolor")) return "dolor_sangrado"
  if (sintomas.includes("sangrado")) return "sangrado"
  if (sintomas.includes("dolor")) return "dolor"
  return "asintomatica"
}

// ================== Handler ==================
export async function POST(req: Request) {
  try {
    const usuario = verificarToken(req)
    const body = await req.json()

    const {
      // requeridos / clínicos
      tvus,                         // "normal" | "libre" | "masa" | "masa_libre"
      sintomasSeleccionados,        // ["dolor", "sangrado", ...]
      factoresSeleccionados,        // [...]
      // hCG actual y previos
      hcgValor,                     // string | number (actual)
      hcgAnterior,                  // string | number (para 1→2)
      hcgValorVisita1,              // string | number (para 1→3, recomendado)
      // control de visita/estado
      esConsultaSeguimiento,        // boolean
      numeroConsultaActual,         // 1 | 2 | 3
      resultadoV1b,                 // número: posttest tras visita 1 (v1b)
      resultadoV2c,                 // número: posttest tras visita 2 con variación (v2c)
    } = body || {}

    // Validación mínima: siempre se requiere TVUS (paper: paso 2)
    if (!tvus || !(tvus in TVUS_MAP)) {
      return NextResponse.json({ error: "Falta o es inválido el hallazgo de TVUS" }, { status: 400 })
    }

    const tieneFactoresRiesgo = Array.isArray(factoresSeleccionados) && factoresSeleccionados.length > 0
    const sintomasParaCalculo: string[] = Array.isArray(sintomasSeleccionados)
      ? sintomasSeleccionados.filter((s) => s !== "sincope") // no afecta pretest del paper
      : []

    const claveSintoma = seleccionarClaveSintoma(sintomasParaCalculo) as keyof typeof PROBABILIDADES_SIN_FACTORES
    const tablaProb = tieneFactoresRiesgo ? PROBABILIDADES_CON_FACTORES : PROBABILIDADES_SIN_FACTORES

    // -------- Pretest (visita actual) --------
    let probPre = tablaProb[claveSintoma]

    // -------- Ajuste de pretest en seguimiento (paper) --------
    // Visita 2: usar v1b; Visita 3: usar v2c preferente (si no, v1b).
    if (esConsultaSeguimiento) {
      const visita = Number(numeroConsultaActual) || 2
      let previo: number | null = null

      if (visita === 2) {
        previo = typeof resultadoV1b === "number" ? resultadoV1b : null
      } else if (visita === 3) {
        if (typeof resultadoV2c === "number") previo = resultadoV2c
        else if (typeof resultadoV1b === "number") previo = resultadoV1b
      } else {
        // si no especifican, intenta con v1b
        if (typeof resultadoV1b === "number") previo = resultadoV1b
      }

      if (typeof previo === "number") {
        // Ajuste: pretest_ajustado = (1 - previo) * (vXa) + previo
        probPre = (1 - previo) * probPre + previo
        probPre = +probPre.toFixed(4)
      }
    }

    const pasos: Array<{ etapa: string; prob: number; LRs: number[] }> = []
    let lrsAcumulados: number[] = []

    // -------- Paso TVUS --------
    const lrTvus = TVUS_MAP[tvus as keyof typeof TVUS_MAP]
    lrsAcumulados.push(lrTvus)
    const probTrasTvus = calcularProbabilidad(probPre, lrsAcumulados)
    pasos.push({ etapa: "tvus", prob: probTrasTvus, LRs: [...lrsAcumulados] })

    if (probTrasTvus >= UMBRAL_ALTO || probTrasTvus < UMBRAL_BAJO) {
      const tipoResultado = probTrasTvus >= UMBRAL_ALTO ? "alto" : "bajo"
      const mensaje =
        tipoResultado === "alto"
          ? "Probabilidad alta de embarazo ectópico (≥95%) basada en clínica+TVUS. Evaluación médica urgente."
          : "Probabilidad baja de embarazo ectópico (<1%) basada en clínica+TVUS. Seguimiento clínico según criterio médico."
      return NextResponse.json({
        resultado: probTrasTvus,
        porcentaje: (probTrasTvus * 100).toFixed(1),
        mensaje,
        tipoResultado,
        variacionHcg: "no_aplica",
        detalles: {
          probPre,
          tieneFactoresRiesgo,
          claveSintoma,
          fase: "tvus",
          pasos,
        },
        calculadoPor: usuario ? "servidor-seguro" : "servidor-publico",
      })
    }

    // -------- Paso hCG (DZ 2000) --------
    const nHcg = toNumero(hcgValor)
    if (nHcg === null) {
      // Paper: si queda 1–95% tras TVUS, se requiere hCG para continuar.
      return NextResponse.json(
        {
          error:
            "Se requiere β-hCG para continuar (DZ 2000 mUI/mL), ya que con clínica+TVUS la probabilidad quedó entre 1% y 95%.",
          parcial: {
            resultado: probTrasTvus,
            porcentaje: (probTrasTvus * 100).toFixed(1),
            fase: "tvus",
            pasos,
          },
        },
        { status: 400 },
      )
    }
    const nivelHcg = nHcg >= DZ_HCG ? "alto" : "bajo"
    const lrHcg = HCG_MAP[tvus as keyof typeof HCG_MAP]?.[nivelHcg as "alto" | "bajo"] ?? 1
    lrsAcumulados.push(lrHcg)
    const probTrasHcg = calcularProbabilidad(probPre, lrsAcumulados)
    pasos.push({ etapa: "tvus+hcgDZ", prob: probTrasHcg, LRs: [...lrsAcumulados] })

    if (probTrasHcg >= UMBRAL_ALTO || probTrasHcg < UMBRAL_BAJO) {
      const tipoResultado = probTrasHcg >= UMBRAL_ALTO ? "alto" : "bajo"
      const mensaje =
        tipoResultado === "alto"
          ? "Probabilidad alta de embarazo ectópico (≥95%). Evaluación médica urgente."
          : "Probabilidad baja de embarazo ectópico (<1%). Seguimiento clínico según criterio médico."
      return NextResponse.json({
        resultado: probTrasHcg,
        porcentaje: (probTrasHcg * 100).toFixed(1),
        mensaje,
        tipoResultado,
        variacionHcg: "no_aplica",
        detalles: {
          probPre,
          tieneFactoresRiesgo,
          claveSintoma,
          fase: "tvus+hcgDZ",
          pasos,
        },
        calculadoPor: usuario ? "servidor-seguro" : "servidor-publico",
      })
    }

    // -------- Paso variación hCG (solo seguimiento) --------
    let variacionCalculada = "no_disponible"
    if (esConsultaSeguimiento) {
      const visita = Number(numeroConsultaActual) || 2

      if (visita === 2) {
        // Variación 1→2: usar hcgAnterior (visita 1) vs hcgValor (visita 2)
        variacionCalculada = clasificarVariacionHcg(hcgAnterior, nHcg)
      } else if (visita === 3) {
        // Variación 1→3: paper indica 1 vs 3 (preferir hcgValorVisita1)
        const v1 = hcgValorVisita1 ?? hcgAnterior
        variacionCalculada = clasificarVariacionHcg(v1, nHcg)
      } else {
        // por defecto, trata como 1→2
        variacionCalculada = clasificarVariacionHcg(hcgAnterior, nHcg)
      }

      const lrVar = VARIACION_HCG_MAP[variacionCalculada as keyof typeof VARIACION_HCG_MAP]
      if (typeof lrVar === "number") lrsAcumulados.push(lrVar)
    }

    const probFinal = calcularProbabilidad(probPre, lrsAcumulados)
    pasos.push({ etapa: "tvus+hcgDZ+variacion", prob: probFinal, LRs: [...lrsAcumulados] })

    let tipoResultado = "intermedio" as "alto" | "bajo" | "intermedio"
    let mensaje =
      "Probabilidad intermedia (1%–95%). Seguir en 48–72 h con reevaluación clínica, TVUS y β-hCG según criterio médico."
    if (probFinal >= UMBRAL_ALTO) {
      tipoResultado = "alto"
      mensaje = "Probabilidad alta de embarazo ectópico (≥95%). Evaluación médica urgente."
    } else if (probFinal < UMBRAL_BAJO) {
      tipoResultado = "bajo"
      mensaje = "Probabilidad baja de embarazo ectópico (<1%). Seguimiento clínico según criterio médico."
    }

    return NextResponse.json({
      resultado: probFinal,
      porcentaje: (probFinal * 100).toFixed(1),
      mensaje,
      tipoResultado,
      variacionHcg: variacionCalculada,
      detalles: {
        probPre,
        tieneFactoresRiesgo,
        claveSintoma,
        fase: "tvus+hcgDZ+variacion",
        pasos,
      },
      calculadoPor: usuario ? "servidor-seguro" : "servidor-publico",
    })
  } catch (error) {
    console.error("Error en cálculo de riesgo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
