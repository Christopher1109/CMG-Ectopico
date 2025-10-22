// Client-side API wrappers for calculation endpoints

export interface CalculoRiesgoParams {
  tvus: string
  sintomasSeleccionados: string[]
  factoresSeleccionados: string[]
  hcgValor: string | number
  hcgAnterior?: string | number
  hcgValorVisita1?: string | number
  esConsultaSeguimiento?: boolean
  numeroConsultaActual?: number
  resultadoV1b?: number
  resultadoV2c?: number
}

export interface ValidacionEmbarazoParams {
  pruebaEmbarazoRealizada: string
  resultadoPruebaEmbarazo?: string
}

export interface ValidacionEcografiaParams {
  tieneEcoTransabdominal: string
  resultadoEcoTransabdominal?: string
}

export async function calcularRiesgo(params: CalculoRiesgoParams) {
  const response = await fetch("/api/calculos/riesgo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Error al calcular riesgo")
  }

  return response.json()
}

export async function validarEmbarazo(params: ValidacionEmbarazoParams) {
  const response = await fetch("/api/validaciones/embarazo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Error al validar embarazo")
  }

  return response.json()
}

export async function validarEcografia(params: ValidacionEcografiaParams) {
  const response = await fetch("/api/validaciones/ecografia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Error al validar ecografía")
  }

  return response.json()
}
