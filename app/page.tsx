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

/* ==================== SUPABASE ==================== */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

/* ==================== USUARIOS AUTORIZADOS ==================== */
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "dra.lopez", contraseña: "DocAuth2024!", nombre: "Dra. López" },
  { usuario: "admin", contraseña: "CMGAdmin2024#", nombre: "Administrador" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
]

/* ==================== UTILIDADES ==================== */
const isNum = (v: any) => typeof v === "number" && Number.isFinite(v)
const toNumOrNull = (v: any) => (v === "" || v === null || v === undefined ? null : Number(v))
const clamp01 = (p: number) => Math.max(0, Math.min(1, p))
const bayes = (preProb: number, lr: number) => {
  const odds = preProb / (1 - preProb)
  const postOdds = odds * lr
  return clamp01(postOdds / (1 + postOdds))
}

/** Convierte cualquier objeto camelCase / snake_case en un registro consistente (snake_case). */
function normalizarRegistro(d: any) {
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

    numero_consulta: d.numeroConsulta ?? d.numero_consulta ?? 1,
    historial: d.historial ?? d.historial ?? [],

    resultado: d.resultado ?? d.resultado ?? null,
  }
}

/* ==================== API WRAPPERS ==================== */
async function crearOActualizar(id: string, datos: any): Promise<boolean> {
  try {
    // Si ya existe, PATCH. Si no existe, POST.
    const existente = await leerDatosDesdeBackend(id)
    if (existente) {
      const patch = {
        nombre_paciente: datos.nombrePaciente ?? null,
        edad_paciente: toNumOrNull(datos.edadPaciente),
        frecuencia_cardiaca: toNumOrNull(datos.frecuenciaCardiaca),
        presion_sistolica: toNumOrNull(datos.presionSistolica),
        presion_diastolica: toNumOrNull(datos.presionDiastolica),
        estado_conciencia: datos.estadoConciencia ?? null,
        prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada ?? null,
        resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo ?? null,
        hallazgos_exploracion: datos.hallazgosExploracion ?? null,
        tiene_eco_transabdominal: datos.tieneEcoTransabdominal ?? null,
        resultado_eco_transabdominal: datos.resultadoEcoTransabdominal ?? null,
        sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
        factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
        tvus: datos.tvus ?? null,
        hcg_valor: toNumOrNull(datos.hcgValor),
        variacion_hcg: datos.variacionHcg ?? null,
        hcg_anterior: toNumOrNull(datos.hcgAnterior),
        numero_consulta: datos.numeroConsulta ?? 1,
        historial: Array.isArray(datos.historial) ? datos.historial : [],
        resultado: isNum(datos.resultado) ? datos.resultado : null,
      }
      const res = await actualizarConsulta(id, patch)
      if (res?.error) {
        console.error("API PATCH /api/consultas error:", res.error)
        return false
      }
      return true
    } else {
      const payload = {
        id,
        usuario_creador: datos.usuarioCreador ?? null,
        nombre_paciente: datos.nombrePaciente ?? "N/A",
        edad_paciente: toNumOrNull(datos.edadPaciente),
        frecuencia_cardiaca: toNumOrNull(datos.frecuenciaCardiaca),
        presion_sistolica: toNumOrNull(datos.presionSistolica),
        presion_diastolica: toNumOrNull(datos.presionDiastolica),
        estado_conciencia: datos.estadoConciencia ?? null,
        prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada ?? null,
        resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo ?? null,
        hallazgos_exploracion: datos.hallazgosExploracion ?? null,
        tiene_eco_transabdominal: datos.tieneEcoTransabdominal ?? null,
        resultado_eco_transabdominal: datos.resultadoEcoTransabdominal ?? null,
        sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
        factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
        tvus: datos.tvus ?? null,
        hcg_valor: toNumOrNull(datos.hcgValor),
        variacion_hcg: datos.variacionHcg ?? null,
        hcg_anterior: toNumOrNull(datos.hcgAnterior),
        numero_consulta: datos.numeroConsulta ?? 1,
        historial: Array.isArray(datos.historial) ? datos.historial : [],
        resultado: isNum(datos.resultado) ? datos.resultado : null,
      }
      const res = await crearConsulta(payload)
      if (res?.error) {
        console.error("API POST /api/consultas error:", res.error)
        return false
      }
      return true
    }
  } catch (e) {
    console.error("Error en crearOActualizar:", e)
    return false
  }
}

async function leerDatosDesdeBackend(id: string): Promise<any | null> {
  try {
    const res = await obtenerConsulta(id)
    if (res?.error) return null
    return res?.data ?? null
  } catch (e) {
    console.error("Error llamando GET /api/consultas/:id:", e)
    return null
  }
}

/* ==================== GENERACIÓN DE ID ==================== */
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
  const siguienteNumero = idsExistentes.length > 0 ? Math.max(...idsExistentes) + 1 : 1
  return `ID-${siguienteNumero.toString().padStart(5, "0")}`
}

/* ==================== TABLAS (de la Tabla 1 del estudio) ==================== */
const pretestSinFactores = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 }
const pretestConFactores = { asintomatica: 0.05, sangrado: 0.08, dolor: 0.4, dolor_sangrado: 0.46 }

/* LR por TVUS (día 1, 2 y 3) */
const LR_TVUS: Record<string, number> = { normal: 0.07, libre: 2.4, masa: 38, masa_libre: 47 }

/* LR por hCG según TVUS y zona discriminatoria (2000) */
const LR_hCG: Record<string, { bajo: number; alto: number }> = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}

/* LR por variación entre visitas (48–72 h). Valores derivados del paper. */
const LR_variacion = {
  reduccion_1_35: 16.6, // ↓ <35% aumenta probabilidad
  reduccion_35_50: 0.8,  // ↓ 35–50% baja ligeramente
  reduccion_mayor_50: 0, // ↓ ≥50% descarta
  aumento: 3.3,          // ↑ aumenta
  estable: 1,            // sin cambio relevante
}

/* ==================== ALGORITMO BAYES (Tabla 1) ==================== */
function sintomasClave(sintomas: string[]): "asintomatica" | "sangrado" | "dolor" | "dolor_sangrado" {
  const s = new Set(sintomas.filter((x) => x !== "sincope"))
  const sang = s.has("sangrado")
  const dol = s.has("dolor")
  const comb = s.has("dolor_sangrado")
  if (comb || (sang && dol)) return "dolor_sangrado"
  if (sang) return "sangrado"
  if (dol) return "dolor"
  return "asintomatica"
}

function pretestPorSintomasRiesgo(sintomas: string[], factores: string[]) {
  const clave = sintomasClave(sintomas)
  const tabla = factores.length > 0 ? pretestConFactores : pretestSinFactores
  return tabla[clave as keyof typeof tabla]
}

function lrTVUS(tvus: string) {
  return LR_TVUS[tvus as keyof typeof LR_TVUS] ?? 1
}
function lrHcg(tvus: string, hcg: number) {
  const nivel = hcg >= 2000 ? "alto" : "bajo"
  const mapa = LR_hCG[tvus as keyof typeof LR_hCG]
  return mapa ? mapa[nivel as "alto" | "bajo"] : 1
}
function categoriaVariacion(prev: number, actual: number) {
  if (!isNum(prev) || !isNum(actual)) return "estable" as const
  if (actual > prev) return "aumento" as const
  const reduccion = ((prev - actual) / prev) * 100
  if (reduccion >= 50) return "reduccion_mayor_50" as const
  if (reduccion >= 35) return "reduccion_35_50" as const
  if (reduccion >= 1) return "reduccion_1_35" as const
  return "estable" as const
}

/** Calcula probabilidad según visita (1/2/3) siguiendo Tabla 1. */
function calcularProbabilidadTabla1(params: {
  numeroConsulta: number
  sintomas: string[]
  factores: string[]
  tvus: string
  hcgActual: number | null
  hcgPrevio: number | null
  probPrevio: number | null
}) {
  const { numeroConsulta, sintomas, factores, tvus, hcgActual, hcgPrevio, probPrevio } = params

  // 1) Pretest (vXa)
  const pretest = pretestPorSintomasRiesgo(sintomas, factores)

  // Si es visita 2 o 3: pretest ajustado = (1 - v(prev)) * vXa + v(prev)
  const pretestAjustado =
    numeroConsulta > 1 && isNum(probPrevio) ? (1 - (probPrevio as number)) * pretest + (probPrevio as number) : pretest

  // 2) TVUS (vXb)
  const p_tvus = bayes(pretestAjustado, lrTVUS(tvus))

  // Si ya está fuera de umbrales, termina
  if (p_tvus < 0.01 || p_tvus >= 0.95) {
    return { prob: p_tvus, usadoHcg: false, usadoVar: false }
  }

  // 3) hCG (si disponible)
  let p_hcg = p_tvus
  if (isNum(hcgActual)) {
    p_hcg = bayes(p_tvus, lrHcg(tvus, hcgActual as number))
    if (p_hcg < 0.01 || p_hcg >= 0.95 || numeroConsulta === 1) {
      return { prob: p_hcg, usadoHcg: true, usadoVar: false }
    }
  }

  // 4) Variación (solo visitas ≥2 y si siguen entre 1% y 95%)
  if (numeroConsulta >= 2 && isNum(hcgPrevio) && isNum(hcgActual)) {
    const cat = categoriaVariacion(hcgPrevio as number, hcgActual as number)
    const lrVar = LR_variacion[cat as keyof typeof LR_variacion] ?? 1
    const p_var = bayes(p_hcg, lrVar)
    return { prob: p_var, usadoHcg: true, usadoVar: true }
  }

  return { prob: p_hcg, usadoHcg: isNum(hcgActual), usadoVar: false }
}

/* ==================== COMPONENTE PRINCIPAL ==================== */
export default function CalculadoraEctopico() {
  /* ------ BÚSQUEDA / RESUMEN ------ */
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

  async function buscarConsulta() {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    let consultaEncontrada: any = null
    const local = localStorage.getItem(`ectopico_${id}`)
    if (local) {
      try {
        consultaEncontrada = normalizarRegistro(JSON.parse(local))
      } catch (e) {
        console.warn("Error parseando localStorage:", e)
      }
    }

    if (!consultaEncontrada) {
      try {
        const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()
        if (error) console.error("Supabase error:", error)
        if (data) {
          consultaEncontrada = normalizarRegistro(data)
          localStorage.setItem(`ectopico_${id}`, JSON.stringify(consultaEncontrada))
        }
      } catch (e) {
        console.error("Error buscando en Supabase:", e)
      }
    }

    if (!consultaEncontrada) {
      alert("No se encontró ninguna consulta con ese ID")
      return
    }

    setConsultaCargada(consultaEncontrada)
    setMostrarResumenConsulta(true)
    setModoCargarConsulta(false)
  }

  /* ------ AUTENTICACIÓN ------ */
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

  /* ------ ESTADOS CLÍNICOS ------ */
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
  const [mensajeFinal, setMensajeFinal] = useState("")
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)

  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  /* ------ SEGUIMIENTO / VISITAS ------ */
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [numeroConsulta, setNumeroConsulta] = useState(1)
  const [probPrevio, setProbPrevio] = useState<number | null>(null)

  /* ------ UI ------ */
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  /* ------ SÍNTOMAS / FACTORES / PRUEBAS ------ */
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  /* ====== NUEVA EVALUACIÓN ====== */
  const iniciarNuevaEvaluacion = async () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setNumeroConsulta(1)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  /* ====== CONTINUAR CONSULTA (carga datos previos) ====== */
  const continuarConsultaCargada = async () => {
    const c = consultaCargada
    setIdSeguimiento(c.id)
    setNumeroConsulta((c.numero_consulta ?? 1) + 1)
    setProbPrevio(isNum(c.resultado) ? c.resultado : null)

    setNombrePaciente(c.nombre_paciente || "")
    setEdadPaciente(c.edad_paciente?.toString() || "")
    setFrecuenciaCardiaca(c.frecuencia_cardiaca?.toString() || "")
    setPresionSistolica(c.presion_sistolica?.toString() || "")
    setPresionDiastolica(c.presion_diastolica?.toString() || "")
    setEstadoConciencia(c.estado_conciencia || "")
    setPruebaEmbarazoRealizada(c.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(c.resultado_prueba_embarazo || "")
    setHallazgosExploracion(c.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(c.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(c.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(c.sintomas_seleccionados || [])
    setFactoresSeleccionados(c.factores_seleccionados || [])
    setTvus(c.tvus || "")

    setHcgAnterior(c.hcg_valor?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  /* ====== HELPERS UI ====== */
  const sintomas = [
    { id: "sangrado", label: "Sangrado vaginal" },
    { id: "dolor", label: "Dolor pélvico/abdominal" },
    { id: "dolor_sangrado", label: "Sangrado vaginal + Dolor pélvico/abdominal" },
    { id: "sincope", label: "Síncope o mareo" },
  ]
  const factoresRiesgo = [
    { id: "infertilidad", label: "Historia de infertilidad" },
    { id: "ectopico_previo", label: "Embarazo ectópico previo" },
    { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
    { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
  ]
  const obtenerNombreSintoma = (id: string) => sintomas.find((s) => s.id === id)?.label || id
  const obtenerNombreFactorRiesgo = (id: string) => factoresRiesgo.find((f) => f.id === id)?.label || id
  const obtenerNombreTVUS = (id: string) =>
    id === "normal" ? "Normal" : id === "libre" ? "Líquido libre" : id === "masa" ? "Masa anexial" : id === "masa_libre" ? "Masa anexial + líquido libre" : "No especificado"

  const handleSintomaChange = (id: string, checked: boolean) => {
    let nuevo = checked ? [...sintomasSeleccionados, id] : sintomasSeleccionados.filter((x) => x !== id)
    if (id === "dolor_sangrado" && !checked) nuevo = nuevo.filter((x) => x !== "sangrado" && x !== "dolor")
    if ((id === "sangrado" || id === "dolor") && nuevo.includes("dolor_sangrado")) {
      nuevo = nuevo.filter((x) => x !== "dolor_sangrado")
    }
    setSintomasSeleccionados(nuevo)
  }
  const handleFactorChange = (id: string, checked: boolean) => {
    setFactoresSeleccionados(checked ? [...factoresSeleccionados, id] : factoresSeleccionados.filter((x) => x !== id))
  }

  /* ====== VALIDACIONES RÁPIDAS ====== */
  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sist = Number.parseFloat(presionSistolica)
    const diast = Number.parseFloat(presionDiastolica)
    setMostrarAlerta(false)
    setMensajeAlerta("")
    if (sist >= 180 || diast >= 110) {
      setMensajeFinal("🚨 EMERGENCIA: Crisis hipertensiva (PA ≥ 180/110). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 100 && (sist <= 90 || diast <= 60)) {
      setMensajeFinal("🚨 EMERGENCIA: Taquicardia con hipotensión. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 120) {
      setMensajeFinal("🚨 EMERGENCIA: Taquicardia severa (FC > 120). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (fc < 50) {
      setMensajeFinal("🚨 EMERGENCIA: Bradicardia severa (FC < 50). Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal("🚨 EMERGENCIA: Alteración severa del estado de conciencia. Traslado inmediato.")
      setProtocoloFinalizado(true)
      return false
    }
    let alerta = ""
    if (sist < 90 || diast < 60) alerta = "Hipotensión detectada. Evaluación inmediata."
    else if (sist >= 140 || diast >= 90) alerta = "Hipertensión detectada. Requiere seguimiento."
    else if (fc > 100) alerta = "Taquicardia detectada. Monitoreo."
    else if (fc < 60) alerta = "Bradicardia detectada. Evaluación."
    if (alerta) {
      setMostrarAlerta(true)
      setMensajeAlerta(alerta)
    }
    return true
  }
  const validarPruebaEmbarazo = () => {
    if (pruebaEmbarazoRealizada === "no") {
      setMensajeFinal("Primero debe realizarse una prueba de embarazo cualitativa.")
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
    const confirma = ["saco_embrion_fc", "saco_vitelino_embrion", "saco_vitelino_sin_embrion", "saco_sin_embrion", "saco_10mm_decidual_2mm"]
    if (tieneEcoTransabdominal === "si" && confirma.includes(resultadoEcoTransabdominal)) {
      setMensajeFinal("Evidencia de embarazo intrauterino. Ectópico descartado.")
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  /* ====== CALCULAR (Tabla 1) + GUARDAR ====== */
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Complete síntomas, TVUS y β-hCG.")
      return
    }

    const hcgNum = Number.parseFloat(hcgValor)
    const prevNum = hcgAnterior ? Number.parseFloat(hcgAnterior) : null

    const { prob } = calcularProbabilidadTabla1({
      numeroConsulta,
      sintomas: sintomasSeleccionados,
      factores: factoresSeleccionados,
      tvus,
      hcgActual: hcgNum,
      hcgPrevio: prevNum,
      probPrevio,
    })

    setResultado(prob)

    const fecha = new Date().toISOString()
    const registroActual = {
      id: idSeguimiento,
      fechaCreacion: fecha,
      fechaUltimaActualizacion: fecha,
      usuarioCreador: usuarioActual,

      nombrePaciente,
      edadPaciente: toNumOrNull(edadPaciente),
      frecuenciaCardiaca: toNumOrNull(frecuenciaCardiaca),
      presionSistolica: toNumOrNull(presionSistolica),
      presionDiastolica: toNumOrNull(presionDiastolica),
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
      hcgAnterior: prevNum,
      variacionHcg: prevNum !== null ? ((prevNum - hcgNum) / prevNum) * 100 : null,

      numeroConsulta,
      historial: [],
      resultado: prob,
    }

    // Historial local (Consulta 1, 2, 3…)
    const previoLocalRaw = localStorage.getItem(`ectopico_${idSeguimiento}`)
    let historialLocal: any[] = []
    if (previoLocalRaw) {
      try {
        const prev = JSON.parse(previoLocalRaw)
        if (Array.isArray(prev.historial)) historialLocal = prev.historial
        else if (prev.resultado) {
          historialLocal = [
            {
              n: prev.numero_consulta ?? 1,
              fecha: prev.fecha_creacion ?? fecha,
              tvus: prev.tvus ?? "",
              hcg: prev.hcg_valor ?? null,
              resultado: prev.resultado ?? null,
            },
          ]
        }
      } catch {}
    }
    historialLocal.push({
      n: numeroConsulta,
      fecha,
      tvus,
      hcg: hcgNum,
      resultado: prob,
    })
    registroActual.historial = historialLocal

    // Guardar local + API (POST o PATCH según exista)
    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify({ ...registroActual }))

    const ok = await crearOActualizar(idSeguimiento, registroActual)
    if (!ok) {
      alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")
    }

    if (prob >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (≥95%). Iniciar tratamiento.")
      setProtocoloFinalizado(true)
    } else if (prob < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (<1%).")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  /* ====== PDF (TXT simple) ====== */
  const generarInformePDF = () => {
    try {
      const contenido = `
INFORME - EVALUACIÓN DE EMBARAZO ECTÓPICO
==========================================

ID: ${idSeguimiento}
Consulta: ${numeroConsulta}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

Paciente: ${nombrePaciente || "N/A"}  |  Edad: ${edadPaciente || "N/A"} años

Signos vitales:
- FC: ${frecuenciaCardiaca || "N/A"} lpm
- PA: ${presionSistolica || "N/A"}/${presionDiastolica || "N/A"} mmHg
- Conciencia: ${estadoConciencia || "N/A"}

Hallazgos:
- TVUS: ${obtenerNombreTVUS(tvus)}
- β-hCG actual: ${hcgValor || "N/A"} mUI/mL
${hcgAnterior ? `- β-hCG previo: ${hcgAnterior} mUI/mL` : ""}

Síntomas:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n") || "- Ninguno"}

Factores de riesgo:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactorRiesgo(f)}`).join("\n") || "- Ninguno"}

Resultado:
${resultado !== null ? `Probabilidad de EE: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

Conclusión:
${mensajeFinal || "Seguimiento según protocolo."}

==========================================
CMG Health Solutions
`
      const a = document.createElement("a")
      a.href = URL.createObjectURL(new Blob([contenido], { type: "text/plain" }))
      a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      alert("Informe generado y descargado.")
    } catch (e) {
      console.error(e)
      alert("Error al generar el informe.")
    }
  }

  /* ====== VARIOS ====== */
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
    setNumeroConsulta(1)
    setProbPrevio(null)
  }
  const copiarId = () => {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado.")
    }
  }
  const volverAInicio = () => resetCalculadora()

  /* ====== LOGIN ====== */
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

  /* ====== UI ====== */
  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de Evaluación Diagnóstica Avanzada
      </p>
    </div>
  )

  const ProgressBar = () => {
    const steps = [
      { id: 1, name: "Expediente Clínico", icon: User },
      { id: 2, name: "Signos Vitales", icon: Activity },
      { id: 3, name: "Prueba Embarazo", icon: FileText },
      { id: 4, name: "Evaluación Previa", icon: Stethoscope },
      { id: 5, name: `Consultas (Consulta ${numeroConsulta})`, icon: Calculator },
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
                    <span className={`text-xs mt-2 text-center max-w-24 ${isCurrent ? "font-semibold text-blue-600" : "text-gray-600"}`}>{step.name}</span>
                  </div>
                  {i < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 mx-4 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const completarSeccion = (n: number) => {
    if (!seccionesCompletadas.includes(n)) setSeccionesCompletadas([...seccionesCompletadas, n])
    setSeccionActual(n + 1)
  }

  /* ====== LOGIN SCREEN ====== */
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

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario</Label>
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
                  <Label className="text-base font-medium text-slate-700">Contraseña</Label>
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
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

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-base" disabled={intentosLogin >= 5}>
                  {intentosLogin >= 5 ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Acceso Bloqueado
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
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

  /* ====== APP ====== */
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
                  <Button onClick={iniciarNuevaEvaluacion} className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg">
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
                  <p className="text-blue-800 text-sm">Las consultas de seguimiento deben realizarse entre 48-72 horas después de la consulta inicial. Ingrese el ID que se generó en la Consulta 1.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de seguimiento</Label>
                    <input
                      type="text"
                      placeholder="Ej: ID-00001"
                      value={idBusqueda}
                      onChange={(e) => setIdBusqueda(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">Formato: ID-NNNNN (Ejemplo: ID-00001)</p>
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
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>ID:</strong> {consultaCargada.id}</p>
                      <p><strong>Consulta actual:</strong> {consultaCargada.numero_consulta ?? 1}</p>
                      <p><strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}</p>
                      <p><strong>Edad:</strong> {consultaCargada.edad_paciente || "No especificado"} años</p>
                      <p><strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor || "No especificado"} mUI/mL</p>
                    </div>
                    <div>
                      <p><strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}</p>
                      <p><strong>Resultado anterior:</strong> {consultaCargada.resultado ? `${(consultaCargada.resultado * 100).toFixed(1)}%` : "No calculado"}</p>
                      <p>
                        <strong>Fecha:</strong>{" "}
                        {consultaCargada.fechaCreacion || consultaCargada.fecha_creacion
                          ? new Date(consultaCargada.fechaCreacion || consultaCargada.fecha_creacion).toLocaleDateString()
                          : "No disponible"}
                      </p>
                      <p><strong>Frecuencia Cardíaca:</strong> {consultaCargada.frecuencia_cardiaca || "No especificado"} lpm</p>
                    </div>
                  </div>

                  {Array.isArray(consultaCargada.historial) && consultaCargada.historial.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Historial de Consultas</h4>
                      <ul className="text-sm list-disc list-inside text-blue-800">
                        {consultaCargada.historial.map((h: any, idx: number) => (
                          <li key={idx}>
                            Consulta {h.n}: TVUS {obtenerNombreTVUS(h.tvus)} | β-hCG {h.hcg ?? "N/D"} | Prob {(h.resultado * 100).toFixed(1)}% | {h.fecha ? new Date(h.fecha).toLocaleDateString() : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Signos Vitales:</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <p>
                        <strong>Presión Arterial:</strong> {consultaCargada.presion_sistolica || "N/A"}/{consultaCargada.presion_diastolica || "N/A"} mmHg
                      </p>
                      <p>
                        <strong>Estado de Conciencia:</strong> {consultaCargada.estado_conciencia || "No especificado"}
                      </p>
                      <p>
                        <strong>Prueba Embarazo:</strong> {consultaCargada.resultado_prueba_embarazo || "No especificado"}
                      </p>
                    </div>
                  </div>

                  {consultaCargada.sintomas_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Síntomas:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.sintomas_seleccionados.map((s: string) => (<li key={s}>{obtenerNombreSintoma(s)}</li>))}
                      </ul>
                    </div>
                  )}

                  {consultaCargada.factores_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Factores de Riesgo:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.factores_seleccionados.map((f: string) => (<li key={f}>{obtenerNombreFactorRiesgo(f)}</li>))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Consulta de Seguimiento</span>
                  </div>
                  <p className="text-yellow-800 text-sm">Al continuar, se precargarán los datos de la última visita y se usará el valor previo de β-hCG para calcular la variación.</p>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={continuarConsultaCargada} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar (hará la Consulta { (consultaCargada.numero_consulta ?? 1) + 1 })
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
                  <h2 className="text-2xl font-bold text-slate-800">Evaluación Completada (Consulta {numeroConsulta})</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">{mensajeFinal}</p>
                </div>

                {resultado !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                    <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                    <p className="text-blue-800 text-sm">
                      {resultado >= 0.95 ? "Alta probabilidad - Confirmar diagnóstico" : resultado < 0.01 ? "Baja probabilidad - Descartar diagnóstico" : "Probabilidad intermedia - Seguimiento requerido"}
                    </p>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button onClick={generarInformePDF} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent">
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
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Resultado de la Consulta {numeroConsulta}</h2>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                  <p className="text-blue-800 text-sm">
                    {resultado >= 0.95 ? "Alta probabilidad - Confirmar diagnóstico" : resultado < 0.01 ? "Baja probabilidad - Descartar diagnóstico" : "Probabilidad intermedia - Seguimiento requerido"}
                  </p>
                </div>

                {mostrarIdSeguimiento && idSeguimiento && (
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-900">Seguimiento</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-800">ID de seguimiento:</span>
                        <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                        <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-white p-4 rounded border border-yellow-300">
                        <h4 className="font-medium text-yellow-900 mb-2">Instrucciones</h4>
                        <ul className="text-yellow-800 text-sm space-y-1">
                          <li>• Regrese en 48–72 horas para la siguiente consulta.</li>
                          <li>• Vigile síntomas y acuda si hay empeoramiento.</li>
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
        <div>
          <ProgressBar />
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {/* SECCIÓN 1 */}
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
                          placeholder="Ingrese el nombre del paciente"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Nombre completo (opcional).</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Edad del Paciente</Label>
                        <input
                          type="number"
                          placeholder="Ej: 29"
                          value={edadPaciente}
                          onChange={(e) => setEdadPaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">En años.</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => completarSeccion(1)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECCIÓN 2 */}
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
                          placeholder="Ej: 78"
                          value={frecuenciaCardiaca}
                          onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Latidos por minuto.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión Sistólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Ej: 110"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión Diastólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Ej: 70"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Estado de Conciencia</Label>
                        <select value={estadoConciencia} onChange={(e) => setEstadoConciencia(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione un estado</option>
                          <option value="alerta">Alerta</option>
                          <option value="somnolienta">Somnolienta</option>
                          <option value="estuporosa">Estuporosa</option>
                          <option value="comatosa">Comatosa</option>
                        </select>
                        <p className="text-xs text-slate-500">Seleccione el nivel de alerta actual.</p>
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

                {/* SECCIÓN 3 */}
                {seccionActual === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó la prueba?</Label>
                        <select value={pruebaEmbarazoRealizada} onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione una opción</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                        <p className="text-xs text-slate-500">Debe ser cualitativa inicial (orina o suero).</p>
                      </div>
                      {pruebaEmbarazoRealizada === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado</Label>
                          <select value={resultadoPruebaEmbarazo} onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <option value="">Seleccione un resultado</option>
                            <option value="positiva">Positiva</option>
                            <option value="negativa">Negativa</option>
                          </select>
                          <p className="text-xs text-slate-500">Si es negativa, el algoritmo finaliza.</p>
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

                {/* SECCIÓN 4 */}
                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Hallazgos de exploración</Label>
                        <textarea
                          placeholder="Hallazgos relevantes de la exploración física (dolor, sangrado, etc.)"
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Opcional, para contexto clínico.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó ecografía transabdominal?</Label>
                        <select value={tieneEcoTransabdominal} onChange={(e) => setTieneEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione una opción</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      {tieneEcoTransabdominal === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado de la ecografía transabdominal</Label>
                          <select value={resultadoEcoTransabdominal} onChange={(e) => setResultadoEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <option value="">Seleccione un resultado</option>
                            <option value="saco_embrion_fc">Saco embrionario con FC</option>
                            <option value="saco_vitelino_embrion">Saco vitelino con embrión</option>
                            <option value="saco_vitelino_sin_embrion">Saco vitelino sin embrión</option>
                            <option value="saco_sin_embrion">Saco sin embrión</option>
                            <option value="saco_10mm_decidual_2mm">Saco ≥10mm con anillo decidual ≥2mm</option>
                            <option value="ausencia_saco">Ausencia de saco</option>
                          </select>
                          <p className="text-xs text-slate-500">Si hay evidencia de embarazo intrauterino, el algoritmo finaliza.</p>
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

                {/* SECCIÓN 5 */}
                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Calculator className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Consultas (Consulta {numeroConsulta})</h2>
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
                        <p className="text-xs text-slate-500">Seleccione todos los presentes (excepto síncope, que no influye en la probabilidad base).</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de riesgo</Label>
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
                        <p className="text-xs text-slate-500">Si hay ≥1 factor, se usa la tabla de pretest “con factores”.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Resultado de TVUS</Label>
                        <select value={tvus} onChange={(e) => setTvus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione un resultado</option>
                          <option value="normal">Normal</option>
                          <option value="libre">Líquido libre</option>
                          <option value="masa">Masa anexial</option>
                          <option value="masa_libre">Masa anexial + líquido libre</option>
                        </select>
                        <p className="text-xs text-slate-500">Estos hallazgos usan LR específicos según la Tabla 1.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG actual (mUI/mL)</Label>
                        <input
                          type="number"
                          placeholder="Ej: 1500"
                          value={hcgValor}
                          onChange={(e) => setHcgValor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">Se aplicará LR por zona discriminatoria (2000 mUI/mL) si la probabilidad sigue entre 1% y 95% tras el TVUS.</p>
                      </div>

                      {esConsultaSeguimiento && hcgAnterior && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL
                          </p>
                          <p className="text-xs text-blue-600 mt-1">Se aplicará LR por variación si tras TVUS y hCG la probabilidad permanece entre 1% y 95%.</p>
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
