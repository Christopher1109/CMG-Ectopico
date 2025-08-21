interface CalculoRequest {
  sintomas?: string[]
  factoresRiesgo?: string[]
  tvus: string
  hcgValor: string | number
  hcgAnterior?: string | number
  esConsultaSeguimiento?: boolean
  resultadoAnterior?: number
  frecuenciaCardiaca?: string | number
  presionSistolica?: string | number
  presionDiastolica?: string | number
  estadoConciencia?: string
  pruebaEmbarazoRealizada?: string
  resultadoPruebaEmbarazo?: string
  tieneEcoTransabdominal?: string
  resultadoEcoTransabdominal?: string
}

interface CalculoResponse {
  bloqueado: boolean
  mensaje?: string
  motivo?: string
  resultado?: number
  porcentaje?: number
  clasificacion?: "alto" | "bajo" | "intermedio"
  textoApoyo?: string
  variacionHcg?: string
  error?: string
}

export async function calcularRiesgo(params: CalculoRequest): Promise<CalculoResponse> {
  try {
    const response = await fetch("/api/calculos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error en calcularRiesgo:", error)
    throw error
  }
}
