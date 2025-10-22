"use client"
import { clienteSeguro } from "@/lib/api/clienteSeguro"
import { calcularRiesgo, validarEmbarazo, validarEcografia } from "@/lib/api/calculos"
import { useState, useEffect } from "react"
import type React from "react"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"
import { Button } from "@/components/ui/button"
import { Heart, Home, Copy, User } from "lucide-react"

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
  if (numero === 1) {
    return !!(consulta.tvus || consulta.hcg_valor || consulta.resultado)
  } else if (numero === 2) {
    return !!(
      consulta.tvus_2 ||
      consulta.hcg_valor_2 ||
      consulta.resultado_2 ||
      (consulta.sintomas_seleccionados_2 && consulta.sintomas_seleccionados_2.length > 0)
    )
  } else if (numero === 3) {
    return !!(
      consulta.tvus_3 ||
      consulta.hcg_valor_3 ||
      consulta.resultado_3 ||
      (consulta.sintomas_seleccionados_3 && consulta.sintomas_seleccionados_3.length > 0)
    )
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
  const volverAPantallaBienvenida = () => {
    if (confirm("¿Está seguro que desea regresar al inicio? Se perderá el progreso actual si no ha guardado.")) {
      resetCalculadora()
      setMostrarPantallaBienvenida(true)
      setModoCargarConsulta(false)
      setMostrarResumenConsulta(false)
      setProtocoloFinalizado(false)
      setMostrarResultados(false)
      setSeccionActual(1)
    }
  }

  const resetCalculadora = () => {
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
    setVariacionHcg("")
    setHcgAnterior("")
    setResultado(null)
    setMostrarResultados(false)
    setProtocoloFinalizado(false)
    setMensajeFinal("")
    setMostrarAlerta(false)
    setMensajeAlerta("")
    setIdSeguimiento("")
    setMostrarIdSeguimiento(false)
    setIdBusqueda("")
    setConsultaCargada(null)
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setSeccionActual(1)
    setSeccionesCompletadas([])
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const volverAInicio = () => {
    resetCalculadora()
    setMostrarPantallaBienvenida(true)
    setModoCargarConsulta(false)
    setMostrarResumenConsulta(false)
    setProtocoloFinalizado(false)
    setMostrarResultados(false)
  }

  // === FUNCIONES DE NAVEGACIÓN ===
  const iniciarNuevaEvaluacion = async () => {
    resetCalculadora()
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
    setNumeroConsultaActual(1)
  }

  const continuarConsultaCargada = async () => {
    console.log("🔄Continuing consulta cargada:", consultaCargada)

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

    let ultimoHcg = consultaCargada.hcg_valor
    if (tieneC2) ultimoHcg = consultaCargada.hcg_valor_2
    if (tieneC3) ultimoHcg = consultaCargada.hcg_valor_3

    setHcgAnterior(ultimoHcg?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)

    console.log("🔍 Análisis de consultas existentes:")
    console.log("Tiene consulta 2:", tieneC2)
    console.log("Tiene consulta 3:", tieneC3)

    const ultimaDecision = tieneC3
      ? consultaCargada.resultado_3
      : tieneC2
        ? consultaCargada.resultado_2
        : consultaCargada.resultado

    if (ultimaDecision != null && (ultimaDecision >= 0.95 || ultimaDecision < 0.01)) {
      alert("Esta consulta ya tiene una decisión final (confirmar o descartar). No se puede continuar.")
      setMostrarResumenConsulta(true)
      return
    }

    if (tieneC3) {
      alert("Esta consulta ya tiene 3 evaluaciones completadas.")
      setMostrarResumenConsulta(true)
      return
    } else if (tieneC2) {
      console.log("➡️ Será consulta 3")
      setNumeroConsultaActual(3)
    } else {
      console.log("➡️ Será consulta 2")
      setNumeroConsultaActual(2)
    }

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
      } catch (error) {
        console.warn("Error al parsear datos de localStorage:", error)
      }
    }

    if (!consultaEncontrada) {
      try {
        const res = await leerDatosDesdeBackend(folioNumerico)
        if (res) {
          consultaEncontrada = res
          localStorage.setItem(`ectopico_folio_${res.folio}`, JSON.stringify(consultaEncontrada))
        }
      } catch (error) {
        console.error("Error al buscar en backend:", error)
      }
    }

    if (consultaEncontrada) {
      console.log("✅ Consulta encontrada y cargada:", consultaEncontrada)
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
      alert("ID copiado al portapapeles: " + idSeguimiento)
    }
  }

  const cerrarSesion = () => {
    clienteSeguro.logout()
    setEstaAutenticado(false)
    setUsuarioActual("")
    setNombreUsuario("")
  }

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
              {!mostrarPantallaBienvenida && (
                <Button
                  onClick={volverAPantallaBienvenida}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Inicio
                </Button>
              )}
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

      {/* Rest of the code here */}
    </div>
  )
}
