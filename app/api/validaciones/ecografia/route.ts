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

export async function POST(req: Request) {
  try {
    const usuario = verificarToken(req)
    const { tieneEcoTransabdominal, resultadoEcoTransabdominal } = await req.json()

    let debeDetener = false
    let mensaje = ""
    let motivo = ""

    // Lógica EXACTA del frontend
    const opcionesConfirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ]

    if (tieneEcoTransabdominal === "si" && opcionesConfirmatorias.includes(resultadoEcoTransabdominal)) {
      debeDetener = true
      motivo = "embarazo_intrauterino_confirmado"
      mensaje =
        "Los hallazgos ecográficos sugieren evidencia de embarazo intrauterino. Se recomienda seguimiento médico apropiado. La decisión final corresponde al médico tratante."
    }

    return NextResponse.json({
      debeDetener,
      mensaje,
      motivo,
      puedeContnuar: !debeDetener,
      validadoPor: usuario ? "servidor" : "cliente",
    })
  } catch (error) {
    console.error("Error en validación de ecografía:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
