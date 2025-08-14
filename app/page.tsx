"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Heart,
  Stethoscope,
  FileText,
  Calculator,
  User,
  Activity,
  AlertTriangle,
  Copy,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Download,
  ArrowRight,
} from "lucide-react"
import { useState } from "react"
import type React from "react"
import { createClient } from "@supabase/supabase-js"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ==================== Supabase (no lo usamos directamente, pero lo dejo si luego lo necesitas) ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==================== USUARIOS AUTORIZADOS ====================
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "dra.lopez", contraseña: "DocAuth2024!", nombre: "Dra. López" },
  { usuario: "admin", contraseña: "CMGAdmin2024#", nombre: "Administrador" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
]

// ==================== TABLAS DEL ALGORITMO (paper) ====================
const PRETEST_SIN_FACTORES = {
  asintomatica: 0.017,
  sangrado: 0.03,
  dolor: 0.13,
  dolor_sangrado: 0.15,
} as const

const PRETEST_CON_FACTORES = {
  asintomatica: 0.05,
  sangrado: 0.08,
  dolor: 0.40,
  dolor_sangrado: 0.46,
} as const

const LR_TVUS: Record<"normal" | "libre" | "masa" | "masa_libre", number> = {
  normal: 0.07,
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
}

const LR_HCG: Record<keyof typeof LR_TVUS, { bajo: number; alto: number }> = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}

const LR_VARIACION: Record<"reduccion_1_35" | "reduccion_35_50" | "reduccion_mayor_50" | "aumento" | "no_disponible", number> =
  {
    reduccion_1_35: 16.6,
    reduccion_35_50: 0.8,
    reduccion_mayor_50: 0,
    aumento: 3.3,
    no_disponible: 1,
  }

const DZ = 2000 // zona discriminatoria

// ==================== UTILIDADES ====================
const toNumOrNull = (v: any) => (Number.isFinite(+v) ? +v : null)

function probToOdds(p: number) {
  return p / (1 - p)
}
function oddsToProb(o: number) {
  return o / (1 + o)
}

function clamp01(x: number) {
  if (x < 0) return 0
  if (x > 0.999999) return 0.999999
  return x
}

// Sintetiza los síntomas a la clave del paper
function claveSintomaParaTabla(sintomas: string[]) {
  const sincopeFuera = sintomas.filter((s) => s !== "sincope")
  const tieneSangrado = sincopeFuera.includes("sangrado")
  const tieneDolor = sincopeFuera.includes("dolor")
  const tieneCombo = sincopeFuera.includes("dolor_sangrado") || (tieneSangrado && tieneDolor)

  if (tieneCombo) return "dolor_sangrado"
  if (tieneSangrado) return "sangrado"
  if (tieneDolor) return "dolor"
  return "asintomatica"
}

// Variación categórica de hCG entre consultas
function categorizarVariacionHcg(hcgPrev: number | null, hcgAct: number | null) {
  if (!Number.isFinite(hcgPrev!) || !Number.isFinite(hcgAct!)) return "no_disponible"
  if (hcgAct! > hcgPrev!) return "aumento"
  const reduccion = ((hcgPrev! - hcgAct!) / hcgPrev!) * 100
  if (reduccion >= 50) return "reduccion_mayor_50"
  if (reduccion >= 35) return "reduccion_35_50"
  if (reduccion >= 1) return "reduccion_1_35"
  return "aumento"
}

// ==================== NORMALIZACIÓN A snake_case (DB) ====================
function normalizarDesdeLocal(d: any) {
  return {
    id: d.id,
    fecha_creacion: d.fechaCreacion ?? d.fecha_creacion ?? null,
    fecha_ultima_actualizacion: d.fechaUltimaActualizacion ?? d.fecha_ultima_actualizacion ?? null,
    usuario_creador: d.usuarioCreador ?? d.usuario_creador ?? null,

    nombre_paciente: d.nombrePaciente ?? d.nombre_paciente ?? null,
    edad_paciente: toNumOrNull(d.edadPaciente ?? d.edad_paciente),

    frecuencia_cardiaca: toNumOrNull(d.frecuenciaCardiaca ?? d.frecuencia_cardiaca),
    presion_sistolica: toNumOrNull(d.presionSistolica ?? d.presion_sistolica),
    presion_diastolica: toNumOrNull(d.presionDiastolica ?? d.presion_diastolica),
    estado_conciencia: d.estadoConciencia ?? d.estado_conciencia ?? null,

    prueba_embarazo_realizada: d.pruebaEmbarazoRealizada ?? d.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: d.resultadoPruebaEmbarazo ?? d.resultado_prueba_embarazo ?? null,

    hallazgos_exploracion: d.hallazgosExploracion ?? d.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: d.tieneEcoTransabdominal ?? d.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: d.resultadoEcoTransabdominal ?? d.resultado_eco_transabdominal ?? null,

    sintomas_seleccionados: d.sintomasSeleccionados ?? d.sintomas_seleccionados ?? [],
    factores_seleccionados: d.factoresSeleccionados ?? d.factores_seleccionados ?? [],

    tvus: d.tvus ?? null,

    hcg_valor: toNumOrNull(d.hcgValor ?? d.hcg_valor),
    variacion_hcg: d.variacionHcg ?? d.variacion_hcg ?? null,
    hcg_anterior: toNumOrNull(d.hcgAnterior ?? d.hcg_anterior),

    resultado: typeof d.resultado === "number" ? d.resultado : toNumOrNull(d.resultado),
  }
}

// ==================== API Next (POST/PATCH/GET) ====================
async function enviarDatosAlBackend(datos: any): Promise<boolean> {
  try {
    const payload = normalizarDesdeLocal(datos)
    const res = await crearConsulta(payload) // POST /api/consultas
    if (res?.error) {
      console.error("POST /api/consultas error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("POST /api/consultas fallo:", e)
    return false
  }
}

async function actualizarDatosEnBackend(id: string, datos: any): Promise<boolean> {
  try {
    const patch = normalizarDesdeLocal(datos)
    const res = await actualizarConsulta(id, patch) // PATCH /api/consultas/:id
    if (res?.error) {
      console.error("PATCH /api/consultas error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("PATCH /api/consultas fallo:", e)
    return false
  }
}

async function leerDatosDesdeBackend(id: string): Promise<any | null> {
  try {
    const res = await obtenerConsulta(id) // GET /api/consultas/:id
    if (res?.error) return null
    return res?.data ?? null
  } catch (e) {
    console.error("GET /api/consultas fallo:", e)
    return null
  }
}

// ==================== ID secuencial ID-00000 en localStorage ====================
function generarIdConsulta(): string {
  const idsExistentes: number[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("ectopico_ID-")) {
      const idCompleto = key.replace("ectopico_", "")
      const n = Number.parseInt(idCompleto.replace("ID-", ""))
      if (!Number.isNaN(n)) idsExistentes.push(n)
    }
  }

  let siguiente = 1
  if (idsExistentes.length > 0) siguiente = Math.max(...idsExistentes) + 1
  return `ID-${siguiente.toString().padStart(5, "0")}`
}

// ==================== COMPONENTE ====================
export default function CalculadoraEctopico() {
  // Estados búsqueda/consulta
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

  // Auth
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

  // Datos clínicos
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
  const [resultado, setResultado] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // Seguimiento / flujo
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)

  // Navegación
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // Consultas
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  // Tablas de factores/síntomas para UI
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
    { id: "sincope", label: "Síncope o mareo" },
  ]

  // ======= Acciones =======
  const iniciarNuevaEvaluacion = () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  async function buscarConsulta() {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    // 1) Local primero (si hay)
    let consulta: any | null = null
    const raw = localStorage.getItem(`ectopico_${id}`)
    if (raw) {
      try {
        consulta = normalizarDesdeLocal(JSON.parse(raw))
      } catch (e) {
        console.warn("Error parseando localStorage:", e)
      }
    }

    // 2) Servidor (prioriza lo del backend)
    const dataSrv = await leerDatosDesdeBackend(id)
    if (dataSrv) {
      consulta = normalizarDesdeLocal(dataSrv)
      localStorage.setItem(`ectopico_${id}`, JSON.stringify(consulta))
    }

    if (!consulta) {
      alert("No se encontró ninguna consulta con ese ID")
      return
    }

    setConsultaCargada(consulta)
    setMostrarResumenConsulta(true)
    setModoCargarConsulta(false)
  }

  const continuarConsultaCargada = () => {
    if (!consultaCargada) return
    setIdSeguimiento(consultaCargada.id)
    setNombrePaciente(consultaCargada.nombre_paciente || "")
    setEdadPaciente((consultaCargada.edad_paciente ?? "")?.toString() || "")

    setFrecuenciaCardiaca((consultaCargada.frecuencia_cardiaca ?? "")?.toString() || "")
    setPresionSistolica((consultaCargada.presion_sistolica ?? "")?.toString() || "")
    setPresionDiastolica((consultaCargada.presion_diastolica ?? "")?.toString() || "")
    setEstadoConciencia(consultaCargada.estado_conciencia || "")
    setPruebaEmbarazoRealizada(consultaCargada.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(consultaCargada.resultado_prueba_embarazo || "")
    setHallazgosExploracion(consultaCargada.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(consultaCargada.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(consultaCargada.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(consultaCargada.sintomas_seleccionados || [])
    setFactoresSeleccionados(consultaCargada.factores_seleccionados || [])
    setTvus(consultaCargada.tvus || "")

    // β-hCG
    setHcgAnterior((consultaCargada.hcg_valor ?? "")?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    // Navegación
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  const obtenerNombreSintoma = (sintomaId: string) => {
    const s = sintomas.find((x) => x.id === sintomaId)
    return s ? s.label : sintomaId
  }
  const obtenerNombreFactorRiesgo = (id: string) => {
    const f = factoresRiesgo.find((x) => x.id === id)
    return f ? f.label : id
  }
  const obtenerNombreTVUS = (id: string) => {
    if (!id) return "No especificado"
    switch (id) {
      case "normal":
        return "Normal"
      case "libre":
        return "Líquido libre"
      case "masa":
        return "Masa anexial"
      case "masa_libre":
        return "Masa anexial + líquido libre"
      default:
        return id
    }
  }

  const resetCalculadora = () => {
    setResultado(null)
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
    setSintomasSeleccionados([])
    setFactoresSeleccionados([])
    setTvus("")
    setHcgValor("")
    setVariacionHcg("")
    setHcgAnterior("")
    setIdSeguimiento("")
    setMostrarIdSeguimiento(false)
    setModoCargarConsulta(false)
    setIdBusqueda("")
    setMostrarResumenConsulta(false)
    setConsultaCargada(null)
    setMostrarPantallaBienvenida(true)
    setMostrarResultados(false)
    setMostrarAlerta(false)
    setMensajeAlerta("")
    setEsConsultaSeguimiento(false)
  }

  const copiarId = () => {
    if (!idSeguimiento) return
    navigator.clipboard.writeText(idSeguimiento)
    alert("ID copiado al portapapeles")
  }

  // ====== Validaciones clínicas rápidas ======
  const completarSeccion = (s: number) => {
    if (!seccionesCompletadas.includes(s)) setSeccionesCompletadas([...seccionesCompletadas, s])
    setSeccionActual(s + 1)
  }

  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sis = Number.parseFloat(presionSistolica)
    const dia = Number.parseFloat(presionDiastolica)

    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (sis >= 180 || dia >= 110) {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Crisis hipertensiva (PA ≥ 180/110 mmHg). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 100 && (sis <= 90 || dia <= 60)) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Taquicardia con hipotensión (FC > 100 y PA ≤ 90/60). Traslado inmediato."
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 120) {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Taquicardia severa (FC > 120). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc < 50) {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Bradicardia severa (FC < 50). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Alteración severa del estado de conciencia. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }

    let alerta = ""
    if (sis < 90 || dia < 60) alerta = "Hipotensión arterial detectada. Evaluación inmediata."
    else if (sis >= 140 || dia >= 90) alerta = "Hipertensión arterial detectada. Requiere seguimiento."
    else if (fc > 100) alerta = "Taquicardia detectada. Monitoreo continuo."
    else if (fc < 60) alerta = "Bradicardia detectada. Evaluación recomendada."

    if (alerta) {
      setMostrarAlerta(true)
      setMensajeAlerta(alerta)
    }

    return true
  }

  const validarPruebaEmbarazo = () => {
    if (pruebaEmbarazoRealizada === "no") {
      setMensajeFinal(
        "Se necesita realizar una prueba de embarazo cualitativa antes de continuar con la evaluación."
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
    const confirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ]
    if (tieneEcoTransabdominal === "si" && confirmatorias.includes(resultadoEcoTransabdominal)) {
      setMensajeFinal("Evidencia de embarazo intrauterino. Embarazo ectópico descartado.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  // ====== Cálculo Bayes (con pretest ajustada en seguimiento) ======
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Por favor complete síntomas, TVUS y β-hCG.")
      return
    }

    // 1) PRETEST base por síntomas y factores
    const clave = claveSintomaParaTabla(sintomasSeleccionados)
    const tieneFR = factoresSeleccionados.length > 0
    const preBase = (tieneFR ? PRETEST_CON_FACTORES : PRETEST_SIN_FACTORES)[clave as keyof typeof PRETEST_SIN_FACTORES]

    // 1b) PRETEST AJUSTADA si es seguimiento: usa el posttest previo
    let pretest = preBase
    const postPrev = Number.isFinite(+consultaCargada?.resultado) ? +consultaCargada.resultado : null
    if (esConsultaSeguimiento && postPrev !== null) {
      // Fórmula: pretest_ajustada = (1 − post_prev) * pretest_actual + post_prev
      pretest = clamp01((1 - postPrev) * preBase + postPrev)
    }

    // 2) LRs
    const lrs: number[] = []
    const lrTvus = LR_TVUS[tvus as keyof typeof LR_TVUS]
    if (lrTvus) lrs.push(lrTvus)

    const hcgNum = Number.parseFloat(hcgValor)
    const nivel = hcgNum >= DZ ? "alto" : "bajo"
    const lrH = LR_HCG[tvus as keyof typeof LR_HCG]?.[nivel as "alto" | "bajo"]
    if (lrH) lrs.push(lrH)

    // Variación solo si hay hcgAnterior
    let variCat = "no_disponible"
    const hPrev = toNumOrNull(hcgAnterior)
    if (hPrev !== null && Number.isFinite(hPrev)) {
      variCat = categorizarVariacionHcg(hPrev, hcgNum)
      const lrV = LR_VARIACION[variCat as keyof typeof LR_VARIACION]
      if (lrV) lrs.push(lrV)
    }
    setVariacionHcg(variCat)

    // 3) Bayes: multiplicar odds por cada LR
    let odds = probToOdds(pretest)
    for (const lr of lrs) odds *= lr
    const post = clamp01(oddsToProb(odds))
    setResultado(post)

    // 4) Guardar
    const fecha = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: consultaCargada?.fecha_creacion ?? fecha,
      fechaUltimaActualizacion: fecha,
      usuarioCreador: usuarioActual,
      nombrePaciente,
      edadPaciente: Number.parseInt(edadPaciente || "0") || null,
      frecuenciaCardiaca: Number.parseInt(frecuenciaCardiaca || "0") || null,
      presionSistolica: Number.parseInt(presionSistolica || "0") || null,
      presionDiastolica: Number.parseInt(presionDiastolica || "0") || null,
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor: hcgNum,
      variacionHcg: variCat,
      hcgAnterior: hPrev,
      resultado: post,
    }

    // Guarda local
    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(datosCompletos))

    // Decide POST vs PATCH (y fallback)
    let ok = false
    if (esConsultaSeguimiento) {
      ok = await actualizarDatosEnBackend(idSeguimiento, datosCompletos)
      if (!ok) ok = await enviarDatosAlBackend(datosCompletos) // si no existiera en DB, intenta crearlo
    } else {
      ok = await enviarDatosAlBackend(datosCompletos)
      if (!ok) ok = await actualizarDatosEnBackend(idSeguimiento, datosCompletos) // si ya existía, actualiza
    }

    if (!ok) {
      alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")
    }

    // 5) Mensaje final
    if (post >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (post < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%).")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  // ====== Informe “txt” ======
  const generarInformePDF = () => {
    try {
      const contenido = `
INFORME MÉDICO - EVALUACIÓN DE EMBARAZO ECTÓPICO
================================================

ID de Consulta: ${idSeguimiento}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

DATOS DEL PACIENTE:
- Nombre: ${nombrePaciente}
- Edad: ${edadPaciente} años

SIGNOS VITALES:
- Frecuencia Cardíaca: ${frecuenciaCardiaca} lpm
- Presión Arterial: ${presionSistolica}/${presionDiastolica} mmHg
- Estado de Conciencia: ${estadoConciencia}

ESTUDIOS COMPLEMENTARIOS:
- Ecografía Transvaginal: ${obtenerNombreTVUS(tvus)}
- β-hCG: ${hcgValor} mUI/mL
${hcgAnterior ? `- β-hCG Anterior: ${hcgAnterior} mUI/mL` : ""}

SÍNTOMAS PRESENTES:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n")}

FACTORES DE RIESGO:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactorRiesgo(f)}`).join("\n")}

RESULTADO:
${resultado !== null ? `Probabilidad de Embarazo Ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

CONCLUSIÓN:
${
  mensajeFinal ||
  (resultado !== null
    ? resultado >= 0.95
      ? "Alta probabilidad - Confirmar diagnóstico"
      : resultado < 0.01
        ? "Baja probabilidad - Descartar diagnóstico"
        : "Probabilidad intermedia - Seguimiento requerido"
    : "Evaluación en proceso")
}

================================================
Sistema CMG Health Solutions
`
      const a = document.createElement("a")
      const archivo = new Blob([contenido], { type: "text/plain" })
      a.href = URL.createObjectURL(archivo)
      a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      alert("Informe generado y descargado.")
    } catch (e) {
      console.error("Error al generar informe:", e)
      alert("Error al generar el informe.")
    }
  }

  // ====== Login ======
  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")
    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
      return
    }
    const u = USUARIOS_AUTORIZADOS.find((x) => x.usuario.toLowerCase() === usuario.toLowerCase() && x.contraseña === contraseña)
    if (u) {
      setEstaAutenticado(true)
      setUsuarioActual(u.usuario)
      setNombreUsuario(u.nombre)
      setErrorLogin("")
      setIntentosLogin(0)
      setUsuario("")
      setContraseña("")
    } else {
      setIntentosLogin((p) => p + 1)
      setErrorLogin(`Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`)
      setContraseña("")
    }
  }

  const cerrarSesion = () => {
    setEstaAutenticado(false)
    setUsuarioActual("")
    setNombreUsuario("")
    setUsuario("")
    setContraseña("")
    setErrorLogin("")
    setIntentosLogin(0)
    resetCalculadora()
  }

  // ====== UI ======
  if (!estaAutenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Acceso Restringido</h1>
                  <p className="text-sm text-slate-600">Sistema Médico Autorizado</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900 text-sm">Acceso Solo para Personal Médico Autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">
                  Este sistema está destinado exclusivamente para uso de profesionales médicos autorizados. El acceso no
                  autorizado está prohibido.
                </p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario:</Label>
                  <input
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={intentosLogin >= 5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Contraseña:</Label>
                  <div className="relative">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={intentosLogin >= 5}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setMostrarContraseña(!mostrarContraseña)}
                      disabled={intentosLogin >= 5}
                    >
                      {mostrarContraseña ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                    </Button>
                  </div>
                </div>

                {errorLogin && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-red-800 text-sm font-medium">{errorLogin}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-base"
                  disabled={intentosLogin >= 5}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {intentosLogin >= 5 ? "Acceso Bloqueado" : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">¿Problemas para acceder? Contacte al administrador del sistema</p>
                <p className="text-xs text-slate-400 mt-2">
                  <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema Seguro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== APLICACIÓN ====================
  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de Evaluación
        Diagnóstica Avanzada
      </p>
    </div>
  )

  const ProgressBar = () => {
    const steps = [
      { id: 1, name: "Expediente Clínico", icon: User },
      { id: 2, name: "Signos Vitales", icon: Activity },
      { id: 3, name: "Prueba Embarazo", icon: FileText },
      { id: 4, name: "Evaluación Previa", icon: Stethoscope },
      { id: 5, name: "Consultas", icon: Calculator },
    ]
    return (
      <div className="bg-gray-100 py-6 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = seccionesCompletadas.includes(step.id)
              const isCurrent = seccionActual === step.id
              const isAccessible = step.id <= Math.max(...seccionesCompletadas, seccionActual)
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-500 text-white"
                          : isAccessible
                          ? "bg-gray-300 text-gray-600"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-20 ${isCurrent ? "font-semibold text-blue-600" : "text-gray-600"}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 mx-4 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Calculadora de Embarazo Ectópico</h1>
                <p className="text-blue-100 text-sm">Sistema de Evaluación Diagnóstica Avanzada</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {idSeguimiento && (
                <div className="bg-white/20 px-4 py-2 rounded-full flex items-center space-x-2">
                  <span className="text-sm font-mono">ID: {idSeguimiento}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={copiarId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-blue-100">Sesión activa:</p>
                <p className="font-semibold">{nombreUsuario}</p>
              </div>
              <Button onClick={cerrarSesion} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                <User className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {mostrarPantallaBienvenida ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido al Sistema</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">Seleccione una opción para continuar con la evaluación diagnóstica</p>
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
        </div>
      ) : modoCargarConsulta ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
        </div>
      ) : mostrarResumenConsulta && consultaCargada ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Consulta Encontrada</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de la Consulta Previa</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>ID:</strong> {consultaCargada.id}
                      </p>
                      <p>
                        <strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}
                      </p>
                      <p>
                        <strong>Edad:</strong> {consultaCargada.edad_paciente ?? "No especificado"} años
                      </p>
                      <p>
                        <strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor ?? "No especificado"} mUI/mL
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}
                      </p>
                      <p>
                        <strong>Resultado anterior:</strong>{" "}
                        {Number.isFinite(+consultaCargada.resultado)
                          ? `${(consultaCargada.resultado * 100).toFixed(1)}%`
                          : "No calculado"}
                      </p>
                      <p>
                        <strong>Fecha:</strong>{" "}
                        {consultaCargada.fecha_creacion
                          ? new Date(consultaCargada.fecha_creacion).toLocaleDateString()
                          : "No disponible"}
                      </p>
                      <p>
                        <strong>Frecuencia Cardíaca:</strong> {consultaCargada.frecuencia_cardiaca ?? "No especificado"} lpm
                      </p>
                    </div>
                  </div>

                  {Array.isArray(consultaCargada.sintomas_seleccionados) &&
                    consultaCargada.sintomas_seleccionados.length > 0 && (
                      <div className="mt-4">
                        <p>
                          <strong>Síntomas:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-800">
                          {consultaCargada.sintomas_seleccionados.map((s: string) => (
                            <li key={s}>{obtenerNombreSintoma(s)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {Array.isArray(consultaCargada.factores_seleccionados) &&
                    consultaCargada.factores_seleccionados.length > 0 && (
                      <div className="mt-4">
                        <p>
                          <strong>Factores de Riesgo:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-800">
                          {consultaCargada.factores_seleccionados.map((f: string) => (
                            <li key={f}>{obtenerNombreFactorRiesgo(f)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Consulta de Seguimiento</span>
                  </div>
                  <p className="text-yellow-800 text-sm">
                    Al continuar, se cargará automáticamente la información de la consulta previa. El valor de β-hCG
                    anterior se configurará automáticamente para calcular la variación. Solo necesitará ingresar el nuevo valor de β-hCG.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={continuarConsultaCargada} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar Consulta
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarResumenConsulta(false)
                      setModoCargarConsulta(true)
                      setConsultaCargada(null)
                    }}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Buscar Otra Consulta
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : protocoloFinalizado ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Evaluación Completada</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">{mensajeFinal}</p>
                </div>

                {resultado !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                    <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                    <p className="text-blue-800 text-sm">
                      {resultado >= 0.95
                        ? "Alta probabilidad - Confirmar diagnóstico"
                        : resultado < 0.01
                        ? "Baja probabilidad - Descartar diagnóstico"
                        : "Probabilidad intermedia - Seguimiento requerido"}
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button onClick={generarInformePDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe
                  </Button>
                  <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white">
                    <User className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Resultado de la Evaluación</h2>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                  <p className="text-blue-800 text-sm">
                    {resultado >= 0.95
                      ? "Alta probabilidad - Confirmar diagnóstico"
                      : resultado < 0.01
                      ? "Baja probabilidad - Descartar diagnóstico"
                      : "Probabilidad intermedia - Seguimiento requerido"}
                  </p>
                </div>

                {mostrarIdSeguimiento && idSeguimiento && (
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-900">Seguimiento Requerido</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-800">⚪ Guarde este ID:</span>
                        <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                        <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-white p-4 rounded border border-yellow-300">
                        <h4 className="font-medium text-yellow-900 mb-2">Instrucciones de Seguimiento</h4>
                        <ul className="text-yellow-800 text-sm space-y-1">
                          <li>• Regrese en 48-72 horas para continuar con la evaluación</li>
                          <li>• Mantenga vigilancia de los síntomas durante este tiempo</li>
                          <li>• Acuda inmediatamente si presenta dolor, sangrado abundante o signos de shock</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button onClick={generarInformePDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe
                  </Button>
                  <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white">
                    <User className="h-4 w-4 mr-2" />
                    Nueva Evaluación
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <ProgressBar />
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {seccionActual === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <User className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Nombre del Paciente:</Label>
                        <input
                          type="text"
                          placeholder="Ingrese el nombre del paciente"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Edad del Paciente:</Label>
                        <input
                          type="number"
                          placeholder="Ingrese la edad del paciente"
                          value={edadPaciente}
                          onChange={(e) => setEdadPaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => completarSeccion(1)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {seccionActual === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Signos Vitales</h2>
                    </div>

                    {mostrarAlerta && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Alerta</span>
                        </div>
                        <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Frecuencia Cardíaca (lpm):</Label>
                        <input
                          type="number"
                          placeholder="Ingrese la frecuencia cardíaca"
                          value={frecuenciaCardiaca}
                          onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión Sistólica (mmHg):</Label>
                          <input
                            type="number"
                            placeholder="Ingrese la presión sistólica"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión Diastólica (mmHg):</Label>
                          <input
                            type="number"
                            placeholder="Ingrese la presión diastólica"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Estado de Conciencia:</Label>
                        <select
                          value={estadoConciencia}
                          onChange={(e) => setEstadoConciencia(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione un estado</option>
                          <option value="alerta">Alerta</option>
                          <option value="somnolienta">Somnolienta</option>
                          <option value="estuporosa">Estuporosa</option>
                          <option value="comatosa">Comatosa</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(1)} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarSignosVitales()) completarSeccion(2)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {seccionActual === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó la prueba de embarazo?</Label>
                        <select
                          value={pruebaEmbarazoRealizada}
                          onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccione un resultado</option>
                            <option value="positiva">Positiva</option>
                            <option value="negativa">Negativa</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(2)} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarPruebaEmbarazo()) completarSeccion(3)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Hallazgos en la exploración física:</Label>
                        <textarea
                          placeholder="Ingrese los hallazgos de la exploración física"
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó ecografía transabdominal?</Label>
                        <select
                          value={tieneEcoTransabdominal}
                          onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione una opción</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      {tieneEcoTransabdominal === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado de la ecografía:</Label>
                          <select
                            value={resultadoEcoTransabdominal}
                            onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccione un resultado</option>
                            <option value="saco_embrion_fc">Saco embrionario con FC</option>
                            <option value="saco_vitelino_embrion">Saco vitelino con embrión</option>
                            <option value="saco_vitelino_sin_embrion">Saco vitelino sin embrión</option>
                            <option value="saco_sin_embrion">Saco sin embrión</option>
                            <option value="saco_10mm_decidual_2mm">Saco ≥10mm con anillo decidual ≥2mm</option>
                            <option value="ausencia_saco">Ausencia de saco</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(3)} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarEcoTransabdominal()) completarSeccion(4)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Calculator className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Consultas</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Síntomas:</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sintomas.map((s) => (
                            <label key={s.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sintomasSeleccionados.includes(s.id)}
                                onChange={(e) => {
                                  let ns: string[]
                                  if (e.target.checked) ns = [...sintomasSeleccionados, s.id]
                                  else {
                                    ns = sintomasSeleccionados.filter((x) => x !== s.id)
                                    if (s.id === "dolor_sangrado") ns = ns.filter((x) => x !== "sangrado" && x !== "dolor")
                                    if ((s.id === "sangrado" || s.id === "dolor") && ns.includes("dolor_sangrado")) {
                                      ns = ns.filter((x) => x !== "dolor_sangrado")
                                    }
                                  }
                                  setSintomasSeleccionados(ns)
                                }}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{s.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de Riesgo:</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {factoresRiesgo.map((f) => (
                            <label key={f.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={factoresSeleccionados.includes(f.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setFactoresSeleccionados([...factoresSeleccionados, f.id])
                                  else setFactoresSeleccionados(factoresSeleccionados.filter((x) => x !== f.id))
                                }}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{f.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">TVUS:</Label>
                        <select
                          value={tvus}
                          onChange={(e) => setTvus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione un resultado</option>
                          <option value="normal">Normal</option>
                          <option value="libre">Líquido libre</option>
                          <option value="masa">Masa anexial</option>
                          <option value="masa_libre">Masa anexial + líquido libre</option>
                        </select>
                      </div>

                      {/* β-hCG actual */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG actual (mUI/mL):</Label>
                        <input
                          type="number"
                          placeholder="Ingrese el valor actual de β-hCG"
                          value={hcgValor}
                          onChange={(e) => setHcgValor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {esConsultaSeguimiento && hcgAnterior && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Se calculará automáticamente la variación con el valor actual.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(4)} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                        Anterior
                      </Button>
                      <Button onClick={calcular} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6">
                        Calcular
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
