import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function POST(req: Request) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const limit = rateLimit(ip, 20, 15 * 60 * 1000) // 20 requests per 15 minutes

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Demasiadas consultas. Intente nuevamente más tarde.",
          resetTime: limit.resetTime,
        },
        { status: 429 },
      )
    }

    // Redirigir al endpoint principal
    const response = await fetch(new URL("/api/calculos/riesgo", req.url), {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(await req.json()),
    })

    const data = await response.json()

    // Agregar headers de rate limiting
    const headers = new Headers()
    headers.set("X-RateLimit-Remaining", limit.remaining.toString())

    return NextResponse.json(data, { headers })
  } catch (error) {
    console.error("Error en rate limiting:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
