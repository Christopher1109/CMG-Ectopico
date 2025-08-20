import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

function verificarToken(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// 🔒 ALGORITMO PROTEGIDO EN EL SERVIDOR
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
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
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
  reduccion_mayor_50: 0.01,
  aumento: 3.3,
  no_disponible: 1,
}

function calcularProbabilidadSegura(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) {
    odds *= LR
  }
  return +(odds / (1 + odds)).toFixed(4)
}

function calcularVariacionHcgAutomatica(previo: string, actual: string) {
  if (!previo || !actual) return "no_disponible"
  const a = Number.parseFloat(previo)
  const b = Number.parseFloat(actual)
  if (b > a) return "aumento"
  const reduccionPorc = ((a - b) / a) * 100
  if (reduccionPorc >= 50) return "reduccion_mayor_50"
  if (reduccionPorc >= 35) return "reduccion_35_50"
  if (reduccionPorc >= 1) return "reduccion_1_35"
  return "aumento"
}

export async function POST(req: Request) {
  try {
    const usuario = verificarToken(req)

    const {
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor,
      hcgAnterior,
      esConsultaSeguimiento,
      resultadoAnterior,
    } = await req.json()

    // Validar datos requeridos
    if (!tvus || !hcgValor) {
      return NextResponse.json(
        {
          error: "Datos incompletos: TVUS y β-hCG son requeridos",
        },
        { status: 400 },
      )
    }

    // 🔒 CÁLCULO PROTEGIDO
    const tieneFactoresRiesgo = factoresSeleccionados && factoresSeleccionados.length > 0
    const sintomasParaCalculo = sintomasSeleccionados
      ? sintomasSeleccionados.filter((s: string) => s !== "sincope")
      : []

    let claveSintoma = "asintomatica" as keyof typeof PROBABILIDADES_SIN_FACTORES

    if (sintomasParaCalculo.includes("dolor_sangrado")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado") && sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado")) {
      claveSintoma = "sangrado"
    } else if (sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor"
    }

    const tablaProb = tieneFactoresRiesgo ? PROBABILIDADES_CON_FACTORES : PROBABILIDADES_SIN_FACTORES
    let probPre = tablaProb[claveSintoma]

    // Ajuste para consulta de seguimiento
    if (esConsultaSeguimiento && resultadoAnterior) {
      const v1b = resultadoAnterior
      const v2a = probPre
      probPre = (1 - v1b) * v2a + v1b
    }

    const lrs: number[] = []

    // LR para TVUS
    const lrTvus = TVUS_MAP[tvus as keyof typeof TVUS_MAP]
    if (lrTvus) lrs.push(lrTvus)

    // LR para HCG
    const hcgNumerico = Number.parseFloat(hcgValor)
    const nivelHcg = hcgNumerico >= 2000 ? "alto" : "bajo"
    const lrHcg = HCG_MAP[tvus as keyof typeof HCG_MAP]?.[nivelHcg as "alto" | "bajo"]
    if (lrHcg) lrs.push(lrHcg)

    // LR para variación HCG (solo en seguimiento)
    let variacionCalculada = "no_disponible"
    if (hcgAnterior && hcgValor && esConsultaSeguimiento) {
      variacionCalculada = calcularVariacionHcgAutomatica(hcgAnterior, hcgValor)
      const lrVariacion = VARIACION_HCG_MAP[variacionCalculada as keyof typeof VARIACION_HCG_MAP]
      if (lrVariacion !== undefined) lrs.push(lrVariacion)
    }

    // Cálculo final
    const probPost = calcularProbabilidadSegura(probPre, lrs)

    // Generar mensaje
    let mensaje = ""
    let tipoResultado = "intermedio"

    if (probPost >= 0.95) {
      tipoResultado = "alto"
      mensaje =
        "Los datos ingresados sugieren una probabilidad estimada alta de embarazo ectópico (≥95%). Se recomienda evaluación médica urgente."
    } else if (probPost < 0.01) {
      tipoResultado = "bajo"
      mensaje =
        "Los datos sugieren una baja probabilidad de embarazo ectópico (<1%). Se recomienda seguimiento médico apropiado. La decisión final corresponde al médico tratante."
    } else {
      tipoResultado = "intermedio"
      mensaje =
        "Probabilidad intermedia. Se recomienda seguimiento médico y considerar nueva evaluación en 48-72 horas."
    }

    return NextResponse.json({
      resultado: probPost,
      porcentaje: (probPost * 100).toFixed(1),
      mensaje,
      tipoResultado,
      variacionHcg: variacionCalculada,
      detalles: {
        probPre,
        lrs,
        tieneFactoresRiesgo,
        claveSintoma,
      },
      calculadoPor: usuario ? "servidor-seguro" : "servidor-publico",
    })
  } catch (error) {
    console.error("Error en cálculo de riesgo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
