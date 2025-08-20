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
    const { pruebaEmbarazoRealizada, resultadoPruebaEmbarazo } = await req.json()

    let debeDetener = false
    let mensaje = ""
    let motivo = ""

    // Lógica EXACTA del frontend
    if (pruebaEmbarazoRealizada === "no") {
      debeDetener = true
      motivo = "prueba_embarazo_no_realizada"
      mensaje =
        "Se sugiere realizar una prueba de embarazo cualitativa antes de continuar con la evaluación. La decisión final corresponde al médico tratante."
    } else if (resultadoPruebaEmbarazo === "negativa") {
      debeDetener = true
      motivo = "prueba_embarazo_negativa"
      mensaje =
        "Con prueba de embarazo negativa, es poco probable un embarazo ectópico. Sin embargo, se recomienda valoración médica para descartar otras causas de los síntomas."
    }

    return NextResponse.json({
      debeDetener,
      mensaje,
      motivo,
      puedeContnuar: !debeDetener,
      validadoPor: usuario ? "servidor" : "cliente",
    })
  } catch (error) {
    console.error("Error en validación de embarazo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
