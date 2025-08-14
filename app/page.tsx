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

// ==================== Supabase (solo para lectura rápida al buscar por ID) ====================
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

// ==================== HELPERS API FRONT ====================
async function enviarDatosAlBackend(datos: any): Promise<boolean> {
  try {
    const payload = {
      id: datos.id,
      usuario_creador: datos.usuarioCreador || null,
      nombre_paciente: datos.nombrePaciente || "N/A",
      edad_paciente: Number.isFinite(+datos.edadPaciente) ? +datos.edadPaciente : null,
      frecuencia_cardiaca: datos.frecuenciaCardiaca ? +datos.frecuenciaCardiaca : null,
      presion_sistolica: datos.presionSistolica ? +datos.presionSistolica : null,
      presion_diastolica: datos.presionDiastolica ? +datos.presionDiastolica : null,
      estado_conciencia: datos.estadoConciencia || null,
      prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada || null,
      resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo || null,
      hallazgos_exploracion: datos.hallazgosExploracion || null,
      tiene_eco_transabdominal: datos.tieneEcoTransabdominal || null,
      resultado_eco_transabdominal: datos.resultadoEcoTransabdominal || null,
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus || null,
      hcg_valor: Number.isFinite(+datos.hcgValor) ? +datos.hcgValor : null,
      variacion_hcg: datos.variacionHcg || null,
      hcg_anterior: Number.isFinite(+datos.hcgAnterior) ? +datos.hcgAnterior : null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
    }
    const res = await crearConsulta(payload)
    if (res?.error) {
      console.error("API /api/consultas error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("Error llamando /api/consultas:", e)
    return false
  }
}

async function actualizarDatosEnBackend(id: string, patch: any): Promise<boolean> {
  try {
    const res = await actualizarConsulta(id, patch) // PATCH /api/consultas/:id
    if (res?.error) {
      console.error("API PATCH /api/consultas error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("Error llamando PATCH /api/consultas:", e)
    return false
  }
}

async function leerDatosDesdeBackend(id: string): Promise<any | null> {
  try {
    const res = await obtenerConsulta(id) // GET /api/consultas/:id
    if (res?.error) return null
    return res?.data ?? null
  } catch (e) {
    console.error("Error llamando GET /api/consultas/:id:", e)
    return null
  }
}

// ==================== CÁLCULO ====================
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) odds *= LR
  return +(odds / (1 + odds)).toFixed(4)
}

// Normalizador para usar SIEMPRE snake_case en estado interno
function normalizarConsulta(d: any) {
  return {
    id: d.id,
    fecha_creacion: d.fechaCreacion ?? d.fecha_creacion ?? null,
    fecha_ultima_actualizacion: d.fechaUltimaActualizacion ?? d.fecha_ultima_actualizacion ?? null,
    usuario_creador: d.usuarioCreador ?? d.usuario_creador ?? null,

    nombre_paciente: d.nombrePaciente ?? d.nombre_paciente ?? null,
    edad_paciente: d.edadPaciente ?? d.edad_paciente ?? null,

    frecuencia_cardiaca: d.frecuenciaCardiaca ?? d.frecuencia_cardiaca ?? null,
    presion_sistolica: d.presionSistolica ?? d.presion_sistolica ?? null,
    presion_diastolica: d.presionDiastolica ?? d.presion_diastolica ?? null,
    estado_conciencia: d.estadoConciencia ?? d.estado_conciencia ?? null,

    prueba_embarazo_realizada: d.pruebaEmbarazoRealizada ?? d.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: d.resultadoPruebaEmbarazo ?? d.resultado_prueba_embarazo ?? null,

    hallazgos_exploracion: d.hallazgosExploracion ?? d.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: d.tieneEcoTransabdominal ?? d.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: d.resultadoEcoTransabdominal ?? d.resultado_eco_transabdominal ?? null,

    sintomas_seleccionados: d.sintomasSeleccionados ?? d.sintomas_seleccionados ?? [],
    factores_seleccionados: d.factoresSeleccionados ?? d.factores_seleccionados ?? [],

    tvus: d.tvus ?? null,
    hcg_valor: d.hcgValor ?? d.hcg_valor ?? null,
    variacion_hcg: d.variacionHcg ?? d.variacion_hcg ?? null,
    hcg_anterior: d.hcgAnterior ?? d.hcg_anterior ?? null,

    resultado: d.resultado ?? null,

    // posibles campos de seguimiento ya existentes
    tvus_2: d.tvus_2 ?? null,
    hcg_valor_2: d.hcg_valor_2 ?? null,
    variacion_hcg_2: d.variacion_hcg_2 ?? null,
    resultado_2: d.resultado_2 ?? null,
    fecha_consulta_2: d.fecha_consulta_2 ?? null,
    usuario_consulta_2: d.usuario_consulta_2 ?? null,

    tvus_3: d.tvus_3 ?? null,
    hcg_valor_3: d.hcg_valor_3 ?? null,
    variacion_hcg_3: d.variacion_hcg_3 ?? null,
    resultado_3: d.resultado_3 ?? null,
    fecha_consulta_3: d.fecha_consulta_3 ?? null,
    usuario_consulta_3: d.usuario_consulta_3 ?? null,
  }
}

// ==================== TABLAS (Bayes) ====================
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
const tvusMap = { normal: 0.07, libre: 2.4, masa: 38, masa_libre: 47 }
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

// ==================== UI LISTAS ====================
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

// ==================== GENERAR ID ====================
function generarIdConsulta(): string {
  const idsExistentes: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("ectopico_ID-")) {
      const idCompleto = key.replace("ectopico_", "")
      const numeroId = Number.parseInt(idCompleto.replace("ID-", ""))
      if (!isNaN(numeroId)) idsExistentes.push(numeroId)
    }
  }
  const siguiente = idsExistentes.length > 0 ? Math.max(...idsExistentes) + 1 : 1
  return `ID-${siguiente.toString().padStart(5, "0")}`
}

// ==================== COMPONENTE ====================
export default function CalculadoraEctopico() {
  // Buscador
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

  // Estados clínicos
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

  // Seguimiento
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [numeroConsultaActual, setNumeroConsultaActual] = useState(1)

  // UI navegación
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // Consulta (algoritmo)
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  // ---------- Buscar consulta ----------
  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    // 1) Intenta LocalStorage
    let encontrada: any = null
    const datosLocal = localStorage.getItem(`ectopico_${id}`)
    if (datosLocal) {
      try {
        encontrada = normalizarConsulta(JSON.parse(datosLocal))
      } catch (e) {
        console.warn("Error parseando localStorage:", e)
      }
    }

    // 2) Si no, DB
    if (!encontrada) {
      try {
        const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()
        if (error) console.error("Supabase error:", error)
        if (data) {
          encontrada = normalizarConsulta(data)
          localStorage.setItem(`ectopico_${id}`, JSON.stringify(encontrada))
        }
      } catch (e) {
        console.error("Error DB:", e)
      }
    }

    if (encontrada) {
      setConsultaCargada(encontrada)
      setMostrarResumenConsulta(true)
      setModoCargarConsulta(false)
    } else {
      alert("No se encontró ninguna consulta con ese ID")
    }
  }

  // ---------- Utilidades de UI ----------
  const obtenerNombreSintoma = (id: string) => sintomas.find((s) => s.id === id)?.label ?? id
  const obtenerNombreFactorRiesgo = (id: string) => factoresRiesgo.find((f) => f.id === id)?.label ?? id
  const obtenerNombreTVUS = (id: string) => {
    if (!id) return "No especificado"
    switch (id) {
      case "normal": return "Normal"
      case "libre": return "Líquido libre"
      case "masa": return "Masa anexial"
      case "masa_libre": return "Masa anexial + líquido libre"
      default: return id
    }
  }

  // ---------- Navegación ----------
  const completarSeccion = (n: number) => {
    if (!seccionesCompletadas.includes(n)) setSeccionesCompletadas((p) => [...p, n])
    setSeccionActual(n + 1)
  }

  // ---------- Validaciones con mensajes (sin persistir aquí para no duplicar filas) ----------
  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sist = Number.parseFloat(presionSistolica)
    const dias = Number.parseFloat(presionDiastolica)
    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (sist >= 180 || dias >= 110) {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Crisis hipertensiva (PA ≥ 180/110 mmHg). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 100 && (sist <= 90 || dias <= 60)) {
      setMensajeFinal("🚨 EMERGENCIA MÉDICA: Taquicardia con hipotensión. Traslado inmediato.")
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
    if (sist < 90 || dias < 60) alerta = "Hipotensión arterial. Evaluación inmediata."
    else if (sist >= 140 || dias >= 90) alerta = "Hipertensión arterial. Requiere evaluación y seguimiento."
    else if (fc > 100) alerta = "Taquicardia. Monitoreo requerido."
    else if (fc < 60) alerta = "Bradicardia. Evaluación recomendada."

    if (alerta) {
      setMostrarAlerta(true)
      setMensajeAlerta(alerta)
    }
    return true
  }

  const validarPruebaEmbarazo = () => {
    if (pruebaEmbarazoRealizada === "no") {
      setMensajeFinal("Se necesita realizar prueba de embarazo antes de continuar.")
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
      setMensajeFinal("Evidencia de embarazo intrauterino. Ectópico descartado.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  // ---------- Reset ----------
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
    setNumeroConsultaActual(1)
  }

  const copiarId = () => {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado al portapapeles")
    }
  }

  // ---------- Flujos ----------
  const iniciarNuevaEvaluacion = async () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1) // Consulta 1
  }

  const continuarConsultaCargada = async () => {
    // ID base
    setIdSeguimiento(consultaCargada.id)

    // Precarga general (sin TVUS)
    setNombrePaciente(consultaCargada.nombre_paciente || "")
    setEdadPaciente(consultaCargada.edad_paciente?.toString() || "")
    setFrecuenciaCardiaca(consultaCargada.frecuencia_cardiaca?.toString() || "")
    setPresionSistolica(consultaCargada.presion_sistolica?.toString() || "")
    setPresionDiastolica(consultaCargada.presion_diastolica?.toString() || "")
    setEstadoConciencia(consultaCargada.estado_conciencia || "")
    setPruebaEmbarazoRealizada(consultaCargada.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(consultaCargada.resultado_prueba_embarazo || "")
    setHallazgosExploracion(consultaCargada.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(consultaCargada.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(consultaCargada.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(consultaCargada.sintomas_seleccionados || [])
    setFactoresSeleccionados(consultaCargada.factores_seleccionados || [])

    // *** NO preseleccionar TVUS en seguimiento ***
    setTvus("")

    // β-hCG anterior desde la última consulta guardada
    setHcgAnterior(consultaCargada.hcg_valor?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    // Definir si será C2 o C3
    const yaTieneC2 =
      consultaCargada.hcg_valor_2 != null ||
      consultaCargada.resultado_2 != null ||
      (consultaCargada.tvus_2 ?? "") !== ""

    setNumeroConsultaActual(yaTieneC2 ? 3 : 2)

    // Navegar
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  // ---------- UI Handlers ----------
  const handleSintomaChange = (id: string, checked: boolean) => {
    if (checked) setSintomasSeleccionados((p) => [...p, id])
    else {
      let nx = sintomasSeleccionados.filter((x) => x !== id)
      if (id === "dolor_sangrado") nx = nx.filter((x) => x !== "sangrado" && x !== "dolor")
      if ((id === "sangrado" || id === "dolor") && sintomasSeleccionados.includes("dolor_sangrado")) {
        nx = nx.filter((x) => x !== "dolor_sangrado")
      }
      setSintomasSeleccionados(nx)
    }
  }
  const handleFactorChange = (id: string, checked: boolean) => {
    if (checked) setFactoresSeleccionados((p) => [...p, id])
    else setFactoresSeleccionados((p) => p.filter((x) => x !== id))
  }

  // ---------- Calcular y persistir ----------
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Por favor complete síntomas, TVUS y β-hCG")
      return
    }

    // Pre-test
    const tieneFactores = factoresSeleccionados.length > 0
    const sintomasCalc = sintomasSeleccionados.filter((s) => s !== "sincope")

    let clave: keyof typeof probabilidadesSinFactores = "asintomatica"
    if (sintomasCalc.includes("dolor_sangrado") || (sintomasCalc.includes("sangrado") && sintomasCalc.includes("dolor")))
      clave = "dolor_sangrado"
    else if (sintomasCalc.includes("sangrado")) clave = "sangrado"
    else if (sintomasCalc.includes("dolor")) clave = "dolor"

    const tablaProb = tieneFactores ? probabilidadesConFactores : probabilidadesSinFactores
    const probPre = tablaProb[clave]

    // LRs
    const lrs: number[] = []
    const lrTvus = tvusMap[tvus as keyof typeof tvusMap]
    if (lrTvus) lrs.push(lrTvus)

    const hcgN = Number.parseFloat(hcgValor)
    const nivel: "alto" | "bajo" = hcgN >= 2000 ? "alto" : "bajo"
    const lrHcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivel]
    if (lrHcg) lrs.push(lrHcg)

    let variacionCalculada: keyof typeof variacionHcgMap = "no_disponible"
    if (hcgAnterior && hcgValor) {
      const prev = Number.parseFloat(hcgAnterior)
      const now = Number.parseFloat(hcgValor)
      if (now > prev) variacionCalculada = "aumento"
      else {
        const red = ((prev - now) / prev) * 100
        if (red >= 50) variacionCalculada = "reduccion_mayor_50"
        else if (red >= 35) variacionCalculada = "reduccion_35_50"
        else if (red >= 1) variacionCalculada = "reduccion_1_35"
        else variacionCalculada = "aumento"
      }
      const lrVar = variacionHcgMap[variacionCalculada]
      if (lrVar) lrs.push(lrVar)
    }

    // Bayes
    const probPost = calcularProbabilidad(probPre, lrs)
    setResultado(probPost)

    // Persistencia
    const fechaIso = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: fechaIso,
      fechaUltimaActualizacion: fechaIso,
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
      hcgValor: Number.isFinite(hcgN) ? hcgN : null,
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
      resultado: probPost,
    }

    // espejo local
    const prevLocal = localStorage.getItem(`ectopico_${idSeguimiento}`)
    let localObj: any = prevLocal ? JSON.parse(prevLocal) : {}
    localObj = { ...localObj, ...datosCompletos }
    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(localObj))

    try {
      if (numeroConsultaActual === 1) {
        const ok = await enviarDatosAlBackend(datosCompletos) // POST
        if (!ok) alert("Guardado local OK. FALLO al crear en base de datos.")
      } else {
        // PATCH con consulta_num => backend mapea *_2 / *_3
        const patch: any = {
          consulta_num: numeroConsultaActual,
          tvus,
          hcg_valor: hcgN,
          variacion_hcg: variacionCalculada,
          resultado: probPost,
          ...(numeroConsultaActual === 2
            ? { usuario_consulta_2: usuarioActual, fecha_consulta_2: fechaIso }
            : { usuario_consulta_3: usuarioActual, fecha_consulta_3: fechaIso }),
        }
        const ok = await actualizarDatosEnBackend(idSeguimiento, patch)
        if (!ok) alert("Guardado local OK. FALLO al actualizar en base de datos (Consulta 2/3).")
        else {
          if (numeroConsultaActual === 2) {
            localObj.tvus_2 = tvus
            localObj.hcg_valor_2 = hcgN
            localObj.variacion_hcg_2 = variacionCalculada
            localObj.resultado_2 = probPost
            localObj.fecha_consulta_2 = fechaIso
            localObj.usuario_consulta_2 = usuarioActual
          } else {
            localObj.tvus_3 = tvus
            localObj.hcg_valor_3 = hcgN
            localObj.variacion_hcg_3 = variacionCalculada
            localObj.resultado_3 = probPost
            localObj.fecha_consulta_3 = fechaIso
            localObj.usuario_consulta_3 = usuarioActual
          }
          localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(localObj))
        }
      }
    } catch (e) {
      console.error("Error de sincronización:", e)
      alert("Guardado local OK. FALLO de sincronización con base de datos.")
    }

    // UI final
    if (probPost >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Proceder con tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%). Alta confianza en exclusión del diagnóstico.")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  const volverAInicio = () => resetCalculadora()

  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de
        Evaluación Diagnóstica Avanzada
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

  // ==================== LOGIN ====================
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
                <p className="text-amber-800 text-xs">Este sistema está destinado exclusivamente para uso de profesionales médicos autorizados.</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setErrorLogin("")
                  if (intentosLogin >= 5) {
                    setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
                    return
                  }
                  const u = USUARIOS_AUTORIZADOS.find(
                    (x) => x.usuario.toLowerCase() === usuario.toLowerCase() && x.contraseña === contraseña,
                  )
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
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario</Label>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={intentosLogin >= 5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Contraseña</Label>
                  <div className="relative">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      placeholder="Contraseña"
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

  // ==================== APP ====================
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
                  {numeroConsultaActual ? (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Consulta {numeroConsultaActual}</span>
                  ) : null}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={copiarId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-blue-100">Sesión activa:</p>
                <p className="font-semibold">{nombreUsuario}</p>
              </div>
              <Button
                onClick={() => {
                  setEstaAutenticado(false)
                  setUsuarioActual("")
                  setNombreUsuario("")
                  setUsuario("")
                  setContraseña("")
                  setErrorLogin("")
                  setIntentosLogin(0)
                  resetCalculadora()
                }}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
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
                    Las consultas de seguimiento deben realizarse entre 48-72 horas después de la consulta inicial. Ingrese el ID de seguimiento que recibió.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de Seguimiento</Label>
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
                    <Button onClick={buscarConsulta} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-6">
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
        // ---------- Resumen (vista que te gustó) ----------
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
                      <p><strong>ID:</strong> {consultaCargada.id}</p>
                      <p><strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}</p>
                      <p><strong>Edad:</strong> {consultaCargada.edad_paciente || "No especificado"} años</p>
                      <p><strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor || "No especificado"} mUI/mL</p>
                    </div>
                    <div>
                      <p><strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}</p>
                      <p><strong>Resultado anterior:</strong> {consultaCargada.resultado ? `${(consultaCargada.resultado * 100).toFixed(1)}%` : "No calculado"}</p>
                      <p><strong>Fecha:</strong> {consultaCargada.fecha_creacion ? new Date(consultaCargada.fecha_creacion).toLocaleDateString() : "No disponible"}</p>
                      <p><strong>Frecuencia Cardíaca:</strong> {consultaCargada.frecuencia_cardiaca || "No especificado"} lpm</p>
                    </div>
                  </div>

                  {consultaCargada.sintomas_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Síntomas:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.sintomas_seleccionados.map((s: string) => (
                          <li key={s}>{obtenerNombreSintoma(s)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {consultaCargada.factores_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Factores de Riesgo:</strong></p>
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
                    Al continuar, se cargará información básica y podrás volver a capturar TVUS y β-hCG actual para calcular de nuevo.
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
        // ---------- Finalizado ----------
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
                  <Button
                    onClick={() => {
                      try {
                        const contenido = `
INFORME MÉDICO - EVALUACIÓN DE EMBARAZO ECTÓPICO
================================================

ID de Consulta: ${idSeguimiento}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

DATOS DEL PACIENTE:
- Nombre: ${nombrePaciente || "N/A"}
- Edad: ${edadPaciente || "N/A"} años

SIGNOS VITALES:
- Frecuencia Cardíaca: ${frecuenciaCardiaca || "N/A"} lpm
- Presión Arterial: ${presionSistolica || "N/A"}/${presionDiastolica || "N/A"} mmHg
- Estado de Conciencia: ${estadoConciencia || "N/A"}

ESTUDIOS COMPLEMENTARIOS:
- Ecografía Transvaginal: ${obtenerNombreTVUS(tvus)}
- β-hCG: ${hcgValor || "N/A"} mUI/mL
${hcgAnterior ? `- β-hCG Anterior: ${hcgAnterior} mUI/mL` : ""}

SÍNTOMAS:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n")}

FACTORES DE RIESGO:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactorRiesgo(f)}`).join("\n")}

RESULTADO:
${resultado !== null ? `Probabilidad de Embarazo Ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

CONCLUSIÓN:
${mensajeFinal || "N/A"}
`
                        const a = document.createElement("a")
                        const archivo = new Blob([contenido], { type: "text/plain" })
                        a.href = URL.createObjectURL(archivo)
                        a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        alert("Informe generado y descargado exitosamente")
                      } catch (e) {
                        console.error("Error informe:", e)
                        alert("Error al generar el informe.")
                      }
                    }}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe
                  </Button>
                  <Button onClick={volverAInicio} className="bg-green-600 hover:bg-green-700 text-white">
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
        // ---------- Resultado intermedio + seguimiento ----------
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
                          <li>• Acuda de inmediato si hay empeoramiento del dolor, sangrado abundante o síntomas de choque</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    onClick={() => {
                      try {
                        const contenido = `
INFORME MÉDICO - EVALUACIÓN DE EMBARAZO ECTÓPICO
================================================

ID de Consulta: ${idSeguimiento}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

DATOS DEL PACIENTE:
- Nombre: ${nombrePaciente || "N/A"}
- Edad: ${edadPaciente || "N/A"} años

SIGNOS VITALES:
- Frecuencia Cardíaca: ${frecuenciaCardiaca || "N/A"} lpm
- Presión Arterial: ${presionSistolica || "N/A"}/${presionDiastolica || "N/A"} mmHg
- Estado de Conciencia: ${estadoConciencia || "N/A"}

ESTUDIOS COMPLEMENTARIOS:
- Ecografía Transvaginal: ${obtenerNombreTVUS(tvus)}
- β-hCG: ${hcgValor || "N/A"} mUI/mL
${hcgAnterior ? `- β-hCG Anterior: ${hcgAnterior} mUI/mL` : ""}

SÍNTOMAS:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n")}

FACTORES DE RIESGO:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactorRiesgo(f)}`).join("\n")}

RESULTADO:
${resultado !== null ? `Probabilidad de Embarazo Ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

`
                        const a = document.createElement("a")
                        const archivo = new Blob([contenido], { type: "text/plain" })
                        a.href = URL.createObjectURL(archivo)
                        a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        alert("Informe generado y descargado exitosamente")
                      } catch (e) {
                        console.error("Error informe:", e)
                        alert("Error al generar el informe.")
                      }
                    }}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe
                  </Button>
                  <Button onClick={volverAInicio} className="bg-green-600 hover:bg-green-700 text-white">
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
        // ---------- Formularios ----------
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
                        <Label className="text-base font-medium text-slate-700">Nombre del Paciente</Label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Edad del Paciente</Label>
                        <input
                          type="number"
                          placeholder="Edad en años"
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
                        <Label className="text-base font-medium text-slate-700">Frecuencia Cardíaca (lpm)</Label>
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
                          <Label className="text-base font-medium text-slate-700">Presión Sistólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Sistólica"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión Diastólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Diastólica"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Estado de Conciencia</Label>
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
                          <Label className="text-base font-medium text-slate-700">Resultado de la prueba</Label>
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
                        <Label className="text-base font-medium text-slate-700">Hallazgos de la exploración</Label>
                        <textarea
                          placeholder="Describa los hallazgos clínicos relevantes"
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
                          <Label className="text-base font-medium text-slate-700">Resultado de ecografía transabdominal</Label>
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
                        <Label className="text-base font-medium text-slate-700">Síntomas</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sintomas.map((s) => (
                            <label key={s.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sintomasSeleccionados.includes(s.id)}
                                onChange={(e) => handleSintomaChange(s.id, e.target.checked)}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{s.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de Riesgo</Label>
                        <p className="text-xs text-slate-500">Seleccione los factores de riesgo presentes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {factoresRiesgo.map((f) => (
                            <label key={f.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={factoresSeleccionados.includes(f.id)}
                                onChange={(e) => handleFactorChange(f.id, e.target.checked)}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{f.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Resultado de TVUS</Label>
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

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG actual (mUI/mL)</Label>
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
