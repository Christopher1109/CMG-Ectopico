"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { clienteSeguro } from "@/lib/api/clienteSeguro"
import { calcularRiesgo, validarEmbarazo, validarEcografia } from "@/lib/api/calculos"
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
import { useState, useEffect } from "react"
import type React from "react"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ==================== SOLO CONFIGURACIÓN UI - SIN LÓGICA SENSIBLE ====================
const factoresRiesgo = [
  { id: "infertilidad", label: "Historia de infertilidad" },
  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
  { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
  { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
]

const sintomas = [
  { id: "infertilidad", label: "Historia de infertilidad" },
  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
  { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
  { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
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

async function actualizarDatosEnBackend(folioOrId: string, visitaNo: 2 | 3, datos: any): Promise<boolean> {
  try {
    const patch = {
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus || null,
      hcg_valor: Number.isFinite(+datos.hcgValor) ? +datos.hcgValor : null,
      variacion_hcg: datos.variacionHcg || null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
    }

    console.log(`📤 Actualizando consulta ${visitaNo}:`, patch)

    const res = await actualizarConsulta(folioOrId, visitaNo, patch)
    if (res?.error) {
      console.error("API PATCH /api/consultas error:", res.error)
      return false
    }

    console.log("✅ Consulta actualizada exitosamente")
    return true
  } catch (e) {
    console.error("Error llamando PATCH /api/consultas:", e)
    return false
  }
}

async function leerDatosDesdeBackend(folioOrId: string): Promise<any | null> {
  try {
    const res = await obtenerConsulta(folioOrId)
    if (res?.error) return null

    console.log("📥 Datos cargados desde backend:", res?.data)
    return res?.data ?? null
  } catch (e) {
    console.error("Error llamando GET /api/consultas/:id:", e)
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
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState("")
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("")
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

  // Búsqueda y carga
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)

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
        presionDiastolica: presionDiastolica ? Number.parseInt(presionDiastolica) : null, // Corrected typo here
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
    }
  }

  // ==================== VALIDACIONES VIA BACKEND ÚNICAMENTE ====================
  const validarEdadPaciente = async () => {
    if (!edadPaciente) return true

    try {
      const respuesta = await calcularRiesgo({
        edadPaciente: edadPaciente,
        tvus: "normal",
        hcgValor: "1000",
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
    if (!tvus || !hcgValor) {
      alert("Por favor complete todos los campos requeridos: TVUS y β-hCG")
      return
    }

    if (esConsultaSeguimiento && !consultaCargada) {
      alert("Error: No existe consulta previa para calcular pretest ajustada y delta de hCG.")
      return
    }

    try {
      const resultadoV1b = consultaCargada?.resultado
      const resultadoV2c = consultaCargada?.resultado_2
      const hcgValorVisita1 = consultaCargada?.hcg_valor

      // For C3, use C2 result as pretest (not C1)
      const pretestAjustado = numeroConsultaActual === 3 && resultadoV2c != null ? resultadoV2c : resultadoV1b

      console.log("[v0] Calculando riesgo con:", {
        numeroConsultaActual,
        esConsultaSeguimiento,
        resultadoV1b,
        resultadoV2c,
        pretestAjustado,
        hcgAnterior,
        hcgValor,
      })

      const respuesta = await clienteSeguro.calcularRiesgo({
        sintomasSeleccionados: sintomasSeleccionados,
        factoresSeleccionados: factoresSeleccionados,
        tvus: tvus,
        hcgValor: hcgValor,
        hcgAnterior: hcgAnterior,
        esConsultaSeguimiento: esConsultaSeguimiento,
        numeroConsultaActual: numeroConsultaActual,
        resultadoV1b: resultadoV1b,
        resultadoV2c: resultadoV2c,
        hcgValorVisita1: hcgValorVisita1,
        edadPaciente: edadPaciente,
        frecuenciaCardiaca: frecuenciaCardiaca,
        presionSistolica: presionSistolica,
        presionDiastolica: presionDiastolica,
        estadoConciencia: estadoConciencia,
        pruebaEmbarazoRealizada: pruebaEmbarazoRealizada,
        resultadoPruebaEmbarazo: resultadoPruebaEmbarazo,
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
        pruebaEmbarazoRealizada,
        resultadoPruebaEmbarazo,
        hallazgosExploracion,
        tieneEcoTransabdominal,
        resultadoEcoTransabdominal,
        sintomasSeleccionados,
        factoresSeleccionados,
        tvus,
        hcgValor: Number.parseFloat(hcgValor),
        variacionHcg: respuesta.variacionHcg || null,
        hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
        resultado: probPost,
      }

      try {
        let result = { success: false, data: null }
        if (!esConsultaSeguimiento) {
          result = await enviarDatosAlBackend(datosCompletos)
          if (result.success && result.data) {
            const folio = result.data.folio
            const idPublico = `ID-${String(folio).padStart(5, "0")}`
            setIdSeguimiento(idPublico)
            localStorage.setItem(
              `ectopico_folio_${folio}`,
              JSON.stringify({
                ...datosCompletos,
                id: result.data.id,
                folio: result.data.folio,
                id_publico: idPublico,
              }),
            )
          }
        } else {
          console.log("🔍 Evaluando qué consulta actualizar...")
          console.log("Consulta cargada:", consultaCargada)

          const tieneC2 = existeConsulta(consultaCargada, 2)
          const tieneC3 = existeConsulta(consultaCargada, 3)

          console.log("¿Tiene consulta 2?:", tieneC2)
          console.log("¿Tiene consulta 3?:", tieneC3)

          const visitaNo: 2 | 3 = tieneC3 ? 3 : tieneC2 ? 3 : 2
          console.log(`📝 Guardando como consulta ${visitaNo}`)

          const ok = await actualizarDatosEnBackend(idSeguimiento, visitaNo, datosCompletos)
          result.success = ok
        }
        if (!result.success) {
          alert("Advertencia: Falló la sincronización con la base de datos.")
        }
      } catch (e) {
        console.error("Error al sincronizar con el backend:", e)
        alert("Advertencia: Falló la sincronización con la base de datos.")
      }

      if (respuesta.tipoResultado === "alto" || respuesta.tipoResultado === "bajo") {
        setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
        setProtocoloFinalizado(true)
      } else {
        setMostrarResultados(true)
        setMostrarIdSeguimiento(true)
      }
    } catch (error) {
      console.error("Error en el cálculo:", error)
      alert("Error al realizar el cálculo. Por favor, inténtelo de nuevo.")
    }
  }

  // ====== FUNCIONES PRINCIPALES ======
  const iniciarNuevaEvaluacion = async () => {
    resetCalculadora()
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const resetToHome = () => {
    // Clear all form state
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
    setSintomasSeleccionados([])
    setFactoresSeleccionados([])
    setTvus("")
    setHcgValor("")
    setHcgAnterior("")
    setResultado(null)
    setIdSeguimiento("")
    setIdBusqueda("")
    setConsultaCargada(null)
    setNumeroConsultaActual(1)
    setEsConsultaSeguimiento(false)

    // Clear localStorage draft data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("form_") || key.startsWith("consult_") || key.includes("Draft")) {
        localStorage.removeItem(key)
      }
    })

    // Reset to welcome screen
    setMostrarPantallaBienvenida(true)
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setProtocoloFinalizado(false)
    setSeccionActual(1)
    setSeccionesCompletadas([])
  }

  const continuarConsultaCargada = async () => {
    console.log("🔄 Continuing consulta cargada:", consultaCargada)

    setIdSeguimiento(consultaCargada.id_publico || consultaCargada.folio?.toString() || consultaCargada.id?.toString())

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

    // Limpiar campos para nueva consulta
    setSintomasSeleccionados([])
    setFactoresSeleccionados(consultaCargada.factores_seleccionados || [])
    setTvus("")

    const tieneC2 = existeConsulta(consultaCargada, 2)
    const tieneC3 = existeConsulta(consultaCargada, 3)

    let consultaAnteriorNumero: 1 | 2 | 3 = 1
    let ultimoHcg: number | null = null
    let ultimoResultado: number | null = null

    if (tieneC3) {
      // If C3 exists, we cannot continue (max 3 consultations)
      alert("Esta consulta ya tiene 3 evaluaciones completadas.")
      setMostrarResumenConsulta(true)
      return
    } else if (tieneC2) {
      // If C2 exists, use C2 as previous (will create C3)
      consultaAnteriorNumero = 2
      ultimoHcg = consultaCargada.hcg_valor_2
      ultimoResultado = consultaCargada.resultado_2
      setNumeroConsultaActual(3)
      console.log("➡️ Será consulta 3, usando C2 como anterior")
    } else {
      // If only C1 exists, use C1 as previous (will create C2)
      consultaAnteriorNumero = 1
      ultimoHcg = consultaCargada.hcg_valor
      ultimoResultado = consultaCargada.resultado
      setNumeroConsultaActual(2)
      console.log("➡️ Será consulta 2, usando C1 como anterior")
    }

    // Check if can continue
    if (ultimoResultado != null && (ultimoResultado >= 0.95 || ultimoResultado < 0.01)) {
      alert("La última consulta ya tiene una decisión final (confirmar o descartar). No se puede continuar.")
      setMostrarResumenConsulta(true)
      return
    }

    setConsultaAnteriorParaMostrar(consultaAnteriorNumero)

    setHcgAnterior(ultimoHcg?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    console.log("🔍 Análisis de consultas:")
    console.log("Consulta anterior a mostrar:", consultaAnteriorNumero)
    console.log("Último hCG:", ultimoHcg)
    console.log("Último resultado:", ultimoResultado)

    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  // === BÚSQUEDA: usa SIEMPRE el backend ===
  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!/^ID-\d{5}$/.test(id)) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    let consultaEncontrada: any = null

    const folioNumerico = Number.parseInt(id.replace(/^ID-0*/, ""), 10)
    const datosLocal = localStorage.getItem(`ectopico_folio_${folioNumerico}`)
    if (datosLocal) {
      try {
        consultaEncontrada = normalizarDesdeLocal(JSON.parse(datosLocal))
        console.log("[v0] Consulta loaded from localStorage:", consultaEncontrada)
      } catch (error) {
        console.warn("Error al parsear datos de localStorage:", error)
      }
    }

    if (!consultaEncontrada) {
      try {
        const res = await leerDatosDesdeBackend(folioNumerico)
        if (res) {
          consultaEncontrada = res
          console.log("[v0] Consulta loaded from backend:", consultaEncontrada)
          localStorage.setItem(`ectopico_folio_${res.folio}`, JSON.stringify(consultaEncontrada))
        }
      } catch (error) {
        console.error("Error al buscar en backend:", error)
      }
    }

    if (consultaEncontrada) {
      console.log("✅ Consulta encontrada y cargada:", consultaEncontrada)
      console.log("[v0] Checking consultations after load:")
      console.log("[v0] Has C1:", existeConsulta(consultaEncontrada, 1))
      console.log("[v0] Has C2:", existeConsulta(consultaEncontrada, 2))
      console.log("[v0] Has C3:", existeConsulta(consultaEncontrada, 3))

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
    setConsultaAnteriorParaMostrar(1) // Reset new state
  }

  const generarInformePDF = () => {
    try {
      const recomendacionTexto =
        resultado != null
          ? resultado >= 0.95
            ? "Se sugiere considerar alta probabilidad - Evaluación médica recomendada"
            : resultado < 0.01
              ? "Se sugiere considerar baja probabilidad - Seguimiento médico recomendado"
              : "Probabilidad intermedia - Seguimiento médico requerido"
          : "Evaluación en proceso"

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
${resultado != null ? `Estimación de riesgo: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

RECOMENDACIÓN DE APOYO:
${recomendacionTexto}

DESCARGO DE RESPONSABILIDAD:
Esta herramienta es<bos>únicamente de apoyo clínico y no reemplaza el juicio médico profesional.
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
      document.body.removeChild(a)
      alert("Reporte de apoyo generado y descargado exitosamente")
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      alert("Error al generar el reporte. Por favor, inténtelo de nuevo.")
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
        Esta aplicación es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico.
        <br />
        El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
      </p>
    </div>
  )

  const ProgressBar = () => {
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
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
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

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
                  <p className="text-blue-900 font-medium">{mensajeFinal}</p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Información Guardada</span>
                  </div>
                  <div className="text-green-800 text-sm space-y-2">
                    <p>✅ Los datos de esta consulta han sido guardados exitosamente</p>
                    <p>
                      📋 ID de Consulta: <span className="font-mono font-bold">{idSeguimiento}</span>
                    </p>
                    <p>
                      👤 Paciente: {nombrePaciente}, {edadPaciente} años
                    </p>
                    <p>📊 Sección completada: {Math.max(...seccionesCompletadas, seccionActual - 1)} de 5</p>
                    <p>💾 Esta información estará disponible para análisis y seguimiento médico</p>
                  </div>
                </div>

                {resultado !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Estimación de Riesgo Sugerida</h3>
                    <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                    <p className="text-blue-800 text-sm">
                      {resultado >= 0.95
                        ? "Se sugiere considerar alta probabilidad - Evaluación médica recomendada"
                        : resultado < 0.01
                          ? "Se sugiere considerar baja probabilidad - Seguimiento médico recomendado"
                          : "Probabilidad intermedia - Seguimiento médico requerido"}
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
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Header */}
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

                {/* Resultado */}
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

                {/* ID seguimiento */}
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
                            <span className="text-white text-xs font-bold">ID</span>
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
                          <li>• Mantener vigilancia de los síntomas durante este tiempo</li>
                          <li>
                            • Acudir de inmediato si presenta dolor severo, sangrado abundante o síntomas de shock
                          </li>
                          <li>• La decisión final siempre corresponde al médico tratante</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones */}
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
      ) : (
        <div>
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
                        onClick={async () => {
                          if (await validarEdadPaciente()) completarSeccion(1)
                        }}
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="flex justify-between">
                      <Button
                        onClick={() => setSeccionActual(1)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
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
                      <FileText className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium text-slate-700">
                        ¿Se realizó prueba de embarazo cualitativa?
                      </Label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                          <input
                            type="radio"
                            name="pruebaEmbarazo"
                            value="si"
                            checked={pruebaEmbarazoRealizada === "si"}
                            onChange={(e) => {
                              setPruebaEmbarazoRealizada(e.target.value)
                              setMostrarAlerta(false)
                              setMensajeAlerta("")
                            }}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-base font-medium text-slate-700">Sí</span>
                        </label>

                        <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                          <input
                            type="radio"
                            name="pruebaEmbarazo"
                            value="no"
                            checked={pruebaEmbarazoRealizada === "no"}
                            onChange={(e) => {
                              setPruebaEmbarazoRealizada(e.target.value)
                              setResultadoPruebaEmbarazo("")
                            }}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-base font-medium text-slate-700">No</span>
                        </label>
                      </div>
                    </div>

                    {pruebaEmbarazoRealizada === "si" && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-700">Resultado de la prueba</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                            <input
                              type="radio"
                              name="resultadoPrueba"
                              value="positiva"
                              checked={resultadoPruebaEmbarazo === "positiva"}
                              onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-base font-medium text-slate-700">Positiva</span>
                          </label>

                          <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                            <input
                              type="radio"
                              name="resultadoPrueba"
                              value="negativa"
                              checked={resultadoPruebaEmbarazo === "negativa"}
                              onChange={async (e) => {
                                setResultadoPruebaEmbarazo(e.target.value)
                                if (e.target.value === "negativa") {
                                  try {
                                    const respuesta = await validarEmbarazo({
                                      pruebaEmbarazoRealizada: "si",
                                      resultadoPruebaEmbarazo: "negativa",
                                    })
                                    if (respuesta.debeDetener) {
                                      await guardarDatosIncompletos(respuesta.motivo, 3)
                                      setMensajeFinal(<div className="text-center">{respuesta.mensaje}</div>)
                                      setProtocoloFinalizado(true)
                                    }
                                  } catch (error) {
                                    console.warn("Error en validación inmediata:", error)
                                  }
                                }
                              }}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-base font-medium text-slate-700">Negativa</span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        onClick={() => setSeccionActual(2)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
                      <div className="text-center">
                        <Button
                          onClick={async () => {
                            if (pruebaEmbarazoRealizada === "no") {
                              setMostrarAlerta(true)
                              setMensajeAlerta(
                                "Se recomienda realizar una prueba de embarazo cualitativa antes de continuar con la evaluación.",
                              )

                              setTimeout(async () => {
                                await guardarDatosIncompletos("prueba_embarazo_no_realizada", 3)
                                setMensajeFinal(
                                  <div className="text-center">
                                    Se recomienda realizar una prueba de embarazo antes de proseguir.
                                  </div>,
                                )
                                setProtocoloFinalizado(true)
                              }, 2000)
                            } else {
                              if (await validarPruebaEmbarazo()) completarSeccion(3)
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>

                    <CMGFooter />
                  </div>
                )}

                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Hallazgos de Exploración Física</Label>
                        <textarea
                          placeholder="Describa los hallazgos relevantes..."
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base font-medium text-slate-700">¿Tiene ecografía transabdominal?</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                            <input
                              type="radio"
                              name="tieneEco"
                              value="si"
                              checked={tieneEcoTransabdominal === "si"}
                              onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-base font-medium text-slate-700">Sí</span>
                          </label>
                          <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                            <input
                              type="radio"
                              name="tieneEco"
                              value="no"
                              checked={tieneEcoTransabdominal === "no"}
                              onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-base font-medium text-slate-700">No</span>
                          </label>
                        </div>
                      </div>

                      {tieneEcoTransabdominal === "si" && (
                        <div className="space-y-3">
                          <Label className="text-base font-medium text-slate-700">Resultado de la ecografía</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { value: "saco_embrion_fc", label: "Saco embrionario con FC" },
                              { value: "saco_vitelino_embrion", label: "Saco vitelino con embrión" },
                              { value: "saco_vitelino_sin_embrion", label: "Saco vitelino sin embrión" },
                              { value: "saco_sin_embrion", label: "Saco sin embrión" },
                              { value: "saco_10mm_decidual_2mm", label: "Saco ≥10mm con anillo decidual ≥2mm" },
                              { value: "ausencia_saco", label: "Ausencia de saco" },
                            ].map((opcion) => (
                              <label
                                key={opcion.value}
                                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name="resultadoEco"
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

                    <div className="flex justify-between">
                      <Button
                        onClick={() => setSeccionActual(3)}
                        variant="outline"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Anterior
                      </Button>
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
                    </div>
                    <CMGFooter />
                  </div>
                )}

                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-3">
                        <Calculator className="h-8 w-8" />
                        <div>
                          <h2 className="text-2xl font-bold">Calculadora de Riesgo de Embarazo Ectópico</h2>
                          <p className="text-blue-100 text-sm">
                            Herramienta de apoyo clínico para la evaluación del riesgo de embarazo ectópico
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Evaluación de Riesgo</h3>
                      </div>

                      <div className="space-y-8">
                        {/* Síntomas */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Síntomas Presentes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { id: "sangrado", label: "Sangrado vaginal" },
                              { id: "dolor", label: "Dolor pélvico/abdominal" },
                              { id: "dolor_sangrado", label: "Sangrado + Dolor" },
                              { id: "sincope", label: "Síncope o mareo" },
                            ].map((op) => (
                              <label
                                key={op.id}
                                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={sintomasSeleccionados.includes(op.id)}
                                    onChange={(e) =>
                                      setSintomasSeleccionados((prev) =>
                                        e.target.checked ? [...prev, op.id] : prev.filter((id) => id !== op.id),
                                      )
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      sintomasSeleccionados.includes(op.id)
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-gray-300 hover:border-blue-400"
                                    }`}
                                  >
                                    {sintomasSeleccionados.includes(op.id) && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Factores de Riesgo */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">Factores de Riesgo</h4>
                            {esConsultaSeguimiento && (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Mantenidos de consulta anterior
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {factoresRiesgo.map((factor) => (
                              <label
                                key={factor.id}
                                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={factoresSeleccionados.includes(factor.id)}
                                    onChange={(e) =>
                                      setFactoresSeleccionados((prev) =>
                                        e.target.checked ? [...prev, factor.id] : prev.filter((id) => id !== factor.id),
                                      )
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      factoresSeleccionados.includes(factor.id)
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-gray-300 hover:border-blue-400"
                                    }`}
                                  >
                                    {factoresSeleccionados.includes(factor.id) && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{factor.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* TVUS */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            Ecografía Transvaginal (TVUS)
                            {!tvus && (
                              <span className="text-xs text-red-600 block font-normal mt-1">
                                * Campo requerido - Seleccione una opción
                              </span>
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { value: "normal", label: "Normal" },
                              { value: "libre", label: "Líquido libre" },
                              { value: "masa", label: "Masa anexial" },
                              { value: "masa_libre", label: "Masa anexial + líquido libre" },
                            ].map((op) => (
                              <label
                                key={op.value}
                                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="relative">
                                  <input
                                    type="radio"
                                    name="tvus"
                                    value={op.value}
                                    checked={tvus === op.value}
                                    onChange={(e) => setTvus(e.target.value)}
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      tvus === op.value
                                        ? "bg-blue-600 border-blue-600"
                                        : "border-gray-300 hover:border-blue-400"
                                    }`}
                                  >
                                    {tvus === op.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{op.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* β-hCG actual */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">
                            β-hCG actual (mUI/mL)
                            {!hcgValor && (
                              <span className="text-xs text-red-600 block font-normal mt-1">
                                * Campo requerido - Ingrese el valor
                              </span>
                            )}
                          </h4>
                          <input
                            type="number"
                            placeholder="Valor actual"
                            value={hcgValor}
                            onChange={(e) => setHcgValor(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700"
                          />
                        </div>

                        {/* β-hCG previo */}
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

                      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <Button
                          onClick={() => setSeccionActual(4)}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Anterior
                        </Button>
                        <Button
                          onClick={calcular}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg"
                        >
                          <Calculator className="h-5 w-5 mr-2" />
                          Calcular Riesgo
                        </Button>
                      </div>
                    </div>

                    <CMGFooter />
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
