// Cliente seguro - SIN información sensible, SIN fallbacks
export class ClienteSeguro {
  private token: string | null = null
  private usuarioActual: any = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("cmg_token")
      const usuarioGuardado = localStorage.getItem("cmg_usuario")
      if (usuarioGuardado) {
        try {
          this.usuarioActual = JSON.parse(usuarioGuardado)
        } catch (error) {
          console.warn("Error al parsear usuario guardado")
          localStorage.removeItem("cmg_usuario")
        }
      }
    }
  }

  // ✅ SOLO autenticación via backend - SIN fallbacks
  async login(usuario: string, contraseña: string) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña }),
      })

      if (response.ok) {
        const data = await response.json()
        this.token = data.token
        this.usuarioActual = data.usuario

        if (typeof window !== "undefined") {
          localStorage.setItem("cmg_token", data.token)
          localStorage.setItem("cmg_usuario", JSON.stringify(data.usuario))
        }

        return { success: true, usuario: data.usuario }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error || "Credenciales incorrectas" }
      }
    } catch (error) {
      return { success: false, error: "Error de conexión con el servidor" }
    }
  }

  // ✅ SOLO validación via backend - SIN lógica local
  async validarSignosVitales(datos: any) {
    try {
      const response = await fetch("/api/validaciones/signos-vitales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: JSON.stringify(datos),
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new Error("Error en validación de signos vitales")
      }
    } catch (error) {
      throw new Error("No se pudo validar los signos vitales. Verifique su conexión.")
    }
  }

  // ✅ SOLO cálculo via backend - SIN lógica local
  async calcularRiesgo(datos: any) {
    try {
      const response = await fetch("/api/calculos/riesgo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: JSON.stringify(datos),
      })

      if (response.ok) {
        return await response.json()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error en el cálculo")
      }
    } catch (error) {
      throw new Error("No se pudo realizar el cálculo. Verifique su conexión.")
    }
  }

  // ✅ Verificación de token via backend
  async verificarToken() {
    if (!this.token) return false

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: this.token }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.valid
      }
      return false
    } catch (error) {
      return false
    }
  }

  logout() {
    this.token = null
    this.usuarioActual = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("cmg_token")
      localStorage.removeItem("cmg_usuario")
    }
  }

  getUsuario() {
    return this.usuarioActual
  }

  isAuthenticated() {
    return !!this.token && !!this.usuarioActual
  }

  getToken() {
    return this.token
  }
}

// Instancia singleton
export const clienteSeguro = new ClienteSeguro()
