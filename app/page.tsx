"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Heart,
  Stethoscope,
  FileText,
  Calculator,
  CheckCircle,
  ArrowRight,
  User,
  Activity,
  AlertTriangle,
  Copy,
} from "lucide-react"

// ==================== FUNCIONES DE API ====================
// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

// Función para enviar datos al backend (POST - nuevo paciente)
async function enviarDatosAlBackend(datos: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/paciente`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })
    if (response.ok) {
      console.log("Datos enviados exitosamente al backend")
      return true
    } else {
      console.warn("Error al enviar datos al backend:", response.status)
      return false
    }
  } catch (error) {
    console.warn("Error de conexión al enviar datos:", error)
    return false
  }
}

// Función para actualizar datos en el backend (PUT - paciente existente)
async function actualizarDatosEnBackend(id: string, datos: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/paciente/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })
    if (response.ok) {
      console.log("Datos actualizados exitosamente en el backend")
      return true
    } else {
      console.warn("Error al actualizar datos en el backend:", response.status)
      return false
    }
  } catch (error) {
    console.warn("Error de conexión al actualizar datos:", error)
    return false
  }
}

// Función para leer datos desde el backend (GET)
async function leerDatosDesdeBackend(id: string): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/paciente/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (response.ok) {
      const datos = await response.json()
      console.log("Datos leídos exitosamente desde el backend")
      return datos
    } else if (response.status === 404) {
      console.log("Paciente no encontrado en el backend")
      return null
    } else {
      console.warn("Error al leer datos del backend:", response.status)
      return null
    }
  } catch (error) {
    console.warn("Error de conexión al leer datos:", error)
    return null
  }
}

// Función para sincronizar datos entre localStorage y servidor
async function sincronizarDatos(id: string, datos: any, esNuevo = false): Promise<void> {
  // Siempre guardar en localStorage primero (funcionalidad actual)
  localStorage.setItem(`ectopico_${id}`, JSON.stringify(datos))
  // Intentar sincronizar con el backend
  if (esNuevo) {
    await enviarDatosAlBackend(datos)
  } else {
    await actualizarDatosEnBackend(id, datos)
  }
}

// Función para buscar datos (localStorage + backend)
async function buscarDatosPaciente(id: string): Promise<any | null> {
  // Primero buscar en localStorage (funcionalidad actual)
  const datosLocal = localStorage.getItem(`ectopico_${id}`)
  let datosLocalParsed = null
  if (datosLocal) {
    try {
      datosLocalParsed = JSON.parse(datosLocal)
    } catch (error) {
      console.warn("Error al parsear datos de localStorage:", error)
    }
  }

  // Intentar buscar en el backend
  const datosBackend = await leerDatosDesdeBackend(id)

  // Si hay datos en el backend, usarlos y actualizar localStorage
  if (datosBackend) {
    localStorage.setItem(`ectopico_${id}`, JSON.stringify(datosBackend))
    return datosBackend
  }

  // Si no hay datos en el backend, usar localStorage
  return datosLocalParsed
}

// ==================== FUNCIONES DE CÁLCULO ====================
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) {
    odds *= LR
  }
  return +(odds / (1 + odds)).toFixed(4)
}

function ajustarPretest(prevPostProb: number, nuevoPretest: number) {
  return (1 - prevPostProb) * nuevoPretest + prevPostProb
}

// Función mejorada para generar IDs únicos secuenciales
function generarIdSeguimiento(): string {
  // Obtener todos los IDs existentes del localStorage
  const idsExistentes = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("ectopico_ID-")) {
      const idNumero = key.replace("ectopico_ID-", "")
      idsExistentes.push(Number.parseInt(idNumero))
    }
  }

  // Encontrar el siguiente número disponible
  let siguienteNumero = 1
  if (idsExistentes.length > 0) {
    siguienteNumero = Math.max(...idsExistentes) + 1
  }

  // Formatear el ID con ceros a la izquierda
  return `ID-${siguienteNumero.toString().padStart(5, "0")}`
}

// Datos del algoritmo
const probabilidadesSinFactores = {
  asintomatica: 0.017,
  sangrado: 0.03,
  dolor: 0.13,
  dolor_sangrado: 0.15,
}

const probabilidadesConFactores = {
  asintomatica: 0.05,
  sangrado: 0.08,
  dolor: 0.4,
  dolor_sangrado: 0.46,
}

const tvusMap = {
  normal: 0.07,
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
}

const hcgMap = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}

const variacionHcgMap = {
  reduccion_1_35: 16.6,
  reduccion_35_50: 0.8,
  reduccion_mayor_50: 0,
  aumento: 3.3,
  no_disponible: 1,
}

const factoresRiesgo = [
  { id: "infertilidad", label: "Historia de infertilidad" },
  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
  { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
  { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
]

const sintomas = [
  { id: "sangrado", label: "Sangrado vaginal" },
  { id: "dolor", label: "Dolor pélvico/abdominal" },
  { id: "dolor_sangrado", label: "Sangrado vaginal + Dolor pélvico/abdominal" },
  { id: "sincope", label: "Síncope o mareo (informativo)", informativo: true },
]

export default function CalculadoraEctopico() {
  // Estados principales
  const [nombrePaciente, setNombrePaciente] = useState("")
  const [edadPaciente, setEdadPaciente] = useState("")
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("")
  const [presionSistolica, setPresionSistolica] = useState("")
  const [presionDiastolica, setPresionDiastolica] = useState("")
  const [estadoConciencia, setEstadoConciencia] = useState("")
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState("")
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("")
  const [hallazgosExploracion, setHallazgosExploracion] = useState("")
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState("")
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState("")
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mensajeFinal, setMensajeFinal] = useState("")
  const [mostrarInforme, setMostrarInforme] = useState(false)
  const [resultado, setResultado] = useState<number | null>(null)
  const [fase, setFase] = useState(0)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [dz] = useState(2000) // Zona discriminatoria fija

  // Estados para el sistema de seguimiento
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [consultasRealizadas, setConsultasRealizadas] = useState<number[]>([])
  const [proximaConsulta, setProximaConsulta] = useState(1)

  // Estados para controlar las secciones
  const [seccionActual, setSeccionActual] = useState(1) // 1: Datos básicos, 2: Signos vitales, 3: Prueba embarazo, 4: Evaluación previa, 5: Consultas
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // Estados para consultas
  const [sintomasSeleccionados1, setSintomasSeleccionados1] = useState<string[]>([])
  const [factoresSeleccionados1, setFactoresSeleccionados1] = useState<string[]>([])
  const [tvus1, setTvus1] = useState("")
  const [hcgValor1, setHcgValor1] = useState("")
  const [resultado1, setResultado1] = useState<number | null>(null)

  const [sintomasSeleccionados2, setSintomasSeleccionados2] = useState<string[]>([])
  const [factoresSeleccionados2, setFactoresSeleccionados2] = useState<string[]>([])
  const [tvus2, setTvus2] = useState("")
  const [hcgValor2, setHcgValor2] = useState("")
  const [resultado2, setResultado2] = useState<number | null>(null)

  const [sintomasSeleccionados3, setSintomasSeleccionados3] = useState<string[]>([])
  const [factoresSeleccionados3, setFactoresSeleccionados3] = useState<string[]>([])
  const [tvus3, setTvus3] = useState("")
  const [hcgValor3, setHcgValor3] = useState("")
  const [resultado3, setResultado3] = useState<number | null>(null)

  // Funciones auxiliares
  const calcularVariacionHcg = (hcgAnterior: string, hcgActual: string) => {
    if (!hcgAnterior || !hcgActual) return "no_disponible"
    const anterior = Number.parseFloat(hcgAnterior)
    const actual = Number.parseFloat(hcgActual)
    if (actual > anterior) return "aumento"
    const reduccionPorcentaje = ((anterior - actual) / anterior) * 100
    if (reduccionPorcentaje >= 50) return "reduccion_mayor_50"
    if (reduccionPorcentaje >= 35) return "reduccion_35_50"
    if (reduccionPorcentaje >= 1) return "reduccion_1_35"
    return "aumento"
  }

  const determinarNivelHcg = (hcgValor: string, dz: number) => {
    if (!hcgValor) return null
    return Number.parseFloat(hcgValor) >= dz ? "alto" : "bajo"
  }

  const calcularProbabilidadPretest = (sintomasSeleccionados: string[], factoresSeleccionados: string[]) => {
    const sintomasParaCalculo = sintomasSeleccionados.filter((s) => s !== "sincope")
    const tieneFactoresRiesgo = factoresSeleccionados.length > 0
    const tieneSangrado = sintomasParaCalculo.includes("sangrado")
    const tieneDolor = sintomasParaCalculo.includes("dolor")
    const tieneCombinado = sintomasParaCalculo.includes("dolor_sangrado")

    let claveSintoma = ""
    if (tieneCombinado || (tieneSangrado && tieneDolor)) {
      claveSintoma = "dolor_sangrado"
    } else if (tieneSangrado && !tieneDolor) {
      claveSintoma = "sangrado"
    } else if (!tieneSangrado && tieneDolor) {
      claveSintoma = "dolor"
    } else {
      claveSintoma = "asintomatica"
    }

    const tablaProb = tieneFactoresRiesgo ? probabilidadesConFactores : probabilidadesSinFactores
    return tablaProb[claveSintoma as keyof typeof tablaProb]
  }

  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    // Verificar taquicardia con hipotensión (FC > 100 y PA ≤ 90/60) - EMERGENCIA PRINCIPAL
    if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta taquicardia con hipotensión (FC > 100 lpm y PA ≤ 90/60 mmHg), sugestivo de compromiso hemodinámico severo. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para manejo de emergencia.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Verificar hipotensión severa (sistólica < 90 mmHg o diastólica < 60 mmHg)
    if (sistolica < 90 || diastolica < 60) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta hipotensión arterial severa. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación hemodinámica y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Verificar taquicardia severa (FC > 120)
    if (fc > 120) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta taquicardia severa. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación cardiovascular y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Verificar alteración grave del estado de conciencia (estuporosa o comatosa)
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta alteración severa del estado de conciencia. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    return true
  }

  const handleSintomaChange = (faseNum: number, sintomaId: string, checked: boolean) => {
    const getSintomas = () => {
      switch (faseNum) {
        case 1:
          return sintomasSeleccionados1
        case 2:
          return sintomasSeleccionados2
        case 3:
          return sintomasSeleccionados3
        default:
          return []
      }
    }

    const setSintomas = (nuevos: string[]) => {
      switch (faseNum) {
        case 1:
          setSintomasSeleccionados1(nuevos)
          break
        case 2:
          setSintomasSeleccionados2(nuevos)
          break
        case 3:
          setSintomasSeleccionados3(nuevos)
          break
      }
    }

    let nuevosSeleccionados = []
    const actuales = getSintomas()

    if (checked) {
      nuevosSeleccionados = [...actuales, sintomaId]
    } else {
      nuevosSeleccionados = actuales.filter((id) => id !== sintomaId)
      if (sintomaId === "dolor_sangrado") {
        nuevosSeleccionados = nuevosSeleccionados.filter((id) => id !== "sangrado" && id !== "dolor")
      }
      if ((sintomaId === "sangrado" || sintomaId === "dolor") && nuevosSeleccionados.includes("dolor_sangrado")) {
        nuevosSeleccionados = nuevosSeleccionados.filter((id) => id !== "dolor_sangrado")
      }
    }

    setSintomas(nuevosSeleccionados)
  }

  const handleFactorChange = (faseNum: number, factorId: string, checked: boolean) => {
    const getFactores = () => {
      switch (faseNum) {
        case 1:
          return factoresSeleccionados1
        case 2:
          return factoresSeleccionados2
        case 3:
          return factoresSeleccionados3
        default:
          return []
      }
    }

    const setFactores = (nuevos: string[]) => {
      switch (faseNum) {
        case 1:
          setFactoresSeleccionados1(nuevos)
          break
        case 2:
          setFactoresSeleccionados2(nuevos)
          break
        case 3:
          setFactoresSeleccionados3(nuevos)
          break
      }
    }

    const actuales = getFactores()
    if (checked) {
      setFactores([...actuales, factorId])
    } else {
      setFactores(actuales.filter((id) => id !== factorId))
    }
  }

  const validarPruebaEmbarazo = () => {
    if (pruebaEmbarazoRealizada === "no") {
      setMensajeFinal(
        "Se necesita realizar una prueba de embarazo cualitativa antes de continuar con la evaluación. Se recomienda realizar una prueba de embarazo en carácter URGENTE para descartar o confirmar gestación antes de proceder con el protocolo diagnóstico.",
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (resultadoPruebaEmbarazo === "negativa") {
      setMensajeFinal("Embarazo ectópico descartado por prueba negativa.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  const validarEcoTransabdominal = () => {
    const opcionesConfirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ]

    if (tieneEcoTransabdominal === "si" && opcionesConfirmatorias.includes(resultadoEcoTransabdominal)) {
      setMensajeFinal("Evidencia suficiente de embarazo intrauterino. Embarazo ectópico descartado.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  const calcularFase1 = async () => {
    const probPre = calcularProbabilidadPretest(sintomasSeleccionados1, factoresSeleccionados1)
    const lrTvus = tvusMap[tvus1 as keyof typeof tvusMap]
    const nivelHcg = determinarNivelHcg(hcgValor1, dz)
    const lrHcg = hcgMap[tvus1 as keyof typeof hcgMap]?.[nivelHcg as keyof (typeof hcgMap)[keyof typeof hcgMap]]

    if (!probPre || !lrTvus || !lrHcg) {
      alert("Por favor complete todos los campos")
      return
    }

    const probPost = calcularProbabilidad(probPre, [lrTvus, lrHcg])
    setResultado(probPost)
    setResultado1(probPost)

    // Marcar consulta 1 como realizada
    const nuevasConsultas = [1]
    setConsultasRealizadas(nuevasConsultas)
    setProximaConsulta(2)

    // Guardar datos COMPLETOS después del cálculo
    const fechaActual = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: fechaActual,
      fechaUltimaActualizacion: fechaActual,
      // Datos del paciente
      nombrePaciente: nombrePaciente,
      edadPaciente: edadPaciente,
      frecuenciaCardiaca: frecuenciaCardiaca,
      presionSistolica: presionSistolica,
      presionDiastolica: presionDiastolica,
      estadoConciencia: estadoConciencia,
      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      hallazgosExploracion: hallazgosExploracion,
      tieneEcoTransabdominal: tieneEcoTransabdominal,
      resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      // Control de consultas
      consultasRealizadas: nuevasConsultas,
      proximaConsulta: 2,
      // Consulta 1 COMPLETA
      sintomasSeleccionados1: sintomasSeleccionados1,
      factoresSeleccionados1: factoresSeleccionados1,
      tvus1: tvus1,
      hcgValor1: hcgValor1,
      resultado1: probPost,
      // Consultas futuras (vacías)
      sintomasSeleccionados2: [],
      factoresSeleccionados2: [],
      tvus2: "",
      hcgValor2: "",
      resultado2: null,
      sintomasSeleccionados3: [],
      factoresSeleccionados3: [],
      tvus3: "",
      hcgValor3: "",
      resultado3: null,
    }

    // Usar la nueva función de sincronización
    await sincronizarDatos(idSeguimiento, datosCompletos, true)

    if (probPost >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Proceder con tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%). Alta confianza en exclusión del diagnóstico.")
      setProtocoloFinalizado(true)
    } else {
      // Probabilidad intermedia (1%-95%) - continuar con seguimiento
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  const calcularFase2 = async () => {
    // Usar resultado de fase 1 como pretest base, ajustado con nuevos síntomas
    const nuevoPre = calcularProbabilidadPretest(sintomasSeleccionados2, factoresSeleccionados2)
    const pretestAjustado = ajustarPretest(resultado1!, nuevoPre)

    const lrTvus = tvusMap[tvus2 as keyof typeof tvusMap]
    const nivelHcg = determinarNivelHcg(hcgValor2, dz)
    const lrHcg = hcgMap[tvus2 as keyof typeof hcgMap]?.[nivelHcg as keyof (typeof hcgMap)[keyof typeof hcgMap]]

    const tipoVariacion = calcularVariacionHcg(hcgValor1, hcgValor2)
    const lrVar = variacionHcgMap[tipoVariacion as keyof typeof variacionHcgMap]

    if (!lrTvus || !lrHcg || !lrVar) {
      alert("Por favor complete todos los campos")
      return
    }

    const probPost2 = calcularProbabilidad(pretestAjustado, [lrTvus, lrHcg, lrVar])
    setResultado(probPost2)
    setResultado2(probPost2)

    // Marcar consulta 2 como realizada
    const nuevasConsultas = [1, 2]
    setConsultasRealizadas(nuevasConsultas)
    setProximaConsulta(3)

    // Guardar datos actualizados COMPLETOS
    const fechaActual = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: consultaCargada?.fechaCreacion || fechaActual,
      fechaUltimaActualizacion: fechaActual,
      // Datos del paciente
      nombrePaciente: nombrePaciente,
      edadPaciente: edadPaciente,
      frecuenciaCardiaca: frecuenciaCardiaca,
      presionSistolica: presionSistolica,
      presionDiastolica: presionDiastolica,
      estadoConciencia: estadoConciencia,
      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      hallazgosExploracion: hallazgosExploracion,
      tieneEcoTransabdominal: tieneEcoTransabdominal,
      resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      // Control de consultas
      consultasRealizadas: nuevasConsultas,
      proximaConsulta: 3,
      // Consulta 1 COMPLETA
      sintomasSeleccionados1: sintomasSeleccionados1,
      factoresSeleccionados1: factoresSeleccionados1,
      tvus1: tvus1,
      hcgValor1: hcgValor1,
      resultado1: resultado1,
      // Consulta 2
      sintomasSeleccionados2: sintomasSeleccionados2,
      factoresSeleccionados2: factoresSeleccionados2,
      tvus2: tvus2,
      hcgValor2: hcgValor2,
      resultado2: probPost2,
      // Consultas futuras (vacías)
      sintomasSeleccionados3: [],
      factoresSeleccionados3: [],
      tvus3: "",
      hcgValor3: "",
      resultado3: null,
    }

    // Usar la nueva función de sincronización (actualización)
    await sincronizarDatos(idSeguimiento, datosCompletos, false)

    if (probPost2 >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Proceder con tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (probPost2 < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%). Alta confianza en exclusión del diagnóstico.")
      setProtocoloFinalizado(true)
    } else {
      // Continuar a tercera consulta
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  const calcularFase3 = async () => {
    // Usar resultado de fase 2 como pretest base, ajustado con nuevos síntomas
    const nuevoPre = calcularProbabilidadPretest(sintomasSeleccionados3, factoresSeleccionados3)
    const pretestAjustado = ajustarPretest(resultado2!, nuevoPre)

    const lrTvus = tvusMap[tvus3 as keyof typeof tvusMap]
    const nivelHcg = determinarNivelHcg(hcgValor3, dz)
    const lrHcg = hcgMap[tvus3 as keyof typeof hcgMap]?.[nivelHcg as keyof (typeof hcgMap)[keyof typeof hcgMap]]

    const tipoVariacion = calcularVariacionHcg(hcgValor2, hcgValor3)
    const lrVar = variacionHcgMap[tipoVariacion as keyof typeof variacionHcgMap]

    if (!lrTvus || !lrHcg || !lrVar) {
      alert("Por favor complete todos los campos")
      return
    }

    const probPost3 = calcularProbabilidad(pretestAjustado, [lrTvus, lrHcg, lrVar])
    setResultado(probPost3)
    setResultado3(probPost3)

    // Marcar consulta 3 como realizada
    const nuevasConsultas = [...consultasRealizadas, 3]
    setConsultasRealizadas(nuevasConsultas)
    setProximaConsulta(0) // No hay más consultas

    // Guardar datos actualizados
    const fechaActual = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: consultaCargada?.fechaCreacion || fechaActual,
      fechaUltimaActualizacion: fechaActual,
      nombrePaciente: nombrePaciente,
      edadPaciente: edadPaciente,
      frecuenciaCardiaca: frecuenciaCardiaca,
      presionSistolica: presionSistolica,
      presionDiastolica: presionDiastolica,
      estadoConciencia: estadoConciencia,
      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      hallazgosExploracion: hallazgosExploracion,
      tieneEcoTransabdominal: tieneEcoTransabdominal,
      resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      consultasRealizadas: nuevasConsultas,
      proximaConsulta: 0,
      sintomasSeleccionados1: sintomasSeleccionados1,
      factoresSeleccionados1: factoresSeleccionados1,
      tvus1: tvus1,
      hcgValor1: hcgValor1,
      resultado1: resultado1,
      sintomasSeleccionados2: sintomasSeleccionados2,
      factoresSeleccionados2: factoresSeleccionados2,
      tvus2: tvus2,
      hcgValor2: hcgValor2,
      resultado2: resultado2,
      sintomasSeleccionados3: sintomasSeleccionados3,
      factoresSeleccionados3: factoresSeleccionados3,
      tvus3: tvus3,
      hcgValor3: hcgValor3,
      resultado3: probPost3,
    }

    // Usar la nueva función de sincronización (actualización)
    await sincronizarDatos(idSeguimiento, datosCompletos, false)

    // Después de la consulta 3, siempre finalizar
    if (probPost3 >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Proceder con tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (probPost3 < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%). Alta confianza en exclusión del diagnóstico.")
      setProtocoloFinalizado(true)
    } else {
      setMensajeFinal(
        `Algoritmo completado después de 3 consultas. Probabilidad final: ${(probPost3 * 100).toFixed(1)}%. Según el protocolo, se requiere decisión clínica individualizada considerando el contexto completo del paciente.`,
      )
      setProtocoloFinalizado(true)
    }
  }

  // Funciones para manejar las secciones
  const completarSeccion = async (numeroSeccion: number) => {
    // Validaciones específicas por sección
    if (numeroSeccion === 1) {
      // Validar que haya datos básicos
      if (!nombrePaciente || !edadPaciente) {
        alert("Por favor complete todos los campos")
        return
      }
      // Validar edad fértil INMEDIATAMENTE
      if (edadPaciente && Number.parseInt(edadPaciente) < 10) {
        setMensajeFinal("La mujer no está en edad fértil. Se descarta embarazo.")
        setProtocoloFinalizado(true)
        return
      }
      // Guardar datos básicos
      await guardarDatosSeguimiento(idSeguimiento)
    }

    if (numeroSeccion === 2) {
      if (!validarSignosVitalesCompletos()) {
        alert("Por favor complete todos los campos de signos vitales")
        return
      }
      // Mostrar advertencia para estados de conciencia alterados pero no graves
      if (estadoConciencia === "somnolenta" || estadoConciencia === "confusa") {
        alert(
          "⚠️ PRECAUCIÓN: Paciente con alteración leve-moderada del estado de conciencia. Se recomienda vigilancia estrecha durante la evaluación.",
        )
      }
      // Validar signos vitales críticos
      if (!validarSignosVitales()) {
        return
      }
      // Guardar datos de signos vitales
      await guardarDatosSeguimiento(idSeguimiento)
    }

    if (numeroSeccion === 3) {
      if (!validarPruebaEmbarazoCompleta()) {
        alert("Por favor complete la información sobre la prueba de embarazo")
        return
      }
      if (!validarPruebaEmbarazo()) {
        return
      }
      // Guardar datos de prueba de embarazo
      await guardarDatosSeguimiento(idSeguimiento)
    }

    if (numeroSeccion === 4) {
      if (!validarEvaluacionPrevia()) {
        alert("Por favor complete la información sobre la evaluación previa")
        return
      }
      if (!validarEcoTransabdominal()) {
        return
      }
      // Guardar datos de evaluación previa
      await guardarDatosSeguimiento(idSeguimiento)
    }

    if (!seccionesCompletadas.includes(numeroSeccion)) {
      setSeccionesCompletadas([...seccionesCompletadas, numeroSeccion])
    }
    setSeccionActual(numeroSeccion + 1)
  }

  const validarDatosBasicos = () => {
    return nombrePaciente && edadPaciente
  }

  const validarSignosVitalesCompletos = () => {
    return frecuenciaCardiaca && presionSistolica && presionDiastolica && estadoConciencia
  }

  const validarPruebaEmbarazoCompleta = () => {
    return pruebaEmbarazoRealizada && (pruebaEmbarazoRealizada === "no" || resultadoPruebaEmbarazo)
  }

  const validarEvaluacionPrevia = () => {
    return tieneEcoTransabdominal && (tieneEcoTransabdominal === "no" || resultadoEcoTransabdominal)
  }

  const procederConsulta1 = () => {
    setFase(1)
    setSeccionActual(5)
  }

  // Modificar la función resetCalculadora para que funcione correctamente
  const resetCalculadora = () => {
    setResultado(null)
    setFase(0)
    setSeccionActual(1)
    setSeccionesCompletadas([])
    setNombrePaciente("")
    setEdadPaciente("")
    setFrecuenciaCardiaca("")
    setPresionSistolica("")
    setPresionDiastolica("")
    setEstadoConciencia("")
    setPruebaEmbarazoRealizada("")
    setResultadoPruebaEmbarazo("")
    setHallazgosExploracion("")
    setTieneEcoTransabdominal("")
    setResultadoEcoTransabdominal("")
    setProtocoloFinalizado(false)
    setMensajeFinal("")
    setSintomasSeleccionados1([])
    setFactoresSeleccionados1([])
    setTvus1("")
    setHcgValor1("")
    setResultado1(null)
    setSintomasSeleccionados2([])
    setFactoresSeleccionados2([])
    setTvus2("")
    setHcgValor2("")
    setResultado2(null)
    setSintomasSeleccionados3([])
    setFactoresSeleccionados3([])
    setTvus3("")
    setHcgValor3("")
    setResultado3(null)
    setMostrarInforme(false)
    setIdSeguimiento("")
    setMostrarIdSeguimiento(false)
    setModoCargarConsulta(false)
    setIdBusqueda("")
    setMostrarResumenConsulta(false)
    setConsultaCargada(null)
    setMostrarPantallaBienvenida(true)
    setMostrarResultados(false)
    setConsultasRealizadas([])
    setProximaConsulta(1)
  }

  const iniciarNuevaEvaluacion = () => {
    // Generar ID inmediatamente al iniciar nueva evaluación
    const nuevoId = generarIdSeguimiento()
    setIdSeguimiento(nuevoId)

    // Reiniciar todos los estados
    setResultado(null)
    setFase(0)
    setSeccionActual(1)
    setSeccionesCompletadas([])
    setNombrePaciente("")
    setEdadPaciente("")
    setFrecuenciaCardiaca("")
    setPresionSistolica("")
    setPresionDiastolica("")
    setEstadoConciencia("")
    setPruebaEmbarazoRealizada("")
    setResultadoPruebaEmbarazo("")
    setHallazgosExploracion("")
    setTieneEcoTransabdominal("")
    setResultadoEcoTransabdominal("")
    setProtocoloFinalizado(false)
    setMensajeFinal("")
    setSintomasSeleccionados1([])
    setFactoresSeleccionados1([])
    setTvus1("")
    setHcgValor1("")
    setResultado1(null)
    setSintomasSeleccionados2([])
    setFactoresSeleccionados2([])
    setTvus2("")
    setHcgValor2("")
    setResultado2(null)
    setSintomasSeleccionados3([])
    setFactoresSeleccionados3([])
    setTvus3("")
    setHcgValor3("")
    setResultado3(null)
    setMostrarInforme(false)
    setMostrarIdSeguimiento(false)
    setModoCargarConsulta(false)
    setIdBusqueda("")
    setMostrarResumenConsulta(false)
    setConsultaCargada(null)
    setMostrarResultados(false)
    setConsultasRealizadas([])
    setProximaConsulta(1)

    // Ocultar la pantalla de bienvenida y mostrar directamente el paso 1
    setMostrarPantallaBienvenida(false)
  }

  const generarInformePDF = () => {
    const fecha = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const contenidoHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Médico - ${nombrePaciente}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .header { text-align: center; background: #2563eb; color: white; padding: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
    .result { background: #f0f9ff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; }
    .consultation { background: #f9fafb; padding: 10px; margin: 10px 0; border-left: 4px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td, th { padding: 8px; border: 1px solid #ddd; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INFORME MÉDICO - EMBARAZO ECTÓPICO</h1>
    <p>Generado el ${fecha}</p>
  </div>

  <div class="section">
    <h2>INFORMACIÓN DEL PACIENTE</h2>
    <table>
      <tr><td><strong>Nombre:</strong></td><td>${nombrePaciente}</td></tr>
      <tr><td><strong>Edad:</strong></td><td>${edadPaciente} años</td></tr>
      <tr><td><strong>ID Seguimiento:</strong></td><td>${idSeguimiento || "N/A"}</td></tr>
      <tr><td><strong>Fecha:</strong></td><td>${fecha}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>SIGNOS VITALES</h2>
    <table>
      <tr><td><strong>Frecuencia Cardíaca:</strong></td><td>${frecuenciaCardiaca} lpm</td></tr>
      <tr><td><strong>Presión Arterial:</strong></td><td>${presionSistolica}/${presionDiastolica} mmHg</td></tr>
      <tr><td><strong>Estado Conciencia:</strong></td><td>${estadoConciencia}</td></tr>
    </table>
  </div>

  ${
    consultasRealizadas.includes(1)
      ? `
  <div class="section">
    <h2>CONSULTAS REALIZADAS</h2>
    
    <div class="consultation">
      <h3>Primera Consulta</h3>
      <table>
        <tr><td><strong>Síntomas:</strong></td><td>${sintomasSeleccionados1.map(obtenerNombreSintoma).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>Factores Riesgo:</strong></td><td>${factoresSeleccionados1.map(obtenerNombreFactorRiesgo).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>TVUS:</strong></td><td>${obtenerNombreTVUS(tvus1)}</td></tr>
        <tr><td><strong>β-hCG:</strong></td><td>${hcgValor1} mUI/mL</td></tr>
        <tr><td><strong>Resultado:</strong></td><td>${resultado1 !== null ? (resultado1 * 100).toFixed(1) + "%" : "No disponible"}</td></tr>
      </table>
    </div>
    
    ${
      consultasRealizadas.includes(2)
        ? `
    <div class="consultation">
      <h3>Segunda Consulta (48-72h)</h3>
      <table>
        <tr><td><strong>Síntomas:</strong></td><td>${sintomasSeleccionados2.map(obtenerNombreSintoma).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>Factores Riesgo:</strong></td><td>${factoresSeleccionados2.map(obtenerNombreFactorRiesgo).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>TVUS:</strong></td><td>${obtenerNombreTVUS(tvus2)}</td></tr>
        <tr><td><strong>β-hCG:</strong></td><td>${hcgValor2} mUI/mL</td></tr>
        <tr><td><strong>Variación β-hCG:</strong></td><td>${calcularVariacionHcg(hcgValor1, hcgValor2)}</td></tr>
        <tr><td><strong>Resultado:</strong></td><td>${resultado2 !== null ? (resultado2 * 100).toFixed(1) + "%" : "No disponible"}</td></tr>
      </table>
    </div>
    `
        : ""
    }
    
    ${
      consultasRealizadas.includes(3)
        ? `
    <div class="consultation">
      <h3>Tercera Consulta (48-72h)</h3>
      <table>
        <tr><td><strong>Síntomas:</strong></td><td>${sintomasSeleccionados3.map(obtenerNombreSintoma).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>Factores Riesgo:</strong></td><td>${factoresSeleccionados3.map(obtenerNombreFactorRiesgo).join(", ") || "Ninguno"}</td></tr>
        <tr><td><strong>TVUS:</strong></td><td>${obtenerNombreTVUS(tvus3)}</td></tr>
        <tr><td><strong>β-hCG:</strong></td><td>${hcgValor3} mUI/mL</td></tr>
        <tr><td><strong>Variación β-hCG:</strong></td><td>${calcularVariacionHcg(hcgValor2, hcgValor3)}</td></tr>
        <tr><td><strong>Resultado:</strong></td><td>${resultado3 !== null ? (resultado3 * 100).toFixed(1) + "%" : "No disponible"}</td></tr>
      </table>
    </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  ${
    resultado !== null
      ? `
  <div class="result">
    <h2>RESULTADO FINAL</h2>
    <p>Probabilidad de Embarazo Ectópico: <strong>${(resultado * 100).toFixed(1)}%</strong></p>
    <p>${
      resultado >= 0.95
        ? "CONFIRMADO - Proceder con tratamiento"
        : resultado < 0.01
          ? "DESCARTADO - Alta confianza"
          : "INTERMEDIO - Seguimiento requerido"
    }</p>
  </div>
  `
      : ""
  }

  ${
    mensajeFinal
      ? `
  <div class="section">
    <h2>CONCLUSIÓN CLÍNICA</h2>
    <p><strong>${mensajeFinal}</strong></p>
  </div>
  `
      : ""
  }

  <div class="section">
    <h2>METODOLOGÍA</h2>
    <p>Algoritmo bayesiano basado en evidencia científica para diagnóstico de embarazo ectópico. 
    Zona discriminatoria β-hCG: ${dz} mUI/mL. Los resultados deben interpretarse en contexto clínico completo.</p>
  </div>

  <div style="text-align: center; margin-top: 30px; color: #666;">
    <p><strong>CMG Health Solutions</strong> - Sistema de Evaluación Diagnóstica</p>
  </div>
</body>
</html>`

    const ventana = window.open("", "_blank")
    if (ventana) {
      ventana.document.write(contenidoHTML)
      ventana.document.close()
      setTimeout(() => {
        ventana.print()
      }, 500)
    } else {
      alert("Por favor permita ventanas emergentes para generar el PDF")
    }
  }

  const renderSintomasYFactores = (faseNum: number) => {
    const sintomasSeleccionados =
      faseNum === 1 ? sintomasSeleccionados1 : faseNum === 2 ? sintomasSeleccionados2 : sintomasSeleccionados3
    const factoresSeleccionados =
      faseNum === 1 ? factoresSeleccionados1 : faseNum === 2 ? factoresSeleccionados2 : factoresSeleccionados3

    const probPretest = calcularProbabilidadPretest(sintomasSeleccionados, factoresSeleccionados)

    return (
      <div className="space-y-6">
        {/* Síntomas */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-900">Síntomas Presentes</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {sintomas.map((sintoma) => (
              <div
                key={sintoma.id}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-100 hover:bg-red-25 transition-colors"
              >
                <Checkbox
                  id={`${sintoma.id}-fase${faseNum}`}
                  checked={sintomasSeleccionados.includes(sintoma.id)}
                  onCheckedChange={(checked) => handleSintomaChange(faseNum, sintoma.id, checked as boolean)}
                  className="border-red-300 data-[state=checked]:bg-red-600"
                />
                <Label
                  htmlFor={`${sintoma.id}-fase${faseNum}`}
                  className="text-sm font-medium cursor-pointer text-red-800 flex-1"
                >
                  {sintoma.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Factores de Riesgo */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Heart className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-orange-900">Factores de Riesgo</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {factoresRiesgo.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-orange-100 hover:bg-orange-25 transition-colors"
              >
                <Checkbox
                  id={`${factor.id}-fase${faseNum}`}
                  checked={factoresSeleccionados.includes(factor.id)}
                  onCheckedChange={(checked) => handleFactorChange(faseNum, factor.id, checked as boolean)}
                  className="border-orange-300 data-[state=checked]:bg-orange-600"
                />
                <Label
                  htmlFor={`${factor.id}-fase${faseNum}`}
                  className="text-sm font-medium cursor-pointer text-orange-800 flex-1"
                >
                  {factor.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Probabilidad Pre-test */}
        {probPretest && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-900 mb-1">Probabilidad Pre-test Calculada</div>
              <div className="text-2xl font-bold text-blue-800">{(probPretest * 100).toFixed(1)}%</div>
              <div className="text-xs text-blue-700 mt-1">
                {factoresSeleccionados.length > 0 ? "Con factores de riesgo" : "Sin factores de riesgo"}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Función para obtener el nombre del síntoma
  const obtenerNombreSintoma = (id: string) => {
    const sintoma = sintomas.find((s) => s.id === id)
    return sintoma ? sintoma.label : id
  }

  // Función para obtener el nombre del factor de riesgo
  const obtenerNombreFactorRiesgo = (id: string) => {
    const factor = factoresRiesgo.find((f) => f.id === id)
    return factor ? factor.label : id
  }

  // Función para obtener el nombre del resultado TVUS
  const obtenerNombreTVUS = (valor: string) => {
    const nombres = {
      normal: "Normal",
      libre: "Líquido libre",
      masa: "Masa anexial",
      masa_libre: "Masa anexial + líquido libre",
    }
    return nombres[valor as keyof typeof nombres] || valor
  }

  // Componente para mostrar el progreso
  const ProgressIndicator = () => (
    <div className="flex justify-center items-center mb-8">
      <div className="flex items-center space-x-2 md:space-x-4">
        {[
          { num: 1, label: "Expediente Clínico", icon: User },
          { num: 2, label: "Signos Vitales", icon: Activity },
          { num: 3, label: "Prueba Embarazo", icon: FileText },
          { num: 4, label: "Evaluación Previa", icon: Stethoscope },
          { num: 5, label: "Consultas", icon: Calculator },
        ].map(({ num, label, icon: Icon }, index) => (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  seccionesCompletadas.includes(num)
                    ? "bg-green-500 text-white"
                    : seccionActual === num
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {seccionesCompletadas.includes(num) ? (
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                )}
              </div>
              <span className="text-xs mt-1 text-center font-medium max-w-[80px] leading-tight">{label}</span>
            </div>
            {index < 4 && (
              <ArrowRight
                className={`h-4 w-4 mx-1 md:mx-2 ${
                  seccionesCompletadas.includes(num) ? "text-green-500" : "text-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // Componente para la leyenda CMG
  const CMGFooter = () => (
    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
      <p className="text-xs text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de
        Evaluación Diagnóstica Avanzada
      </p>
    </div>
  )

  const copiarId = () => {
    navigator.clipboard.writeText(idSeguimiento)
    alert("ID copiado al portapapeles")
  }

  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    // Validar formato del ID
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    // Usar la nueva función de búsqueda que revisa localStorage y backend
    const consultaEncontrada = await buscarDatosPaciente(id)

    if (consultaEncontrada) {
      try {
        setConsultaCargada(consultaEncontrada)
        setModoCargarConsulta(false)
        setMostrarResumenConsulta(true)
        console.log("Consulta encontrada:", consultaEncontrada) // Para debug
      } catch (error) {
        alert("Error al cargar los datos de la consulta. El archivo puede estar corrupto.")
      }
    } else {
      alert("El ID ingresado no corresponde a ninguna paciente registrada. Verifica que esté bien escrito.")
    }
  }

  const continuarConsultaCargada = () => {
    if (!consultaCargada) return

    // Cargar datos básicos del paciente
    setNombrePaciente(consultaCargada.nombrePaciente || "")
    setEdadPaciente(consultaCargada.edadPaciente || "")
    setFrecuenciaCardiaca(consultaCargada.frecuenciaCardiaca || "")
    setPresionSistolica(consultaCargada.presionSistolica || "")
    setPresionDiastolica(consultaCargada.presionDiastolica || "")
    setEstadoConciencia(consultaCargada.estadoConciencia || "")
    setPruebaEmbarazoRealizada(consultaCargada.pruebaEmbarazoRealizada || "")
    setResultadoPruebaEmbarazo(consultaCargada.resultadoPruebaEmbarazo || "")
    setHallazgosExploracion(consultaCargada.hallazgosExploracion || "")
    setTieneEcoTransabdominal(consultaCargada.tieneEcoTransabdominal || "")
    setResultadoEcoTransabdominal(consultaCargada.resultadoEcoTransabdominal || "")

    // Cargar datos de consultas previas
    setSintomasSeleccionados1(consultaCargada.sintomasSeleccionados1 || [])
    setFactoresSeleccionados1(consultaCargada.factoresSeleccionados1 || [])
    setTvus1(consultaCargada.tvus1 || "")
    setHcgValor1(consultaCargada.hcgValor1 || "")
    setResultado1(consultaCargada.resultado1 || null)

    setSintomasSeleccionados2(consultaCargada.sintomasSeleccionados2 || [])
    setFactoresSeleccionados2(consultaCargada.factoresSeleccionados2 || [])
    setTvus2(consultaCargada.tvus2 || "")
    setHcgValor2(consultaCargada.hcgValor2 || "")
    setResultado2(consultaCargada.resultado2 || null)

    setSintomasSeleccionados3(consultaCargada.sintomasSeleccionados3 || [])
    setFactoresSeleccionados3(consultaCargada.factoresSeleccionados3 || [])
    setTvus3(consultaCargada.tvus3 || "")
    setHcgValor3(consultaCargada.hcgValor3 || "")
    setResultado3(consultaCargada.resultado3 || null)

    // Determinar consultas realizadas y próxima consulta
    const consultasRealizadasArray = consultaCargada.consultasRealizadas || []
    setConsultasRealizadas(consultasRealizadasArray)

    // Determinar la próxima consulta basada en las realizadas
    let proxima = 1
    if (consultasRealizadasArray.includes(1)) {
      proxima = 2
      if (consultasRealizadasArray.includes(2)) {
        proxima = 3
        if (consultasRealizadasArray.includes(3)) {
          proxima = 0 // Ya se realizaron todas las consultas
        }
      }
    }
    setProximaConsulta(proxima)

    // Establecer el resultado actual para cálculos bayesianos
    if (proxima === 2 && consultaCargada.resultado1) {
      setResultado(consultaCargada.resultado1)
    } else if (proxima === 3 && consultaCargada.resultado2) {
      setResultado(consultaCargada.resultado2)
    }

    setIdSeguimiento(consultaCargada.id)
    setMostrarResumenConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionesCompletadas([1, 2, 3, 4]) // Marcar secciones como completadas

    // Ir directamente a la sección de consultas
    setSeccionActual(5)
    setFase(proxima)
  }

  const guardarDatosSeguimiento = async (id: string) => {
    // Si no existe un ID, generar uno nuevo
    if (!id) {
      id = generarIdSeguimiento()
      setIdSeguimiento(id)
      setMostrarIdSeguimiento(true)
    }

    const datosAGuardar = {
      id: id,
      fechaCreacion: new Date().toISOString(),
      fechaUltimaActualizacion: new Date().toISOString(),
      nombrePaciente: nombrePaciente,
      edadPaciente: edadPaciente,
      frecuenciaCardiaca: frecuenciaCardiaca,
      presionSistolica: presionSistolica,
      presionDiastolica: presionDiastolica,
      estadoConciencia: estadoConciencia,
      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      hallazgosExploracion: hallazgosExploracion,
      tieneEcoTransabdominal: tieneEcoTransabdominal,
      resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      consultasRealizadas: consultasRealizadas,
      proximaConsulta: proximaConsulta,
      sintomasSeleccionados1: sintomasSeleccionados1,
      factoresSeleccionados1: factoresSeleccionados1,
      tvus1: tvus1,
      hcgValor1: hcgValor1,
      resultado1: resultado1,
      sintomasSeleccionados2: sintomasSeleccionados2,
      factoresSeleccionados2: factoresSeleccionados2,
      tvus2: tvus2,
      hcgValor2: hcgValor2,
      resultado2: resultado2,
      sintomasSeleccionados3: sintomasSeleccionados3,
      factoresSeleccionados3: factoresSeleccionados3,
      tvus3: tvus3,
      hcgValor3: hcgValor3,
      resultado3: resultado3,
    }

    // Usar la nueva función de sincronización
    await sincronizarDatos(id, datosAGuardar, false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Heart className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">Calculadora de Embarazo Ectópico</h1>
              <p className="text-blue-100 text-lg">Sistema de Evaluación Diagnóstica Avanzada</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full">
              <Stethoscope className="h-8 w-8" />
            </div>
          </div>
          {idSeguimiento && (
            <div className="flex justify-center items-center mt-4">
              <div className="bg-white/20 px-4 py-2 rounded-full flex items-center space-x-2">
                <span className="text-sm font-mono">ID: {idSeguimiento}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={copiarId}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Pantalla inicial con opciones */}
        {mostrarPantallaBienvenida ? (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido al Sistema</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">
                  Seleccione una opción para continuar con la evaluación diagnóstica
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button
                    onClick={iniciarNuevaEvaluacion}
                    className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <User className="h-8 w-8" />
                      <span>Nueva Evaluación</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarPantallaBienvenida(false)
                      setModoCargarConsulta(true)
                    }}
                    variant="outline"
                    className="h-24 border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold text-lg"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8" />
                      <span>Continuar Consulta</span>
                    </div>
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        ) : modoCargarConsulta ? (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Continuar Consulta Existente</h2>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Información Importante</span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Las consultas de seguimiento deben realizarse entre 48-72 horas después de la consulta inicial.
                    Ingrese el ID de seguimiento que recibió al completar su primera consulta.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de Seguimiento:</Label>
                    <input
                      type="text"
                      placeholder="Ej: ID-00001"
                      value={idBusqueda}
                      onChange={(e) => setIdBusqueda(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">Formato: ID-NNNNN (Ej: ID-00001)</p>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={buscarConsulta}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-6"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Buscar Consulta
                    </Button>
                    <Button
                      onClick={() => {
                        setModoCargarConsulta(false)
                        setMostrarPantallaBienvenida(true)
                      }}
                      variant="outline"
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        ) : mostrarResumenConsulta && consultaCargada ? (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">📋 Historial Clínico Completo</h2>
                </div>

                {/* Información del Paciente */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">👤 Información del Paciente</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">ID de Seguimiento</div>
                      <div className="text-lg font-mono font-bold text-blue-800">{consultaCargada.id}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">Paciente</div>
                      <div className="text-blue-800 font-semibold">
                        {consultaCargada.nombrePaciente}, {consultaCargada.edadPaciente} años
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">Fecha de Creación</div>
                      <div className="text-blue-800">
                        {consultaCargada.fechaCreacion
                          ? new Date(consultaCargada.fechaCreacion).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No disponible"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">Última Actualización</div>
                      <div className="text-blue-800">
                        {consultaCargada.fechaUltimaActualizacion
                          ? new Date(consultaCargada.fechaUltimaActualizacion).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No disponible"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">Signos Vitales</div>
                      <div className="text-blue-800 text-sm">
                        FC: {consultaCargada.frecuenciaCardiaca} lpm | PA: {consultaCargada.presionSistolica}/
                        {consultaCargada.presionDiastolica} mmHg
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-900 mb-1">Estado de Conciencia</div>
                      <div className="text-blue-800 capitalize">{consultaCargada.estadoConciencia}</div>
                    </div>
                  </div>
                </div>

                {/* Mostrar consultas realizadas con detalles completos */}
                {consultaCargada.consultasRealizadas?.includes(1) && (
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">📋 Primera Consulta Realizada</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-green-900 mb-1">Síntomas</div>
                        <div className="text-green-800">
                          {consultaCargada.sintomasSeleccionados1?.map(obtenerNombreSintoma).join(", ") || "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-900 mb-1">Factores de Riesgo</div>
                        <div className="text-green-800">
                          {consultaCargada.factoresSeleccionados1?.map(obtenerNombreFactorRiesgo).join(", ") ||
                            "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-900 mb-1">TVUS</div>
                        <div className="text-green-800">{obtenerNombreTVUS(consultaCargada.tvus1)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-900 mb-1">β-hCG</div>
                        <div className="text-green-800">{consultaCargada.hcgValor1} mUI/mL</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-sm font-medium text-green-900 mb-1">Resultado del Algoritmo</div>
                        <div className="text-green-800 font-bold text-lg">
                          {consultaCargada.resultado1
                            ? `${(consultaCargada.resultado1 * 100).toFixed(1)}% probabilidad de embarazo ectópico`
                            : "No disponible"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {consultaCargada.consultasRealizadas?.includes(2) && (
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">📋 Segunda Consulta Realizada</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">Síntomas</div>
                        <div className="text-orange-800">
                          {consultaCargada.sintomasSeleccionados2?.map(obtenerNombreSintoma).join(", ") || "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">Factores de Riesgo</div>
                        <div className="text-orange-800">
                          {consultaCargada.factoresSeleccionados2?.map(obtenerNombreFactorRiesgo).join(", ") ||
                            "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">TVUS</div>
                        <div className="text-orange-800">{obtenerNombreTVUS(consultaCargada.tvus2)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">β-hCG</div>
                        <div className="text-orange-800">{consultaCargada.hcgValor2} mUI/mL</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">Variación β-hCG</div>
                        <div className="text-orange-800">
                          {calcularVariacionHcg(consultaCargada.hcgValor1, consultaCargada.hcgValor2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-900 mb-1">Resultado del Algoritmo</div>
                        <div className="text-orange-800 font-bold text-lg">
                          {consultaCargada.resultado2
                            ? `${(consultaCargada.resultado2 * 100).toFixed(1)}% probabilidad de embarazo ectópico`
                            : "No disponible"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {consultaCargada.consultasRealizadas?.includes(3) && (
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-bold text-purple-900 mb-4">📋 Tercera Consulta Realizada</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">Síntomas</div>
                        <div className="text-purple-800">
                          {consultaCargada.sintomasSeleccionados3?.map(obtenerNombreSintoma).join(", ") || "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">Factores de Riesgo</div>
                        <div className="text-purple-800">
                          {consultaCargada.factoresSeleccionados3?.map(obtenerNombreFactorRiesgo).join(", ") ||
                            "Ninguno"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">TVUS</div>
                        <div className="text-purple-800">{obtenerNombreTVUS(consultaCargada.tvus3)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">β-hCG</div>
                        <div className="text-purple-800">{consultaCargada.hcgValor3} mUI/mL</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">Variación β-hCG</div>
                        <div className="text-purple-800">
                          {calcularVariacionHcg(consultaCargada.hcgValor2, consultaCargada.hcgValor3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-purple-900 mb-1">Resultado del Algoritmo</div>
                        <div className="text-purple-800 font-bold text-lg">
                          {consultaCargada.resultado3
                            ? `${(consultaCargada.resultado3 * 100).toFixed(1)}% probabilidad de embarazo ectópico`
                            : "No disponible"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Diagnóstico de seguimiento automático */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
                  <h3 className="text-lg font-bold text-amber-900 mb-4">🎯 Diagnóstico de Seguimiento</h3>
                  {(() => {
                    const consultasRealizadas = consultaCargada.consultasRealizadas || []
                    if (consultasRealizadas.includes(1) && !consultasRealizadas.includes(2)) {
                      return (
                        <p className="text-amber-800 font-medium text-lg">
                          📊 Aproximación: se debe realizar la segunda consulta.
                        </p>
                      )
                    } else if (
                      consultasRealizadas.includes(1) &&
                      consultasRealizadas.includes(2) &&
                      !consultasRealizadas.includes(3)
                    ) {
                      return (
                        <p className="text-amber-800 font-medium text-lg">
                          📊 Aproximación: se debe realizar la tercera consulta.
                        </p>
                      )
                    } else if (
                      consultasRealizadas.includes(1) &&
                      consultasRealizadas.includes(2) &&
                      consultasRealizadas.includes(3)
                    ) {
                      return (
                        <p className="text-amber-800 font-medium text-lg">
                          ✅ Todas las consultas han sido completadas. Evaluación diagnóstica finalizada.
                        </p>
                      )
                    } else {
                      return (
                        <p className="text-amber-800 font-medium text-lg">📊 Se debe realizar la primera consulta.</p>
                      )
                    }
                  })()}
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-4">
                  {(() => {
                    const consultasRealizadas = consultaCargada.consultasRealizadas || []
                    if (!consultasRealizadas.includes(1)) {
                      return (
                        <Button
                          onClick={continuarConsultaCargada}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6"
                        >
                          ✅ Realizar Primera Consulta
                        </Button>
                      )
                    } else if (consultasRealizadas.includes(1) && !consultasRealizadas.includes(2)) {
                      return (
                        <Button
                          onClick={continuarConsultaCargada}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6"
                        >
                          ✅ Realizar segunda consulta
                        </Button>
                      )
                    } else if (
                      consultasRealizadas.includes(1) &&
                      consultasRealizadas.includes(2) &&
                      !consultasRealizadas.includes(3)
                    ) {
                      return (
                        <Button
                          onClick={continuarConsultaCargada}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6"
                        >
                          ✅ Realizar tercera consulta
                        </Button>
                      )
                    } else {
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-gray-700">
                            ✅ Todas las consultas han sido completadas para este paciente.
                          </p>
                        </div>
                      )
                    }
                  })()}
                  <Button
                    onClick={() => {
                      setMostrarResumenConsulta(false)
                      setConsultaCargada(null)
                      setModoCargarConsulta(true)
                    }}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 py-3 px-6"
                  >
                    🔍 Buscar Otro ID
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarResumenConsulta(false)
                      setConsultaCargada(null)
                      setMostrarPantallaBienvenida(true)
                    }}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50 py-3 px-6"
                  >
                    Cancelar
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        ) : mostrarResultados ? (
          /* Pantalla de Resultados */
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Resultado de la Consulta</h2>
                  </div>

                  {/* Resultado Principal */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200 shadow-lg">
                    <div className="text-center">
                      <div className="text-sm font-medium text-purple-900 mb-2">Probabilidad de Embarazo Ectópico</div>
                      <div className="text-5xl font-bold text-purple-800 mb-4">{(resultado! * 100).toFixed(1)}%</div>
                      <div className="text-lg text-purple-700 font-medium">
                        {resultado! >= 0.95
                          ? "Alta probabilidad - Confirmar diagnóstico"
                          : resultado! < 0.01
                            ? "Baja probabilidad - Descartar diagnóstico"
                            : "Probabilidad intermedia - Seguimiento requerido"}
                      </div>
                    </div>
                  </div>

                  {/* ID de Seguimiento */}
                  {mostrarIdSeguimiento && idSeguimiento && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 shadow-lg">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <AlertTriangle className="h-6 w-6 text-blue-600" />
                          <h3 className="text-xl font-bold text-blue-900">Seguimiento Requerido</h3>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 mb-2">⚪ Guarde este ID</div>
                          <div className="text-2xl font-mono font-bold text-blue-800 mb-3">{idSeguimiento}</div>
                          <Button
                            onClick={copiarId}
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar ID
                          </Button>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <div className="flex items-center justify-center space-x-2 mb-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <span className="font-medium text-amber-900">Instrucciones de Seguimiento</span>
                          </div>
                          <ul className="text-amber-800 text-sm space-y-2 list-disc list-inside text-left">
                            <li>
                              <strong>Regrese en 48-72 horas</strong> para continuar con la evaluación
                            </li>
                            <li>
                              <strong>Mantenga vigilancia</strong> de los síntomas durante este tiempo
                            </li>
                            <li>
                              <strong>Acuda inmediatamente</strong> si presenta empeoramiento del dolor, sangrado
                              abundante o síntomas de shock
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex justify-center space-x-4 pt-6">
                    <Button
                      onClick={() => setMostrarInforme(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generar Informe PDF
                    </Button>
                    <Button
                      onClick={resetCalculadora}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Nueva Evaluación
                    </Button>
                  </div>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        ) : (
          /* FORMULARIO PRINCIPAL */
          <div>
            {/* Indicador de progreso */}
            {!protocoloFinalizado && <ProgressIndicator />}

            {/* Mensaje final si el protocolo está finalizado */}
            {protocoloFinalizado ? (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800">Evaluación Completada</h2>
                    </div>

                    {/* Alerta centrada con colores según urgencia */}
                    <div className="flex justify-center">
                      <div
                        className={`max-w-4xl w-full p-6 rounded-xl border shadow-lg text-center ${
                          mensajeFinal.includes("🚨 EMERGENCIA")
                            ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-900"
                            : mensajeFinal.includes("⚠️")
                              ? "bg-gradient-to-r from-amber-50 to-orange-100 border-amber-300 text-amber-900"
                              : mensajeFinal.includes("confirmado")
                                ? "bg-gradient-to-r from-red-50 to-pink-100 border-red-300 text-red-900"
                                : mensajeFinal.includes("descartado")
                                  ? "bg-gradient-to-r from-green-50 to-emerald-100 border-green-300 text-green-900"
                                  : "bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-300 text-blue-900"
                        }`}
                      >
                        <p className="text-lg font-semibold leading-relaxed">{mensajeFinal}</p>
                      </div>
                    </div>

                    {resultado !== null && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-900 mb-2">
                            Probabilidad de Embarazo Ectópico
                          </div>
                          <div className="text-4xl font-bold text-purple-800 mb-2">{(resultado * 100).toFixed(1)}%</div>
                          <div className="text-purple-700">
                            {resultado >= 0.95
                              ? "Alta probabilidad - Confirmar diagnóstico"
                              : resultado < 0.01
                                ? "Baja probabilidad - Descartar diagnóstico"
                                : "Probabilidad intermedia - Seguimiento requerido"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={() => setMostrarInforme(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Generar Informe PDF
                      </Button>
                      <Button
                        onClick={resetCalculadora}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Nueva Evaluación
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Secciones del formulario según seccionActual */
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                  {/* Sección 1: Datos Básicos */}
                  {seccionActual === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Nombre de la Paciente:</Label>
                          <input
                            type="text"
                            placeholder="Nombre completo"
                            value={nombrePaciente}
                            onChange={(e) => setNombrePaciente(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Edad:</Label>
                          <input
                            type="number"
                            placeholder="Edad en años"
                            value={edadPaciente}
                            onChange={(e) => setEdadPaciente(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={() => completarSeccion(1)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <CMGFooter />
                    </div>
                  )}

                  {/* Sección 2: Signos Vitales */}
                  {seccionActual === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Activity className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Signos Vitales</h2>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Estado de Conciencia - Superior Izquierda */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Estado de Conciencia:</Label>
                          <select
                            value={estadoConciencia}
                            onChange={(e) => setEstadoConciencia(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="alerta">Alerta</option>
                            <option value="somnolenta">Somnolenta</option>
                            <option value="confusa">Confusa</option>
                            <option value="estuporosa">Estuporosa</option>
                            <option value="comatosa">Comatosa</option>
                          </select>
                        </div>

                        {/* Frecuencia Cardíaca - Superior Derecha */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Frecuencia Cardíaca (lpm):</Label>
                          <input
                            type="number"
                            placeholder="Ej: 80"
                            value={frecuenciaCardiaca}
                            onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        {/* Presión Sistólica - Inferior Izquierda */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">
                            Presión Arterial Sistólica (mmHg):
                          </Label>
                          <input
                            type="number"
                            placeholder="Ej: 120"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        {/* Presión Diastólica - Inferior Derecha */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">
                            Presión Arterial Diastólica (mmHg):
                          </Label>
                          <input
                            type="number"
                            placeholder="Ej: 80"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Alertas de signos vitales */}
                      {frecuenciaCardiaca && presionSistolica && presionDiastolica && estadoConciencia && (
                        <div className="space-y-3">
                          {/* Alerta de taquicardia con hipotensión */}
                          {Number.parseFloat(frecuenciaCardiaca) > 100 &&
                            (Number.parseFloat(presionSistolica) <= 90 ||
                              Number.parseFloat(presionDiastolica) <= 60) && (
                              <div className="flex justify-center">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg border border-red-600 shadow-lg max-w-2xl text-center">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-bold">🚨 EMERGENCIA MÉDICA</span>
                                  </div>
                                  <p className="text-sm">
                                    Taquicardia con hipotensión detectada. Posible compromiso hemodinámico severo.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Alerta de hipotensión */}
                          {(Number.parseFloat(presionSistolica) < 90 || Number.parseFloat(presionDiastolica) < 60) &&
                            !(Number.parseFloat(frecuenciaCardiaca) > 100) && (
                              <div className="flex justify-center">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg border border-orange-600 shadow-lg max-w-2xl text-center">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-bold">ALERTA</span>
                                  </div>
                                  <p className="text-sm">
                                    Hipotensión arterial detectada. Requiere evaluación inmediata.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Alerta de taquicardia severa */}
                          {Number.parseFloat(frecuenciaCardiaca) > 120 &&
                            Number.parseFloat(presionSistolica) > 90 &&
                            Number.parseFloat(presionDiastolica) > 60 && (
                              <div className="flex justify-center">
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-lg border border-orange-600 shadow-lg max-w-2xl text-center">
                                  <div className="flex items-center justify-center space-x-2 mb-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-bold">ALERTA</span>
                                  </div>
                                  <p className="text-sm">
                                    Taquicardia severa detectada. Requiere evaluación cardiovascular.
                                  </p>
                                </div>
                              </div>
                            )}

                          {/* Alerta de estado de conciencia alterado */}
                          {(estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") && (
                            <div className="flex justify-center">
                              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg border border-red-700 shadow-lg max-w-2xl text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span className="font-bold">🚨 EMERGENCIA MÉDICA</span>
                                </div>
                                <p className="text-sm">
                                  Alteración severa del estado de conciencia. Requiere traslado inmediato.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Precaución para alteraciones leves */}
                          {(estadoConciencia === "somnolenta" || estadoConciencia === "confusa") && (
                            <div className="flex justify-center">
                              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg border border-yellow-600 shadow-lg max-w-2xl text-center">
                                <div className="flex items-center justify-center space-x-2 mb-2">
                                  <AlertTriangle className="h-5 w-5" />
                                  <span className="font-bold">PRECAUCIÓN</span>
                                </div>
                                <p className="text-sm">
                                  Alteración leve-moderada del estado de conciencia. Vigilancia estrecha recomendada.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={() => completarSeccion(2)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <CMGFooter />
                    </div>
                  )}

                  {/* Sección 3: Prueba de Embarazo */}
                  {seccionActual === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">
                            ¿Se ha realizado prueba de embarazo?
                          </Label>
                          <select
                            value={pruebaEmbarazoRealizada}
                            onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        {pruebaEmbarazoRealizada === "si" && (
                          <div className="space-y-2">
                            <Label className="text-base font-medium text-slate-700">Resultado de la prueba:</Label>
                            <select
                              value={resultadoPruebaEmbarazo}
                              onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Seleccione una opción</option>
                              <option value="positiva">Positiva</option>
                              <option value="negativa">Negativa</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={() => completarSeccion(3)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <CMGFooter />
                    </div>
                  )}

                  {/* Sección 4: Evaluación Previa */}
                  {seccionActual === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Stethoscope className="h-6 w-6 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">
                            Hallazgos en la exploración física (opcional):
                          </Label>
                          <input
                            type="text"
                            placeholder="Describa los hallazgos relevantes"
                            value={hallazgosExploracion}
                            onChange={(e) => setHallazgosExploracion(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">
                            ¿Se ha realizado ecografía transabdominal?
                          </Label>
                          <select
                            value={tieneEcoTransabdominal}
                            onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                            className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Seleccione una opción</option>
                            <option value="si">Sí</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        {tieneEcoTransabdominal === "si" && (
                          <div className="space-y-2">
                            <Label className="text-base font-medium text-slate-700">
                              Resultado de la ecografía transabdominal:
                            </Label>
                            <select
                              value={resultadoEcoTransabdominal}
                              onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                              className="w-full px-3 py-2 border border-blue-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Seleccione una opción</option>
                              <option value="saco_embrion_fc">Saco gestacional + embrión con FC</option>
                              <option value="saco_vitelino_embrion">
                                Saco gestacional + vesícula vitelina + embrión
                              </option>
                              <option value="saco_vitelino_sin_embrion">
                                Saco gestacional + vesícula vitelina sin embrión
                              </option>
                              <option value="saco_sin_embrion">
                                Saco gestacional sin vesícula vitelina ni embrión
                              </option>
                              <option value="saco_10mm_decidual_2mm">
                                Saco gestacional ≥10mm + reacción decidual ≥2mm
                              </option>
                              <option value="no_concluyente">No concluyente / No visualiza saco gestacional</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={() => completarSeccion(4)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <CMGFooter />
                    </div>
                  )}

                  {/* Sección 5: Consultas */}
                  {seccionActual === 5 && (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calculator className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">
                          {proximaConsulta === 1
                            ? "Primera Consulta"
                            : proximaConsulta === 2
                              ? "Segunda Consulta (48-72h)"
                              : "Tercera Consulta (48-72h)"}
                        </h2>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6 shadow-sm">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-200 rounded-full">
                            <div className="h-4 w-4 rounded-full bg-blue-600" />
                          </div>
                          <span className="font-bold text-blue-900 text-lg">Zona Discriminatoria β-hCG</span>
                        </div>
                        <p className="text-blue-800 font-medium">
                          El valor de la zona discriminatoria es de{" "}
                          <span className="font-bold text-xl">{dz} mUI/mL</span>. Por encima de este valor, se espera
                          visualizar un saco gestacional intrauterino en la ecografía transvaginal.
                        </p>
                      </div>

                      {/* Síntomas y Factores de Riesgo */}
                      {renderSintomasYFactores(proximaConsulta)}

                      {/* Resultados de TVUS y hCG */}
                      <div className="space-y-6 mt-8">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200 shadow-sm">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Stethoscope className="h-5 w-5 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-purple-900">Estudios Complementarios</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-base font-medium text-purple-800">
                                Resulta\
