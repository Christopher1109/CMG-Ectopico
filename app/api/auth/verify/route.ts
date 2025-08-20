import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token requerido" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    return NextResponse.json({
      valid: true,
      usuario: decoded,
    })
  } catch (error) {
    return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 401 })
  }
}
