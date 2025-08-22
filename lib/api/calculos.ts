interface CalculoRiesgoRequest {
  sintomas?: string[]
  factoresRiesgo?: string[]
  tvus?: string
  hcgValor?: string
  hcgAnterior?: string
  esConsultaSeguimiento?: boolean
  resultadoAnterior?: number
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
  bloqueado: boolean
  resultado?: number
  porcentaje?: number
  clasificacion?: "alto" | "bajo" | "intermedio"
  textoApoyo?: string
  tipoResultado?: "finalizado" | "seguimiento"
  variacionHcg?: string
  mensaje?: string
  motivo?: string
  error?: string
}

export async function calcularRiesgo(datos: CalculoRiesgoRequest): Promise<CalculoRiesgoResponse> {
  try {
    const response = await fetch("/api/calculos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { bloqueado: false, error: errorData.error || "Error en la solicitud" }
    }

    return await response.json()
  } catch (error) {
    console.error("Error en calcularRiesgo:", error)
    return { bloqueado: false, error: "Error de conexión" }
  }
}
