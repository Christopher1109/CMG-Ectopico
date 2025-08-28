// ✅ API limpia - SIN lógica de cálculo expuesta
interface CalculoRiesgoRequest {
  sintomas?: string[]
  factoresRiesgo?: string[]
  tvus?: string
  hcgValor?: string
  hcgAnterior?: string
  hcgValorVisita1?: string
  esConsultaSeguimiento?: boolean
  numeroConsultaActual?: 1 | 2 | 3
  resultadoV1b?: number
  resultadoV2c?: number
  // Datos para validaciones
  edadPaciente?: string | number
  frecuenciaCardiaca?: string | number
  presionSistolica?: string | number
  presionDiastolica?: string | number
  estadoConciencia?: string
  pruebaEmbarazoRealizada?: string
  resultadoPruebaEmbarazo?: string
  tieneEcoTransabdominal?: string
  resultadoEcoTransabdominal?: string
}

interface CalculoRiesgoResponse {
  resultado?: number
  porcentaje?: string
  mensaje?: string
  tipoResultado?: "alto" | "bajo" | "intermedio"
  variacionHcg?: string
  detalles?: any
  calculadoPor?: string
  error?: string
}

export async function calcularRiesgo(datos: CalculoRiesgoRequest): Promise<CalculoRiesgoResponse> {
  try {
    const token = localStorage.getItem("cmg_token")

    const response = await fetch("/api/calculos/riesgo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(datos),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || "Error en la solicitud" }
    }

    return await response.json()
  } catch (error) {
    console.error("Error en calcularRiesgo:", error)
    return { error: "Error de conexión" }
  }
}

export async function validarEmbarazo(datos: { pruebaEmbarazoRealizada: string; resultadoPruebaEmbarazo: string }) {
  try {
    const token = localStorage.getItem("cmg_token")

    const response = await fetch("/api/validaciones/embarazo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(datos),
    })

    if (!response.ok) {
      throw new Error("Error en validación")
    }

    return await response.json()
  } catch (error) {
    throw new Error("No se pudo validar la prueba de embarazo")
  }
}

export async function validarEcografia(datos: { tieneEcoTransabdominal: string; resultadoEcoTransabdominal: string }) {
  try {
    const token = localStorage.getItem("cmg_token")

    const response = await fetch("/api/validaciones/ecografia", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(datos),
    })

    if (!response.ok) {
      throw new Error("Error en validación")
    }

    return await response.json()
  } catch (error) {
    throw new Error("No se pudo validar la ecografía")
  }
}
