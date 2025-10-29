"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { clienteSeguro } from "@/lib/api/clienteSeguro"
import { calcularRiesgo, validarEmbarazo, validarEcografia } from "@/lib/api/calculos"
import {
  Heart,
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
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  Droplet,
} from "lucide-react"
import { useState, useEffect } from "react"
import type React from "react"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ==================== SOLO CONFIGURACIÓN UI - SIN LÓGICA SENSIBLE ====================
// Síncope/mareo es solo informativo (no afecta cálculo)
const sintomas = [
  { id: "sincope", label: "Síncope o mareo", informativo: true },
  { id: "sangrado", label: "Sangrado vaginal" },
  { id: "dolor", label: "Dolor abdominal" },
  { id: "dolor_sangrado", label: "Dolor + Sangrado" },
  { id: "asintomatica", label: "Asintomática" },
]

const factoresRiesgo = [
  { id: "infertilidad", label: "Historia de infertilidad" },
  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
  { id: "enfermedad_inflamatoria", label: "Enfermedad inflamatoria pélvica previa" }, // Corrected ID
  { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
  { id: "sin_factores", label: "Sin factores de riesgo" },
]

// ==================== HELPERS API - SIN LÓGICA DE NEGOCIO ====================
async function enviarDatosAlBackend(datos: any): Promise<{ success: boolean; data?: any }> {
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
      return { success: false }
    }
    return { success: true, data: res.data }
  } catch (e) {
    console.error("Error llamando /api/consultas:", e)
    return { success: false }
  }
}

async function actualizarDatosEnBackend(
  folioOrId: string | number,
  visitaNo: 2 | 3,
  datosCompletos: any,
): Promise<{ success: boolean; data?: any }> {
  try {
    const patch: any = {
      sintomas_seleccionados: datosCompletos.sintomas || [],
      factores_seleccionados: datosCompletos.factores || [],
      tvus: datosCompletos.tvus || null,
      hcg_valor: datosCompletos.hcgValor ? Number(datosCompletos.hcgValor) : null,
      variacion_hcg: datosCompletos.variacionHcg || null,
      resultado: datosCompletos.resultado || null,
    }

    console.log(`[v0] 📤 Actualizando consulta ${visitaNo} para ID:`, folioOrId)
    console.log(`[v0] 📦 Datos a enviar:`, JSON.stringify(patch, null, 2))

    const res = await actualizarConsulta(folioOrId, visitaNo, patch)

    console.log(`[v0] 📨 Respuesta del servidor:`, JSON.stringify(res, null, 2))

    if (res?.error) {
      console.error("[v0] ❌ Error al actualizar:", res.error)
      return { success: false }
    }

    console.log(`[v0] ✅ Consulta ${visitaNo} actualizada exitosamente`)

    const folioNum =
      typeof folioOrId === "string" ? Number.parseInt(folioOrId.replace(/^ID-0*/, ""), 10) : Number(folioOrId)

    console.log(`[v0] 🔄 Refrescando datos desde backend...`)
    const refreshed = await leerDatosDesdeBackend(folioNum.toString())

    if (refreshed) {
      localStorage.setItem(`ectopico_folio_${refreshed.folio}`, JSON.stringify(refreshed))
      console.log(`[v0] 💾 Cache actualizado en localStorage`)
      console.log(`[v0] 🔍 Datos actualizados:`, {
        folio: refreshed.folio,
        TVUS_2: refreshed.tvus_2,
        hCG_2: refreshed.hcg_valor_2,
        Pronostico_2: refreshed.resultado_2,
        TVUS_3: refreshed.tvus_3,
        hCG_3: refreshed.hcg_valor_3,
        Pronostico_3: refreshed.resultado_3,
      })
      return { success: true, data: refreshed }
    }

    return { success: true }
  } catch (e) {
    console.error("[v0] ❌ Error en actualizarDatosEnBackend:", e)
    return { success: false }
  }
}

async function leerDatosDesdeBackend(folioOrId: string): Promise<any | null> {
  try {
    console.log(`[v0] 📥 Cargando datos para folio/ID:`, folioOrId)

    const res = await obtenerConsulta(folioOrId)

    console.log(`[v0] 📨 Respuesta GET del servidor:`, JSON.stringify(res, null, 2))

    const payload = res?.data ?? res

    if (!payload || payload.error) {
      console.error("[v0] ❌ Error al cargar:", payload?.error)
      return null
    }

    console.log("[v0] 📥 Datos cargados desde backend:", {
      folio: payload?.folio,
      tvus: payload?.tvus,
      hcg_valor: payload?.hcg_valor,
      resultado: payload?.resultado,
      tvus_2: payload?.tvus_2,
      hcg_valor_2: payload?.hcg_valor_2,
      resultado_2: payload?.resultado_2,
      tvus_3: payload?.tvus_3,
      hcg_valor_3: payload?.hcg_valor_3,
      resultado_3: payload?.resultado_3,
    })

    return payload
  } catch (e) {
    console.error("[v0] ❌ Error llamando GET /api/consultas/:id:", e)
    return null
  }
}

// ==================== FUNCIONES AUXILIARES - SOLO UI ====================
function normalizarDesdeLocal(d: any) {
  return {
    id: d.id,
    folio: d.folio,
    id_publico: d.id_publico,
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
    resultado_eco_transabdominal: d.resultadoEcoTransabdominal ?? (d.resultado_eco_transabdominal || null),
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

// Función para verificar si existe una consulta específica
function existeConsulta(consulta: any, numero: 1 | 2 | 3): boolean {
  console.log(`[v0] Checking if consultation ${numero} exists:`, {
    numero,
    consulta,
    tvus_2: consulta?.tvus_2,
    hcg_valor_2: consulta?.hcg_valor_2,
    resultado_2: consulta?.resultado_2,
    sintomas_2: consulta?.sintomas_seleccionados_2,
  })

  if (numero === 1) {
    const exists = !!(consulta.tvus || consulta.hcg_valor || consulta.resultado)
    console.log(`[v0] C1 exists: ${exists}`)
    return exists
  } else if (numero === 2) {
    const exists = !!(
      consulta.tvus_2 ||
      consulta.hcg_valor_2 ||
      consulta.resultado_2 ||
      (consulta.sintomas_seleccionados_2 && consulta.sintomas_seleccionados_2.length > 0)
    )
    console.log(`[v0] C2 exists: ${exists}`)
    return exists
  } else if (numero === 3) {
    const exists = !!(
      consulta.tvus_3 ||
      consulta.hcg_valor_3 ||
      consulta.resultado_3 ||
      (consulta.sintomas_seleccionados_3 && consulta.sintomas_seleccionados_3.length > 0)
    )
    console.log(`[v0] C3 exists: ${exists}`)
    return exists
  }
  return false
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function CalculadoraEctopico() {
  // Estados de autenticación
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)
  const [cargandoLogin, setCargandoLogin] = useState(false)

  // Estados principales
  const [nombrePaciente, setNombrePaciente] = useState("")
  const [edadPaciente, setEdadPaciente] = useState("")
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("")
  const [presionSistolica, setPresionSistolica] = useState("")
  const [presionDiastolica, setPresionDiastolica] = useState("")
  const [estadoConciencia, setEstadoConciencia] = useState("")
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState("") // Used for the result of the test
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("") // Used for the result of the test
  const [hallazgosExploracion, setHallazgosExploracion] = useState("")
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState("")
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState("")
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mensajeFinal, setMensajeFinal] = useState<React.ReactNode>("")
  const [resultado, setResultado] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // Seguimiento
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)
  const [numeroConsultaActual, setNumeroConsultaActual] = useState<1 | 2 | 3>(1)
  const [consultaAnteriorParaMostrar, setConsultaAnteriorParaMostrar] = useState<1 | 2 | 3 | null>(null)

  // Navegación y secciones
  const [pantalla, setPantalla] = useState<
    "bienvenida" | "cargar" | "resumen" | "formulario" | "finalizado" | "resultados" | "completada"
  >("bienvenida")
  const [seccionActual, setSeccion] = useState(1) // Renamed from seccionActual for clarity in the new flow
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [errorSeccion, setErrorSeccion] = useState("")

  // Consultas
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("") // TVUS result, should be 'normal', 'libre', 'masa', 'masa_libre'
  const [hcgValor, setHcgValor] = useState("") // Current hCG value
  const [variacionHcg, setVariacionHcg] = useState("") // Calculated hCG variation
  const [hcgAnterior, setHcgAnterior] = useState("") // Previous hCG value

  // Búsqueda y carga
  const [idBusqueda, setIdBusqueda] = useState("")
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(false)
  const [mostrarResumen, setMostrarResumen] = useState(false) // Added for new state

  // Estados específicos para el cálculo
  const [resultadoTVUS, setResultadoTVUS] = useState<string>("") // Renamed from 'tvus' for clarity
  const [betaHcg, setBetaHcg] = useState<string>("") // Renamed from 'hcgValor' for clarity
  const [tieneBetaHCG, setTieneBetaHCG] = useState<string>("") // Indicates if betaHCG result is available
  const [tieneTVUS, setTieneTVUS] = useState<string>("") // Indicates if TVUS result is available
  const [tieneHCG, setTieneHCG] = useState<string>("") // This state seems unused, but kept for consistency

  // New states for checklist in Section 3
  const [tienePruebaEmbarazoDisponible, setTienePruebaEmbarazoDisponible] = useState<string>("")
  const [resultadoPIE, setResultadoPIE] = useState<string>("") // Added state for PIE result
  const [tieneEcoDisponible, setTieneEcoDisponible] = useState<string>("")
  const [tieneBetaDisponible, setTieneBetaDisponible] = useState<string>("")

  // New states for sections with updated designs
  const [tienePruebaEmbarazo, setTienePruebaEmbarazo] = useState<string>("")
  const [hallazgosTVUS, setHallazgosTVUS] = useState<string>("")
  const [nivelBetaHCG, setNivelBetaHCG] = useState<string>("")

  const [guardandoConsulta, setGuardandoConsulta] = useState(false)

  const [tieneBetaSangre, setTieneBetaSangre] = useState<string>("")
  const [tienePruebaEmbarazoChecklist, setTienePruebaEmbarazoChecklist] = useState<string>("")
  const [tieneEcoTVUSChecklist, setTieneEcoTVUSChecklist] = useState<string>("")

  // ✅ Verificar autenticación al cargar
  useEffect(() => {
    const verificarAuth = async () => {
      if (clienteSeguro.isAuthenticated()) {
        const esValido = await clienteSeguro.verificarToken()
        if (esValido) {
          const usuario = clienteSeguro.getUsuario()
          setEstaAutenticado(true)
          setUsuarioActual(usuario.usuario)
          setNombreUsuario(usuario.nombre)
        } else {
          clienteSeguro.logout()
        }
      }
    }
    verificarAuth()
  }, [])

  // ==================== GUARDAR DATOS INCOMPLETOS ====================
  async function guardarDatosIncompletos(motivoFinalizacion: string, seccionCompletada: number): Promise<boolean> {
    if (guardandoConsulta) {
      console.log("[v0] ⚠️ Ya se está guardando una consulta, evitando duplicado")
      return false
    }

    setGuardandoConsulta(true)

    try {
      const fechaActual = new Date().toISOString()
      const datosIncompletos = {
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

      const result = await enviarDatosAlBackend(datosIncompletos)
      if (result.success && result.data) {
        const folio = result.data.folio
        const idPublico = `ID-${String(folio).padStart(5, "0")}`
        setIdSeguimiento(idPublico)
        localStorage.setItem(
          `ectopico_folio_${folio}`,
          JSON.stringify({
            ...datosIncompletos,
            id: result.data.id,
            folio: result.data.folio,
            id_publico: idPublico,
          }),
        )
        return true
      } else {
        console.warn("Falló el guardado en la base de datos")
        return false
      }
    } catch (error) {
      console.error("Error al guardar datos incompletos:", error)
      return false
    } finally {
      setGuardandoConsulta(false)
    }
  }

  // ==================== VALIDACIONES VIA BACKEND ÚNICAMENTE ====================
  const validarEdadPaciente = async () => {
    if (!edadPaciente) return true

    try {
      const respuesta = await calcularRiesgo({
        edadPaciente: edadPaciente,
        tvus: "normal", // Using a default value for TVUS here as it's not yet collected
        hcgValor: "1000", // Using a default value for hCG here as it's not yet collected
      })

      if (respuesta.error) {
        throw new Error(respuesta.error)
      }

      return true
    } catch (error) {
      setMensajeFinal(
        <div className="text-center">
          Error al validar la edad del paciente. Por favor, verifique su conexión e intente nuevamente.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
  }

  const validarSignosVitales = async () => {
    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (!frecuenciaCardiaca || !presionSistolica || !presionDiastolica || !estadoConciencia) {
      return true
    }

    try {
      const respuesta = await clienteSeguro.validarSignosVitales({
        frecuenciaCardiaca: frecuenciaCardiaca,
        presionSistolica: presionSistolica,
        presionDiastolica: presionDiastolica,
        estadoConciencia: estadoConciencia,
      })

      if (respuesta.esEmergencia) {
        await guardarDatosIncompletos("signos_vitales_criticos", 2)
        setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
        setProtocoloFinalizado(true)
        return false
      }

      if (respuesta.hayAlerta) {
        setMostrarAlerta(true)
        setMensajeAlerta(respuesta.mensajeAlerta)
      }

      return true
    } catch (error) {
      setMensajeFinal(
        <div className="text-center">
          Error al validar signos vitales. Por favor, verifique su conexión e intente nuevamente.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
  }

  const validarPruebaEmbarazo = async () => {
    if (!pruebaEmbarazoRealizada) return true

    try {
      const respuesta = await validarEmbarazo({
        pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
        resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
      })

      if (respuesta.debeDetener) {
        await guardarDatosIncompletos(respuesta.motivo, 3)
        setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
        setProtocoloFinalizado(true)
        return false
      }

      return true
    } catch (error) {
      setMensajeFinal(
        <div className="text-center">
          Error al validar la prueba de embarazo. Por favor, verifique su conexión e intente nuevamente.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
  }

  const validarEcoTransabdominal = async () => {
    if (!tieneEcoTransabdominal || !resultadoEcoTransabdominal) return true

    try {
      const respuesta = await validarEcografia({
        tieneEcoTransabdominal: tieneEcoTransabdominal,
        resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      })

      if (respuesta.debeDetener) {
        await guardarDatosIncompletos(respuesta.motivo, 4)
        setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
        setProtocoloFinalizado(true)
        return false
      }

      return true
    } catch (error) {
      setMensajeFinal(
        <div className="text-center">
          Error al validar la ecografía. Por favor, verifique su conexión e intente nuevamente.
        </div>,
      )
      setProtocoloFinalizado(true)
      return false
    }
  }

  const calcular = async () => {
    const currentBetaHcg = nivelBetaHCG || hcgValor
    const currentTvus = tvus

    if (!currentTvus || !currentBetaHcg) {
      alert("Por favor complete todos los campos requeridos: TVUS y β-hCG")
      return
    }

    if (esConsultaSeguimiento && numeroConsultaActual > 1 && !consultaCargada) {
      alert("Error: No existe consulta previa para calcular pretest ajustada y delta de hCG.")
      return
    }

    try {
      const resultadoV1b = consultaCargada?.resultado
      const resultadoV2c = consultaCargada?.resultado_2
      const hcgValorVisita1 = consultaCargada?.hcg_valor

      const pretestAjustado = numeroConsultaActual === 3 && resultadoV2c != null ? resultadoV2c : resultadoV1b

      console.log("[v0] Calculando riesgo con:", {
        numeroConsultaActual,
        esConsultaSeguimiento,
        resultadoV1b,
        resultadoV2c,
        pretestAjustado,
        hcgAnterior,
        hcgValor: currentBetaHcg,
        tvus: currentTvus,
      })

      const respuesta = await clienteSeguro.calcularRiesgo({
        sintomasSeleccionados: sintomasSeleccionados,
        factoresSeleccionados: factoresSeleccionados,
        tvus: currentTvus,
        hcgValor: currentBetaHcg,
        hcgAnterior: hcgAnterior,
        esConsultaSeguimiento: numeroConsultaActual > 1,
        numeroConsultaActual: numeroConsultaActual,
        resultadoV1b: resultadoV1b,
        resultadoV2c: resultadoV2c,
        hcgValorVisita1: hcgValorVisita1,
        edadPaciente: edadPaciente,
        frecuenciaCardiaca: frecuenciaCardiaca,
        presionSistolica: presionSistolica,
        presionDiastolica: presionDiastolica,
        estadoConciencia: estadoConciencia,
        pruebaEmbarazoRealizada: tienePruebaEmbarazoDisponible,
        resultadoPruebaEmbarazo: resultadoPIE,
        tieneEcoTransabdominal: tieneEcoTransabdominal,
        resultadoEcoTransabdominal: resultadoEcoTransabdominal,
      })

      if (respuesta.error) {
        alert(`Error: ${respuesta.error}`)
        return
      }

      const probPost = respuesta.resultado!
      setResultado(probPost)
      if (respuesta.variacionHcg) {
        setVariacionHcg(respuesta.variacionHcg)
      }

      console.log("[v0] Resultado calculado:", {
        resultado: probPost,
        variacionHcg: respuesta.variacionHcg,
        tipoResultado: respuesta.tipoResultado,
      })

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
        pruebaEmbarazoRealizada: tienePruebaEmbarazoDisponible,
        resultadoPruebaEmbarazo: resultadoPIE,
        hallazgosExploracion,
        tieneEcoTransabdominal,
        resultadoEcoTransabdominal,
        sintomasSeleccionados,
        factoresSeleccionados,
        tvus: currentTvus,
        hcgValor: currentBetaHcg ? Number.parseFloat(currentBetaHcg) : null,
        variacionHcg: respuesta.variacionHcg || null,
        hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
        resultado: probPost,
      }

      if (numeroConsultaActual > 1 && consultaCargada) {
        const tieneC2 = existeConsulta(consultaCargada, 2)
        const tieneC3 = existeConsulta(consultaCargada, 3)
        const visitaNo: 2 | 3 = tieneC3 ? 3 : tieneC2 ? 3 : 2

        const consultaActualizada = { ...consultaCargada }

        if (visitaNo === 2) {
          consultaActualizada.sintomas_seleccionados_2 = sintomasSeleccionados
          consultaActualizada.factores_seleccionados_2 = factoresSeleccionados
          consultaActualizada.tvus_2 = currentTvus
          consultaActualizada.hcg_valor_2 = Number.parseFloat(currentBetaHcg)
          consultaActualizada.variacion_hcg_2 = respuesta.variacionHcg || null
          consultaActualizada.resultado_2 = probPost
        } else {
          consultaActualizada.sintomas_seleccionados_3 = sintomasSeleccionados
          consultaActualizada.factores_seleccionados_3 = factoresSeleccionados
          consultaActualizada.tvus_3 = currentTvus
          consultaActualizada.hcg_valor_3 = Number.parseFloat(currentBetaHcg)
          consultaActualizada.variacion_hcg_3 = respuesta.variacionHcg || null
          consultaActualizada.resultado_3 = probPost
        }

        setConsultaCargada(consultaActualizada)

        if (consultaCargada.folio) {
          localStorage.setItem(`ectopico_folio_${consultaCargada.folio}`, JSON.stringify(consultaActualizada))
        }

        console.log("[v0] ✅ consultaCargada actualizada localmente con datos calculados")
      }

      try {
        let result = { success: false, data: null }
        if (numeroConsultaActual === 1 && !idSeguimiento) {
          result = await enviarDatosAlBackend(datosCompletos)
          if (result.success && result.data) {
            const folio = result.data.folio
            const idPublico = `ID-${String(folio).padStart(5, "0")}`
            setIdSeguimiento(idPublico)

            const consultaGuardada = {
              ...datosCompletos,
              id: result.data.id,
              folio: result.data.folio,
              id_publico: idPublico,
            }

            localStorage.setItem(`ectopico_folio_${folio}`, JSON.stringify(consultaGuardada))

            setConsultaCargada(consultaGuardada)
          }
        } else if (numeroConsultaActual > 1) {
          console.log("[v0] 🔍 Evaluando qué consulta actualizar...")
          console.log("[v0] Consulta cargada:", consultaCargada)

          const tieneC2 = existeConsulta(consultaCargada, 2)
          const tieneC3 = existeConsulta(consultaCargada, 3)

          console.log("[v0] ¿Tiene consulta 2?:", tieneC2)
          console.log("[v0] ¿Tiene consulta 3?:", tieneC3)

          const visitaNo: 2 | 3 = tieneC3 ? 3 : tieneC2 ? 3 : 2
          console.log(`[v0] 📝 Guardando como consulta ${visitaNo}`)

          const payloadParaBackend = {
            sintomas: sintomasSeleccionados,
            factores: factoresSeleccionados,
            tvus: currentTvus,
            hcgValor: currentBetaHcg ? Number(currentBetaHcg) : null,
            variacionHcg: respuesta.variacionHcg,
            resultado: probPost,
          }

          console.log("[v0] 📦 Payload para backend:", payloadParaBackend)

          const updateResult = await actualizarDatosEnBackend(idSeguimiento, visitaNo, payloadParaBackend)

          if (updateResult.success) {
            console.log("[v0] ✅ Datos guardados en backend exitosamente")

            if (updateResult.data) {
              setConsultaCargada(updateResult.data)
              if (updateResult.data.folio) {
                localStorage.setItem(`ectopico_folio_${updateResult.data.folio}`, JSON.stringify(updateResult.data))
              }
            }

            result.success = true
          } else {
            console.error("[v0] ❌ Error al guardar en backend")
            alert("Error: No se pudieron guardar los datos en la base de datos. Por favor, intente nuevamente.")
            return
          }
        } else {
          result.success = true
        }

        if (!result.success) {
          alert("Advertencia: Falló la sincronización con la base de datos.")
          return
        }
      } catch (e) {
        console.error("[v0] ❌ Error al sincronizar con el backend:", e)
        alert("Error al guardar los datos. Por favor, intente nuevamente.")
        return
      }

      if (numeroConsultaActual > 1) {
        // Consulta 2 o 3: siempre mostrar resultados
        setMostrarResultados(true)
        setMostrarIdSeguimiento(true)
        setPantalla("resultados")
        console.log("[v0] ✅ Mostrando pantalla de resultados para Consulta", numeroConsultaActual)
      } else {
        // Consulta 1: lógica original
        if (respuesta.tipoResultado === "alto" || respuesta.tipoResultado === "bajo") {
          setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
          setProtocoloFinalizado(true)
          setPantalla("finalizado")
        } else {
          setMostrarResultados(true)
          setMostrarIdSeguimiento(true)
          setPantalla("resultados")
        }
      }
    } catch (error) {
      console.error("[v0] ❌ Error en cálculo:", error)
      alert("Error al calcular el riesgo. Por favor, intente nuevamente.")
    }
  }

  // ====== FUNCIONES PRINCIPALES ======
  const iniciarNuevaEvaluacion = async () => {
    resetCalculadora()
    setPantalla("formulario")
    setSeccion(1) // Start from section 1 for new evaluations
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const resetCalculadora = () => {
    setResultado(null)
    setSeccion(1)
    setSeccionesCompletadas([])
    setGuardandoConsulta(false)
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
    setTvus("") // Resetting original tvus state
    setHcgValor("") // Resetting original hcgValor state
    setVariacionHcg("")
    setHcgAnterior("")
    setTieneTVUS("")
    setTieneHCG("") // This state seems unused, but kept for consistency
    setBetaHcg("") // Reset betaHcg state
    setIdBusqueda("")
    setConsultaAnteriorParaMostrar(null) // Reset state to null
    setNumeroConsultaActual(1) // Reset to 1
    setEsConsultaSeguimiento(false) // Reset to false
    setModoCargarConsulta(false)
    setMostrarResumenConsulta(false)
    setMostrarPantallaBienvenida(false)
    setConsultaCargada(null)
    setPantalla("bienvenida")
    setMostrarResultados(false)
    setMostrarAlerta(false)
    setMensajeAlerta("")
    setTieneBetaHCG("") // Reset tieneBetaHCG state
    setErrorSeccion("")
    setMostrarResumen(false) // Resetting new state

    // Resetting states related to the calculation itself
    setResultadoTVUS("")

    // Resetting new checklist states
    setTieneBetaSangre("")
    setTienePruebaEmbarazoChecklist("")
    setTieneEcoTVUSChecklist("")

    // Resetting states for updated designs
    setTienePruebaEmbarazoDisponible("")
    setResultadoPIE("") // Resetting the new state
    setTieneEcoDisponible("")
    setTieneBetaDisponible("")
    setTienePruebaEmbarazo("")
    setHallazgosTVUS("")
    setNivelBetaHCG("")
  }

  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!/^ID-\d{5}$/.test(id)) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    let consultaEncontrada: any = null
    const folioNumerico = Number.parseInt(id.replace(/^ID-0*/, ""), 10)

    try {
      const res = await leerDatosDesdeBackend(folioNumerico.toString())
      if (res) {
        consultaEncontrada = res
        console.log("[v0] ✅ Consulta loaded from backend:", consultaEncontrada)
        // Update localStorage cache
        localStorage.setItem(`ectopico_folio_${res.folio}`, JSON.stringify(res))
      }
    } catch (error) {
      console.error("[v0] ❌ Error al buscar en backend:", error)
    }

    if (!consultaEncontrada) {
      const datosLocal = localStorage.getItem(`ectopico_folio_${folioNumerico}`)
      if (datosLocal) {
        try {
          consultaEncontrada = normalizarDesdeLocal(JSON.parse(datosLocal))
          console.log("[v0] ⚠️ Consulta loaded from localStorage (fallback):", consultaEncontrada)
        } catch (error) {
          console.warn("[v0] Error al parsear datos de localStorage:", error)
        }
      }
    }

    if (consultaEncontrada) {
      console.log("✅ Consulta encontrada y cargada:", consultaEncontrada)
      console.log("[v0] Checking consultations after load:")
      console.log("[v0] C1 exists:", existeConsulta(consultaEncontrada, 1))
      console.log("[v0] C2 exists:", existeConsulta(consultaEncontrada, 2))
      console.log("[v0] C3 exists:", existeConsulta(consultaEncontrada, 3))

      setConsultaCargada(consultaEncontrada)
      setPantalla("resumen")
      setModoCargarConsulta(false)
    } else {
      alert("No se encontró ninguna consulta con ese ID")
    }
  }

  const continuarConsultaCargada = async () => {
    console.log("🔄 Continuing consulta cargada:", consultaCargada)

    const fc = Number.parseFloat(consultaCargada.frecuencia_cardiaca?.toString() || "0")
    const sistolica = Number.parseFloat(consultaCargada.presion_sistolica?.toString() || "0")
    const diastolica = Number.parseFloat(consultaCargada.presion_diastolica?.toString() || "0")
    const conciencia = consultaCargada.estado_conciencia || ""

    // Check for critical vital signs or altered consciousness
    const tieneCriteriosEmergencia =
      sistolica >= 180 ||
      diastolica >= 110 ||
      fc > 120 ||
      fc < 50 ||
      (fc > 100 && (sistolica <= 90 || diastolica <= 60)) ||
      conciencia === "somnolienta" ||
      conciencia === "estuporosa" ||
      conciencia === "comatosa"

    if (tieneCriteriosEmergencia) {
      alert(
        "⚠️ SEGUIMIENTO BLOQUEADO\n\n" +
          "Esta paciente presenta signos vitales críticos o alteración del estado de conciencia que requieren atención médica inmediata.\n\n" +
          "No se puede continuar con el seguimiento ambulatorio. Se recomienda:\n" +
          "• Acudir de<bos>immediate a urgencias\n" +
          "• Monitoreo continuo de signos vitales\n" +
          "• Evaluación médica presencial\n\n" +
          "La herramienta de seguimiento está diseñada para pacientes estables.",
      )
      return
    }

    const folioNumeric = Number(
      (consultaCargada.id_publico || consultaCargada.folio || "").toString().replace(/^ID-0*/, ""),
    )

    console.log("[v0] 🔍 Fetching previous visit from backend...")
    try {
      // Assuming your API endpoint structure for fetching previous visits
      const prevResponse = await fetch(`/api/consultas/${folioNumeric}?scope=previous`)
      const prev = await prevResponse.json()

      if (!prev || prev.error || !prev.visit_number) {
        alert("No existe consulta previa para continuar.")
        return
      }

      console.log("[v0] 📥 Previous visit data:", prev)

      // Determine next visit number based on previous visit
      const nextVisit = Math.min((prev.visit_number ?? 1) + 1, 3) as 2 | 3

      if (nextVisit > 3) {
        alert("Esta consulta ya tiene 3 evaluaciones completadas.")
        setPantalla("resumen")
        return
      }

      // Check if can continue based on previous result
      if (prev.resultado != null && (prev.resultado >= 0.95 || prev.resultado < 0.01)) {
        alert("La última consulta ya tiene una decisión final (confirmar o descartar). No se puede continuar.")
        setPantalla("resumen")
        return
      }

      // Set consultation number and previous data
      setNumeroConsultaActual(nextVisit)
      setConsultaAnteriorParaMostrar(prev.visit_number as 1 | 2 | 3)
      setHcgAnterior((prev.hcg ?? "").toString()) // Assuming 'hcg' is the key for hCG value in the previous visit response

      console.log(`[v0] ➡️ Será consulta ${nextVisit}, usando C${prev.visit_number} como anterior`)
      console.log(`[v0] 📊 hCG anterior: ${prev.hcg}`)
      console.log(`[v0] 📊 Resultado anterior: ${prev.resultado}`)
    } catch (error) {
      console.error("[v0] ❌ Error fetching previous visit:", error)
      alert("Error al obtener la consulta anterior. Por favor intente de nuevo.")
      return
    }

    setIdSeguimiento(consultaCargada.id_publico || consultaCargada.folio || consultaCargada.id?.toString())

    // Mantener datos del paciente
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
    setTvus("") // Resetting original tvus state
    setHcgValor("") // Resetting original hcgValor state
    setEsConsultaSeguimiento(true)

    setPantalla("formulario")
    setSeccion(7) // Changed from 7 to 4 for section 7 (TVUS)
    setMostrarResumenConsulta(false)
    setMostrarPantallaBienvenida(false)
    setModoCargarConsulta(false)
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
        return "Masa anexial + Líquido libre"
      default:
        return tvusId
    }
  }

  const copiarId = () => {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado al portapapeles")
    }
  }

  const volverAInicio = () => resetCalculadora()

  const completarSeccion = (seccion: number) => {
    setErrorSeccion("")
    if (!seccionesCompletadas.includes(seccion)) {
      setSeccionesCompletadas([...seccionesCompletadas, seccion])
    }
    // FIX: The original code had `setSeccionActual` undeclared.
    // This line was changed to `setSeccion` to use the existing state setter.
    setSeccion(seccion + 1)
  }

  const generarInformePDF = async () => {
    try {
      // Load jsPDF dynamically from CDN
      if (!(window as any).jspdf) {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        document.head.appendChild(script)

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
        })
      }

      const { jsPDF } = (window as any).jspdf
      const doc = new jsPDF()

      let y = 20
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20

      const checkPageBreak = (requiredSpace = 20) => {
        if (y > pageHeight - margin - requiredSpace) {
          doc.addPage()
          y = 20
          return true
        }
        return false
      }

      const addTitle = (text: string, color: [number, number, number] = [41, 98, 255]) => {
        checkPageBreak(15)
        doc.setFillColor(...color)
        doc.rect(margin, y - 5, pageWidth - 2 * margin, 12, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(text, margin + 5, y + 2)
        doc.setTextColor(0, 0, 0)
        y += 15
      }

      const addSubtitle = (text: string) => {
        checkPageBreak(10)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(60, 60, 60)
        doc.text(text, margin, y)
        y += 8
        doc.setTextColor(0, 0, 0)
      }

      const addText = (text: string, indent = 0, fontSize = 10) => {
        checkPageBreak()
        doc.setFontSize(fontSize)
        doc.setFont("helvetica", "normal")
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - indent)
        lines.forEach((line: string) => {
          checkPageBreak()
          doc.text(line, margin + indent, y)
          y += 6
        })
      }

      const addBullet = (text: string) => {
        checkPageBreak()
        doc.setFontSize(10)
        doc.circle(margin + 2, y - 1.5, 1, "F")
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - 10)
        lines.forEach((line: string, index: number) => {
          checkPageBreak()
          doc.text(line, margin + 8, y)
          y += 6
        })
      }

      const addInfoBox = (label: string, value: string, color: [number, number, number] = [245, 247, 250]) => {
        checkPageBreak(12)
        doc.setFillColor(...color)
        doc.roundedRect(margin, y - 4, pageWidth - 2 * margin, 10, 2, 2, "F")
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(label + ":", margin + 3, y + 2)
        doc.setFont("helvetica", "normal")
        const fixedLabelWidth = 60 // Fixed width for all labels
        doc.text(value, margin + 3 + fixedLabelWidth, y + 2)
        y += 13
      }

      const addDivider = () => {
        checkPageBreak(5)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(margin, y, pageWidth - margin, y)
        y += 8
      }

      doc.setFillColor(41, 98, 255)
      doc.rect(0, 0, pageWidth, 35, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("REPORTE DE APOYO CLÍNICO", pageWidth / 2, 15, { align: "center" })
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Herramienta de Evaluación - Embarazo Ectópico", pageWidth / 2, 25, { align: "center" })
      doc.setTextColor(0, 0, 0)
      y = 45

      doc.setFillColor(232, 245, 233)
      doc.roundedRect(margin, y, (pageWidth - 2 * margin - 5) / 2, 25, 2, 2, "F")
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text("ID de Consulta", margin + 5, y + 6)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text(idSeguimiento, margin + 5, y + 13)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text("Fecha:  " + new Date().toLocaleDateString(), margin + 5, y + 19)

      doc.setFillColor(227, 242, 253)
      doc.roundedRect(margin + (pageWidth - 2 * margin + 5) / 2, y, (pageWidth - 2 * margin - 5) / 2, 25, 2, 2, "F")
      doc.setFontSize(9)
      doc.text("Médico Responsable", margin + (pageWidth - 2 * margin + 5) / 2 + 5, y + 6)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text(nombreUsuario, margin + (pageWidth - 2 * margin + 5) / 2 + 5, y + 13)
      doc.setTextColor(0, 0, 0)
      y += 33

      addTitle("DATOS DEL PACIENTE", [76, 175, 80])
      addInfoBox("Nombre", nombrePaciente, [232, 245, 233])
      addInfoBox("Edad", `${edadPaciente} años`, [232, 245, 233])
      y += 3

      addTitle("SIGNOS VITALES", [33, 150, 243])
      addInfoBox("Frecuencia Cardíaca", `${frecuenciaCardiaca} lpm`, [227, 242, 253])
      addInfoBox("Presión Arterial", `${presionSistolica}/${presionDiastolica} mmHg`, [227, 242, 253])
      addInfoBox("Estado de Conciencia", estadoConciencia, [227, 242, 253])
      y += 3

      addTitle("ESTUDIOS COMPLEMENTARIOS", [156, 39, 176])
      addInfoBox("Ecografía Transvaginal", obtenerNombreTVUS(tvus), [243, 229, 245])
      addInfoBox("β-hCG en sangre", nivelBetaHCG ? `${nivelBetaHCG} mUI/mL` : "No disponible", [243, 229, 245])
      if (hcgAnterior) {
        addInfoBox("β-hCG Anterior", `${hcgAnterior} mUI/mL`, [243, 229, 245])
      }
      y += 3

      addTitle("SÍNTOMAS PRESENTES", [255, 152, 0])
      if (sintomasSeleccionados.length > 0) {
        sintomasSeleccionados.forEach((s) => {
          addBullet(obtenerNombreSintoma(s))
        })
      } else {
        addBullet("Sin síntomas reportados")
      }
      y += 3

      addTitle("FACTORES DE RIESGO", [244, 67, 54])
      if (factoresSeleccionados.length > 0) {
        factoresSeleccionados.forEach((f) => {
          addBullet(obtenerNombreFactorRiesgo(f))
        })
      } else {
        addBullet("Sin factores de riesgo identificados")
      }
      y += 3

      addTitle("RESULTADO DE LA EVALUACIÓN", [103, 58, 183])
      if (resultado != null) {
        const riesgoColor: [number, number, number] =
          resultado >= 0.95 ? [255, 235, 238] : resultado < 0.01 ? [232, 245, 233] : [255, 243, 224]
        const riesgoTextColor: [number, number, number] =
          resultado >= 0.95 ? [198, 40, 40] : resultado < 0.01 ? [46, 125, 50] : [245, 124, 0]

        doc.setFillColor(...riesgoColor)
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, "F")
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...riesgoTextColor)
        doc.text(`Estimación de Riesgo: ${(resultado * 100).toFixed(1)}%`, margin + 5, y + 8)
        const clasificacion =
          resultado >= 0.95
            ? "Alta probabilidad de embarazo ectópico"
            : resultado < 0.01
              ? "Baja probabilidad de embarazo ectópico"
              : "Probabilidad intermedia de embarazo ectópico"
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Clasificación: ${clasificacion}`, margin + 5, y + 15)
        doc.setTextColor(0, 0, 0)
        y += 28
      }

      addTitle("RECOMENDACIONES CLÍNICAS", [0, 150, 136])
      const recomendacion =
        resultado != null
          ? resultado >= 0.95
            ? "Se recomienda referencia inmediata a centro especializado para evaluación y manejo quirúrgico si es necesario."
            : resultado < 0.01
              ? "Se recomienda seguimiento con ginecólogo de confianza y monitoreo constante del embarazo."
              : "Se recomienda guardar el código de consulta y regresar en 48-72 horas con nueva ecografía transvaginal y nueva prueba de β-hCG para seguimiento."
          : "Evaluación en proceso"

      doc.setFillColor(224, 247, 250)
      const recLines = doc.splitTextToSize(recomendacion, pageWidth - 2 * margin - 10)
      const recHeight = recLines.length * 6 + 8
      checkPageBreak(recHeight)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, recHeight, 2, 2, "F")
      doc.setFontSize(10)
      let tempY = y + 6
      recLines.forEach((line: string) => {
        doc.text(line, margin + 5, tempY)
        tempY += 6
      })
      y += recHeight + 5

      checkPageBreak(35)
      doc.setFillColor(250, 250, 250)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 32, 2, 2, "FD")
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(100, 100, 100)
      doc.text("DESCARGO DE RESPONSABILIDAD", margin + 5, y + 6)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.text(
        "Esta herramienta es únicamente de apoyo clínico y no reemplaza el juicio médico profesional.",
        margin + 5,
        y + 12,
      )
      doc.text(
        "El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.",
        margin + 5,
        y + 17,
      )
      doc.text("Esta aplicación no constituye un dispositivo médico de diagnóstico.", margin + 5, y + 22)
      doc.text("Los resultados deben interpretarse en el contexto clínico completo del paciente.", margin + 5, y + 27)
      doc.setTextColor(0, 0, 0)
      y += 38

      doc.setFillColor(41, 98, 255)
      doc.rect(0, pageHeight - 15, pageWidth, 15, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("Desarrollado por CMG Health Solutions - Herramienta de Apoyo Clínico", pageWidth / 2, pageHeight - 7, {
        align: "center",
      })
      doc.setFontSize(7)
      doc.text(`Generado el ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 3, { align: "center" })

      // Save PDF
      doc.save(`Reporte_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      alert("Error al generar el reporte: " + (error as Error).message)
    }
  }

  // ✅ LOGIN SEGURO
  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")
    setCargandoLogin(true)

    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
      setCargandoLogin(false)
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
        setErrorLogin(resultado.error || `Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`)
        setContraseña("")
      }
    } catch (error) {
      setIntentosLogin((prev) => prev + 1)
      setErrorLogin(`Error de conexión. Intento ${intentosLogin + 1} de 5.`)
      setContraseña("")
    } finally {
      setCargandoLogin(false)
    }
  }

  const cerrarSesion = () => {
    clienteSeguro.logout()
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
        Esta herramienta es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico.
        <br />
        El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
      </p>
    </div>
  )

  // IMPROVED PROGRESS BAR COMPONENT
  const ProgressBar = () => {
    const totalSecciones = 8 // Updated to 8 sections
    const progreso = (seccionesCompletadas.length / totalSecciones) * 100

    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{seccionesCompletadas.length}</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">Progreso de la Evaluación</span>
            </div>
            <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full shadow-sm">
              {seccionesCompletadas.length} de {totalSecciones} completadas
            </span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progreso}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
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
                    disabled={intentosLogin >= 5 || cargandoLogin}
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
                      disabled={intentosLogin >= 5 || cargandoLogin}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setMostrarContraseña(!mostrarContraseña)}
                      disabled={intentosLogin >= 5 || cargandoLogin}
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
                  disabled={intentosLogin >= 5 || cargandoLogin}
                >
                  {cargandoLogin ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : intentosLogin >= 5 ? (
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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

      {pantalla === "bienvenida" ? (
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
                      setPantalla("cargar")
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
      ) : pantalla === "cargar" ? (
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
                    inicial. Ingrese el ID de seguimiento.
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
                        setPantalla("bienvenida")
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
      ) : pantalla === "resumen" && consultaCargada ? (
        <div className="max-w-6xl mx-auto p-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">📋 Historial Clínico Completo</h2>
                      <p className="text-slate-600">Registro completo de todas las consultas</p>
                    </div>
                  </div>
                </div>

                {/* Información del Paciente */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">Información del Paciente</h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                        <span className="font-semibold text-blue-700 block mb-1">ID de Seguimiento</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">ID</span>
                          </div>
                          <span className="font-mono text-blue-600 font-bold">
                            {consultaCargada.id_publico || consultaCargada.folio}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-1">Última Actualización</span>
                        <div className="text-slate-600 text-xs">
                          {consultaCargada.fecha_ultima_actualizacion || consultaCargada.fechaUltimaActualizacion
                            ? new Date(
                                consultaCargada.fecha_ultima_actualizacion || consultaCargada.fechaUltimaActualizacion,
                              ).toLocaleString()
                            : "No disponible"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-1">Paciente</span>
                        <div className="font-semibold text-slate-800">
                          {consultaCargada.nombre_paciente || "No especificado"},{" "}
                          {consultaCargada.edad_paciente || "N/A"} años
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-1">Signos Vitales</span>
                        <div className="text-slate-600 text-sm">
                          FC: {consultaCargada.frecuencia_cardiaca || "N/A"} lpm | PA:{" "}
                          {consultaCargada.presion_sistolica || "N/A"}/{consultaCargada.presion_diastolica || "N/A"}{" "}
                          mmHg
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-1">Fecha de Creación</span>
                        <div className="text-slate-600 text-sm">
                          {consultaCargada.fecha_creacion || consultaCargada.fechaCreacion
                            ? new Date(
                                consultaCargada.fecha_creacion || consultaCargada.fechaCreacion,
                              ).toLocaleDateString()
                            : "No disponible"}
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-1">Estado de Conciencia</span>
                        <div className="text-slate-600 capitalize text-sm">
                          {consultaCargada.estado_conciencia || "No especificado"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consulta 1 - Siempre se muestra si existe */}
                {existeConsulta(consultaCargada, 1) && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">📋 Consulta 1 - Evaluación Inicial</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Síntomas Presentes</span>
                          <div className="text-slate-600">
                            {consultaCargada.sintomas_seleccionados && consultaCargada.sintomas_seleccionados.length > 0
                              ? consultaCargada.sintomas_seleccionados
                                  .map((s: string) => obtenerNombreSintoma(s))
                                  .join(", ")
                              : "Ninguno"}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Factores de Riesgo</span>
                          <div className="text-slate-600">
                            {consultaCargada.factores_seleccionados && consultaCargada.factores_seleccionados.length > 0
                              ? consultaCargada.factores_seleccionados
                                  .map((f: string) => obtenerNombreFactorRiesgo(f))
                                  .join(", ")
                              : "Ninguno"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">TVUS</span>
                          <div className="text-slate-600">{obtenerNombreTVUS(consultaCargada.tvus)}</div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">β-hCG</span>
                          <div className="text-slate-600">{consultaCargada.hcg_valor || "N/A"} mUI/mL</div>
                        </div>
                        {consultaCargada.resultado != null && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                            <span className="font-semibold text-blue-700 block mb-1">Resultado</span>
                            <div className="text-blue-900 font-bold text-lg">
                              {(consultaCargada.resultado * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Consulta 2 - Solo se muestra si existe */}
                {existeConsulta(consultaCargada, 2) && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">📋 Consulta 2 - Seguimiento</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Síntomas Presentes</span>
                          <div className="text-slate-600">
                            {consultaCargada.sintomas_seleccionados_2 &&
                            consultaCargada.sintomas_seleccionados_2.length > 0
                              ? consultaCargada.sintomas_seleccionados_2
                                  .map((s: string) => obtenerNombreSintoma(s))
                                  .join(", ")
                              : "Ninguno"}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Factores de Riesgo</span>
                          <div className="text-slate-600">
                            {consultaCargada.factores_seleccionados_2 &&
                            consultaCargada.factores_seleccionados_2.length > 0
                              ? consultaCargada.factores_seleccionados_2
                                  .map((f: string) => obtenerNombreFactorRiesgo(f))
                                  .join(", ")
                              : "Mantenidos de consulta anterior"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">TVUS</span>
                          <div className="text-slate-600">{obtenerNombreTVUS(consultaCargada.tvus_2)}</div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">β-hCG</span>
                          <div className="text-slate-600">{consultaCargada.hcg_valor_2 || "N/A"} mUI/mL</div>
                        </div>
                        {consultaCargada.variacion_hcg_2 && (
                          <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-slate-700 block mb-1">Variación β-hCG</span>
                            <div className="text-slate-600">{consultaCargada.variacion_hcg_2}</div>
                          </div>
                        )}
                        {consultaCargada.resultado_2 != null && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-200">
                            <span className="font-semibold text-amber-700 block mb-1">Resultado</span>
                            <div className="text-amber-900 font-bold text-lg">
                              {(consultaCargada.resultado_2 * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Consulta 3 - Solo se muestra si existe */}
                {existeConsulta(consultaCargada, 3) && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-800">📋 Consulta 3 - Seguimiento Final</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Síntomas Presentes</span>
                          <div className="text-slate-600">
                            {consultaCargada.sintomas_seleccionados_3 &&
                            consultaCargada.sintomas_seleccionados_3.length > 0
                              ? consultaCargada.sintomas_seleccionados_3
                                  .map((s: string) => obtenerNombreSintoma(s))
                                  .join(", ")
                              : "Ninguno"}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">Factores de Riesgo</span>
                          <div className="text-slate-600">
                            {consultaCargada.factores_seleccionados_3 &&
                            consultaCargada.factores_seleccionados_3.length > 0
                              ? consultaCargada.factores_seleccionados_3
                                  .map((f: string) => obtenerNombreFactorRiesgo(f))
                                  .join(", ")
                              : "Mantenidos de consulta anterior"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">TVUS</span>
                          <div className="text-slate-600">{obtenerNombreTVUS(consultaCargada.tvus_3)}</div>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                          <span className="font-semibold text-slate-700 block mb-1">β-hCG</span>
                          <div className="text-slate-600">{consultaCargada.hcg_valor_3 || "N/A"} mUI/mL</div>
                        </div>
                        {consultaCargada.variacion_hcg_3 && (
                          <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded-lg">
                            <span className="font-semibold text-slate-700 block mb-1">Variación β-hCG</span>
                            <div className="text-slate-600">{consultaCargada.variacion_hcg_3}</div>
                          </div>
                        )}
                        {consultaCargada.resultado_3 != null && (
                          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                            <span className="font-semibold text-purple-700 block mb-1">Resultado</span>
                            <div className="text-purple-900 font-bold text-lg">
                              {(consultaCargada.resultado_3 * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                {(() => {
                  const tieneC2 = existeConsulta(consultaCargada, 2)
                  const tieneC3 = existeConsulta(consultaCargada, 3)

                  const ultimoResultado = tieneC3
                    ? consultaCargada.resultado_3
                    : tieneC2
                      ? consultaCargada.resultado_2
                      : consultaCargada.resultado

                  const esDecisionFinal = ultimoResultado != null && (ultimoResultado >= 0.95 || ultimoResultado < 0.01)
                  const puedeContinuar = !tieneC3 && !esDecisionFinal

                  const proximaConsulta = tieneC2 ? 3 : 2

                  return puedeContinuar ? (
                    <div className="flex justify-center">
                      <Button
                        onClick={continuarConsultaCargada}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Continuar a Consulta {proximaConsulta}
                      </Button>
                    </div>
                  ) : null
                })()}

                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : pantalla === "completada" ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <h2 className="text-3xl font-bold text-slate-800">Evaluación Incompleta</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">
                    {typeof mensajeFinal === "string" ? (
                      <div className="space-y-4">
                        <p className="font-medium text-lg">
                          {mensajeFinal.includes("tres estudios")
                            ? "Se necesitan realizar los tres estudios (prueba de embarazo cuantitativa, ecografía transvaginal y β-hCG en sangre) para poder continuar con la evaluación."
                            : mensajeFinal.includes("siguientes estudios")
                              ? "Se necesitan realizar los siguientes estudios para poder continuar con la evaluación:"
                              : mensajeFinal}
                        </p>
                        {(mensajeFinal.includes("prueba de embarazo") ||
                          mensajeFinal.includes("ecografía transvaginal") ||
                          mensajeFinal.includes("β-hCG")) && (
                          <ul className="list-none space-y-2 ml-4">
                            {mensajeFinal.includes("prueba de embarazo") && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Prueba de embarazo cualitativa (PIE)</span>
                              </li>
                            )}
                            {mensajeFinal.includes("ecografía transvaginal") && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>Ecografía transvaginal (TVUS)</span>
                              </li>
                            )}
                            {mensajeFinal.includes("β-hCG") && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>β-hCG en sangre</span>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className="font-medium">{mensajeFinal}</div>
                    )}
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Información Guardada</span>
                  </div>
                  <div className="text-green-800 text-sm space-y-2">
                    <p>✅ Los datos de esta consulta han sido guardados exitosamente</p>
                    <div className="flex items-center space-x-2">
                      <span>📋 ID de Consulta:</span>
                      <span className="font-mono font-bold">{idSeguimiento}</span>
                      <Button
                        onClick={copiarId}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-green-100"
                        title="Copiar ID"
                      >
                        <Copy className="h-3 w-3 text-green-700" />
                      </Button>
                    </div>
                    <p>
                      👤 Paciente: {nombrePaciente}, {edadPaciente} años
                    </p>
                    <p>💾 Sección completada: {Math.max(...seccionesCompletadas, seccionActual - 1)} de 8</p>
                    <p>💾 Esta información estará disponible para análisis y seguimiento médico</p>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={volverAInicio}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 text-lg"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Regresar al Inicio
                  </Button>
                </div>

                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : pantalla === "resultados" ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Resultados de la Evaluación</h2>
                </div>

                {resultado !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      Estimación de Riesgo - Consulta {numeroConsultaActual}
                    </h3>
                    <div className="text-5xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                    <p className="text-blue-800 text-sm">
                      {resultado >= 0.95
                        ? "Alta probabilidad de embarazo ectópico"
                        : resultado < 0.01
                          ? "Baja probabilidad de embarazo ectópico"
                          : "Probabilidad intermedia de embarazo ectópico"}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">
                    {resultado !== null ? (
                      resultado < 0.01 ? (
                        <>
                          <strong>Bajas probabilidades de embarazo ectópico.</strong>
                          <br />
                          <br />
                          Se recomienda mantener un monitoreo constante con su ginecólogo de confianza y estar atenta a
                          cualquier cambio en los síntomas.
                        </>
                      ) : resultado >= 0.95 ? (
                        <>
                          <strong>Alta probabilidad de embarazo ectópico.</strong>
                          <br />
                          <br />
                          Se recomienda referencia inmediata a un centro médico especializado para evaluación y manejo
                          apropiado.
                        </>
                      ) : (
                        <>
                          <strong>Probabilidad intermedia de embarazo ectópico.</strong>
                          <br />
                          <br />
                          Guarde el código de consulta (disponible abajo para copiar) y regrese en 48 a 72 horas con
                          nueva ecografía transvaginal y nueva prueba de β-hCG para seguimiento.
                        </>
                      )
                    ) : (
                      "Los datos de esta consulta han sido guardados exitosamente."
                    )}
                  </p>
                </div>

                {mostrarIdSeguimiento && idSeguimiento && (
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">Información Guardada</span>
                    </div>
                    <div className="text-green-800 text-sm space-y-2">
                      <p>✅ Los datos de esta consulta han sido guardados exitosamente</p>
                      <div className="flex items-center space-x-2">
                        <span>📋 ID de Consulta:</span>
                        <span className="font-mono font-bold">{idSeguimiento}</span>
                        <Button
                          onClick={copiarId}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-green-100"
                          title="Copiar ID"
                        >
                          <Copy className="h-3 w-3 text-green-700" />
                        </Button>
                      </div>
                      <p>
                        👤 Paciente: {nombrePaciente}, {edadPaciente} años
                      </p>
                      <p>💾 Esta información estará disponible para análisis y seguimiento médico</p>
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
                    Generar Reporte
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
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {/* SECCION 1: Datos del Paciente */}
                {seccionActual === 1 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Datos del Paciente</h2>
                          <p className="text-sm text-slate-600">Información básica de la paciente</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Nombre Completo</span>
                        </Label>
                        <input
                          type="text"
                          placeholder="Ingrese el nombre de la paciente"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Edad</span>
                        </Label>
                        <input
                          type="number"
                          placeholder="Edad en años"
                          value={edadPaciente}
                          onChange={(e) => setEdadPaciente(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                        />
                        <span className="text-xs text-slate-500 mt-1 block">años</span>
                      </div>
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => {
                          if (!nombrePaciente || !edadPaciente) {
                            setErrorSeccion("Por favor, complete todos los campos.")
                            return
                          }
                          setSeccion(2)
                          completarSeccion(1)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {/* SECCION 2: Signos Vitales */}
                {seccionActual === 2 && (
                  <div className="space-y-6">
                    {/* Applied modern card design to vital signs section */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Signos Vitales</h2>
                          <p className="text-sm text-slate-600">Mediciones clínicas actuales</p>
                        </div>
                      </div>
                    </div>

                    {mostrarAlerta && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-200 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-amber-900 block mb-1">Sugerencia Clínica</span>
                            <p className="text-amber-800 text-sm leading-relaxed">{mensajeAlerta}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow-md">
                          <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>Frecuencia Cardíaca</span>
                          </Label>
                          <input
                            type="number"
                            placeholder="60-100"
                            value={frecuenciaCardiaca}
                            onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                          />
                          <span className="text-xs text-slate-500 mt-1 block">lpm</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow-md">
                          <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>Presión Sistólica</span>
                          </Label>
                          <input
                            type="number"
                            placeholder="90-140"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                          />
                          <span className="text-xs text-slate-500 mt-1 block">mmHg</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-emerald-200 transition-all duration-200 shadow-sm hover:shadow-md">
                          <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span>Presión Diastólica</span>
                          </Label>
                          <input
                            type="number"
                            placeholder="60-90"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-200"
                          />
                          <span className="text-xs text-slate-500 mt-1 block">mmHg</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Estado de Conciencia</span>
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: "alerta", label: "Alerta", color: "emerald" },
                            { value: "somnolienta", label: "Somnolienta", color: "amber" },
                            { value: "estuporosa", label: "Estuporosa", color: "orange" },
                            { value: "comatosa", label: "Comatosa", color: "red" },
                          ].map((opcion) => (
                            <label
                              key={opcion.value}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                estadoConciencia === opcion.value
                                  ? `border-${opcion.color}-500 bg-${opcion.color}-50 shadow-md`
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="estadoConciencia"
                                value={opcion.value}
                                checked={estadoConciencia === opcion.value}
                                onChange={(e) => setEstadoConciencia(e.target.value)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  estadoConciencia === opcion.value
                                    ? `border-${opcion.color}-500 bg-${opcion.color}-500`
                                    : "border-gray-300"
                                }`}
                              >
                                {estadoConciencia === opcion.value && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{opcion.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(1)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!frecuenciaCardiaca || !presionSistolica || !presionDiastolica || !estadoConciencia) {
                            setErrorSeccion("Por favor, complete todos los campos de signos vitales.")
                            return
                          }
                          if (await validarSignosVitales()) {
                            setSeccion(3)
                            completarSeccion(2)
                          }
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {/* SECCION 3: Síntomas y Factores de Riesgo */}
                {seccionActual === 3 && (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Síntomas y Factores de Riesgo</h2>
                          <p className="text-sm text-gray-600 mt-1">Evaluación clínica de la paciente</p>
                        </div>
                      </div>

                      {/* Síntomas Presentes */}
                      <div className="space-y-4 mb-8">
                        <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          Síntomas Presentes
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {sintomas.map((s) => {
                            const isChecked = sintomasSeleccionados.includes(s.id)
                            const isAsintomatica = s.id === "asintomatica"
                            const hayOtrosSintomas = sintomasSeleccionados.some(
                              (id) => id !== "asintomatica" && id !== "sincope",
                            )

                            // Si hay otros síntomas (sangrado/dolor), deshabilitar asintomática
                            const isDisabled = isAsintomatica && hayOtrosSintomas

                            return (
                              <label
                                key={s.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                                  isChecked
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                                } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={(e) => {
                                    if (isAsintomatica && e.target.checked) {
                                      // Si selecciona asintomática, limpiar otros síntomas (excepto síncope)
                                      setSintomasSeleccionados(["asintomatica"])
                                    } else if (isAsintomatica && !e.target.checked) {
                                      // Si deselecciona asintomática
                                      setSintomasSeleccionados(
                                        sintomasSeleccionados.filter((id) => id !== "asintomatica"),
                                      )
                                    } else if (e.target.checked) {
                                      // Si selecciona otro síntoma, quitar asintomática
                                      setSintomasSeleccionados([
                                        ...sintomasSeleccionados.filter((id) => id !== "asintomatica"),
                                        s.id,
                                      ])
                                    } else {
                                      // Si deselecciona
                                      setSintomasSeleccionados(sintomasSeleccionados.filter((id) => id !== s.id))
                                    }
                                  }}
                                  className="h-4 w-4 rounded-md border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                  {s.label}
                                  {s.informativo && <span className="ml-1 text-xs text-gray-500">(informativo)</span>}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Factores de Riesgo */}
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          Factores de Riesgo
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {factoresRiesgo.map((f) => {
                            const isChecked = factoresSeleccionados.includes(f.id)
                            const isSinFactores = f.id === "sin_factores"
                            const hayOtrosFactores = factoresSeleccionados.some((id) => id !== "sin_factores")
                            const isDisabled = isSinFactores && hayOtrosFactores

                            return (
                              <label
                                key={f.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                                  isChecked
                                    ? "border-orange-500 bg-orange-50"
                                    : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                                } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={(e) => {
                                    if (isSinFactores && e.target.checked) {
                                      setFactoresSeleccionados(["sin_factores"])
                                    } else if (isSinFactores && !e.target.checked) {
                                      setFactoresSeleccionados(
                                        factoresSeleccionados.filter((id) => id !== "sin_factores"),
                                      )
                                    } else if (e.target.checked) {
                                      setFactoresSeleccionados([
                                        ...factoresSeleccionados.filter((id) => id !== "sin_factores"),
                                        f.id,
                                      ])
                                    } else {
                                      setFactoresSeleccionados(factoresSeleccionados.filter((id) => id !== f.id))
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">{f.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button onClick={() => setSeccion(2)} variant="outline" className="gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (sintomasSeleccionados.length === 0) {
                            alert("Por favor selecciona al menos un síntoma")
                            return
                          }
                          if (factoresSeleccionados.length === 0) {
                            alert("Por favor selecciona al menos un factor de riesgo (o 'Sin factores de riesgo')")
                            return
                          }
                          setSeccion(4)
                          completarSeccion(3)
                        }}
                        className="gap-2 bg-teal-600 hover:bg-teal-700"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECCION 4: PIE - Prueba de Embarazo Cualitativa */}
                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                          <ClipboardList className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                          <p className="text-sm text-slate-600">Verificación de prueba cualitativa</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      Por favor, indique si la paciente cuenta con el siguiente estudio:
                    </p>

                    <div className="space-y-4">
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>¿Se realizó la PIE (Prueba de Embarazo)?</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["si", "no"].map((opcion) => (
                            <label
                              key={opcion}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                tienePruebaEmbarazoDisponible === opcion
                                  ? "border-purple-500 bg-purple-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tienePruebaEmbarazoDisponible"
                                value={opcion}
                                checked={tienePruebaEmbarazoDisponible === opcion}
                                onChange={(e) => {
                                  setTienePruebaEmbarazoDisponible(e.target.value)
                                  setResultadoPIE("")
                                }}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  tienePruebaEmbarazoDisponible === opcion
                                    ? "border-purple-500 bg-purple-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {tienePruebaEmbarazoDisponible === opcion && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">{opcion}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {tienePruebaEmbarazoDisponible === "si" && (
                        <div className="bg-white p-5 rounded-xl border-2 border-purple-200 transition-all duration-200 shadow-sm">
                          <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>¿Resultado de la prueba?</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            {["positivo", "negativo"].map((resultado) => (
                              <label
                                key={resultado}
                                className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  resultadoPIE === resultado
                                    ? "border-purple-500 bg-purple-50 shadow-md"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="resultadoPIE"
                                  value={resultado}
                                  checked={resultadoPIE === resultado}
                                  onChange={(e) => setResultadoPIE(e.target.value)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    resultadoPIE === resultado ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                  }`}
                                >
                                  {resultadoPIE === resultado && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-sm font-medium text-slate-700 capitalize">{resultado}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(3)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!tienePruebaEmbarazoDisponible) {
                            setErrorSeccion("Por favor seleccione si tiene la prueba realizada")
                            return
                          }

                          if (tienePruebaEmbarazoDisponible === "si" && !resultadoPIE) {
                            setErrorSeccion("Por favor seleccione el resultado de la prueba")
                            return
                          }

                          if (tienePruebaEmbarazoDisponible === "si" && resultadoPIE === "negativo") {
                            setMensajeFinal(
                              "Según los resultados de su prueba de embarazo, no puede ser considerado un embarazo ectópico. Por favor, contacte con su médico para determinar el motivo de sus síntomas.",
                            )
                            await guardarDatosIncompletos("prueba_negativa", 4)
                            setPantalla("completada")
                            setMostrarResumen(false)
                            setProtocoloFinalizado(true)
                            return
                          }

                          if (tienePruebaEmbarazoDisponible === "no") {
                            setMensajeFinal(
                              "Se necesita realizar una prueba de embarazo cualitativa (PIE) para poder continuar con la evaluación. Por favor, acuda a un laboratorio clínico y regrese cuando tenga el resultado.",
                            )
                            await guardarDatosIncompletos("estudios_faltantes", 4)
                            setPantalla("completada")
                            setMostrarResumen(false)
                            setProtocoloFinalizado(true)
                          } else {
                            setErrorSeccion("")
                            setSeccion(5)
                            completarSeccion(4)
                          }
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {/* SECCION 5: Eco Transabdominal */}
                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <Stethoscope className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                          <p className="text-sm text-slate-600">Ecografía transabdominal y exploración física</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-cyan-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <span>Hallazgos de Exploración Física</span>
                        </Label>
                        <textarea
                          placeholder="Describa los hallazgos relevantes..."
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all duration-200 resize-none"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <span>¿Tiene ecografía transabdominal?</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["si", "no"].map((opcion) => (
                            <label
                              key={opcion}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                tieneEcoTransabdominal === opcion
                                  ? "border-cyan-500 bg-cyan-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tieneEcoTransabdominal"
                                value={opcion}
                                checked={tieneEcoTransabdominal === opcion}
                                onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  tieneEcoTransabdominal === opcion ? "border-cyan-500 bg-cyan-500" : "border-gray-300"
                                }`}
                              >
                                {tieneEcoTransabdominal === opcion && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">{opcion}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {tieneEcoTransabdominal === "si" && (
                        <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                          <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span>Resultado de la ecografía</span>
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { value: "saco_embrionario_fc", label: "Saco embrionario con FC" },
                              { value: "saco_vitelino_embrion", label: "Saco vitelino con embrión" },
                              { value: "saco_vitelino_sin_embrion", label: "Saco vitelino sin embrión" },
                              { value: "saco_sin_embrion", label: "Saco sin embrión" },
                              { value: "saco_10mm_anillo_2mm", label: "Saco ≥10mm con anillo decidual ≥2mm" },
                              { value: "ausencia_saco", label: "Ausencia de saco" },
                            ].map((opcion) => (
                              <label
                                key={opcion.value}
                                className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  resultadoEcoTransabdominal === opcion.value
                                    ? "border-cyan-500 bg-cyan-50 shadow-md"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="resultadoEcoTransabdominal"
                                  value={opcion.value}
                                  checked={resultadoEcoTransabdominal === opcion.value}
                                  onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    resultadoEcoTransabdominal === opcion.value
                                      ? "border-cyan-500 bg-cyan-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {resultadoEcoTransabdominal === opcion.value && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-700">{opcion.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(4)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!tieneEcoTransabdominal) {
                            setErrorSeccion("Por favor, seleccione si tiene ecografía transabdominal.")
                            return
                          }

                          if (tieneEcoTransabdominal === "si" && !resultadoEcoTransabdominal) {
                            setErrorSeccion("Por favor, seleccione el resultado de la ecografía.")
                            return
                          }

                          const opcionesQueBloquean = [
                            "saco_embrionario_fc",
                            "saco_vitelino_embrion",
                            "saco_vitelino_sin_embrion",
                            "saco_sin_embrion",
                            "saco_10mm_anillo_2mm",
                          ]

                          if (
                            tieneEcoTransabdominal === "si" &&
                            opcionesQueBloquean.includes(resultadoEcoTransabdominal)
                          ) {
                            await guardarDatosIncompletos(
                              "Los hallazgos ecográficos transabdominales presentan evidencia que sugiere que no se trata de un embarazo ectópico. Se recomienda seguimiento obstétrico apropiado.",
                              5,
                            )
                            setMensajeFinal(
                              <div className="text-center">
                                Los hallazgos ecográficos transabdominales presentan evidencia que sugiere que no se
                                trata de un embarazo ectópico. Se recomienda seguimiento obstétrico apropiado.
                              </div>,
                            )
                            setProtocoloFinalizado(true)
                            setPantalla("completada")
                            setMostrarResumen(false)
                          } else {
                            setErrorSeccion("")
                            setSeccion(6)
                            completarSeccion(5)
                          }
                        }}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {/* SECCION 6: TVUS y β-hCG Disponibles */}
                {seccionActual === 6 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                          <ClipboardList className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">Estudios Complementarios</h2>
                          <p className="text-sm text-slate-600">Verificación de estudios realizados</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      Por favor, indique si la paciente cuenta con los siguientes estudios realizados:
                    </p>

                    <div className="space-y-4">
                      {/* Eco TVUS */}
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>¿Cuenta con ecografía transvaginal (TVUS)?</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["si", "no"].map((opcion) => (
                            <label
                              key={opcion}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                tieneEcoDisponible === opcion
                                  ? "border-purple-500 bg-purple-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tieneEcoDisponible"
                                value={opcion}
                                checked={tieneEcoDisponible === opcion}
                                onChange={(e) => setTieneEcoDisponible(e.target.value)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  tieneEcoDisponible === opcion ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                }`}
                              >
                                {tieneEcoDisponible === opcion && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">{opcion}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Beta hCG */}
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>¿Cuenta con resultado de β-hCG en sangre?</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["si", "no"].map((opcion) => (
                            <label
                              key={opcion}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                tieneBetaDisponible === opcion
                                  ? "border-purple-500 bg-purple-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="tieneBetaDisponible"
                                value={opcion}
                                checked={tieneBetaDisponible === opcion}
                                onChange={(e) => setTieneBetaDisponible(e.target.value)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  tieneBetaDisponible === opcion ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                }`}
                              >
                                {tieneBetaDisponible === opcion && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">{opcion}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(5)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!tieneEcoDisponible || !tieneBetaDisponible) {
                            setErrorSeccion("Por favor llene todos los campos")
                            return
                          }

                          // Check how many are "no"
                          const faltantes = []
                          if (tieneEcoDisponible === "no") faltantes.push("ecografía transvaginal (TVUS)")
                          if (tieneBetaDisponible === "no") faltantes.push("β-hCG en sangre")

                          if (faltantes.length > 0) {
                            let mensaje = ""
                            if (faltantes.length === 2) {
                              mensaje =
                                "Se necesitan realizar los siguientes estudios para poder continuar con la evaluación: ecografía transvaginal (TVUS) y β-hCG en sangre. Por favor, acuda a un laboratorio clínico y regrese cuando tenga los resultados."
                            } else {
                              mensaje = `Se necesita realizar ${faltantes[0]} para poder continuar con la evaluación. Por favor, acuda a un laboratorio clínico y regrese cuando tenga el resultado.`
                            }

                            setMensajeFinal(mensaje)
                            await guardarDatosIncompletos("estudios_faltantes", 6)
                            setPantalla("completada")
                            setMostrarResumen(false)
                            setProtocoloFinalizado(true)
                          } else {
                            // All are "si", continue
                            setErrorSeccion("")
                            setSeccion(7)
                            completarSeccion(6)
                          }
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {/* SECCION 7: TVUS */}
                {seccionActual === 7 && (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Ecografía Transvaginal (TVUS)</h2>
                          <p className="text-sm text-gray-600 mt-1">Hallazgos ecográficos</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-purple-900">
                          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                          Hallazgos en TVUS
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: "masa", label: "Masa anexial" },
                            { value: "libre", label: "Líquido libre" },
                            { value: "masa_libre", label: "Masa anexial + Líquido libre" },
                            { value: "normal", label: "Normal" },
                          ].map((opcion) => (
                            <button
                              key={opcion.value}
                              type="button"
                              onClick={() => setTvus(opcion.value)}
                              className={`
                                w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200
                                flex items-center gap-3 text-left
                                ${
                                  tvus === opcion.value
                                    ? "border-purple-500 bg-purple-50 shadow-md"
                                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                                }
                              `}
                            >
                              <div
                                className={`
                                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                  ${tvus === opcion.value ? "border-purple-500 bg-purple-500" : "border-gray-300"}
                                `}
                              >
                                {tvus === opcion.value && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{opcion.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {errorSeccion && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                        <p className="text-sm text-red-700">{errorSeccion}</p>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(6)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={() => {
                          if (!tvus) {
                            setErrorSeccion("Por favor seleccione los hallazgos en TVUS.")
                            return
                          }
                          setSeccion(8)
                          completarSeccion(7)
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* SECCION 8: β-hCG */}
                {seccionActual === 8 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                          <Droplet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">β-hCG en Sangre</h2>
                          <p className="text-sm text-slate-600">Nivel cuantitativo de β-hCG</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-teal-200 transition-all duration-200 shadow-sm hover:shadow-md">
                        <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                          <span>Valor de β-hCG</span>
                        </Label>
                        <input
                          type="number"
                          placeholder="Ingrese el valor"
                          value={nivelBetaHCG}
                          onChange={(e) => setNivelBetaHCG(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all duration-200"
                        />
                        <span className="text-xs text-slate-500 mt-1 block">mUI/mL</span>
                      </div>
                    </div>

                    {errorSeccion && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-red-700 font-medium">{errorSeccion}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        onClick={() => setSeccion(7)}
                        variant="outline"
                        className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!nivelBetaHCG) {
                            setErrorSeccion("Por favor, ingrese el valor de β-hCG.")
                            return
                          }
                          await calcular()
                        }}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Calcular Riesgo
                        <ChevronRight className="ml-2 h-4 w-4" />
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
