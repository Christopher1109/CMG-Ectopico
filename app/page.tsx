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
import React, { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ==================== SUPABASE ====================
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

// ==================== HELPERS (normalizar / ids / storage) ====================
function esNumero(v: any): boolean {
  if (typeof v === "number") return Number.isFinite(v)
  const n = Number(v)
  return Number.isFinite(n)
}

// Convierte cualquier objeto (camelCase o snake_case) a un objeto CONSISTENTE en snake_case
function normalizarConsulta(d: any) {
  return {
    id: d.id,
    fecha_creacion: d.fecha_creacion ?? d.fechaCreacion ?? null,
    fecha_ultima_actualizacion: d.fecha_ultima_actualizacion ?? d.fechaUltimaActualizacion ?? null,
    usuario_creador: d.usuario_creador ?? d.usuarioCreador ?? null,

    nombre_paciente: d.nombre_paciente ?? d.nombrePaciente ?? null,
    edad_paciente: esNumero(d.edad_paciente ?? d.edadPaciente) ? Number(d.edad_paciente ?? d.edadPaciente) : null,

    frecuencia_cardiaca: esNumero(d.frecuencia_cardiaca ?? d.frecuenciaCardiaca)
      ? Number(d.frecuencia_cardiaca ?? d.frecuenciaCardiaca)
      : null,
    presion_sistolica: esNumero(d.presion_sistolica ?? d.presionSistolica)
      ? Number(d.presion_sistolica ?? d.presionSistolica)
      : null,
    presion_diastolica: esNumero(d.presion_diastolica ?? d.presionDiastolica)
      ? Number(d.presion_diastolica ?? d.presionDiastolica)
      : null,
    estado_conciencia: d.estado_conciencia ?? d.estadoConciencia ?? null,

    prueba_embarazo_realizada: d.prueba_embarazo_realizada ?? d.pruebaEmbarazoRealizada ?? null,
    resultado_prueba_embarazo: d.resultado_prueba_embarazo ?? d.resultadoPruebaEmbarazo ?? null,

    hallazgos_exploracion: d.hallazgos_exploracion ?? d.hallazgosExploracion ?? null,
    tiene_eco_transabdominal: d.tiene_eco_transabdominal ?? d.tieneEcoTransabdominal ?? null,
    resultado_eco_transabdominal: d.resultado_eco_transabdominal ?? d.resultadoEcoTransabdominal ?? null,

    sintomas_seleccionados: d.sintomas_seleccionados ?? d.sintomasSeleccionados ?? [],
    factores_seleccionados: d.factores_seleccionados ?? d.factoresSeleccionados ?? [],

    tvus: d.tvus ?? null,
    hcg_valor: esNumero(d.hcg_valor ?? d.hcgValor) ? Number(d.hcg_valor ?? d.hcgValor) : null,
    variacion_hcg: d.variacion_hcg ?? d.variacionHcg ?? null,
    hcg_anterior: esNumero(d.hcg_anterior ?? d.hcgAnterior) ? Number(d.hcg_anterior ?? d.hcgAnterior) : null,

    resultado: esNumero(d.resultado) ? Number(d.resultado) : null,

    // Si ya viene con historial, respétalo
    historial: Array.isArray(d.historial) ? d.historial : undefined,
    numero_consulta: esNumero(d.numero_consulta) ? Number(d.numero_consulta) : undefined,
  }
}

// ID secuencial estilo ID-00001
function generarIdConsulta(): string {
  const ids: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("ectopico_ID-")) {
      const idCompleto = key.replace("ectopico_", "")
      const num = Number.parseInt(idCompleto.replace("ID-", ""))
      if (!Number.isNaN(num)) ids.push(num)
    }
  }
  const siguiente = ids.length ? Math.max(...ids) + 1 : 1
  return `ID-${String(siguiente).padStart(5, "0")}`
}

function cargarLocal(id: string): any | null {
  const raw = localStorage.getItem(`ectopico_${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function guardarLocal(id: string, obj: any) {
  localStorage.setItem(`ectopico_${id}`, JSON.stringify(obj))
}

// ==================== API ====================
// POST -> crear. Si falla por duplicado, devolver false
async function enviarDatosAlBackend(datos: any): Promise<boolean> {
  try {
    const payload = {
      id: datos.id,
      usuario_creador: datos.usuarioCreador ?? null,
      nombre_paciente: datos.nombrePaciente ?? null,
      edad_paciente: esNumero(datos.edadPaciente) ? Number(datos.edadPaciente) : null,
      frecuencia_cardiaca: esNumero(datos.frecuenciaCardiaca) ? Number(datos.frecuenciaCardiaca) : null,
      presion_sistolica: esNumero(datos.presionSistolica) ? Number(datos.presionSistolica) : null,
      presion_diastolica: esNumero(datos.presionDiastolica) ? Number(datos.presionDiastolica) : null,
      estado_conciencia: datos.estadoConciencia ?? null,
      prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada ?? null,
      resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo ?? null,
      hallazgos_exploracion: datos.hallazgosExploracion ?? null,
      tiene_eco_transabdominal: datos.tieneEcoTransabdominal ?? null,
      resultado_eco_transabdominal: datos.resultadoEcoTransabdominal ?? null,
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus ?? null,
      hcg_valor: esNumero(datos.hcgValor) ? Number(datos.hcgValor) : null,
      variacion_hcg: datos.variacionHcg ?? null,
      hcg_anterior: esNumero(datos.hcgAnterior) ? Number(datos.hcgAnterior) : null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
    }
    const res = await crearConsulta(payload)
    if (res?.error) {
      console.error("API /api/consultas (POST) error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("POST /api/consultas exception:", e)
    return false
  }
}

// PATCH -> actualizar
async function actualizarDatosEnBackend(id: string, datos: any): Promise<boolean> {
  try {
    const patch = {
      nombre_paciente: datos.nombrePaciente ?? null,
      edad_paciente: esNumero(datos.edadPaciente) ? Number(datos.edadPaciente) : null,
      frecuencia_cardiaca: esNumero(datos.frecuenciaCardiaca) ? Number(datos.frecuenciaCardiaca) : null,
      presion_sistolica: esNumero(datos.presionSistolica) ? Number(datos.presionSistolica) : null,
      presion_diastolica: esNumero(datos.presionDiastolica) ? Number(datos.presionDiastolica) : null,
      estado_conciencia: datos.estadoConciencia ?? null,
      prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada ?? null,
      resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo ?? null,
      hallazgos_exploracion: datos.hallazgosExploracion ?? null,
      tiene_eco_transabdominal: datos.tieneEcoTransabdominal ?? null,
      resultado_eco_transabdominal: datos.resultadoEcoTransabdominal ?? null,
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus ?? null,
      hcg_valor: esNumero(datos.hcgValor) ? Number(datos.hcgValor) : null,
      variacion_hcg: datos.variacionHcg ?? null,
      hcg_anterior: esNumero(datos.hcgAnterior) ? Number(datos.hcgAnterior) : null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
    }
    const res = await actualizarConsulta(id, patch)
    if (res?.error) {
      console.error("API /api/consultas (PATCH) error:", res.error)
      return false
    }
    return true
  } catch (e) {
    console.error("PATCH /api/consultas exception:", e)
    return false
  }
}

async function leerDatosDesdeBackend(id: string): Promise<any | null> {
  try {
    const res = await obtenerConsulta(id) // GET /api/consultas/:id
    if (res?.error) return null
    return res?.data ?? null
  } catch (e) {
    console.error("GET /api/consultas/:id exception:", e)
    return null
  }
}

// Sincroniza con BD según sea nuevo (POST) o seguimiento (PATCH)
async function sincronizarDatos(id: string, datos: any, esNuevo: boolean): Promise<boolean> {
  guardarLocal(id, datos)
  if (esNuevo) {
    const ok = await enviarDatosAlBackend(datos)
    return ok
  } else {
    const ok = await actualizarDatosEnBackend(id, datos)
    return ok
  }
}

// ==================== CÁLCULOS ====================
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) odds *= LR
  return +(odds / (1 + odds)).toFixed(4)
}

// ==================== COMPONENTE ====================
export default function CalculadoraEctopico() {
  // --- estados de búsqueda / modo ---
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

  // --- login ---
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

  // --- estados clínicos ---
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

  const [resultado, setResultado] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mensajeFinal, setMensajeFinal] = useState("")
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // seguimiento / id / historial
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [esNuevoRegistro, setEsNuevoRegistro] = useState(false) // <- CLAVE para POST/PATCH
  const [numeroConsultaActual, setNumeroConsultaActual] = useState(1)
  const [historial, setHistorial] = useState<any[]>([]) // solo local

  // secciones UI
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // síntomas / factores / tvus / hcg
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  // ---- datos algoritmo (mismos que ya tenías) ----
  const probabilidadesSinFactores = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 }
  const probabilidadesConFactores = { asintomatica: 0.05, sangrado: 0.08, dolor: 0.4, dolor_sangrado: 0.46 }
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

  // ==================== BÚSQUEDA POR ID ====================
  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    // 1) intento local
    let local = cargarLocal(id)

    // 2) si no hay local, voy a BD y normalizo
    if (!local) {
      const bd = await leerDatosDesdeBackend(id)
      if (bd) {
        const n = normalizarConsulta(bd)
        // Genero historial de una sola consulta (consulta 1) con lo que vino de BD
        const c1 = {
          numero: 1,
          fecha: n.fecha_creacion ?? new Date().toISOString(),
          tvus: n.tvus ?? "",
          hcg_valor: n.hcg_valor ?? null,
          variacion_hcg: n.variacion_hcg ?? null,
          resultado: n.resultado ?? null,
          sintomas: n.sintomas_seleccionados ?? [],
          factores: n.factores_seleccionados ?? [],
        }
        local = { ...n, historial: [c1], numero_consulta: 1 }
        guardarLocal(id, local)
      }
    }

    if (!local) {
      alert("No se encontró ninguna consulta con ese ID")
      return
    }

    // ahora tengo local listo y normalizado
    setConsultaCargada(local)
    setHistorial(Array.isArray(local.historial) ? local.historial : [])
    setMostrarResumenConsulta(true)
    setModoCargarConsulta(false)
  }

  // ==================== INICIO / CONTINUAR ====================
  const iniciarNuevaEvaluacion = () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setNumeroConsultaActual(1)
    setHistorial([])
    setEsNuevoRegistro(true) // <- será POST
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  const continuarConsultaCargada = () => {
    // cargo todo desde la última consulta registrada en "historial"
    const h = Array.isArray(consultaCargada?.historial) ? consultaCargada.historial : []
    const ultima = h.length ? h[h.length - 1] : null

    setIdSeguimiento(consultaCargada.id)
    setNombrePaciente(consultaCargada.nombre_paciente || "")
    setEdadPaciente(consultaCargada.edad_paciente ? String(consultaCargada.edad_paciente) : "")

    setFrecuenciaCardiaca(consultaCargada.frecuencia_cardiaca ? String(consultaCargada.frecuencia_cardiaca) : "")
    setPresionSistolica(consultaCargada.presion_sistolica ? String(consultaCargada.presion_sistolica) : "")
    setPresionDiastolica(consultaCargada.presion_diastolica ? String(consultaCargada.presion_diastolica) : "")
    setEstadoConciencia(consultaCargada.estado_conciencia || "")
    setPruebaEmbarazoRealizada(consultaCargada.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(consultaCargada.resultado_prueba_embarazo || "")
    setHallazgosExploracion(consultaCargada.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(consultaCargada.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(consultaCargada.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(consultaCargada.sintomas_seleccionados || [])
    setFactoresSeleccionados(consultaCargada.factores_seleccionados || [])
    setTvus(consultaCargada.tvus || "")

    // β-hCG anterior = hcg de la última consulta
    setHcgAnterior(ultima && esNumero(ultima.hcg_valor) ? String(ultima.hcg_valor) : consultaCargada.hcg_valor ?? "")
    setHcgValor("") // limpiar para ingresar nuevo valor

    setHistorial(h)
    setNumeroConsultaActual(h.length + 1)
    setEsConsultaSeguimiento(true)
    setEsNuevoRegistro(false) // <- será PATCH
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  // ==================== UTILIDADES DE UI ====================
  const obtenerNombreSintoma = (id: string) => sintomas.find((s) => s.id === id)?.label ?? id
  const obtenerNombreFactorRiesgo = (id: string) => factoresRiesgo.find((f) => f.id === id)?.label ?? id
  const obtenerNombreTVUS = (v: string) =>
    v === "normal"
      ? "Normal"
      : v === "libre"
        ? "Líquido libre"
        : v === "masa"
          ? "Masa anexial"
          : v === "masa_libre"
            ? "Masa anexial + líquido libre"
            : "No especificado"

  const completarSeccion = (n: number) => {
    if (!seccionesCompletadas.includes(n)) setSeccionesCompletadas([...seccionesCompletadas, n])
    setSeccionActual(n + 1)
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
    setNumeroConsultaActual(1)
    setHistorial([])
    setEsNuevoRegistro(false)
  }

  const copiarId = () => {
    if (!idSeguimiento) return
    navigator.clipboard.writeText(idSeguimiento)
    alert("ID copiado al portapapeles")
  }

  // ==================== VALIDACIONES BÁSICAS ====================
  const validarSignosVitales = () => {
    const fc = Number(frecuenciaCardiaca)
    const sis = Number(presionSistolica)
    const dia = Number(presionDiastolica)

    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (sis >= 180 || dia >= 110) {
      setMensajeFinal("🚨 EMERGENCIA: Crisis hipertensiva (≥180/110). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 100 && (sis <= 90 || dia <= 60)) {
      setMensajeFinal("🚨 EMERGENCIA: Taquicardia + hipotensión. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 120) {
      setMensajeFinal("🚨 EMERGENCIA: Taquicardia severa. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc < 50) {
      setMensajeFinal("🚨 EMERGENCIA: Bradicardia severa. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal("🚨 EMERGENCIA: Alteración severa de conciencia. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }

    let alerta = ""
    if (sis < 90 || dia < 60) alerta = "Hipotensión detectada. Evaluar de inmediato."
    else if (sis >= 140 || dia >= 90) alerta = "Hipertensión detectada. Requiere seguimiento."
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
      setMensajeFinal("Realice prueba de embarazo cualitativa antes de continuar.")
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
    const conf = ["saco_embrion_fc", "saco_vitelino_embrion", "saco_vitelino_sin_embrion", "saco_sin_embrion", "saco_10mm_decidual_2mm"]
    if (tieneEcoTransabdominal === "si" && conf.includes(resultadoEcoTransabdominal)) {
      setMensajeFinal("Evidencia de embarazo intrauterino. Ectópico descartado.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  // ==================== CALCULAR ====================
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Complete síntomas, TVUS y β-hCG")
      return
    }

    // prob pre-test
    const tieneFactores = factoresSeleccionados.length > 0
    const sincopeFiltrado = sintomasSeleccionados.filter((s) => s !== "sincope")
    let clave: "asintomatica" | "sangrado" | "dolor" | "dolor_sangrado" = "asintomatica"
    if (sincopeFiltrado.includes("dolor_sangrado")) clave = "dolor_sangrado"
    else if (sincopeFiltrado.includes("sangrado") && sincopeFiltrado.includes("dolor")) clave = "dolor_sangrado"
    else if (sincopeFiltrado.includes("sangrado")) clave = "sangrado"
    else if (sincopeFiltrado.includes("dolor")) clave = "dolor"
    const tabla = tieneFactores ? probabilidadesConFactores : probabilidadesSinFactores
    const probPre = tabla[clave]

    // LRs
    const lrs: number[] = []
    const lrTvus = tvusMap[tvus as keyof typeof tvusMap]
    if (lrTvus) lrs.push(lrTvus)

    const hNum = Number(hcgValor)
    const nivel = hNum >= 2000 ? "alto" : "bajo"
    const lrHcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivel as "alto" | "bajo"]
    if (lrHcg) lrs.push(lrHcg)

    let variacionCalculada = "no_disponible"
    if (hcgAnterior && hcgValor) {
      const ant = Number(hcgAnterior)
      const act = Number(hcgValor)
      if (act > ant) variacionCalculada = "aumento"
      else {
        const red = ((ant - act) / ant) * 100
        if (red >= 50) variacionCalculada = "reduccion_mayor_50"
        else if (red >= 35) variacionCalculada = "reduccion_35_50"
        else if (red >= 1) variacionCalculada = "reduccion_1_35"
        else variacionCalculada = "aumento"
      }
      const lrVar = variacionHcgMap[variacionCalculada as keyof typeof variacionHcgMap]
      if (lrVar) lrs.push(lrVar)
    }
    setVariacionHcg(variacionCalculada)

    const probPost = calcularProbabilidad(probPre, lrs)
    setResultado(probPost)

    // ======= GUARDADO =======
    const fechaIso = new Date().toISOString()

    // Entrada de historial local
    const entrada = {
      numero: numeroConsultaActual,
      fecha: fechaIso,
      tvus,
      hcg_valor: Number(hcgValor),
      variacion_hcg: variacionCalculada,
      resultado: probPost,
      sintomas: [...sintomasSeleccionados],
      factores: [...factoresSeleccionados],
    }
    const nuevoHistorial = [...historial, entrada]
    setHistorial(nuevoHistorial)

    // snapshot (camel) para API + local
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: consultaCargada?.fecha_creacion ?? fechaIso,
      fechaUltimaActualizacion: fechaIso,
      usuarioCreador: usuarioActual,

      nombrePaciente,
      edadPaciente: esNumero(edadPaciente) ? Number(edadPaciente) : null,
      frecuenciaCardiaca: esNumero(frecuenciaCardiaca) ? Number(frecuenciaCardiaca) : null,
      presionSistolica: esNumero(presionSistolica) ? Number(presionSistolica) : null,
      presionDiastolica: esNumero(presionDiastolica) ? Number(presionDiastolica) : null,
      estadoConciencia,

      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,

      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,

      sintomasSeleccionados: [...sintomasSeleccionados],
      factoresSeleccionados: [...factoresSeleccionados],

      tvus,
      hcgValor: Number(hcgValor),
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? Number(hcgAnterior) : null,
      resultado: probPost,

      // meta local
      numero_consulta: numeroConsultaActual,
      historial: nuevoHistorial,
    }

    const ok = await sincronizarDatos(idSeguimiento, datosCompletos, esNuevoRegistro)
    if (!ok) {
      alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")
    } else {
      // a partir de aquí, ya es seguimiento (PATCH en próximas veces)
      setEsNuevoRegistro(false)
    }

    // ======= RESULTADO UI =======
    if (probPost >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (≥95%). Tratamiento inmediato.")
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal("Ectópico descartado (<1%).")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  // ==================== PDF (texto) ====================
  const generarInformePDF = () => {
    try {
      const contenido = `
INFORME MÉDICO - EVALUACIÓN DE EMBARAZO ECTÓPICO
================================================

ID: ${idSeguimiento}
Consulta: #${numeroConsultaActual}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

PACIENTE:
- Nombre: ${nombrePaciente || "N/A"}
- Edad: ${edadPaciente || "N/A"} años

SIGNOS VITALES:
- FC: ${frecuenciaCardiaca || "N/A"} lpm
- PA: ${presionSistolica || "N/A"}/${presionDiastolica || "N/A"} mmHg
- Conciencia: ${estadoConciencia || "N/A"}

ESTUDIOS:
- TVUS: ${obtenerNombreTVUS(tvus)}
- β-hCG actual: ${hcgValor || "N/A"} mUI/mL
${hcgAnterior ? `- β-hCG anterior: ${hcgAnterior} mUI/mL` : ""}

SÍNTOMAS:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n") || "- N/A"}

FACTORES DE RIESGO:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactorRiesgo(f)}`).join("\n") || "- N/A"}

RESULTADO:
${resultado !== null ? `Probabilidad de ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

CONCLUSIÓN:
${mensajeFinal || "Seguimiento según protocolo clínico."}
`
      const a = document.createElement("a")
      const file = new Blob([contenido], { type: "text/plain" })
      a.href = URL.createObjectURL(file)
      a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      alert("Informe generado y descargado")
    } catch (e) {
      console.error(e)
      alert("Error al generar informe")
    }
  }

  // ==================== LOGIN ====================
  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")
    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos. Contacte al administrador.")
      return
    }
    const u = USUARIOS_AUTORIZADOS.find((x) => x.usuario.toLowerCase() === usuario.toLowerCase() && x.contraseña === contraseña)
    if (u) {
      setEstaAutenticado(true)
      setUsuarioActual(u.usuario)
      setNombreUsuario(u.nombre)
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

  // ==================== UI (LOGIN) ====================
  if (!estaAutenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-full"><Lock className="h-8 w-8 text-blue-600" /></div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Acceso Restringido</h1>
                  <p className="text-sm text-slate-600">Sistema Médico Autorizado</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900 text-sm">Acceso solo para personal autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">El acceso no autorizado está prohibido.</p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario:</Label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg"
                    required
                    disabled={intentosLogin >= 5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Contraseña:</Label>
                  <div className="relative">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border rounded-lg"
                      required
                      disabled={intentosLogin >= 5}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setMostrarContraseña(!mostrarContraseña)}
                      disabled={intentosLogin >= 5}
                    >
                      {mostrarContraseña ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                    </Button>
                  </div>
                </div>

                {errorLogin && (
                  <div className="bg-red-50 p-3 rounded-lg border">
                    <p className="text-red-800 text-sm font-medium">{errorLogin}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 text-white py-3" disabled={intentosLogin >= 5}>
                  <Lock className="mr-2 h-4 w-4" /> {intentosLogin >= 5 ? "Acceso bloqueado" : "Iniciar sesión"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== UI (APP) ====================
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
            {steps.map((step, i) => {
              const Icon = step.icon
              const isCompleted = seccionesCompletadas.includes(step.id)
              const isCurrent = seccionActual === step.id
              const isAccessible = step.id <= Math.max(...seccionesCompletadas, seccionActual)
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-blue-500 text-white" : isAccessible ? "bg-gray-300 text-gray-600" : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isCurrent ? "font-semibold text-blue-600" : "text-gray-600"}`}>{step.name}</span>
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de Evaluación Diagnóstica Avanzada
      </p>
    </div>
  )

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
                  <span className="text-xs bg-black/20 px-2 py-0.5 rounded">Consulta #{numeroConsultaActual}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={copiarId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-blue-100">Sesión activa:</p>
                <p className="font-semibold">{nombreUsuario}</p>
              </div>
              <Button onClick={cerrarSesion} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <User className="h-4 w-4 mr-2" /> Cerrar Sesión
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
                  <div className="p-3 bg-blue-100 rounded-full"><Calculator className="h-8 w-8 text-blue-600" /></div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido al Sistema</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">Seleccione una opción</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button onClick={iniciarNuevaEvaluacion} className="h-24 bg-green-600 hover:bg-green-700 text-white text-lg">
                    <div className="flex flex-col items-center space-y-2"><User className="h-8 w-8" /><span>Nueva Evaluación</span></div>
                  </Button>
                  <Button
                    onClick={() => { setMostrarPantallaBienvenida(false); setModoCargarConsulta(true) }}
                    variant="outline"
                    className="h-24 border-blue-300 text-blue-600 hover:bg-blue-50 text-lg"
                  >
                    <div className="flex flex-col items-center space-y-2"><FileText className="h-8 w-8" /><span>Continuar Consulta</span></div>
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : modoCargarConsulta ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg"><CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
                <h2 className="text-2xl font-bold text-slate-800">Continuar Consulta Existente</h2>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">Información</span></div>
                <p className="text-blue-800 text-sm">Las consultas de seguimiento se realizan 48-72 horas después. Ingrese el ID entregado en la consulta previa.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base">ID de Seguimiento:</Label>
                  <input
                    type="text"
                    placeholder="Ej: ID-00001"
                    value={idBusqueda}
                    onChange={(e) => setIdBusqueda(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <p className="text-xs text-slate-500">Formato: ID-NNNNN</p>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={buscarConsulta} className="bg-blue-600 hover:bg-blue-700 text-white"><FileText className="h-4 w-4 mr-2" /> Buscar Consulta</Button>
                  <Button onClick={() => { setModoCargarConsulta(false); setMostrarPantallaBienvenida(true) }} variant="outline">Cancelar</Button>
                </div>
              </div>
              <CMGFooter />
            </div>
          </CardContent></Card>
        </div>
      ) : mostrarResumenConsulta && consultaCargada ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg"><CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                <h2 className="text-2xl font-bold text-slate-800">Consulta Encontrada</h2>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de la Consulta (ID: {consultaCargada.id})</h3>

                {/* Historial (Consulta 1, 2, ...) */}
                {Array.isArray(historial) && historial.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {historial.map((c) => (
                      <div key={c.numero} className="bg-white rounded border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Consulta #{c.numero}</span>
                          <span className="text-gray-500">{new Date(c.fecha).toLocaleString()}</span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 mt-2">
                          <p><strong>TVUS:</strong> {obtenerNombreTVUS(c.tvus)}</p>
                          <p><strong>β-hCG:</strong> {c.hcg_valor ?? "N/D"} mUI/mL</p>
                          <p><strong>Resultado:</strong> {c.resultado != null ? `${(c.resultado * 100).toFixed(1)}%` : "N/D"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Último snapshot */}
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}</p>
                    <p><strong>Edad:</strong> {consultaCargada.edad_paciente || "No especificado"} años</p>
                    <p><strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor ?? "No especificado"} mUI/mL</p>
                  </div>
                  <div>
                    <p><strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}</p>
                    <p><strong>Resultado anterior:</strong> {consultaCargada.resultado ? `${(consultaCargada.resultado * 100).toFixed(1)}%` : "No calculado"}</p>
                    <p><strong>Fecha:</strong> {consultaCargada.fecha_creacion ? new Date(consultaCargada.fecha_creacion).toLocaleDateString() : "No disponible"}</p>
                    <p><strong>Frecuencia Cardíaca:</strong> {consultaCargada.frecuencia_cardiaca ?? "No especificado"} lpm</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Signos Vitales:</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <p><strong>Presión Arterial:</strong> {consultaCargada.presion_sistolica ?? "N/A"}/{consultaCargada.presion_diastolica ?? "N/A"} mmHg</p>
                    <p><strong>Estado de Conciencia:</strong> {consultaCargada.estado_conciencia || "No especificado"}</p>
                    <p><strong>Prueba Embarazo:</strong> {consultaCargada.resultado_prueba_embarazo || "No especificado"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /><span className="font-medium text-yellow-900">Consulta de Seguimiento</span></div>
                <p className="text-yellow-800 text-sm">Al continuar, se usará la información previa. El β-hCG anterior se toma automáticamente del último registro.</p>
              </div>

              <div className="flex space-x-4">
                <Button onClick={continuarConsultaCargada} className="bg-green-600 hover:bg-green-700 text-white">
                  <ArrowRight className="h-4 w-4 mr-2" /> Continuar (Consulta #{(historial?.length ?? 0) + 1})
                </Button>
                <Button
                  onClick={() => { setMostrarResumenConsulta(false); setModoCargarConsulta(true); setConsultaCargada(null) }}
                  variant="outline"
                >
                  Buscar Otra Consulta
                </Button>
              </div>
              <CMGFooter />
            </div>
          </CardContent></Card>
        </div>
      ) : protocoloFinalizado ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg"><CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div><h2 className="text-2xl font-bold text-slate-800">Evaluación Completada</h2></div>
              <div className="bg-blue-50 p-6 rounded-lg border"><p className="text-blue-900 font-medium">{mensajeFinal}</p></div>
              {resultado !== null && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                </div>
              )}
              <div className="flex space-x-4">
                <Button onClick={generarInformePDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50"> <Download className="h-4 w-4 mr-2" /> Generar Informe</Button>
                <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white"><User className="h-4 w-4 mr-2" /> Nueva Evaluación</Button>
              </div>
              <CMGFooter />
            </div>
          </CardContent></Card>
        </div>
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg"><CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div><h2 className="text-2xl font-bold text-slate-800">Resultado de la Evaluación</h2></div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border text-center">
                <div className="text-sm mb-2">Consulta #{numeroConsultaActual}</div>
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
              </div>

              {mostrarIdSeguimiento && idSeguimiento && (
                <div className="bg-yellow-50 p-6 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-4"><AlertTriangle className="h-5 w-5 text-yellow-600" /><h3 className="text-lg font-semibold text-yellow-900">Seguimiento Requerido</h3></div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-800">⚪ Guarde este ID:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                      <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0"><Copy className="h-3 w-3" /></Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-yellow-300">
                      <h4 className="font-medium text-yellow-900 mb-2">Instrucciones</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• Regrese en 48-72 horas para continuar (Consulta #{numeroConsultaActual + 1}).</li>
                        <li>• Vigile síntomas.</li>
                        <li>• Acuda a urgencias si hay empeoramiento.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={generarInformePDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50"><Download className="h-4 w-4 mr-2" /> Generar Informe</Button>
                <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white"><User className="h-4 w-4 mr-2" /> Nueva Evaluación</Button>
              </div>
              <CMGFooter />
            </div>
          </CardContent></Card>
        </div>
      ) : (
        <div>
          <ProgressBar />
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg"><CardContent className="p-8">
              {seccionActual === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><User className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Nombre del Paciente:</Label>
                      <input type="text" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">Edad del Paciente:</Label>
                      <input type="number" value={edadPaciente} onChange={(e) => setEdadPaciente(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => completarSeccion(1)} className="bg-blue-600 hover:bg-blue-700 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {seccionActual === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Activity className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Signos Vitales</h2></div>

                  {mostrarAlerta && (
                    <div className="bg-yellow-50 p-4 rounded-lg border">
                      <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /><span className="font-medium text-yellow-900">Alerta</span></div>
                      <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Frecuencia Cardíaca (lpm):</Label>
                      <input type="number" value={frecuenciaCardiaca} onChange={(e) => setFrecuenciaCardiaca(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base">Presión Sistólica (mmHg):</Label>
                        <input type="number" value={presionSistolica} onChange={(e) => setPresionSistolica(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base">Presión Diastólica (mmHg):</Label>
                        <input type="number" value={presionDiastolica} onChange={(e) => setPresionDiastolica(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">Estado de Conciencia:</Label>
                      <select value={estadoConciencia} onChange={(e) => setEstadoConciencia(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Seleccione</option>
                        <option value="alerta">Alerta</option>
                        <option value="somnolienta">Somnolienta</option>
                        <option value="estuporosa">Estuporosa</option>
                        <option value="comatosa">Comatosa</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(1)} variant="outline">Anterior</Button>
                    <Button onClick={() => { if (validarSignosVitales()) completarSeccion(2) }} className="bg-blue-600 hover:bg-blue-700 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {seccionActual === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><FileText className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">¿Se realizó la prueba?</Label>
                      <select value={pruebaEmbarazoRealizada} onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Seleccione</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {pruebaEmbarazoRealizada === "si" && (
                      <div className="space-y-2">
                        <Label className="text-base">Resultado:</Label>
                        <select value={resultadoPruebaEmbarazo} onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                          <option value="">Seleccione</option>
                          <option value="positiva">Positiva</option>
                          <option value="negativa">Negativa</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(2)} variant="outline">Anterior</Button>
                    <Button onClick={() => { if (validarPruebaEmbarazo()) completarSeccion(3) }} className="bg-blue-600 hover:bg-blue-700 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {seccionActual === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Stethoscope className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Hallazgos de exploración:</Label>
                      <textarea value={hallazgosExploracion} onChange={(e) => setHallazgosExploracion(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">¿Ecografía transabdominal?</Label>
                      <select value={tieneEcoTransabdominal} onChange={(e) => setTieneEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Seleccione</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {tieneEcoTransabdominal === "si" && (
                      <div className="space-y-2">
                        <Label className="text-base">Resultado de la ecografía:</Label>
                        <select value={resultadoEcoTransabdominal} onChange={(e) => setResultadoEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                          <option value="">Seleccione</option>
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
                    <Button onClick={() => setSeccionActual(3)} variant="outline">Anterior</Button>
                    <Button onClick={() => { if (validarEcoTransabdominal()) completarSeccion(4) }} className="bg-blue-600 hover:bg-blue-700 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {seccionActual === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Calculator className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Consultas</h2></div>

                  <div className="text-sm text-gray-600 -mt-2">Consulta #{numeroConsultaActual}</div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base">Síntomas:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sintomas.map((s) => (
                          <label key={s.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sintomasSeleccionados.includes(s.id)}
                              onChange={(e) =>
                                setSintomasSeleccionados((prev) =>
                                  e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                                )
                              }
                              className="h-5 w-5 border-gray-300 rounded"
                            />
                            <span className="text-sm">{s.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">Factores de riesgo:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {factoresRiesgo.map((f) => (
                          <label key={f.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={factoresSeleccionados.includes(f.id)}
                              onChange={(e) =>
                                setFactoresSeleccionados((prev) =>
                                  e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                                )
                              }
                              className="h-5 w-5 border-gray-300 rounded"
                            />
                            <span className="text-sm">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">TVUS:</Label>
                      <select value={tvus} onChange={(e) => setTvus(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Seleccione</option>
                        <option value="normal">Normal</option>
                        <option value="libre">Líquido libre</option>
                        <option value="masa">Masa anexial</option>
                        <option value="masa_libre">Masa anexial + líquido libre</option>
                      </select>
                    </div>

                    {/* En la sección 5, campo de β-hCG actual */}
                    <div className="space-y-2">
                      <Label className="text-base">β-hCG actual (mUI/mL):</Label>
                      <input
                        type="number"
                        value={hcgValor}
                        onChange={(e) => setHcgValor(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Ingrese el valor actual de β-hCG"
                      />
                    </div>

                    {esConsultaSeguimiento && hcgAnterior && (
                      <div className="bg-blue-50 p-4 rounded-lg border">
                        <p className="text-sm text-blue-800"><strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL</p>
                        <p className="text-xs text-blue-600 mt-1">Se calculará automáticamente la variación</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(4)} variant="outline">Anterior</Button>
                    <Button onClick={calcular} className="bg-green-600 hover:bg-green-700 text-white">Calcular</Button>
                  </div>
                </div>
              )}
            </CardContent></Card>
          </div>
        </div>
      )}
    </div>
  )
}
