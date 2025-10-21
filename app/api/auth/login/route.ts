import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// SOLUCIÓN TEMPORAL: Contraseñas en texto plano (SOLO PARA DESARROLLO)
const USUARIOS_TEMP = [
  {
    usuario: "dr.martinez",
    contraseña: "CMG2024Med!",
    nombre: "Dr. Martínez",
    rol: "medico",
  },
  {
    usuario: "dra.rodriguez",
    contraseña: "Ectopico2024#",
    nombre: "Dra. Rodríguez",
    rol: "medico",
  },
  {
    usuario: "dr.garcia",
    contraseña: "MedCMG2024$",
    nombre: "Dr. García",
    rol: "medico",
  },
  {
    usuario: "Dra.Alma",
    contraseña: "Nuevoleon",
    nombre: "Secretaria de Salud NL",
    rol: "admin",
  },
  {
    usuario: "Dr.Francisco",
    contraseña: "Francisco",
    nombre: "Dr.Francisco",
    rol: "medico",
  },
  {
    usuario: "Christopher",
    contraseña: "Matutito22",
    nombre: "Christopher",
    rol: "admin",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { usuario, contraseña } = body

    console.log("=== INTENTO DE LOGIN ===")
    console.log("Usuario:", usuario)

    if (!usuario || !contraseña) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    // Buscar usuario (case-insensitive)
    const usuarioEncontrado = USUARIOS_TEMP.find((u) => u.usuario.toLowerCase() === usuario.toLowerCase())

    if (!usuarioEncontrado) {
      console.log("❌ Usuario no encontrado")
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    // Comparar contraseña directamente
    if (contraseña !== usuarioEncontrado.contraseña) {
      console.log("❌ Contraseña incorrecta")
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    // Generar JWT token
    const token = jwt.sign(
      {
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    )

    console.log("✅ Login exitoso:", usuarioEncontrado.usuario)

    return NextResponse.json({
      success: true,
      token,
      usuario: {
        usuario: usuarioEncontrado.usuario,
        nombre: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol,
      },
    })
  } catch (error) {
    console.error("❌ Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
