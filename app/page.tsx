"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { clienteSeguro } from "@/lib/api/clienteSeguro"
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
} from "lucide-react"
import { useState } from "react"
import type React from "react"
import { createClient } from "@supabase/supabase-js"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ===================== SUPABASE CLIENT =====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==================== USUARIOS AUTORIZADOS ====================
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "Dra.Alma", contraseña: "Nuevoleon", nombre: "Secretaria de Salud NL" },
  { usuario: "Dr.Francisco", contraseña: "Francisco", nombre: "Dr.Francisco" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
]

// ==================== FUNCIÓN PARA GENERAR ID ÚNICO ====================
// Cambiar la función generarIdUnico para que genere IDs más simples y únicos
function generarIdUnico(): string {
  const fecha = new Date()
  const año = fecha.getFullYear().toString().slice(-2)
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
  const dia = fecha.getDate().toString().padStart(2, "0")
  const hora = fecha.getHours().toString().padStart(2, "0")
  const minuto = fecha.getMinutes().toString().padStart(2, "0")
  const segundo = fecha.getSeconds().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")

  return `${año}${mes}${dia}${hora}${minuto}${segundo}${random}`
}

// ==================== HELPERS API ====================
// Arreglar la función enviarDatosAlBackend para incluir el ID generado
async function enviarDatosAlBackend(datos: any): Promise<{ success: boolean; id?: string }> {
  try {
    console.log("📤 Enviando datos con ID:", datos.id)

    const payload = {
      id: datos.id, // USAR EL ID QUE YA VIENE EN LOS DATOS
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
      console.error("❌ API error:", res.error)
      return { success: false }
    }

    console.log("✅ Consulta creada exitosamente")
    return { success: true, id: datos.id }
  } catch (e) {
    console.error("❌ Error llamando API:", e)
    return { success: false }
  }
}

async function actualizarDatosEnBackend(id: string, visitaNo: 2 | 3, datos: any): Promise<boolean> {
  try {
    const patch = {
      nombre_paciente: datos.nombrePaciente || null,
      edad_paciente: Number.isFinite(+datos.edadPaciente) ? +datos.edadPaciente : null,
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus || null,
      hcg_valor: Number.isFinite(+datos.hcgValor) ? +datos.hcgValor : null,
      hcg_anterior: Number.isFinite(+datos.hcgAnterior) ? +datos.hcgValor : null,
      variacion_hcg: datos.variacionHcg || null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
      usuario_editor: datos.usuarioCreador || "anon",
    }
    const res = await actualizarConsulta(id, visitaNo, patch)
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
    const res = await obtenerConsulta(id)
    if (res?.error) return null
    return res?.data ?? null
  } catch (e) {
    console.error("Error llamando GET /api/consultas/:id:", e)
    return null
  }
}

// ==================== FUNCIONES DE CÁLCULO ====================
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) {
    odds *= LR
  }
  return +(odds / (1 + odds)).toFixed(4)
}

function normalizarDesdeLocal(d: any) {
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
    sintomas_seleccionados_2: d.sintomas_seleccionados_2 ?? null,
    factores_seleccionados_2: d.factores_seleccionados_2 ?? null,
    tvus_2: d.tvus_2 ?? null,
    hcg_valor_2: d.hcg_valor_2 ?? null,
    hcg_anterior_2: d.hcg_anterior_2 ?? null,
    variacion_hcg_2: d.variacion_hcg_2 ?? null,
    resultado_2: d.resultado_2 ?? null,
    sintomas_seleccionados_3: d.sintomas_seleccionados_3 ?? null,
    factores_seleccionados_3: d.factores_seleccionados_3 ?? null,
    tvus_3: d.tvus_3 ?? null,
    hcg_valor_3: d.hcg_valor_3 ?? null,
    hcg_anterior_3: d.hcg_anterior_3 ?? null,
    variacion_hcg_3: d.variacion_hcg_3 ?? null,
    resultado_3: d.resultado_3 ?? null,
    resultado: d.resultado ?? null,
  }
}

// Función para generar ID temporal para localStorage
function generarIdTemporal(): string {
  return `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function CalculadoraEctopico() {
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

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
    reduccion_mayor_50: 0.01,
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
    { id: "dolor_sangrado", label: "Sangrado + Dolor" },
    { id: "sincope", label: "Síncope o mareo" },
  ]

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

  // Seguimiento
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [numeroConsultaActual, setNumeroConsultaActual] = useState<1 | 2 | 3>(1)

  // Secciones
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

  // ==================== FUNCIÓN PARA GUARDAR DATOS INCOMPLETOS ====================
  // Arreglar la función guardarDatosIncompletos para usar el ID generado
  async function guardarDatosIncompletos(motivoFinalizacion: string, seccionCompletada: number): Promise<boolean> {
    try {
      const fechaActual = new Date().toISOString()
      const idUnico = generarIdUnico() // GENERAR ID ÚNICO

      // ASIGNAR ID INMEDIATAMENTE
      setIdSeguimiento(idUnico)
      console.log("🆔 ID generado para datos incompletos:", idUnico)

      const datosIncompletos = {
        id: idUnico,
        fechaCreacion: fechaActual,
        fechaUltimaActualizacion: fechaActual,
        usuarioCreador: usuarioActual || "anon",
        nombrePaciente: nombrePaciente || null,
        edadPaciente: edadPaciente ? Number.parseInt(edadPaciente) : null,
        frecuenciaCardiaca: frecuenciaCardiaca ? Number.parseInt(frecuenciaCardiaca) : null,
        presionSistolica: presionSistolica ? Number.parseInt(presionSistolica) : null,
        presionDiastolica: presionDiastolica ? Number.parseInt(presionDiastolica) : null,
        estadoConciencia: estadoConciencia || null,
        pruebaEmbarazoRealizada: pruebaEmbarazoRealizada || null,
        resultadoPruebaEmbarazo: resultadoPruebaEmbarazo || null,
        hallazgosExploracion: hallazgosExploracion || null,
        tieneEcoTransabdominal: tieneEcoTransabdominal || null,
        resultadoEcoTransabdominal: resultadoEcoTransabdominal || null,
        sintomasSeleccionados: sintomasSeleccionados || [],
        factoresSeleccionados: factoresSeleccionados || [],
        tvus: tvus || null,
        hcgValor: hcgValor ? Number.parseFloat(hcgValor) : null,
        variacionHcg: variacionHcg || null,
        hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
        resultado: null,
        motivoFinalizacion,
        seccionCompletada,
        consultaCompleta: false,
      }

      // Guardar localmente SIEMPRE
      localStorage.setItem(`ectopico_${idUnico}`, JSON.stringify(datosIncompletos))
      console.log("💾 Datos incompletos guardados localmente:", idUnico)

      // Intentar sincronizar (en segundo plano)
      try {
        const resultadoSync = await enviarDatosAlBackend(datosIncompletos)
        if (resultadoSync.success) {
          console.log("✅ Datos incompletos sincronizados")
        }
      } catch (error) {
        console.warn("⚠️ Error en sincronización, pero guardado localmente")
      }

      return true
    } catch (error) {
      console.error("❌ Error al guardar datos incompletos:", error)
      return false
    }
  }

  // ====== FUNCIONES PRINCIPALES ======
  const iniciarNuevaEvaluacion = async () => {
    resetCalculadora()
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const continuarConsultaCargada = async () => {
    setIdSeguimiento(consultaCargada.id.toString())
    // Mantener datos del paciente (NO cambiar)
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

    // LIMPIAR campos para nueva consulta (NO usar datos previos)
    setSintomasSeleccionados([])
    setFactoresSeleccionados([]) // Siempre empezar limpio
    setTvus("")

    let ultimoHcg = consultaCargada.hcg_valor
    if (consultaCargada.hcg_valor_2) ultimoHcg = consultaCargada.hcg_valor_2
    if (consultaCargada.hcg_valor_3) ultimoHcg = consultaCargada.hcg_valor_3

    setHcgAnterior(ultimoHcg?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    // Determinar número de consulta
    const tieneC2 = consultaCargada.tvus_2 || consultaCargada.hcg_valor_2 || consultaCargada.resultado_2
    const tieneC3 = consultaCargada.tvus_3 || consultaCargada.hcg_valor_3 || consultaCargada.resultado_3

    if (tieneC3) {
      alert("Esta consulta ya tiene 3 evaluaciones completadas.")
      setMostrarResumenConsulta(true)
      return
    } else if (tieneC2) {
      setNumeroConsultaActual(3) // Hacer la tercera consulta
    } else {
      setNumeroConsultaActual(2) // Hacer la segunda consulta
    }

    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  const buscarConsulta = async () => {
    const id = idBusqueda.trim()
    if (!id) {
      alert("Por favor ingrese un ID de consulta")
      return
    }

    let consultaEncontrada: any = null

    // Primero buscar en localStorage
    const datosLocal = localStorage.getItem(`ectopico_${id}`)
    if (datosLocal) {
      try {
        consultaEncontrada = normalizarDesdeLocal(JSON.parse(datosLocal))
      } catch (error) {
        console.warn("Error al parsear datos de localStorage:", error)
      }
    }

    // Si no se encuentra localmente, buscar en la base de datos
    if (!consultaEncontrada) {
      try {
        const { data, error } = await supabase.from("consultas").select("*").eq("id", id).single()
        if (error) console.error("Error al buscar en Supabase:", error)
        if (data) {
          const normalizada = normalizarDesdeLocal(data)
          consultaEncontrada = normalizada
          localStorage.setItem(`ectopico_${id}`, JSON.stringify(normalizada))
        }
      } catch (error) {
        console.error("Error al buscar en Supabase:", error)
      }
    }

    if (consultaEncontrada) {
      setConsultaCargada(consultaEncontrada)
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

  const calcularVariacionHcgAutomatica = (previo: string, actual: string) => {
    if (!previo || !actual) return "no_disponible"
    const a = Number.parseFloat(previo)
    const b = Number.parseFloat(actual)
    if (b > a) return "aumento"
    const reduccionPorc = ((a - b) / a) * 100
    if (reduccionPorc >= 50) return "reduccion_mayor_50"
    if (reduccionPorc >= 35) return "reduccion_35_50"
    if (reduccionPorc >= 1) return "reduccion_1_35"
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
    setNumeroConsultaActual(1)
  }

  const copiarId = () => {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado al portapapeles")
    }
  }

  const volverAInicio = () => resetCalculadora()

  const completarSeccion = (seccion: number) => {
    if (!seccionesCompletadas.includes(seccion)) {
      setSeccionesCompletadas([...seccionesCompletadas, seccion])
    }
    setSeccionActual(seccion + 1)
  }

  const validarSignosVitales = async () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (sistolica >= 180 || diastolica >= 110) {
      await guardarDatosIncompletos("signos_vitales_hipertension_severa", 2)
      setMensajeFinal(
        <div className="text-center">
          🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin
          demora.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      await guardarDatosIncompletos("signos_vitales_taquicardia_hipotension", 2)
      setMensajeFinal(
        <div className="text-center">
          🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin
          demora.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (fc > 120) {
      await guardarDatosIncompletos("signos_vitales_taquicardia_severa", 2)
      setMensajeFinal(
        <div className="text-center">
          🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin
          demora.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (fc < 50) {
      await guardarDatosIncompletos("signos_vitales_bradicardia_severa", 2)
      setMensajeFinal(
        <div className="text-center">
          🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin
          demora.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      await guardarDatosIncompletos("signos_vitales_alteracion_conciencia", 2)
      setMensajeFinal(
        <div className="text-center">
          🚨 ALERTA MÉDICA: Los resultados sugieren una posible urgencia. Se recomienda acudir a valoración médica sin
          demora.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }

    let hayAlerta = false
    let mensajeAlertaTemp = ""
    if (sistolica < 90 || diastolica < 60) {
      hayAlerta = true
      mensajeAlertaTemp = "Se sugiere considerar hipotensión arterial. Se recomienda evaluación médica."
    } else if (sistolica >= 140 || diastolica >= 90) {
      hayAlerta = true
      mensajeAlertaTemp = "Se sugiere considerar hipertensión arterial. Se recomienda seguimiento médico."
    } else if (fc > 100) {
      hayAlerta = true
      mensajeAlertaTemp = "Se sugiere considerar taquicardia. Se recomienda monitoreo médico."
    } else if (fc < 60) {
      hayAlerta = true
      mensajeAlertaTemp = "Se sugiere considerar bradicardia. Se recomienda evaluación médica."
    }
    if (hayAlerta) {
      setMostrarAlerta(true)
      setMensajeAlerta(mensajeAlertaTemp)
    }
    return true
  }

  const validarPruebaEmbarazo = async () => {
    if (pruebaEmbarazoRealizada === "no") {
      await guardarDatosIncompletos("prueba_embarazo_no_realizada", 3)
      setMensajeFinal(
        <div className="text-center">
          Se sugiere realizar una prueba de embarazo cualitativa antes de continuar con la evaluación. La decisión final
          corresponde al médico tratante.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    if (resultadoPruebaEmbarazo === "negativa") {
      await guardarDatosIncompletos("prueba_embarazo_negativa", 3)
      setMensajeFinal(
        <div className="text-center">
          Con prueba de embarazo negativa, es poco probable un embarazo ectópico. Sin embargo, se recomienda valoración
          médica para descartar otras causas de los síntomas.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  const validarEcoTransabdominal = async () => {
    const opcionesConfirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ]
    if (tieneEcoTransabdominal === "si" && opcionesConfirmatorias.includes(resultadoEcoTransabdominal)) {
      await guardarDatosIncompletos("embarazo_intrauterino_confirmado", 4)
      setMensajeFinal(
        <div className="text-center">
          Los hallazgos ecográficos sugieren evidencia de embarazo intrauterino. Se recomienda seguimiento médico
          apropiado. La decisión final corresponde al médico tratante.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
    return true
  }

  // Arreglar la función calcular para generar y usar el ID correctamente
  const calcular = async () => {
    if (!tvus || !hcgValor) {
      alert("Por favor complete todos los campos requeridos: TVUS y β-hCG")
      return
    }

    // 🆔 GENERAR ID INMEDIATAMENTE AL INICIO
    let idGenerado = idSeguimiento
    if (!esConsultaSeguimiento) {
      idGenerado = generarIdUnico()
      setIdSeguimiento(idGenerado)
      console.log("🆔 ID generado:", idGenerado)
    }

    const tieneFactoresRiesgo = factoresSeleccionados.length > 0
    const sintomasParaCalculo = sintomasSeleccionados.filter((s) => s !== "sincope")

    let claveSintoma = "asintomatica" as "asintomatica" | "sangrado" | "dolor" | "dolor_sangrado"

    if (sintomasParaCalculo.includes("dolor_sangrado")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado") && sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor_sangrado"
    } else if (sintomasParaCalculo.includes("sangrado")) {
      claveSintoma = "sangrado"
    } else if (sintomasParaCalculo.includes("dolor")) {
      claveSintoma = "dolor"
    }

    const tablaProb = tieneFactoresRiesgo ? probabilidadesConFactores : probabilidadesSinFactores
    let probPre = tablaProb[claveSintoma]

    if (esConsultaSeguimiento && consultaCargada?.resultado) {
      const v1b = consultaCargada.resultado
      const v2a = probPre
      probPre = (1 - v1b) * v2a + v1b
    }

    const lrs: number[] = []

    const lrTvus = tvusMap[tvus as keyof typeof tvusMap]
    if (lrTvus) lrs.push(lrTvus)

    const hcgNumerico = Number.parseFloat(hcgValor)
    const nivelHcg = hcgNumerico >= 2000 ? "alto" : "bajo"
    const lrHcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivelHcg as "alto" | "bajo"]
    if (lrHcg) lrs.push(lrHcg)

    let variacionCalculada = "no_disponible"
    if (hcgAnterior && hcgValor && esConsultaSeguimiento) {
      variacionCalculada = calcularVariacionHcgAutomatica(hcgAnterior, hcgValor)
      const lrVariacion = variacionHcgMap[variacionCalculada as keyof typeof variacionHcgMap]
      if (lrVariacion !== undefined) lrs.push(lrVariacion)
    }

    const probPost = calcularProbabilidad(probPre, lrs)
    setResultado(probPost)

    const fechaActual = new Date().toISOString()
    const datosCompletos = {
      id: idGenerado, // USAR EL ID GENERADO
      fechaCreacion: fechaActual,
      fechaUltimaActualizacion: fechaActual,
      usuarioCreador: usuarioActual || "anon",
      nombrePaciente,
      edadPaciente: Number.parseInt(edadPaciente),
      frecuenciaCardiaca: Number.parseInt(frecuenciaCardiaca),
      presionSistolica: Number.parseInt(presionSistolica),
      presionDiastolica: Number.parseInt(presionDiastolica),
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor: Number.parseFloat(hcgValor),
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
      resultado: probPost,
    }

    // Guardar localmente SIEMPRE
    localStorage.setItem(`ectopico_${idGenerado}`, JSON.stringify(datosCompletos))
    console.log("💾 Guardado localmente con ID:", idGenerado)

    // Intentar sincronizar con base de datos (en segundo plano)
    try {
      if (!esConsultaSeguimiento) {
        const resultadoSync = await enviarDatosAlBackend(datosCompletos)
        if (resultadoSync.success) {
          console.log("✅ Sincronizado con base de datos:", idGenerado)
        } else {
          console.warn("⚠️ Error en sincronización, pero datos guardados localmente")
        }
      } else {
        const tieneC2 =
          consultaCargada && (consultaCargada.tvus_2 || consultaCargada.hcg_valor_2 || consultaCargada.resultado_2)
        const tieneC3 =
          consultaCargada && (consultaCargada.tvus_3 || consultaCargada.hcg_valor_3 || consultaCargada.resultado_3)
        const visitaNo: 2 | 3 = tieneC3 ? 3 : tieneC2 ? 3 : 2

        const actualizacionExitosa = await actualizarDatosEnBackend(idGenerado, visitaNo, datosCompletos)
        if (actualizacionExitosa) {
          console.log("✅ Consulta de seguimiento actualizada:", idGenerado)
        }
      }
    } catch (e) {
      console.error("❌ Error al sincronizar:", e)
    }

    if (probPost >= 0.95) {
      setMensajeFinal(
        <div className="text-center">
          Los datos ingresados sugieren una probabilidad estimada alta de embarazo ectópico (≥95%). Se recomienda
          evaluación médica urgente.
        </div>,
      )
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal(
        <div className="text-center">
          Los datos sugieren una baja probabilidad de embarazo ectópico (&lt;1%). Se recomienda seguimiento médico
          apropiado. La decisión final corresponde al médico tratante.
        </div>,
      )
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  const generarInformePDF = () => {
    try {
      const contenidoInforme = `
REPORTE DE APOYO CLÍNICO - HERRAMIENTA DE EVALUACIÓN
===================================================

IMPORTANTE: Esta herramienta es únicamente de apoyo y no constituye un diagnóstico médico.
La decisión final siempre corresponde al médico tratante.

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

RESULTADO DE LA HERRAMIENTA:
${resultado ? `Estimación de riesgo: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

RECOMENDACIÓN DE APOYO:
${
  mensajeFinal ||
  (resultado
    ? resultado >= 0.95
      ? "Se sugiere considerar alta probabilidad - Evaluación médica recomendada"
      : resultado < 0.01
        ? "Se sugiere considerar baja probabilidad - Seguimiento médico recomendado"
        : "Probabilidad intermedia - Seguimiento médico requerido"
    : "Evaluación en proceso")
}

DESCARGO DE RESPONSABILIDAD:
Esta herramienta es únicamente de apoyo clínico y no reemplaza el juicio médico profesional.
El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.

===================================================
Desarrollado por CMG Health Solutions
Herramienta de Apoyo Clínico - No es un dispositivo médico de diagnóstico
      `
      const a = document.createElement("a")
      const archivo = new Blob([contenidoInforme], { type: "text/plain" })
      a.href = URL.createObjectURL(archivo)
      a.download = `Reporte_Apoyo_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      alert("Reporte de apoyo generado y descargado exitosamente")
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      alert("Error al generar el reporte. Por favor, inténtelo de nuevo.")
    }
  }

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")

    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
      return
    }

    try {
      const resultado = await clienteSeguro.login(usuario, contraseña)

      if (resultado.success) {
        setEstaAutenticado(true)
        setUsuarioActual(resultado.usuario.usuario)
        setNombreUsuario(resultado.usuario.nombre)
        setErrorLogin("")
        setIntentosLogin(0)
        setUsuario("")
        setContraseña("")
      } else {
        setIntentosLogin((prev) => prev + 1)
        setErrorLogin(`Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`)
        setContraseña("")
      }
    } catch (error) {
      // Fallback al método original si falla
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

  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500 mb-2">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de
        Apoyo Clínico
      </p>
      <p className="text-xs text-gray-400">
        Esta aplicación es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico.
        <br />
        El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
      </p>
    </div>
  )

  const ProgressBar = () => {
    // No mostrar barra de progreso en pantalla de bienvenida
    if (
      mostrarPantallaBienvenida ||
      modoCargarConsulta ||
      mostrarResumenConsulta ||
      protocoloFinalizado ||
      mostrarResultados
    ) {
      return null
    }

    const totalSecciones = 5
    const seccionesCompletas = seccionesCompletadas.length
    const progreso = (seccionesCompletas / totalSecciones) * 100

    return (
      <div className="bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de la Evaluación</span>
            <span className="text-sm text-gray-500">
              {seccionesCompletas}/{totalSecciones} secciones
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  // Función para renderizar el bloque de consulta individual con pronóstico y sugerencias
  const renderBloqueConsultaIndividual = () => {
    const colores = {
      1: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", icon: "text-green-600" },
      2: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", icon: "text-orange-600" },
      3: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", icon: "text-purple-600" },
    }

    const color = colores[numeroConsultaActual]

    return (
      <div className={`${color.bg} p-6 rounded-lg ${color.border} border`}>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-sm font-bold">
            📋
          </div>
          <h3 className={`text-lg font-semibold ${color.text}`}>
            {numeroConsultaActual === 1
              ? "Primera Consulta"
              : numeroConsultaActual === 2
                ? "Segunda Consulta"
                : "Tercera Consulta"}
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>Síntomas</span>
              {sintomasSeleccionados && sintomasSeleccionados.length > 0 ? (
                sintomasSeleccionados.map((sintoma: string) => (
                  <div key={sintoma} className={color.text.replace("900", "800")}>
                    {obtenerNombreSintoma(sintoma)}
                  </div>
                ))
              ) : (
                <div className={color.text.replace("900", "800")}>Asintomática</div>
              )}
            </div>

            <div>
              <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>TVUS</span>
              <div className={color.text.replace("900", "800")}>{obtenerNombreTVUS(tvus)}</div>
            </div>

            {numeroConsultaActual > 1 && variacionHcg && (
              <div>
                <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>Variación β-hCG</span>
                <div className={`${color.text.replace("900", "800")} capitalize`}>
                  {variacionHcg?.replace(/_/g, " ") || "No calculada"}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>Factores de Riesgo</span>
              {factoresSeleccionados && factoresSeleccionados.length > 0 ? (
                factoresSeleccionados.map((factor: string) => (
                  <div key={factor} className={color.text.replace("900", "800")}>
                    {obtenerNombreFactorRiesgo(factor)}
                  </div>
                ))
              ) : (
                <div className={color.text.replace("900", "800")}>Sin factores de riesgo</div>
              )}
            </div>

            <div>
              <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>β-hCG</span>
              <div className={color.text.replace("900", "800")}>{hcgValor || "No especificado"} mUI/mL</div>
            </div>
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${color.border}`}>
          <span className={`font-medium ${color.text.replace("900", "700")} block mb-1`}>
            Resultado de la Herramienta
          </span>
          <div className={`text-lg font-bold ${color.text}`}>
            {resultado ? `${(resultado * 100).toFixed(1)}% estimación de riesgo` : "No calculado"}
          </div>
        </div>

        {/* SECCIÓN DE PRONÓSTICO Y SUGERENCIAS RESTAURADA */}
        <div className={`mt-6 pt-4 border-t ${color.border} bg-white p-4 rounded-lg`}>
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-gray-800 block mb-2">📋 Pronóstico Clínico</span>
              <div className="text-gray-700 text-sm">
                {resultado && resultado >= 0.95 ? (
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <span className="text-red-800 font-medium">⚠️ ALTA PROBABILIDAD</span>
                    <p className="text-red-700 mt-1">Se sugiere evaluación médica urgente</p>
                  </div>
                ) : resultado && resultado < 0.01 ? (
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <span className="text-green-800 font-medium">✅ BAJA PROBABILIDAD</span>
                    <p className="text-green-700 mt-1">Seguimiento médico apropiado recomendado</p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <span className="text-yellow-800 font-medium">⚡ PROBABILIDAD INTERMEDIA</span>
                    <p className="text-yellow-700 mt-1">Seguimiento médico requerido</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-800 block mb-2">💡 Sugerencias Clínicas</span>
              <div className="text-gray-700 text-sm space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Monitoreo continuo de signos vitales</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Vigilancia de síntomas de alarma</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Seguimiento de β-hCG seriado</span>
                </div>
                {numeroConsultaActual < 3 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Reevaluación en 48-72 horas</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTÓN PARA COPIAR INFORMACIÓN RESTAURADO */}
            <div className="pt-3 border-t border-gray-200">
              <Button
                onClick={() => {
                  const infoCompleta = `
CONSULTA ${numeroConsultaActual} - EMBARAZO ECTÓPICO
=====================================

RESULTADO: ${resultado ? `${(resultado * 100).toFixed(1)}%` : "No calculado"}

SÍNTOMAS: ${sintomasSeleccionados.length > 0 ? sintomasSeleccionados.map((s) => obtenerNombreSintoma(s)).join(", ") : "Asintomática"}

FACTORES DE RIESGO: ${factoresSeleccionados.length > 0 ? factoresSeleccionados.map((f) => obtenerNombreFactorRiesgo(f)).join(", ") : "Ninguno"}

TVUS: ${obtenerNombreTVUS(tvus)}

β-hCG: ${hcgValor} mUI/mL
${hcgAnterior ? `β-hCG Anterior: ${hcgAnterior} mUI/mL` : ""}
${variacionHcg ? `Variación: ${variacionHcg.replace(/_/g, " ")}` : ""}

PRONÓSTICO:
${
  resultado && resultado >= 0.95
    ? "⚠️ ALTA PROBABILIDAD - Evaluación médica urgente"
    : resultado && resultado < 0.01
      ? "✅ BAJA PROBABILIDAD - Seguimiento médico apropiado"
      : "⚡ PROBABILIDAD INTERMEDIA - Seguimiento médico requerido"
}

SUGERENCIAS:
• Monitoreo continuo de signos vitales
• Vigilancia de síntomas de alarma
• Seguimiento de β-hCG seriado
${numeroConsultaActual < 3 ? "• Reevaluación en 48-72 horas" : ""}

Fecha: ${new Date().toLocaleString()}
                  `
                  navigator.clipboard.writeText(infoCompleta)
                  alert("Información copiada al portapapeles")
                }}
                variant="outline"
                size="sm"
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Información Completa
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== UI ====================
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
                  <p className="text-sm text-slate-600">Herramienta de Apoyo Médico</p>
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
                  Esta herramienta está destinada exclusivamente para uso de profesionales médicos autorizados como
                  apoyo clínico. No constituye un dispositivo médico de diagnóstico. El acceso no autorizado está
                  prohibido.
                </p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario:</Label>
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
                  <Label className="text-base font-medium text-slate-700">Contraseña:</Label>
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
                  <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de Apoyo
                  Clínico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== APLICACIÓN (AUTENTICADA) ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con ID */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Herramienta de Apoyo - Embarazo Ectópico</h1>
                <p className="text-blue-100 text-sm">Sistema de Apoyo Clínico</p>
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

      <ProgressBar />

      {mostrarPantallaBienvenida ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido a la Herramienta</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">
                  Seleccione una opción para continuar con la herramienta de apoyo clínico
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
                    Las consultas de seguimiento se sugiere realizarlas entre 48-72 horas después de la consulta
                    inicial. Ingrese el ID numérico de la consulta.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de Consulta:</Label>
                    <input
                      type="text"
                      placeholder="Ej: 2412251430451234"
                      value={idBusqueda}
                      onChange={(e) => setIdBusqueda(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500">Ingrese el ID completo de la consulta</p>
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
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header con diseño mejorado */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Resultado de la Herramienta</h2>
                      <p className="text-slate-600">Análisis de apoyo completado</p>
                    </div>
                  </div>
                </div>

                {/* Resultado principal con diseño mejorado */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg mb-4">
                      <span className="text-2xl font-bold text-white">%</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Estimación de Riesgo Sugerida</h3>
                    <div className="text-5xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                    <p className="text-slate-600 text-lg">
                      {resultado >= 0.95
                        ? "Se sugiere considerar alta probabilidad - Evaluación médica recomendada"
                        : resultado < 0.01
                          ? "Se sugiere considerar baja probabilidad - Seguimiento médico recomendado"
                          : "Probabilidad intermedia - Seguimiento médico requerido"}
                    </p>
                  </div>
                </div>

                {/* Renderizar el bloque de consulta con pronóstico y sugerencias */}
                {renderBloqueConsultaIndividual()}

                {/* ID de seguimiento con diseño mejorado */}
                {mostrarIdSeguimiento && idSeguimiento && resultado < 0.95 && resultado > 0.01 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">Seguimiento Sugerido</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-700 font-medium">⚪ Guarde este ID:</span>
                        <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">#</span>
                          </div>
                          <span className="font-mono text-blue-700 font-bold text-lg">{idSeguimiento}</span>
                          <Button
                            onClick={copiarId}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white border-blue-300 hover:bg-blue-50"
                          >
                            <Copy className="h-3 w-3 text-blue-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-slate-800 mb-2">Recomendaciones de Seguimiento</h4>
                        <ul className="text-slate-700 text-sm space-y-1">
                          <li>• Se sugiere regresar en 48-72 horas para continuar con la evaluación</li>
                          <li>• Se recomienda mantener vigilancia de los síntomas durante este tiempo</li>
                          <li>
                            • Se sugiere acudir inmediatamente si presenta empeoramiento del dolor, sangrado abundante o
                            síntomas de shock
                          </li>
                          <li>• La decisión final siempre corresponde al médico tratante</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones con diseño mejorado */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex space-x-4 justify-center">
                    <Button
                      onClick={generarInformePDF}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-white shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generar Reporte
                    </Button>
                    <Button
                      onClick={volverAInicio}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
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
        </div>
      ) : protocoloFinalizado ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-full shadow-lg">
                      <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Protocolo Finalizado</h2>
                      <p className="text-slate-600">Evaluación completada por criterios de exclusión</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100">
                  <div className="text-center space-y-4">
                    <div className="text-lg text-slate-700">{mensajeFinal}</div>
                    {idSeguimiento && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-slate-700 font-medium">ID de Consulta:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-700 font-bold text-lg">{idSeguimiento}</span>
                            <Button
                              onClick={copiarId}
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 bg-white border-blue-300 hover:bg-blue-50"
                            >
                              <Copy className="h-3 w-3 text-blue-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                  <div className="flex space-x-4 justify-center">
                    <Button
                      onClick={generarInformePDF}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-white shadow-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generar Reporte
                    </Button>
                    <Button
                      onClick={volverAInicio}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
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
        </div>
      ) : mostrarResumenConsulta && consultaCargada ? (
        <div className="max-w-6xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Resumen de Consulta</h2>
                      <p className="text-slate-600">ID: {consultaCargada.id}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      onClick={continuarConsultaCargada}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Continuar Consulta
                    </Button>
                    <Button
                      onClick={() => {
                        setMostrarResumenConsulta(false)
                        setModoCargarConsulta(true)
                      }}
                      variant="outline"
                    >
                      Buscar Otra
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos del Paciente</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-slate-700">Nombre:</span>{" "}
                        {consultaCargada.nombre_paciente || "No especificado"}
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Edad:</span>{" "}
                        {consultaCargada.edad_paciente || "No especificado"} años
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Médico:</span>{" "}
                        {consultaCargada.usuario_creador || "No especificado"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Signos Vitales</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-slate-700">FC:</span>{" "}
                        {consultaCargada.frecuencia_cardiaca || "No especificado"} lpm
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">PA:</span>{" "}
                        {consultaCargada.presion_sistolica || "No especificado"}/
                        {consultaCargada.presion_diastolica || "No especificado"} mmHg
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Estado de Conciencia:</span>{" "}
                        {consultaCargada.estado_conciencia || "No especificado"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mostrar consultas realizadas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Consultas Realizadas</h3>

                  {/* Primera consulta */}
                  {(consultaCargada.tvus || consultaCargada.hcg_valor || consultaCargada.resultado) && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-green-600 rounded text-white flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <h4 className="text-lg font-semibold text-green-900">Primera Consulta</h4>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <span className="font-medium text-green-700">TVUS:</span>{" "}
                          {obtenerNombreTVUS(consultaCargada.tvus)}
                        </div>
                        <div>
                          <span className="font-medium text-green-700">β-hCG:</span>{" "}
                          {consultaCargada.hcg_valor || "No especificado"} mUI/mL
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Resultado:</span>{" "}
                          {consultaCargada.resultado
                            ? `${(consultaCargada.resultado * 100).toFixed(1)}%`
                            : "No calculado"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Segunda consulta */}
                  {(consultaCargada.tvus_2 || consultaCargada.hcg_valor_2 || consultaCargada.resultado_2) && (
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-orange-600 rounded text-white flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <h4 className="text-lg font-semibold text-orange-900">Segunda Consulta</h4>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <span className="font-medium text-orange-700">TVUS:</span>{" "}
                          {obtenerNombreTVUS(consultaCargada.tvus_2)}
                        </div>
                        <div>
                          <span className="font-medium text-orange-700">β-hCG:</span>{" "}
                          {consultaCargada.hcg_valor_2 || "No especificado"} mUI/mL
                        </div>
                        <div>
                          <span className="font-medium text-orange-700">Variación:</span>{" "}
                          {consultaCargada.variacion_hcg_2?.replace(/_/g, " ") || "No calculada"}
                        </div>
                        <div>
                          <span className="font-medium text-orange-700">Resultado:</span>{" "}
                          {consultaCargada.resultado_2
                            ? `${(consultaCargada.resultado_2 * 100).toFixed(1)}%`
                            : "No calculado"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tercera consulta */}
                  {(consultaCargada.tvus_3 || consultaCargada.hcg_valor_3 || consultaCargada.resultado_3) && (
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-6 h-6 bg-purple-600 rounded text-white flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <h4 className="text-lg font-semibold text-purple-900">Tercera Consulta</h4>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <span className="font-medium text-purple-700">TVUS:</span>{" "}
                          {obtenerNombreTVUS(consultaCargada.tvus_3)}
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">β-hCG:</span>{" "}
                          {consultaCargada.hcg_valor_3 || "No especificado"} mUI/mL
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">Variación:</span>{" "}
                          {consultaCargada.variacion_hcg_3?.replace(/_/g, " ") || "No calculada"}
                        </div>
                        <div>
                          <span className="font-medium text-purple-700">Resultado:</span>{" "}
                          {consultaCargada.resultado_3
                            ? `${(consultaCargada.resultado_3 * 100).toFixed(1)}%`
                            : "No calculado"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Resto de la aplicación (secciones del formulario)
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
                        placeholder="Nombre"
                        value={nombrePaciente}
                        onChange={(e) => setNombrePaciente(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Edad del Paciente:</Label>
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
                    <Button
                      onClick={() => completarSeccion(1)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
                    >
                      Continuar
                    </Button>
                  </div>
                  <CMGFooter />
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
                        <span className="font-medium text-yellow-900">Sugerencia</span>
                      </div>
                      <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Frecuencia Cardíaca (lpm)</Label>
                        <input
                          type="number"
                          placeholder="60-100"
                          value={frecuenciaCardiaca}
                          onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Presión Sistólica (mmHg)</Label>
                        <input
                          type="number"
                          placeholder="90-140"
                          value={presionSistolica}
                          onChange={(e) => setPresionSistolica(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Presión Diastólica (mmHg)</Label>
                        <input
                          type="number"
                          placeholder="60-90"
                          value={presionDiastolica}
                          onChange={(e) => setPresionDiastolica(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium text-slate-700">Estado de Conciencia</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: "alerta", label: "Alerta" },
                          { value: "somnolienta", label: "Somnolienta" },
                          { value: "estuporosa", label: "Estuporosa" },
                          { value: "comatosa", label: "Comatosa" },
                        ].map((opcion) => (
                          <label
                            key={opcion.value}
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="estadoConciencia"
                              value={opcion.value}
                              checked={estadoConciencia === opcion.value}
                              onChange={(e) => setEstadoConciencia(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{opcion.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={async () => {
                        if (await validarSignosVitales()) completarSeccion(2)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                    >
                      Continuar
                    </Button>
                  </div>
                  <CMGFooter />
                </div>
              )}

              {seccionActual === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">¿Se realizó prueba de embarazo?</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="pruebaEmbarazoRealizada"
                            value="si"
                            checked={pruebaEmbarazoRealizada === "si"}
                            onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Sí</span>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="pruebaEmbarazoRealizada"
                            value="no"
                            checked={pruebaEmbarazoRealizada === "no"}
                            onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">No</span>
                        </label>
                      </div>
                    </div>

                    {pruebaEmbarazoRealizada === "si" && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">
                          Resultado de la prueba de embarazo:
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="resultadoPruebaEmbarazo"
                              value="positiva"
                              checked={resultadoPruebaEmbarazo === "positiva"}
                              onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">Positiva</span>
                          </label>
                          <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="resultadoPruebaEmbarazo"
                              value="negativa"
                              checked={resultadoPruebaEmbarazo === "negativa"}
                              onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">Negativa</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={async () => {
                        if (await validarPruebaEmbarazo()) completarSeccion(3)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                    >
                      Continuar
                    </Button>
                  </div>
                  <CMGFooter />
                </div>
              )}

              {seccionActual === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Hallazgos y Ecografía</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">
                        Hallazgos en la exploración física:
                      </Label>
                      <input
                        type="text"
                        placeholder="Hallazgos"
                        value={hallazgosExploracion}
                        onChange={(e) => setHallazgosExploracion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">
                        ¿Se realizó ecografía transabdominal?
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="tieneEcoTransabdominal"
                            value="si"
                            checked={tieneEcoTransabdominal === "si"}
                            onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">Sí</span>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="tieneEcoTransabdominal"
                            value="no"
                            checked={tieneEcoTransabdominal === "no"}
                            onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-sm font-medium text-slate-700">No</span>
                        </label>
                      </div>
                    </div>

                    {tieneEcoTransabdominal === "si" && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">
                          Resultado de la ecografía transabdominal:
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: "saco_embrion_fc", label: "Saco embrionario con FC" },
                            { value: "saco_vitelino_embrion", label: "Saco vitelino con embrión" },
                            { value: "saco_vitelino_sin_embrion", label: "Saco vitelino sin embrión" },
                            { value: "saco_sin_embrion", label: "Saco sin embrión" },
                            { value: "saco_10mm_decidual_2mm", label: "Saco >10mm con anillo decidual >2mm" },
                            { value: "sin_hallazgos", label: "Sin hallazgos" },
                            { value: "otros", label: "Otros" },
                          ].map((opcion) => (
                            <label
                              key={opcion.value}
                              className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="resultadoEcoTransabdominal"
                                value={opcion.value}
                                checked={resultadoEcoTransabdominal === opcion.value}
                                onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-sm font-medium text-slate-700">{opcion.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={async () => {
                        if (await validarEcoTransabdominal()) completarSeccion(4)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                    >
                      Continuar
                    </Button>
                  </div>
                  <CMGFooter />
                </div>
              )}

              {seccionActual === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Calculator className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Calculadora de Riesgo</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Síntomas:</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {sintomas.map((sintoma) => (
                          <label
                            key={sintoma.id}
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={sintoma.id}
                              checked={sintomasSeleccionados.includes(sintoma.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSintomasSeleccionados([...sintomasSeleccionados, sintoma.id])
                                } else {
                                  setSintomasSeleccionados(sintomasSeleccionados.filter((id) => id !== sintoma.id))
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{sintoma.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Factores de Riesgo:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {factoresRiesgo.map((factor) => (
                          <label
                            key={factor.id}
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={factor.id}
                              checked={factoresSeleccionados.includes(factor.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFactoresSeleccionados([...factoresSeleccionados, factor.id])
                                } else {
                                  setFactoresSeleccionados(factoresSeleccionados.filter((id) => id !== factor.id))
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{factor.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Ecografía Transvaginal (TVUS):</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { value: "normal", label: "Normal" },
                          { value: "libre", label: "Líquido libre" },
                          { value: "masa", label: "Masa anexial" },
                          { value: "masa_libre", label: "Masa anexial + líquido libre" },
                        ].map((opcion) => (
                          <label
                            key={opcion.value}
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="tvus"
                              value={opcion.value}
                              checked={tvus === opcion.value}
                              onChange={(e) => setTvus(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{opcion.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG (mUI/mL):</Label>
                        <input
                          type="number"
                          placeholder="Valor de β-hCG"
                          value={hcgValor}
                          onChange={(e) => setHcgValor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {esConsultaSeguimiento && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">β-hCG Anterior (mUI/mL):</Label>
                          <input
                            type="number"
                            placeholder="Valor anterior de β-hCG"
                            value={hcgAnterior}
                            onChange={(e) => setHcgAnterior(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={calcular}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-8"
                    >
                      Calcular Riesgo
                    </Button>
                  </div>
                  <CMGFooter />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
