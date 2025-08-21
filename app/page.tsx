"use client"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"
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

// ==================== HELPERS API ====================
async function enviarDatosAlBackend(datos: any): Promise<boolean> {
  try {
    const payload = {
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

async function actualizarDatosEnBackend(id: string, visitaNo: 2 | 3, datos: any): Promise<boolean> {
  try {
    const patch = {
      nombre_paciente: datos.nombrePaciente || null,
      edad_paciente: Number.isFinite(+datos.edadPaciente) ? +datos.edadPaciente : null,
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus || null,
      hcg_valor: Number.isFinite(+datos.hcgValor) ? +datos.hcgValor : null,
      hcg_anterior: Number.isFinite(+datos.hcgAnterior) ? +datos.hcgAnterior : null,
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

// Función para generar ID temporal para localStorage (ya no se usa para DB)
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
  async function guardarDatosIncompletos(motivoFinalizacion: string, seccionCompletada: number): Promise<boolean> {
    try {
      const fechaActual = new Date().toISOString()
      const datosIncompletos = {
        idTemporal: generarIdTemporal(),
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

      localStorage.setItem(`ectopico_${datosIncompletos.idTemporal}`, JSON.stringify(datosIncompletos))
      const ok = await enviarDatosAlBackend(datosIncompletos)

      if (!ok) {
        console.warn("Datos guardados localmente, pero falló la sincronización con la base de datos")
      }

      return true
    } catch (error) {
      console.error("Error al guardar datos incompletos:", error)
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

  // Actualizar la función calcular para manejar mejor los errores y restaurar la funcionalidad completa

  const calcular = async () => {
    if (!tvus || !hcgValor) {
      alert("Por favor complete todos los campos requeridos: TVUS y β-hCG")
      return
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

    try {
      let ok = false
      let consultaId = null

      if (!esConsultaSeguimiento) {
        const res = await enviarDatosAlBackend(datosCompletos)
        if (res) {
          ok = true
          // Obtener el ID generado por la base de datos
          consultaId = "Generado automáticamente"
        }
      } else {
        const tieneC2 =
          consultaCargada &&
          (consultaCargada.tvus_2 ||
            consultaCargada.hcg_valor_2 ||
            consultaCargada.resultado_2 ||
            consultaCargada.sintomas_seleccionados_2?.length > 0)
        const tieneC3 =
          consultaCargada &&
          (consultaCargada.tvus_3 ||
            consultaCargada.hcg_valor_3 ||
            consultaCargada.resultado_3 ||
            consultaCargada.sintomas_seleccionados_3?.length > 0)

        const visitaNo: 2 | 3 = tieneC3 ? 3 : tieneC2 ? 3 : 2
        ok = await actualizarDatosEnBackend(idSeguimiento, visitaNo, datosCompletos)
        consultaId = idSeguimiento
      }

      if (consultaId && consultaId !== "Generado automáticamente") {
        setIdSeguimiento(consultaId)
      }

      if (!ok) {
        console.warn("Error en sincronización con base de datos")
      }
    } catch (e) {
      console.error("Error al sincronizar con el backend:", e)
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

  // Restaurar la función renderBloqueConsultaIndividual completa

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
          <div
            className={`w-6 h-6 bg-${color.icon.split("-")[1]}-600 rounded text-white flex items-center justify-center text-sm font-bold`}
          >
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
}
