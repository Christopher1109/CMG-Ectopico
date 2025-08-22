import { type NextRequest, NextResponse } from "next/server"

// ==================== LÓGICA CLÍNICA Y BAYESIANA (SOLO EN BACKEND) ====================

// Probabilidades pretest por síntomas
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

// LRs por TVUS
const TVUS_LR_MAP = {
  normal: 0.07,
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
}

// LRs por β-hCG según TVUS
const HCG_LR_MAP = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}

// LRs por variación de β-hCG
const VARIACION_HCG_LR_MAP = {
  reduccion_1_35: 16.6,
  reduccion_35_50: 0.8,
  reduccion_mayor_50: 0.01,
  aumento: 3.3,
  no_disponible: 1,
}

// Umbral para β-hCG alto/bajo
const HCG_UMBRAL_ALTO = 2000

// Edad mínima para embarazo
const EDAD_MINIMA_EMBARAZO = 10

// ==================== FUNCIONES DE CÁLCULO ====================

function calcularProbabilidadBayesiana(pretestProb: number, LRs: number[]): number {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) {
    odds *= LR
  }
  return +(odds / (1 + odds)).toFixed(4)
}

function calcularVariacionHcg(valorAnterior: number, valorActual: number): string {
  if (valorActual > valorAnterior) return "aumento"

  const reduccionPorc = ((valorAnterior - valorActual) / valorAnterior) * 100
  if (reduccionPorc >= 50) return "reduccion_mayor_50"
  if (reduccionPorc >= 35) return "reduccion_35_50"
  if (reduccionPorc >= 1) return "reduccion_1_35"
  return "aumento"
}

function determinarClaveSintoma(sintomas: string[]): "asintomatica" | "sangrado" | "dolor" | "dolor_sangrado" {
  const sintomasParaCalculo = sintomas.filter((s) => s !== "sincope")

  if (sintomasParaCalculo.includes("dolor_sangrado")) return "dolor_sangrado"
  if (sintomasParaCalculo.includes("sangrado") && sintomasParaCalculo.includes("dolor")) return "dolor_sangrado"
  if (sintomasParaCalculo.includes("sangrado")) return "sangrado"
  if (sintomasParaCalculo.includes("dolor")) return "dolor"
  return "asintomatica"
}

function validarEdadPaciente(edad: number): { bloqueado: boolean; mensaje?: string; motivo?: string } {
  if (edad < EDAD_MINIMA_EMBARAZO) {
    return {
      bloqueado: true,
      mensaje:
        "La edad de la paciente no es compatible con embarazo. Se sugiere considerar otras causas de los síntomas.",
      motivo: "edad_incompatible_embarazo",
    }
  }
  return { bloqueado: false }
}

function validarSignosVitalesCriticos(
  frecuenciaCardiaca: number,
  presionSistolica: number,
  presionDiastolica: number,
  estadoConciencia: string,
): { bloqueado: boolean; mensaje?: string; motivo?: string } {
  if (presionSistolica >= 180 || presionDiastolica >= 110) {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Hipertensión severa detectada. Se requiere atención médica inmediata.",
      motivo: "signos_vitales_hipertension_severa",
    }
  }

  if (presionSistolica <= 90 || presionDiastolica <= 60) {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Hipotensión detectada. Se requiere evaluación médica inmediata.",
      motivo: "signos_vitales_hipotension",
    }
  }

  if (frecuenciaCardiaca > 100 && (presionSistolica <= 90 || presionDiastolica <= 60)) {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Taquicardia con hipotensión. Se requiere atención médica urgente.",
      motivo: "signos_vitales_taquicardia_hipotension",
    }
  }

  if (frecuenciaCardiaca > 120) {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Taquicardia severa detectada. Se requiere atención médica inmediata.",
      motivo: "signos_vitales_taquicardia_severa",
    }
  }

  if (frecuenciaCardiaca < 50) {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Bradicardia severa detectada. Se requiere evaluación médica inmediata.",
      motivo: "signos_vitales_bradicardia_severa",
    }
  }

  if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
    return {
      bloqueado: true,
      mensaje: "🚨 ALERTA MÉDICA: Alteración del estado de conciencia. Se requiere atención médica urgente.",
      motivo: "signos_vitales_alteracion_conciencia",
    }
  }

  return { bloqueado: false }
}

function validarPruebaEmbarazo(
  pruebaRealizada: string,
  resultadoPrueba: string,
): { bloqueado: boolean; mensaje?: string; motivo?: string } {
  if (pruebaRealizada === "no") {
    return {
      bloqueado: true,
      mensaje:
        "Se requiere realizar una prueba de embarazo cualitativa antes de continuar con la evaluación de riesgo de embarazo ectópico.",
      motivo: "prueba_embarazo_no_realizada",
    }
  }

  if (resultadoPrueba === "negativa") {
    return {
      bloqueado: true,
      mensaje:
        "Con prueba de embarazo negativa, es poco probable un embarazo ectópico. Se sugiere considerar otras causas de los síntomas presentados.",
      motivo: "prueba_embarazo_negativa",
    }
  }

  return { bloqueado: false }
}

function validarEcoTransabdominal(
  tieneEco: string,
  resultadoEco: string,
): { bloqueado: boolean; mensaje?: string; motivo?: string } {
  const opcionesConfirmatorias = [
    "saco_embrion_fc",
    "saco_vitelino_embrion",
    "saco_vitelino_sin_embrion",
    "saco_sin_embrion",
    "saco_10mm_decidual_2mm",
  ]

  if (tieneEco === "si" && opcionesConfirmatorias.includes(resultadoEco)) {
    return {
      bloqueado: true,
      mensaje:
        "Los hallazgos ecográficos son compatibles con embarazo intrauterino. Se sugiere seguimiento obstétrico apropiado.",
      motivo: "embarazo_intrauterino_confirmado",
    }
  }

  return { bloqueado: false }
}

function generarTextoApoyo(probabilidad: number): string {
  if (probabilidad >= 0.95) {
    return "Los datos ingresados sugieren una probabilidad estimada alta de embarazo ectópico (≥95%). Se recomienda evaluación médica urgente."
  } else if (probabilidad < 0.01) {
    return "Los datos sugieren una baja probabilidad de embarazo ectópico (<1%). Seguimiento médico apropiado."
  } else {
    return "Probabilidad intermedia - Seguimiento médico requerido"
  }
}

function clasificarRiesgo(probabilidad: number): "alto" | "bajo" | "intermedio" {
  if (probabilidad >= 0.95) return "alto"
  if (probabilidad < 0.01) return "bajo"
  return "intermedio"
}

function determinarTipoResultado(probabilidad: number): "finalizado" | "seguimiento" {
  if (probabilidad >= 0.95 || probabilidad < 0.01) return "finalizado"
  return "seguimiento"
}

// ==================== ENDPOINT ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      sintomas = [],
      factoresRiesgo = [],
      tvus,
      hcgValor,
      hcgAnterior,
      esConsultaSeguimiento = false,
      resultadoAnterior,
      // Datos para validaciones
      edadPaciente,
      frecuenciaCardiaca,
      presionSistolica,
      presionDiastolica,
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
    } = body

    // ==================== VALIDACIONES DE BLOQUEO ====================

    // 1. Validar edad mínima para embarazo
    if (edadPaciente !== undefined && edadPaciente !== null) {
      const validacionEdad = validarEdadPaciente(Number(edadPaciente))
      if (validacionEdad.bloqueado) {
        return NextResponse.json({
          bloqueado: true,
          mensaje: validacionEdad.mensaje,
          motivo: validacionEdad.motivo,
          tipoResultado: "finalizado",
        })
      }
    }

    // 2. Validar signos vitales críticos
    if (frecuenciaCardiaca && presionSistolica && presionDiastolica && estadoConciencia) {
      const validacionSignos = validarSignosVitalesCriticos(
        Number(frecuenciaCardiaca),
        Number(presionSistolica),
        Number(presionDiastolica),
        estadoConciencia,
      )
      if (validacionSignos.bloqueado) {
        return NextResponse.json({
          bloqueado: true,
          mensaje: validacionSignos.mensaje,
          motivo: validacionSignos.motivo,
          tipoResultado: "finalizado",
        })
      }
    }

    // 3. Validar prueba de embarazo
    if (pruebaEmbarazoRealizada && resultadoPruebaEmbarazo) {
      const validacionEmbarazo = validarPruebaEmbarazo(pruebaEmbarazoRealizada, resultadoPruebaEmbarazo)
      if (validacionEmbarazo.bloqueado) {
        return NextResponse.json({
          bloqueado: true,
          mensaje: validacionEmbarazo.mensaje,
          motivo: validacionEmbarazo.motivo,
          tipoResultado: "finalizado",
        })
      }
    }

    // 4. Validar ecografía transabdominal
    if (tieneEcoTransabdominal && resultadoEcoTransabdominal) {
      const validacionEco = validarEcoTransabdominal(tieneEcoTransabdominal, resultadoEcoTransabdominal)
      if (validacionEco.bloqueado) {
        return NextResponse.json({
          bloqueado: true,
          mensaje: validacionEco.mensaje,
          motivo: validacionEco.motivo,
          tipoResultado: "finalizado",
        })
      }
    }

    // Validar campos requeridos para el cálculo
    if (!tvus || !hcgValor) {
      return NextResponse.json(
        {
          error: "Campos requeridos faltantes: TVUS y β-hCG",
        },
        { status: 400 },
      )
    }

    // ==================== CÁLCULO BAYESIANO ====================

    // 1. Determinar probabilidad pretest
    const tieneFactoresRiesgo = factoresRiesgo.length > 0
    const claveSintoma = determinarClaveSintoma(sintomas)
    const tablaProb = tieneFactoresRiesgo ? PROBABILIDADES_CON_FACTORES : PROBABILIDADES_SIN_FACTORES
    let probPre = tablaProb[claveSintoma]

    // 2. Ajuste para consultas de seguimiento
    if (esConsultaSeguimiento && resultadoAnterior !== undefined && resultadoAnterior !== null) {
      const v1b = Number(resultadoAnterior)
      const v2a = probPre
      probPre = (1 - v1b) * v2a + v1b
    }

    // 3. Calcular LRs
    const lrs: number[] = []

    // LR por TVUS
    const lrTvus = TVUS_LR_MAP[tvus as keyof typeof TVUS_LR_MAP]
    if (lrTvus) lrs.push(lrTvus)

    // LR por β-hCG
    const hcgNumerico = Number(hcgValor)
    const nivelHcg = hcgNumerico >= HCG_UMBRAL_ALTO ? "alto" : "bajo"
    const lrHcg = HCG_LR_MAP[tvus as keyof typeof HCG_LR_MAP]?.[nivelHcg as "alto" | "bajo"]
    if (lrHcg) lrs.push(lrHcg)

    // LR por variación de β-hCG (solo en seguimiento)
    let variacionHcg = "no_disponible"
    if (esConsultaSeguimiento && hcgAnterior && hcgValor) {
      variacionHcg = calcularVariacionHcg(Number(hcgAnterior), Number(hcgValor))
      const lrVariacion = VARIACION_HCG_LR_MAP[variacionHcg as keyof typeof VARIACION_HCG_LR_MAP]
      if (lrVariacion !== undefined) lrs.push(lrVariacion)
    }

    // 4. Calcular probabilidad posterior
    const probabilidadPosterior = calcularProbabilidadBayesiana(probPre, lrs)

    // 5. Generar respuesta
    const porcentaje = Number((probabilidadPosterior * 100).toFixed(1))
    const clasificacion = clasificarRiesgo(probabilidadPosterior)
    const textoApoyo = generarTextoApoyo(probabilidadPosterior)
    const tipoResultado = determinarTipoResultado(probabilidadPosterior)

    return NextResponse.json({
      bloqueado: false,
      resultado: probabilidadPosterior,
      porcentaje,
      clasificacion,
      textoApoyo,
      tipoResultado,
      variacionHcg: esConsultaSeguimiento ? variacionHcg : undefined,
    })
  } catch (error) {
    console.error("Error en cálculo:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
