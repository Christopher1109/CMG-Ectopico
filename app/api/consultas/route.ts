import { type NextRequest, NextResponse } from "next/server"
import { crearConsulta } from "@/lib/api/consultas"

export async function POST(request: NextRequest) {
  try {
    const datos = await request.json()
    const resultado = await crearConsulta(datos)

    if (resultado.error) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({ data: resultado.data }, { status: 201 })
  } catch (error) {
    console.error("Error en POST /api/consultas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
