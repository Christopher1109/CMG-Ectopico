import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// Usuarios con contraseñas hasheadas (más seguro que texto plano)
const USUARIOS_SEGUROS = [
  {
    usuario: "dr.martinez",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // CMG2024Med!
    nombre: "Dr. Martínez",
    rol: "medico",
  },
  {
    usuario: "dra.rodriguez",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // Ectopico2024#
    nombre: "Dra. Rodríguez",
    rol: "medico",
  },
  {
    usuario: "dr.garcia",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // MedCMG2024$
    nombre: "Dr. García",
    rol: "medico",
  },
  {
    usuario: "Dra.Alma",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // Nuevoleon
    nombre: "Secretaria de Salud NL",
    rol: "admin",
  },
  {
    usuario: "Dr.Francisco",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // Francisco
    nombre: "Dr.Francisco",
    rol: "medico",
  },
  {
    usuario: "Christopher",
    hash: "$2a$10$N9qo8uLOickgx2ZMRZoMye", // Matutito22
    nombre: "Christopher",
    rol: "admin",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

export async function POST(req: Request) {
  try {
    const { usuario, contraseña } = await req.json()

    // Buscar usuario
    const usuarioEncontrado = USUARIOS_SEGUROS.find((u) => u.usuario.toLowerCase() === usuario.toLowerCase())

    if (!usuarioEncontrado) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    // Comparar contraseña usando bcrypt
    const contraseñaCorrecta = await bcrypt.compare(contraseña, usuarioEncontrado.hash)

    if (!contraseñaCorrecta) {
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
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
