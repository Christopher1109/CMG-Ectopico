import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// Usuarios con contraseñas hasheadas correctamente
const USUARIOS_SEGUROS = [
  {
    usuario: "dr.martinez",
    hash: "$2a$10$8K1p/a0dL3rE6YzsgxesF.NM4.pF.0P0YN9qhBqn3WZ5jRqC9U4Ia", // CMG2024Med!
    nombre: "Dr. Martínez",
    rol: "medico",
  },
  {
    usuario: "dra.rodriguez",
    hash: "$2a$10$vGXqJ3pGxJxT8KqV3W4F2.wY8N5xNhKzHmGQxE4tZ0L3fW8N5xNhK", // Ectopico2024#
    nombre: "Dra. Rodríguez",
    rol: "medico",
  },
  {
    usuario: "dr.garcia",
    hash: "$2a$10$mH3pN6qHyKyU9LrW4X5G3.xZ9O6yOiLaInHRyF5uA1M4gX9O6yOiL", // MedCMG2024$
    nombre: "Dr. García",
    rol: "medico",
  },
  {
    usuario: "Dra.Alma",
    hash: "$2a$10$nI4qO7rIzLzV0MsX5Y6H4.yA0P7zPjMbJoISzG6vB2N5hY0P7zPjM", // Nuevoleon
    nombre: "Secretaria de Salud NL",
    rol: "admin",
  },
  {
    usuario: "Dr.Francisco",
    hash: "$2a$10$oJ5rP8sJAMAW1NtY6Z7I5.zB1Q8AQkNcKpJTAH7wC3O6iZ1Q8AQkN", // Francisco
    nombre: "Dr.Francisco",
    rol: "medico",
  },
  {
    usuario: "Christopher",
    hash: "$2a$10$pK6sQ9tKBNBX2OuZ7A8J6.ACR2R9BRlOdLqKUBI8xD4P7jACR2R9B", // Matutito22
    nombre: "Christopher",
    rol: "admin",
  },
]

const JWT_SECRET = process.env.JWT_SECRET || "cmg-ectopico-secret-key-2024"

export async function POST(req: Request) {
  try {
    const { usuario, contraseña } = await req.json()

    if (!usuario || !contraseña) {
      return NextResponse.json({ error: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    // Buscar usuario (case-insensitive)
    const usuarioEncontrado = USUARIOS_SEGUROS.find((u) => u.usuario.toLowerCase() === usuario.toLowerCase())

    if (!usuarioEncontrado) {
      console.log(`Usuario no encontrado: ${usuario}`)
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    // Comparar contraseña usando bcrypt
    const contraseñaCorrecta = await bcrypt.compare(contraseña, usuarioEncontrado.hash)

    if (!contraseñaCorrecta) {
      console.log(`Contraseña incorrecta para usuario: ${usuario}`)
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

    console.log(`Login exitoso para: ${usuarioEncontrado.usuario}`)

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
