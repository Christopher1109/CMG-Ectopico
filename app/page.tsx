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

// Configuración de Supabase
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

// ==================== FUNCIONES DE API ====================
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
      // OJO: NO mandamos fecha_creacion ni fecha_ultima_actualizacion;
      // deja que la DB ponga defaults/trigger
    }

    const res = await crearConsulta(payload) // POST /api/consultas
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

async function actualizarDatosEnBackend(id: string, datos: any): Promise<boolean> {
  try {
    const patch = {
      // fecha_ultima_actualizacion: se puede dejar al trigger/DB, si quieres no lo envíes
      nombre_paciente: datos.nombrePaciente || null,
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

async function sincronizarDatos(id: string, datos: any, esNuevo = false): Promise<void> {
  localStorage.setItem(`ectopico_${id}`, JSON.stringify(datos))
  if (esNuevo) {
    await enviarDatosAlBackend(datos)
  } else {
    await actualizarDatosEnBackend(id, datos)
  }
}

async function buscarDatosPaciente(id: string): Promise<any | null> {
  const datosLocal = localStorage.getItem(`ectopico_${id}`)
  let datosLocalParsed = null
  if (datosLocal) {
    try {
      datosLocalParsed = JSON.parse(datosLocal)
    } catch (error) {
      console.warn("Error al parsear datos de localStorage:", error)
    }
  }

  const datosBackend = await leerDatosDesdeBackend(id)

  if (datosBackend) {
    localStorage.setItem(`ectopico_${id}`, JSON.stringify(datosBackend))
    return datosBackend
  }

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

// Modificar la estructura de datos para manejar múltiples consultas por paciente
// Cambiar las funciones de base de datos para guardar consultas numeradas

// En lugar de usar un solo ID, usar ID base + número de consulta
// Ejemplo: ID-00001-C1, ID-00001-C2, ID-00001-C3

// Modificar la función generarIdSeguimiento para generar ID base
function generarIdBasePaciente(): string {
  const idsExistentes = []

  // Buscar en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("ectopico_ID-")) {
      const idCompleto = key.replace("ectopico_", "")
      const idBase = idCompleto.split("-C")[0] // Extraer solo la parte base
      const numeroId = Number.parseInt(idBase.replace("ID-", ""))
      if (!isNaN(numeroId)) {
        idsExistentes.push(numeroId)
      }
    }
  }

  let siguienteNumero = 1
  if (idsExistentes.length > 0) {
    siguienteNumero = Math.max(...idsExistentes) + 1
  }

  return `ID-${siguienteNumero.toString().padStart(5, "0")}`
}

// Nueva función para obtener el siguiente número de consulta
async function obtenerSiguienteNumeroConsulta(idBase: string): Promise<number> {
  const consultasExistentes = []

  // Buscar en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(`ectopico_${idBase}-C`)) {
      const numeroConsulta = Number.parseInt(key.split("-C")[1])
      consultasExistentes.push(numeroConsulta)
    }
  }

  // Buscar en Supabase
  try {
    const { data } = await supabase.from("consultas").select("id").like("id", `${idBase}-C%`)

    if (data) {
      data.forEach((consulta) => {
        const numeroConsulta = Number.parseInt(consulta.id.split("-C")[1])
        if (!consultasExistentes.includes(numeroConsulta)) {
          consultasExistentes.push(numeroConsulta)
        }
      })
    }
  } catch (error) {
    console.error("Error al buscar consultas en Supabase:", error)
  }

  return consultasExistentes.length > 0 ? Math.max(...consultasExistentes) + 1 : 1
}

// Modificar la función buscarConsulta para mostrar todas las consultas del paciente
export default function CalculadoraEctopico() {
  const [idBusqueda, setIdBusqueda] = useState("")
  const [consultasCargadas, setConsultasCargadas] = useState<any[]>([])
  const [mostrarResumenConsultas, setMostrarResumenConsultas] = useState(false)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

  const buscarConsulta = async () => {
    const idBase = idBusqueda.trim().toUpperCase()
    if (!idBase.startsWith("ID-") || idBase.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    // Buscar todas las consultas de este paciente
    const consultasEncontradas = []

    // Buscar en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`ectopico_${idBase}-C`)) {
        try {
          const datos = JSON.parse(localStorage.getItem(key)!)
          consultasEncontradas.push(datos)
        } catch (error) {
          console.warn("Error al parsear datos de localStorage:", error)
        }
      }
    }

    // Buscar en Supabase
    try {
      const { data } = await supabase
        .from("consultas")
        .select("*")
        .like("id", `${idBase}-C%`)
        .order("id", { ascending: true })

      if (data) {
        data.forEach((consultaSupabase) => {
          // Verificar si ya existe en localStorage
          const existeLocal = consultasEncontradas.find((c) => c.id === consultaSupabase.id)
          if (!existeLocal) {
            // Mapear los campos de la base de datos al formato local
            const consultaMapeada = {
              id: consultaSupabase.id,
              fechaCreacion: consultaSupabase.fecha_creacion,
              fechaUltimaActualizacion: consultaSupabase.fecha_ultima_actualizacion,
              usuarioCreador: consultaSupabase.usuario_creador,
              nombre_paciente: consultaSupabase.nombre_paciente,
              edad_paciente: consultaSupabase.edad_paciente,
              frecuencia_cardiaca: consultaSupabase.frecuencia_cardiaca,
              presion_sistolica: consultaSupabase.presion_sistolica,
              presion_diastolica: consultaSupabase.presion_diastolica,
              estado_conciencia: consultaSupabase.estado_conciencia,
              prueba_embarazo_realizada: consultaSupabase.prueba_embarazo_realizada,
              resultado_prueba_embarazo: consultaSupabase.resultado_prueba_embarazo,
              hallazgos_exploracion: consultaSupabase.hallazgos_exploracion,
              tiene_eco_transabdominal: consultaSupabase.tiene_eco_transabdominal,
              resultado_eco_transabdominal: consultaSupabase.resultado_eco_transabdominal,
              sintomas_seleccionados: consultaSupabase.sintomas_seleccionados || [],
              factores_seleccionados: consultaSupabase.factores_seleccionados || [],
              tvus: consultaSupabase.tvus,
              hcg_valor: consultaSupabase.hcg_valor,
              variacion_hcg: consultaSupabase.variacion_hcg,
              hcg_anterior: consultaSupabase.hcg_anterior,
              resultado: consultaSupabase.resultado,
            }
            consultasEncontradas.push(consultaMapeada)
          }
        })
      }
    } catch (error) {
      console.error("Error al buscar en Supabase:", error)
    }

    if (consultasEncontradas.length > 0) {
      // Ordenar por número de consulta
      consultasEncontradas.sort((a, b) => {
        const numA = Number.parseInt(a.id.split("-C")[1])
        const numB = Number.parseInt(b.id.split("-C")[1])
        return numA - numB
      })

      setConsultasCargadas(consultasEncontradas)
      setMostrarResumenConsultas(true)
      setModoCargarConsulta(false)
    } else {
      alert("No se encontró ninguna consulta con ese ID")
    }
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
    { id: "sincope", label: "Síncope o mareo" },
  ]

  //export default function CalculadoraEctopico() {
  // Estados de autenticación
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

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
  const [resultado, setResultado] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // Estados para el sistema de seguimiento
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  //const [modoCargarConsulta, setModoCargarConsulta] = useState(false)
  //const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)

  // Agregar nuevos estados para manejar múltiples consultas
  //const [consultasCargadas, setConsultasCargadas] = useState<any[]>([])
  //const [mostrarResumenConsultas, setMostrarResumenConsultas] = useState(false)
  const [idBasePaciente, setIdBasePaciente] = useState("")
  const [numeroConsultaActual, setNumeroConsultaActual] = useState(1)

  // Estados para controlar las secciones
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // Estados para consultas
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  // ==================== FUNCIONES ====================

  // Modificar la función iniciarNuevaEvaluacion
  const iniciarNuevaEvaluacion = async () => {
    const nuevoIdBase = generarIdBasePaciente()
    const numeroConsulta = 1
    const idCompleto = `${nuevoIdBase}-C${numeroConsulta}`

    resetCalculadora()
    setIdBasePaciente(nuevoIdBase)
    setNumeroConsultaActual(numeroConsulta)
    setIdSeguimiento(idCompleto)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  // Modificar la función continuarConsultaCargada
  const continuarConsultaCargada = async () => {
    const ultimaConsulta = consultasCargadas[consultasCargadas.length - 1]
    const idBase = ultimaConsulta.id.split("-C")[0]
    const siguienteNumero = await obtenerSiguienteNumeroConsulta(idBase)
    const nuevoIdCompleto = `${idBase}-C${siguienteNumero}`

    // Cargar datos de la última consulta
    setIdBasePaciente(idBase)
    setNumeroConsultaActual(siguienteNumero)
    setIdSeguimiento(nuevoIdCompleto)
    setNombrePaciente(ultimaConsulta.nombre_paciente || "")
    setEdadPaciente(ultimaConsulta.edad_paciente?.toString() || "")

    // Cargar datos médicos básicos de la última consulta
    setFrecuenciaCardiaca(ultimaConsulta.frecuencia_cardiaca?.toString() || "")
    setPresionSistolica(ultimaConsulta.presion_sistolica?.toString() || "")
    setPresionDiastolica(ultimaConsulta.presion_diastolica?.toString() || "")
    setEstadoConciencia(ultimaConsulta.estado_conciencia || "")
    setPruebaEmbarazoRealizada(ultimaConsulta.prueba_embarazo_realizada || "")
    setResultadoPruebaEmbarazo(ultimaConsulta.resultado_prueba_embarazo || "")
    setHallazgosExploracion(ultimaConsulta.hallazgos_exploracion || "")
    setTieneEcoTransabdominal(ultimaConsulta.tiene_eco_transabdominal || "")
    setResultadoEcoTransabdominal(ultimaConsulta.resultado_eco_transabdominal || "")
    setSintomasSeleccionados(ultimaConsulta.sintomas_seleccionados || [])
    setFactoresSeleccionados(ultimaConsulta.factores_seleccionados || [])
    setTvus(ultimaConsulta.tvus || "")

    // Configurar β-hCG anterior automáticamente
    setHcgAnterior(ultimaConsulta.hcg_valor?.toString() || "")
    setHcgValor("") // Limpiar para nuevo valor
    setEsConsultaSeguimiento(true)

    // Marcar secciones como completadas y ir a consultas
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsultas(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  const buscarConsulta_OLD = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    const datos = await buscarDatosPaciente(id)
    if (datos) {
      setConsultaCargada(datos)
      setMostrarResumenConsulta(true)
      setModoCargarConsulta(false)
    } else {
      alert("No se encontró ninguna consulta con ese ID")
    }
  }

  const obtenerNombreSintoma = (sintomaId: string) => {
    const sintoma = sintomas.find((s) => s.id === sintomaId)
    return sintoma ? sintoma.label : sintomaId
  }

  const obtenerNombreFactorRiesgo = (factorId: string) => {
    const factor = factoresRiesgo.find((f) => f.id === factorId)
    return factor ? factor.label : factorId
  }

  const obtenerNombreTVUS = (tvusId: string) => {
    if (!tvusId) return "No especificado"
    switch (tvusId) {
      case "normal":
        return "Normal"
      case "libre":
        return "Líquido libre"
      case "masa":
        return "Masa anexial"
      case "masa_libre":
        return "Masa anexial + líquido libre"
      default:
        return tvusId
    }
  }

  const continuarConsultaCargada_OLD = () => {
    // Cargar todos los datos de la consulta previa
    setIdSeguimiento(consultaCargada.id)
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
    setTvus(consultaCargada.tvus || "")

    // Configurar automáticamente el β-hCG anterior con el valor de la consulta previa
    setHcgAnterior(consultaCargada.hcg_valor?.toString() || "")
    setHcgValor("") // Limpiar para que ingrese el nuevo valor
    setEsConsultaSeguimiento(true) // Marcar como consulta de seguimiento

    // Marcar las secciones como completadas
    setSeccionesCompletadas([1, 2, 3, 4])

    // Ir directamente a la sección de consultas (sección 5)
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  const calcularVariacionHcgAutomatica = (hcgAnterior: string, hcgActual: string) => {
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
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado al portapapeles")
    }
  }

  const generarIdSeguimiento = () => {
    return "ID-" + Math.random().toString(36).substring(2, 9).toUpperCase()
  }

  const iniciarNuevaEvaluacion_OLD = () => {
    const nuevoId = generarIdSeguimiento()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  const volverAInicio = () => {
    resetCalculadora()
  }

  const CMGFooter = () => {
    return (
      <div className="text-center mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de
          Evaluación Diagnóstica Avanzada
        </p>
      </div>
    )
  }

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
                    <span
                      className={`text-xs mt-2 text-center max-w-20 ${
                        isCurrent ? "font-semibold text-blue-600" : "text-gray-600"
                      }`}
                    >
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

  const completarSeccion = (seccion: number) => {
    if (!seccionesCompletadas.includes(seccion)) {
      setSeccionesCompletadas([...seccionesCompletadas, seccion])
    }
    setSeccionActual(seccion + 1)
  }

  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    // Resetear alertas
    setMostrarAlerta(false)
    setMensajeAlerta("")

    // Crisis hipertensiva - EMERGENCIA
    if (sistolica >= 180 || diastolica >= 110) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Crisis hipertensiva detectada (PA ≥ 180/110 mmHg). Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para manejo de emergencia.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Hipotensión severa con taquicardia - EMERGENCIA
    if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta taquicardia con hipotensión (FC > 100 lpm y PA ≤ 90/60 mmHg), sugestivo de compromiso hemodinámico severo. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para manejo de emergencia.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Taquicardia severa - EMERGENCIA
    if (fc > 120) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Taquicardia severa detectada (FC > 120 lpm). Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación cardiovascular y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Bradicardia severa - EMERGENCIA
    if (fc < 50) {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Bradicardia severa detectada (FC < 50 lpm). Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación cardiovascular y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Estado de conciencia alterado - EMERGENCIA
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal(
        "🚨 EMERGENCIA MÉDICA: Paciente presenta alteración severa del estado de conciencia. Se requiere TRASLADO INMEDIATO a la sala de urgencias del hospital para evaluación y manejo especializado.",
      )
      setProtocoloFinalizado(true)
      return false
    }

    // Alertas (permiten continuar pero con advertencia)
    let hayAlerta = false
    let mensajeAlertaTemp = ""

    if (sistolica < 90 || diastolica < 60) {
      hayAlerta = true
      mensajeAlertaTemp = "Hipotensión arterial detectada. Requiere evaluación inmediata."
    } else if (sistolica >= 140 || diastolica >= 90) {
      hayAlerta = true
      mensajeAlertaTemp = "Hipertensión arterial detectada. Requiere evaluación y seguimiento."
    } else if (fc > 100) {
      hayAlerta = true
      mensajeAlertaTemp = "Taquicardia detectada. Monitoreo continuo requerido."
    } else if (fc < 60) {
      hayAlerta = true
      mensajeAlertaTemp = "Bradicardia detectada. Evaluación cardiovascular recomendada."
    }

    if (hayAlerta) {
      setMostrarAlerta(true)
      setMensajeAlerta(mensajeAlertaTemp)
    }

    return true
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

  const handleSintomaChange = (sintomaId: string, checked: boolean) => {
    let nuevosSeleccionados = []

    if (checked) {
      nuevosSeleccionados = [...sintomasSeleccionados, sintomaId]
    } else {
      nuevosSeleccionados = sintomasSeleccionados.filter((id) => id !== sintomaId)
      if (sintomaId === "dolor_sangrado") {
        nuevosSeleccionados = nuevosSeleccionados.filter((id) => id !== "sangrado" && id !== "dolor")
      }
      if ((sintomaId === "sangrado" || sintomaId === "dolor") && nuevosSeleccionados.includes("dolor_sangrado")) {
        nuevosSeleccionados = nuevosSeleccionados.filter((id) => id !== "dolor_sangrado")
      }
    }

    setSintomasSeleccionados(nuevosSeleccionados)
  }

  const handleFactorChange = (factorId: string, checked: boolean) => {
    if (checked) {
      setFactoresSeleccionados([...factoresSeleccionados, factorId])
    } else {
      setFactoresSeleccionados(factoresSeleccionados.filter((id) => id !== factorId))
    }
  }

  // Corregir el algoritmo bayesiano - función calcular
  const calcular = async () => {
    // Validar datos requeridos
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Por favor complete todos los campos requeridos: síntomas, TVUS y β-hCG")
      return
    }

    // 1. CALCULAR PROBABILIDAD PRE-TEST
    const tieneFactoresRiesgo = factoresSeleccionados.length > 0

    // Determinar síntomas para el cálculo (excluyendo síncope)
    const sintomasParaCalculo = sintomasSeleccionados.filter((s) => s !== "sincope")
    let claveSintoma = "asintomatica"

    if (sintomasParaCalculo.includes("dolor_sangrado")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado") && sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado")) {
      claveSintoma = "sangrado"
    } else if (sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor"
    }

    // Seleccionar tabla de probabilidades
    const tablaProb = tieneFactoresRiesgo ? probabilidadesConFactores : probabilidadesSinFactores
    const probPre = tablaProb[claveSintoma as keyof typeof tablaProb]

    // 2. CALCULAR LIKELIHOOD RATIOS
    const lrs = []

    // LR para TVUS
    const lrTvus = tvusMap[tvus as keyof typeof tvusMap]
    if (lrTvus) {
      lrs.push(lrTvus)
    }

    // LR para β-hCG (basado en discriminatory zone de 2000)
    const hcgNumerico = Number.parseFloat(hcgValor)
    const nivelHcg = hcgNumerico >= 2000 ? "alto" : "bajo"
    const lrHcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivelHcg as keyof (typeof hcgMap)[keyof typeof hcgMap]]
    if (lrHcg) {
      lrs.push(lrHcg)
    }

    // LR para variación de β-hCG (solo si hay valor anterior)
    let variacionCalculada = "no_disponible"
    if (hcgAnterior && hcgValor) {
      const hcgAnteriorNum = Number.parseFloat(hcgAnterior)
      const hcgActualNum = Number.parseFloat(hcgValor)

      if (hcgActualNum > hcgAnteriorNum) {
        variacionCalculada = "aumento"
      } else {
        const reduccionPorcentaje = ((hcgAnteriorNum - hcgActualNum) / hcgAnteriorNum) * 100
        if (reduccionPorcentaje >= 50) {
          variacionCalculada = "reduccion_mayor_50"
        } else if (reduccionPorcentaje >= 35) {
          variacionCalculada = "reduccion_35_50"
        } else if (reduccionPorcentaje >= 1) {
          variacionCalculada = "reduccion_1_35"
        } else {
          variacionCalculada = "aumento"
        }
      }

      setVariacionHcg(variacionCalculada)
      const lrVariacion = variacionHcgMap[variacionCalculada as keyof typeof variacionHcgMap]
      if (lrVariacion) {
        lrs.push(lrVariacion)
      }
    }

    // 3. APLICAR TEOREMA DE BAYES
    const probPost = calcularProbabilidad(probPre, lrs)
    setResultado(probPost)

    // 4. GUARDAR DATOS AUTOMÁTICAMENTE
    const fechaActual = new Date().toISOString()
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: numeroConsultaActual === 1 ? fechaActual : consultasCargadas[0]?.fecha_creacion || fechaActual,
      fechaUltimaActualizacion: fechaActual,
      usuarioCreador: usuarioActual,
      nombrePaciente: nombrePaciente,
      edadPaciente: Number.parseInt(edadPaciente),
      frecuenciaCardiaca: Number.parseInt(frecuenciaCardiaca),
      presionSistolica: Number.parseInt(presionSistolica),
      presionDiastolica: Number.parseInt(presionDiastolica),
      estadoConciencia: estadoConciencia,
      pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      hallazgosExploracion: hallazgosExploracion,
      tieneEcoTransabdominal: tieneEcoTransabdominal,
      resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      sintomasSeleccionados: sintomasSeleccionados,
      factoresSeleccionados: factoresSeleccionados,
      tvus: tvus,
      hcgValor: Number.parseFloat(hcgValor),
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
      resultado: probPost,
      numeroConsulta: numeroConsultaActual,
    }

    // Guarda localmente
    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(datosCompletos))

    try {
      // Ahora usamos tu API Next (/api/consultas), NO supabase.from(...).insert()
      const ok = await enviarDatosAlBackend(datosCompletos)

      if (!ok) {
        alert("Advertencia: Los datos se guardaron localmente pero hubo un error al sincronizar con la base de datos.")
      } else {
        console.log("Datos guardados exitosamente vía /api/consultas")
      }
    } catch (e) {
      console.error("Error llamando /api/consultas:", e)
      alert("Advertencia: Los datos se guardaron localmente pero no se pudo conectar con la base de datos.")
    }

    // 5. MOSTRAR RESULTADOS
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

  // Función mejorada para generar PDF
  const generarInformePDF = () => {
    try {
      // Crear contenido del informe
      const contenidoInforme = `
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
${resultado ? `Probabilidad de Embarazo Ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

CONCLUSIÓN:
${
  mensajeFinal ||
  (resultado
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

      // Crear elemento temporal para descargar
      const elemento = document.createElement("a")
      const archivo = new Blob([contenidoInforme], { type: "text/plain" })
      elemento.href = URL.createObjectURL(archivo)
      elemento.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`

      // Simular click para descargar
      document.body.appendChild(elemento)
      elemento.click()
      document.body.removeChild(elemento)

      alert("Informe generado y descargado exitosamente")
    } catch (error) {
      console.error("Error al generar el informe:", error)
      alert("Error al generar el informe. Por favor, inténtelo de nuevo.")
    }
  }

  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")

    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
      return
    }

    const usuarioEncontrado = USUARIOS_AUTORIZADOS.find(
      (u) => u.usuario.toLowerCase() === usuario.toLowerCase() && u.contraseña === contraseña,
    )

    if (usuarioEncontrado) {
      setEstaAutenticado(true)
      setUsuarioActual(usuarioEncontrado.usuario)
      setNombreUsuario(usuarioEncontrado.nombre)
      setErrorLogin("")
      setIntentosLogin(0)
      setUsuario("")
      setContraseña("")
    } else {
      setIntentosLogin((prev) => prev + 1)
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

  // ==================== PANTALLA DE LOGIN ====================
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
                  <span className="font-medium text-amber-900 text-sm">
                    Acceso Solo para Personal Médico Autorizado
                  </span>
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
                      {mostrarContraseña ? (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-500" />
                      )}
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

  // ==================== APLICACIÓN PRINCIPAL (AUTENTICADA) ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con ID */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    onClick={copiarId}
                  >
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
                        <strong>Paciente:</strong> {consultaCargada.nombre_paciente}
                      </p>
                      <p>
                        <strong>Edad:</strong> {consultaCargada.edad_paciente} años
                      </p>
                      <p>
                        <strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor} mUI/mL
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}
                      </p>
                      <p>
                        <strong>Resultado anterior:</strong>{" "}
                        {consultaCargada.resultado
                          ? `${(consultaCargada.resultado * 100).toFixed(1)}%`
                          : "No calculado"}
                      </p>
                      <p>
                        <strong>Fecha:</strong>{" "}
                        {consultaCargada.fecha_creacion
                          ? new Date(consultaCargada.fecha_creacion).toLocaleDateString()
                          : "No disponible"}
                      </p>
                    </div>
                  </div>

                  {consultaCargada.sintomas_seleccionados && consultaCargada.sintomas_seleccionados.length > 0 && (
                    <div className="mt-4">
                      <p>
                        <strong>Síntomas:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.sintomas_seleccionados.map((sintoma: string) => (
                          <li key={sintoma}>{obtenerNombreSintoma(sintoma)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {consultaCargada.factores_seleccionados && consultaCargada.factores_seleccionados.length > 0 && (
                    <div className="mt-4">
                      <p>
                        <strong>Factores de Riesgo:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.factores_seleccionados.map((factor: string) => (
                          <li key={factor}>{obtenerNombreFactorRiesgo(factor)}</li>
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
                    anterior se configurará automáticamente para calcular la variación. Solo necesitará ingresar el
                    nuevo valor de β-hCG.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={continuarConsultaCargada}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6"
                  >
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
      ) : mostrarResumenConsultas ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Consultas Encontradas</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de Consultas Previas</h3>
                  {consultasCargadas.map((consulta: any) => (
                    <div key={consulta.id} className="mb-4 p-4 rounded-lg bg-white border border-gray-200">
                      <h4 className="text-md font-semibold text-blue-800 mb-2">
                        Consulta {consulta.id.split("-C")[1]}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>ID:</strong> {consulta.id}
                          </p>
                          <p>
                            <strong>Paciente:</strong> {consulta.nombre_paciente}
                          </p>
                          <p>
                            <strong>Edad:</strong> {consulta.edad_paciente} años
                          </p>
                          <p>
                            <strong>β-hCG:</strong> {consulta.hcg_valor} mUI/mL
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>TVUS:</strong> {obtenerNombreTVUS(consulta.tvus)}
                          </p>
                          <p>
                            <strong>Resultado:</strong>{" "}
                            {consulta.resultado ? `${(consulta.resultado * 100).toFixed(1)}%` : "No calculado"}
                          </p>
                          <p>
                            <strong>Fecha:</strong>{" "}
                            {consulta.fecha_creacion
                              ? new Date(consulta.fecha_creacion).toLocaleDateString()
                              : "No disponible"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Consulta de Seguimiento</span>
                  </div>
                  <p className="text-yellow-800 text-sm">
                    Al continuar, se cargará automáticamente la información de la última consulta. El valor de β-hCG
                    anterior se configurará automáticamente para calcular la variación. Solo necesitará ingresar el
                    nuevo valor de β-hCG.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={continuarConsultaCargada}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar Consulta
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarResumenConsultas(false)
                      setModoCargarConsulta(true)
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
                  <Button
                    onClick={generarInformePDF}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe PDF
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
                          <li>
                            • Acuda inmediatamente si presenta empeoramiento del dolor, sangrado abundante o síntomas de
                            shock
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    onClick={generarInformePDF}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar Informe PDF
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
                      <Button
                        onClick={() => completarSeccion(1)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                      >
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
                      <Button
                        onClick={() => setSeccionActual(1)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarSignosVitales()) {
                            completarSeccion(2)
                          }
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
                        <Label className="text-base font-medium text-slate-700">
                          ¿Se realizó la prueba de embarazo?
                        </Label>
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
                          <Label className="text-base font-medium text-slate-700">
                            Resultado de la prueba de embarazo:
                          </Label>
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
                      <Button
                        onClick={() => setSeccionActual(2)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarPruebaEmbarazo()) {
                            completarSeccion(3)
                          }
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
                        <Label className="text-base font-medium text-slate-700">
                          Hallazgos en la exploración física:
                        </Label>
                        <textarea
                          placeholder="Ingrese los hallazgos de la exploración física"
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">
                          ¿Se realizó ecografía transabdominal?
                        </Label>
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
                          <Label className="text-base font-medium text-slate-700">
                            Resultado de la ecografía transabdominal:
                          </Label>
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
                      <Button
                        onClick={() => setSeccionActual(3)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (validarEcoTransabdominal()) {
                            completarSeccion(4)
                          }
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
                          {sintomas.map((sintoma) => (
                            <label key={sintoma.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sintomasSeleccionados.includes(sintoma.id)}
                                onChange={(e) => handleSintomaChange(sintoma.id, e.target.checked)}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{sintoma.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de Riesgo:</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {factoresRiesgo.map((factor) => (
                            <label key={factor.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={factoresSeleccionados.includes(factor.id)}
                                onChange={(e) => handleFactorChange(factor.id, e.target.checked)}
                                className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm font-medium text-slate-700">{factor.label}</span>
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
                      // En la sección 5, reemplazar los campos de β-hCG con:
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
                          <p className="text-xs text-blue-600 mt-1">
                            Se calculará automáticamente la variación con el valor actual
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button
                        onClick={() => setSeccionActual(4)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={calcular}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6"
                      >
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
