import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

// Middleware de autenticación
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

export async function POST(req: Request) {
  try {
    // Verificar autenticación (opcional, fallback a funcionamiento original)
    const usuario = verificarToken(req)

    const { frecuenciaCardiaca, presionSistolica, presionDiastolica, estadoConciencia } = await req.json()

    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    // Lógica de validación (MISMA que en frontend, pero protegida)
    let esEmergencia = false
    let mensaje = ""
    let tipoAlerta = "normal"

    // Emergencias críticas
    if (sistolica >= 180 || diastolica >= 110) {
      esEmergencia = true
      mensaje =
        "🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin demora."
      tipoAlerta = "hipertension_severa"
    } else if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      esEmergencia = true
      mensaje =
        "🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin demora."
      tipoAlerta = "taquicardia_hipotension"
    } else if (fc > 120) {
      esEmergencia = true
      mensaje =
        "🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin demora."
      tipoAlerta = "taquicardia_severa"
    } else if (fc < 50) {
      esEmergencia = true
      mensaje =
        "🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin demora."
      tipoAlerta = "bradicardia_severa"
    } else if (
      estadoConciencia === "estuporosa" ||
      estadoConciencia === "comatosa" ||
      estadoConciencia === "somnolienta"
    ) {
      esEmergencia = true
      mensaje =
        "🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin demora."
      tipoAlerta = "alteracion_conciencia"
    }

    // Alertas menores
    let hayAlerta = false
    let mensajeAlerta = ""

    if (!esEmergencia) {
      if (sistolica < 90 || diastolica < 60) {
        hayAlerta = true
        mensajeAlerta = "Se sugiere considerar hipotensión arterial. Se recomienda evaluación médica."
      } else if (sistolica >= 140 || diastolica >= 90) {
        hayAlerta = true
        mensajeAlerta = "Se sugiere considerar hipertensión arterial. Se recomienda seguimiento médico."
      } else if (fc > 100) {
        hayAlerta = true
        mensajeAlerta = "Se sugiere considerar taquicardia. Se recomienda monitoreo médico."
      } else if (fc < 60) {
        hayAlerta = true
        mensajeAlerta = "Se sugiere considerar bradicardia. Se recomienda evaluación médica."
      }
    }

    return NextResponse.json({
      esEmergencia,
      mensaje: esEmergencia ? mensaje : "",
      hayAlerta,
      mensajeAlerta,
      tipoAlerta,
      puedeContnuar: !esEmergencia,
      validadoPor: usuario ? "servidor" : "cliente",
    })
  } catch (error) {
    console.error("Error en validación de signos vitales:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
