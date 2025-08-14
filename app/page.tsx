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

// ==================== CONFIG ====================
// Nombre de la tabla de visitas/seguimientos:
const TABLE_VISITAS = "consultas_visitas"

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==================== USUARIOS ====================
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "dra.lopez", contraseña: "DocAuth2024!", nombre: "Dra. López" },
  { usuario: "admin", contraseña: "CMGAdmin2024#", nombre: "Administrador" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
]

// ==================== UTILES ====================
const isNumber = (v: any) => (typeof v === "number" ? true : !Number.isNaN(Number(v)))

function generarIdConsulta(): string {
  const ids: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith("ectopico_ID-")) {
      const idCompleto = k.replace("ectopico_", "")
      const num = Number.parseInt(idCompleto.replace("ID-", ""))
      if (!Number.isNaN(num)) ids.push(num)
    }
  }
  const siguiente = ids.length ? Math.max(...ids) + 1 : 1
  return `ID-${String(siguiente).padStart(5, "0")}`
}

function normalizarDesdeLocal(d: any) {
  return {
    id: d.id,
    fecha_creacion: d.fechaCreacion ?? d.fecha_creacion ?? null,
    fecha_ultima_actualizacion: d.fechaUltimaActualizacion ?? d.fecha_ultima_actualizacion ?? null,
    usuario_creador: d.usuarioCreador ?? d.usuario_creador ?? null,

    nombre_paciente: d.nombrePaciente ?? d.nombre_paciente ?? null,
    edad_paciente: isNumber(d.edadPaciente) ? +d.edadPaciente : d.edad_paciente ?? null,

    frecuencia_cardiaca: isNumber(d.frecuenciaCardiaca) ? +d.frecuenciaCardiaca : d.frecuencia_cardiaca ?? null,
    presion_sistolica: isNumber(d.presionSistolica) ? +d.presionSistolica : d.presion_sistolica ?? null,
    presion_diastolica: isNumber(d.presionDiastolica) ? +d.presionDiastolica : d.presion_diastolica ?? null,
    estado_conciencia: d.estadoConciencia ?? d.estado_conciencia ?? null,

    prueba_embarazo_realizada: d.pruebaEmbarazoRealizada ?? d.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: d.resultadoPruebaEmbarazo ?? d.resultado_prueba_embarazo ?? null,

    hallazgos_exploracion: d.hallazgosExploracion ?? d.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: d.tieneEcoTransabdominal ?? d.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: d.resultadoEcoTransabdominal ?? d.resultado_eco_transabdominal ?? null,

    sintomas_seleccionados: d.sintomasSeleccionados ?? d.sintomas_seleccionados ?? [],
    factores_seleccionados: d.factoresSeleccionados ?? d.factores_seleccionados ?? [],

    tvus: d.tvus ?? null,
    hcg_valor: isNumber(d.hcgValor) ? +d.hcgValor : d.hcg_valor ?? null,
    variacion_hcg: d.variacionHcg ?? d.variacion_hcg ?? null,
    hcg_anterior: isNumber(d.hcgAnterior) ? +d.hcgAnterior : d.hcg_anterior ?? null,

    resultado: isNumber(d.resultado) ? +d.resultado : d.resultado ?? null,
  }
}

function aPayload(datos: any) {
  return {
    id: datos.id,
    usuario_creador: datos.usuarioCreador || null,
    nombre_paciente: datos.nombrePaciente || "N/A",
    edad_paciente: isNumber(datos.edadPaciente) ? +datos.edadPaciente : null,
    frecuencia_cardiaca: isNumber(datos.frecuenciaCardiaca) ? +datos.frecuenciaCardiaca : null,
    presion_sistolica: isNumber(datos.presionSistolica) ? +datos.presionSistolica : null,
    presion_diastolica: isNumber(datos.presionDiastolica) ? +datos.presionDiastolica : null,
    estado_conciencia: datos.estadoConciencia || null,
    prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada || null,
    resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo || null,
    hallazgos_exploracion: datos.hallazgosExploracion || null,
    tiene_eco_transabdominal: datos.tieneEcoTransabdominal || null,
    resultado_eco_transabdominal: datos.resultadoEcoTransabdominal || null,
    sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
    factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
    tvus: datos.tvus || null,
    hcg_valor: isNumber(datos.hcgValor) ? +datos.hcgValor : null,
    variacion_hcg: datos.variacionHcg || null,
    hcg_anterior: isNumber(datos.hcgAnterior) ? +datos.hcgAnterior : null,
    resultado: typeof datos.resultado === "number" ? datos.resultado : null,
  }
}
function aPatch(datos: any) {
  return {
    nombre_paciente: datos.nombrePaciente || null,
    edad_paciente: isNumber(datos.edadPaciente) ? +datos.edadPaciente : null,
    frecuencia_cardiaca: isNumber(datos.frecuenciaCardiaca) ? +datos.frecuenciaCardiaca : null,
    presion_sistolica: isNumber(datos.presionSistolica) ? +datos.presionSistolica : null,
    presion_diastolica: isNumber(datos.presionDiastolica) ? +datos.presionDiastolica : null,
    estado_conciencia: datos.estadoConciencia || null,
    prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada || null,
    resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo || null,
    hallazgos_exploracion: datos.hallazgosExploracion || null,
    tiene_eco_transabdominal: datos.tieneEcoTransabdominal || null,
    resultado_eco_transabdominal: datos.resultadoEcoTransabdominal || null,
    sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
    factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
    tvus: datos.tvus || null,
    hcg_valor: isNumber(datos.hcgValor) ? +datos.hcgValor : null,
    variacion_hcg: datos.variacionHcg || null,
    hcg_anterior: isNumber(datos.hcgAnterior) ? +datos.hcgAnterior : null,
    resultado: typeof datos.resultado === "number" ? datos.resultado : null,
  }
}

// Upsert de la fila principal (consultas)
async function guardarEnBackendAuto(datos: any): Promise<boolean> {
  try {
    const res = await obtenerConsulta(datos.id)
    if (res?.error) {
      const post = await crearConsulta(aPayload(datos))
      if (post?.error) {
        console.error("POST /api/consultas error:", post.error)
        return false
      }
      return true
    } else if (res?.data) {
      const patch = await actualizarConsulta(datos.id, aPatch(datos))
      if (patch?.error) {
        console.error("PATCH /api/consultas error:", patch.error)
        return false
      }
      return true
    } else {
      const post = await crearConsulta(aPayload(datos))
      if (post?.error) {
        console.error("POST /api/consultas error:", post.error)
        return false
      }
      return true
    }
  } catch (e) {
    console.error("Upsert /api/consultas error:", e)
    return false
  }
}

// Inserta una fila en consultas_visitas
async function registrarVisitaEnBD(args: {
  consulta_id: string
  visit_number: number
  tvus: string | null
  hcg_valor: number | null
  hcg_anterior: number | null
  variacion_hcg: string | null
  pretest: number | null
  lr_tvus: number | null
  lr_hcg: number | null
  lr_variacion: number | null
  prob_post: number | null
  decision: string | null
  usuario: string | null
}) {
  const { error } = await supabase.from(TABLE_VISITAS).insert([args] as any)
  if (error) console.error("Insert visitas error:", error)
}

// ==================== BAYES ====================
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) odds *= LR
  return +(odds / (1 + odds)).toFixed(4)
}

const probabilidadesSinFactores = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 }
const probabilidadesConFactores = { asintomatica: 0.05, sangrado: 0.08, dolor: 0.4, dolor_sangrado: 0.46 }

const tvusMap = { normal: 0.07, libre: 2.4, masa: 38, masa_libre: 47 } as const
const hcgMap = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
} as const
const variacionHcgMap = { reduccion_1_35: 16.6, reduccion_35_50: 0.8, reduccion_mayor_50: 0, aumento: 3.3, no_disponible: 1 } as const

function nombreTVUS(code: string) {
  switch (code) {
    case "normal":
      return "Normal"
    case "libre":
      return "Líquido libre"
    case "masa":
      return "Masa anexial"
    case "masa_libre":
      return "Masa anexial + líquido libre"
    default:
      return "No especificado"
  }
}

// ==================== COMPONENTE ====================
export default function CalculadoraEctopico() {
  // Auth
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

  // Datos base
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

  // Seguimiento / consultas
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [numeroConsultaActual, setNumeroConsultaActual] = useState(1)

  // Navegación
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // Búsqueda
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)

  // Consultas (Tabla 1)
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

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

  // Helpers UI
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

  // Inicio/Búsqueda
  const iniciarNuevaEvaluacion = async () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    let encontrada: any = null
    const local = localStorage.getItem(`ectopico_${id}`)
    if (local) {
      try {
        encontrada = normalizarDesdeLocal(JSON.parse(local))
      } catch (e) {}
    }

    if (!encontrada) {
      try {
        const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()
        if (data) {
          encontrada = normalizarDesdeLocal(data)
          localStorage.setItem(`ectopico_${id}`, JSON.stringify(encontrada))
        } else if (error) {
          console.error("Supabase error:", error)
        }
      } catch (e) {
        console.error("Error al buscar en Supabase:", e)
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

  const continuarConsultaCargada = async () => {
    const d = consultaCargada
    setIdSeguimiento(d.id)
    setNombrePaciente(d.nombre_paciente || "")
    setEdadPaciente(d.edad_paciente?.toString() || "")
    setFrecuenciaCardiaca(d.frecuencia_cardiaca?.toString() || "")
    setPresionSistolica(d.presion_sistolica?.toString() || "")
    setPresionDiastolica(d.presion_diastolica?.toString() || "")
    setEstadoConciencia(d.estado_conciencia || "")
    setPruebaEmbarazoRealizada(d.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(d.resultado_prueba_embarazo || "")
    setHallazgosExploracion(d.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(d.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(d.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(d.sintomas_seleccionados || [])
    setFactoresSeleccionados(d.factores_seleccionados || [])

    // TVUS se vuelve a capturar (solicitado)
    setTvus("")
    // hCG anterior = último guardado en la fila principal si existe
    setHcgAnterior(d.hcg_valor?.toString() || "")

    setEsConsultaSeguimiento(true)
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
    setNumeroConsultaActual(2) // al continuar desde 1, esto es consulta 2
  }

  // Finalizaciones inmediatas (se registran también en visitas)
  async function persistirFinalizacion(mensaje: string, decision: string) {
    setMensajeFinal(mensaje)
    setProtocoloFinalizado(true)

    const id = idSeguimiento || generarIdConsulta()
    if (!idSeguimiento) setIdSeguimiento(id)

    const fecha = new Date().toISOString()
    const datos = {
      id,
      fechaCreacion: fecha,
      fechaUltimaActualizacion: fecha,
      usuarioCreador: usuarioActual,
      nombrePaciente,
      edadPaciente,
      frecuenciaCardiaca,
      presionSistolica,
      presionDiastolica,
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor,
      variacionHcg,
      hcgAnterior: hcgAnterior || null,
      resultado: null,
    }

    localStorage.setItem(`ectopico_${id}`, JSON.stringify(datos))
    const ok = await guardarEnBackendAuto(datos)
    if (!ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")

    // También inserta una “visita” con lo que haya
    await registrarVisitaEnBD({
      consulta_id: id,
      visit_number: numeroConsultaActual,
      tvus: tvus || null,
      hcg_valor: isNumber(hcgValor) ? +hcgValor : null,
      hcg_anterior: isNumber(hcgAnterior) ? +hcgAnterior : null,
      variacion_hcg: variacionHcg || null,
      pretest: null,
      lr_tvus: null,
      lr_hcg: null,
      lr_variacion: null,
      prob_post: null,
      decision,
      usuario: usuarioActual || null,
    })
  }

  // Validaciones
  const validarSignosVitales = async () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    setMostrarAlerta(false)
    setMensajeAlerta("")

    // Finaliza
    if (sistolica >= 180 || diastolica >= 110) {
      await persistirFinalizacion("🚨 EMERGENCIA: Crisis hipertensiva (PA ≥ 180/110 mmHg). Traslado inmediato.", "finalizado_por_signos")
      return false
    }
    if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      await persistirFinalizacion("🚨 EMERGENCIA: Taquicardia con hipotensión. Traslado inmediato.", "finalizado_por_signos")
      return false
    }
    if (fc > 120) {
      await persistirFinalizacion("🚨 EMERGENCIA: Taquicardia severa (FC > 120). Traslado inmediato.", "finalizado_por_signos")
      return false
    }
    if (fc < 50) {
      await persistirFinalizacion("🚨 EMERGENCIA: Bradicardia severa (FC < 50). Traslado inmediato.", "finalizado_por_signos")
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      await persistirFinalizacion("🚨 EMERGENCIA: Alteración severa del estado de conciencia. Traslado inmediato.", "finalizado_por_signos")
      return false
    }

    // Alertas informativas
    let msg = ""
    if (sistolica < 90 || diastolica < 60) msg = "Hipotensión arterial. Requiere evaluación."
    else if (sistolica >= 140 || diastolica >= 90) msg = "Hipertensión. Requiere evaluación y seguimiento."
    else if (fc > 100) msg = "Taquicardia. Monitoreo recomendado."
    else if (fc < 60) msg = "Bradicardia. Evaluación recomendada."
    if (msg) {
      setMostrarAlerta(true)
      setMensajeAlerta(msg)
    }
    return true
  }

  const validarPruebaEmbarazo = async () => {
    if (pruebaEmbarazoRealizada === "no") {
      await persistirFinalizacion("Se requiere prueba de embarazo cualitativa antes de continuar.", "finalizado_por_pe_pendiente")
      return false
    }
    if (resultadoPruebaEmbarazo === "negativa") {
      await persistirFinalizacion("Embarazo ectópico descartado por prueba negativa.", "finalizado_por_pe_negativa")
      return false
    }
    return true
  }

  const validarEcoTransabdominal = async () => {
    const confirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ]
    if (tieneEcoTransabdominal === "si" && confirmatorias.includes(resultadoEcoTransabdominal)) {
      await persistirFinalizacion("Evidencia de embarazo intrauterino. Embarazo ectópico descartado.", "finalizado_por_eco_intrauterina")
      return false
    }
    return true
  }

  // Pretest
  const calcularProbabilidadPretest = (sxSel: string[], facSel: string[]) => {
    const sx = sxSel.filter((s) => s !== "sincope")
    const conFactores = facSel.length > 0
    const combinado = sx.includes("dolor_sangrado")
    const sangrado = sx.includes("sangrado")
    const dolor = sx.includes("dolor")
    let clave: keyof typeof probabilidadesSinFactores = "asintomatica"
    if (combinado || (sangrado && dolor)) clave = "dolor_sangrado"
    else if (sangrado) clave = "sangrado"
    else if (dolor) clave = "dolor"
    const tabla = conFactores ? probabilidadesConFactores : probabilidadesSinFactores
    return tabla[clave]
  }

  // Cálculo
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Complete: síntomas, TVUS y β-hCG actual.")
      return
    }

    const probPre = calcularProbabilidadPretest(sintomasSeleccionados, factoresSeleccionados)

    const lrs: number[] = []
    const lr_tvus = tvusMap[tvus as keyof typeof tvusMap] ?? null
    if (lr_tvus) lrs.push(lr_tvus)

    const hcgNum = Number.parseFloat(hcgValor)
    const nivel: "alto" | "bajo" = hcgNum >= 2000 ? "alto" : "bajo"
    const lr_hcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivel as any] ?? null
    if (lr_hcg) lrs.push(lr_hcg)

    let variacionCalculada: keyof typeof variacionHcgMap = "no_disponible"
    let lr_variacion: number | null = null
    if (hcgAnterior && hcgValor) {
      const ant = Number.parseFloat(hcgAnterior)
      const act = Number.parseFloat(hcgValor)
      if (act > ant) variacionCalculada = "aumento"
      else {
        const reduccion = ((ant - act) / ant) * 100
        if (reduccion >= 50) variacionCalculada = "reduccion_mayor_50"
        else if (reduccion >= 35) variacionCalculada = "reduccion_35_50"
        else if (reduccion >= 1) variacionCalculada = "reduccion_1_35"
        else variacionCalculada = "aumento"
      }
      setVariacionHcg(variacionCalculada)
      lr_variacion = variacionHcgMap[variacionCalculada]
      if (lr_variacion) lrs.push(lr_variacion)
    }

    const probPost = calcularProbabilidad(probPre, lrs)
    setResultado(probPost)

    // Snapshot principal
    const fecha = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: fecha,
      fechaUltimaActualizacion: fecha,
      usuarioCreador: usuarioActual,
      nombrePaciente,
      edadPaciente: isNumber(edadPaciente) ? +edadPaciente : null,
      frecuenciaCardiaca: isNumber(frecuenciaCardiaca) ? +frecuenciaCardiaca : null,
      presionSistolica: isNumber(presionSistolica) ? +presionSistolica : null,
      presionDiastolica: isNumber(presionDiastolica) ? +presionDiastolica : null,
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor: +hcgValor,
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? +hcgAnterior : null,
      resultado: probPost,
    }

    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(datosCompletos))
    const ok = await guardarEnBackendAuto(datosCompletos)
    if (!ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")

    // Inserta VISITA 2/3…
    let decision = "intermedia"
    if (probPost >= 0.95) decision = "confirmado_probabilidad"
    else if (probPost < 0.01) decision = "descartado_probabilidad"

    await registrarVisitaEnBD({
      consulta_id: idSeguimiento,
      visit_number: numeroConsultaActual,
      tvus,
      hcg_valor: +hcgValor,
      hcg_anterior: isNumber(hcgAnterior) ? +hcgAnterior : null,
      variacion_hcg: variacionCalculada,
      pretest: probPre,
      lr_tvus,
      lr_hcg,
      lr_variacion,
      prob_post: probPost,
      decision,
      usuario: usuarioActual || null,
    })

    // Mostrar
    if (probPost >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (probabilidad ≥95%). Proceder con tratamiento.")
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (probabilidad <1%).")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
      // si fue 2a visita, al terminar esta pantalla el médico podría volver en 48-72h => aumentamos contador
      setNumeroConsultaActual((n) => Math.min(n + 1, 3))
    }
  }

  // PDF simple
  const generarInformePDF = () => {
    try {
      const contenido = `
INFORME - EVALUACIÓN DE EMBARAZO ECTÓPICO
=========================================
ID: ${idSeguimiento}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

Paciente: ${nombrePaciente}
Edad: ${edadPaciente || "N/D"} años

Signos vitales: FC ${frecuenciaCardiaca || "N/D"} lpm, PA ${presionSistolica || "N/D"}/${presionDiastolica || "N/D"} mmHg
Conciencia: ${estadoConciencia || "N/D"}

TVUS: ${nombreTVUS(tvus)}
β-hCG actual: ${hcgValor || "N/D"} mUI/mL${hcgAnterior ? `  |  β-hCG anterior: ${hcgAnterior} mUI/mL` : ""}

Síntomas: ${sintomasSeleccionados.join(", ") || "N/D"}
Factores de riesgo: ${factoresSeleccionados.join(", ") || "N/D"}

Probabilidad: ${resultado !== null ? (resultado * 100).toFixed(1) + "%" : "No calculada"}
Conclusión: ${mensajeFinal || "—"}
`
      const a = document.createElement("a")
      const file = new Blob([contenido], { type: "text/plain" })
      a.href = URL.createObjectURL(file)
      a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      alert("Informe generado y descargado.")
    } catch {}
  }

  // Login
  const manejarLogin = (e: React.FormEvent) => {
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

  // ====== UI LOGIN ======
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
                  <span className="font-medium text-amber-900 text-sm">Acceso solo para personal médico autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">
                  Este sistema está destinado exclusivamente a profesionales autorizados.
                </p>
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

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-base"
                  disabled={intentosLogin >= 5}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Iniciar Sesión
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

  // ===== UI principal =====
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
                  {i < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 mx-4 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const completarSeccion = (s: number) => {
    if (!seccionesCompletadas.includes(s)) setSeccionesCompletadas([...seccionesCompletadas, s])
    setSeccionActual(s + 1)
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
              <Button
                onClick={cerrarSesion}
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
                <p className="text-lg text-slate-600 mb-8">Seleccione una opción para continuar con la evaluación</p>
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
                  <p className="text-blue-800 text-sm">Ingrese el ID que recibió al finalizar la primera consulta.</p>
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
        // ======== RESUMEN estilo anterior ========
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
                      <p><strong>Edad:</strong> {consultaCargada.edad_paciente ?? "No especificado"} años</p>
                      <p><strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor ?? "No especificado"} mUI/mL</p>
                    </div>
                    <div>
                      <p><strong>TVUS:</strong> {nombreTVUS(consultaCargada.tvus)}</p>
                      <p><strong>Resultado anterior:</strong> {isNumber(consultaCargada.resultado) ? `${(consultaCargada.resultado * 100).toFixed(1)}%` : "No calculado"}</p>
                      <p><strong>Fecha:</strong> {consultaCargada.fecha_creacion ? new Date(consultaCargada.fecha_creacion).toLocaleDateString() : "No disponible"}</p>
                      <p><strong>Frecuencia cardíaca:</strong> {consultaCargada.frecuencia_cardiaca ?? "No especificado"} lpm</p>
                    </div>
                  </div>

                  {Array.isArray(consultaCargada.sintomas_seleccionados) && consultaCargada.sintomas_seleccionados.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Síntomas:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.sintomas_seleccionados.map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(consultaCargada.factores_seleccionados) && consultaCargada.factores_seleccionados.length > 0 && (
                    <div className="mt-4">
                      <p><strong>Factores de riesgo:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.factores_seleccionados.map((f: string) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Consulta de seguimiento</span>
                  </div>
                  <p className="text-yellow-800 text-sm">
                    Al continuar, se precargarán los datos clínicos previos. Registre nuevamente el resultado de la TVUS y la β-hCG actual.
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
                    Buscar otra
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
            <CardContent className="p-8 space-y-6">
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
            </CardContent>
          </Card>
        </div>
      ) : mostrarResultados && resultado !== null ? (
        // ===== Resultado con bloque de seguimiento como antes =====
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
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
                      <span className="text-yellow-800">Guarde este ID:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                      <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-yellow-300">
                      <h4 className="font-medium text-yellow-900 mb-2">Instrucciones</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• Regrese en 48–72 horas para nueva evaluación.</li>
                        <li>• Mantenga vigilancia de síntomas durante este tiempo.</li>
                        <li>• Acuda de inmediato si hay empeoramiento del dolor, sangrado abundante o signos de shock.</li>
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
            </CardContent>
          </Card>
        </div>
      ) : (
        // ===== FORMULARIO =====
        <div>
          <ProgressBar />
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {/* Sección 1 */}
                {seccionActual === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <User className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Nombre del paciente</Label>
                        <p className="text-xs text-slate-500">Escriba el nombre completo de la paciente.</p>
                        <input
                          type="text"
                          placeholder="Nombre y apellidos"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Edad</Label>
                        <p className="text-xs text-slate-500">Ingrese la edad en años.</p>
                        <input
                          type="number"
                          placeholder="Ej: 28"
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

                {/* Sección 2 */}
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
                        <Label className="text-base font-medium text-slate-700">Frecuencia cardíaca (lpm)</Label>
                        <p className="text-xs text-slate-500">Capture el valor medido al ingreso.</p>
                        <input
                          type="number"
                          placeholder="Ej: 78"
                          value={frecuenciaCardiaca}
                          onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión sistólica (mmHg)</Label>
                          <p className="text-xs text-slate-500">Primera cifra de la presión arterial.</p>
                          <input
                            type="number"
                            placeholder="Ej: 120"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión diastólica (mmHg)</Label>
                          <p className="text-xs text-slate-500">Segunda cifra de la presión arterial.</p>
                          <input
                            type="number"
                            placeholder="Ej: 80"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Estado de conciencia</Label>
                        <p className="text-xs text-slate-500">Seleccione el estado observado.</p>
                        <select
                          value={estadoConciencia}
                          onChange={(e) => setEstadoConciencia(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione…</option>
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
                        onClick={async () => {
                          const ok = await validarSignosVitales()
                          if (ok) completarSeccion(2)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 3 */}
                {seccionActual === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó la prueba?</Label>
                        <p className="text-xs text-slate-500">Indique si se tomó prueba cualitativa.</p>
                        <select
                          value={pruebaEmbarazoRealizada}
                          onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione…</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      {pruebaEmbarazoRealizada === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado</Label>
                          <p className="text-xs text-slate-500">Seleccione el resultado informado.</p>
                          <select
                            value={resultadoPruebaEmbarazo}
                            onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccione…</option>
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
                        onClick={async () => {
                          const ok = await validarPruebaEmbarazo()
                          if (ok) completarSeccion(3)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 4 */}
                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Hallazgos de exploración física</Label>
                        <p className="text-xs text-slate-500">Describa signos relevantes encontrados.</p>
                        <textarea
                          placeholder="Escriba aquí…"
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó ecografía transabdominal?</Label>
                        <p className="text-xs text-slate-500">Indique si se efectuó el estudio.</p>
                        <select
                          value={tieneEcoTransabdominal}
                          onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione…</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      {tieneEcoTransabdominal === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado</Label>
                          <p className="text-xs text-slate-500">Seleccione el hallazgo descrito.</p>
                          <select
                            value={resultadoEcoTransabdominal}
                            onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccione…</option>
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
                        onClick={async () => {
                          const ok = await validarEcoTransabdominal()
                          if (ok) completarSeccion(4)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 5 – Consultas */}
                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Calculator className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Consultas (Consulta {numeroConsultaActual})</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Síntomas */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Síntomas</Label>
                        <p className="text-xs text-slate-500">Seleccione todos los presentes.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sintomas.map((s) => (
                            <label key={s.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sintomasSeleccionados.includes(s.id)}
                                onChange={(e) => {
                                  let arr = [...sintomasSeleccionados]
                                  if (e.target.checked) {
                                    arr.push(s.id)
                                  } else {
                                    arr = arr.filter((x) => x !== s.id)
                                    if (s.id === "dolor_sangrado") {
                                      arr = arr.filter((x) => x !== "sangrado" && x !== "dolor")
                                    }
                                    if ((s.id === "sangrado" || s.id === "dolor") && arr.includes("dolor_sangrado")) {
                                      arr = arr.filter((x) => x !== "dolor_sangrado")
                                    }
                                  }
                                  setSintomasSeleccionados(arr)
                                }}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{s.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Factores */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de riesgo</Label>
                        <p className="text-xs text-slate-500">Marque los antecedentes aplicables a la paciente.</p>
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

                      {/* TVUS */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Resultado de TVUS</Label>
                        <p className="text-xs text-slate-500">Seleccione el hallazgo observado en la ecografía transvaginal.</p>
                        <select
                          value={tvus}
                          onChange={(e) => setTvus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccione…</option>
                          <option value="normal">Normal</option>
                          <option value="libre">Líquido libre</option>
                          <option value="masa">Masa anexial</option>
                          <option value="masa_libre">Masa anexial + líquido libre</option>
                        </select>
                      </div>

                      {/* hCG */}
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG actual (mUI/mL)</Label>
                        <p className="text-xs text-slate-500">Ingrese el valor cuantitativo obtenido en esta visita.</p>
                        <input
                          type="number"
                          placeholder="Ej: 1450"
                          value={hcgValor}
                          onChange={(e) => setHcgValor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {esConsultaSeguimiento && hcgAnterior && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800"><strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL</p>
                          <p className="text-xs text-blue-600 mt-1">Se calculará automáticamente la variación respecto al valor actual.</p>
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
