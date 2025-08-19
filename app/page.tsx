"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { User, CheckCircle, Download, Heart, TestTube, Eye, Calculator } from "lucide-react"

const CMGFooter = () => (
  <div className="text-center mt-8 pt-4 border-t border-gray-200">
    <p className="text-sm text-gray-500 mb-2">
      Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de Apoyo
      Clínico
    </p>
    <p className="text-xs text-gray-400">
      Esta aplicación es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico.
      <br />
      El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
    </p>
  </div>
)

const Page = () => {
  // Estados principales
  const [protocoloFinalizado, setProtocoloFinalizado] = React.useState(false)
  const [mensajeFinal, setMensajeFinal] = React.useState("")
  const [idSeguimiento, setIdSeguimiento] = React.useState("")
  const [nombrePaciente, setNombrePaciente] = React.useState("")
  const [edadPaciente, setEdadPaciente] = React.useState("")
  const [seccionesCompletadas, setSeccionesCompletadas] = React.useState([])
  const [seccionActual, setSeccionActual] = React.useState(1)
  const [resultado, setResultado] = React.useState(null)
  const [usuarioActual, setUsuarioActual] = React.useState("")

  // Estados de signos vitales
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = React.useState("")
  const [presionSistolica, setPresionSistolica] = React.useState("")
  const [presionDiastolica, setPresionDiastolica] = React.useState("")
  const [estadoConciencia, setEstadoConciencia] = React.useState("")

  // Estados de prueba de embarazo
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = React.useState("")
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = React.useState("")

  // Estados de exploración física
  const [hallazgosExploracion, setHallazgosExploracion] = React.useState("")

  // Estados de evaluación previa
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = React.useState("")
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = React.useState("")

  // Estados del algoritmo
  const [sintomasSeleccionados, setSintomasSeleccionados] = React.useState([])
  const [factoresSeleccionados, setFactoresSeleccionados] = React.useState([])
  const [tvus, setTvus] = React.useState("")
  const [hcgValor, setHcgValor] = React.useState("")
  const [variacionHcg, setVariacionHcg] = React.useState("")
  const [hcgAnterior, setHcgAnterior] = React.useState("")

  const generarIdConsulta = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `ID-${timestamp}-${random}`.toUpperCase()
  }

  const enviarDatosAlBackend = async (data) => {
    try {
      const response = await fetch("/api/consultas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      return response.ok
    } catch (error) {
      console.error("Error enviando datos:", error)
      return false
    }
  }

  // Función para guardar datos incompletos
  async function guardarDatosIncompletos(motivoFinalizacion: string, seccionCompletada: number): Promise<boolean> {
    try {
      const fechaActual = new Date().toISOString()
      const datosIncompletos = {
        id: idSeguimiento || generarIdConsulta(),
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

      localStorage.setItem(`ectopico_${datosIncompletos.id}`, JSON.stringify(datosIncompletos))
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

  const iniciarEvaluacion = () => {
    if (!nombrePaciente.trim() || !edadPaciente.trim() || !usuarioActual.trim()) {
      alert("Por favor complete todos los campos requeridos")
      return
    }

    const nuevoId = generarIdConsulta()
    setIdSeguimiento(nuevoId)
    setSeccionActual(2)
    setSeccionesCompletadas([1])
  }

  const completarSeccion = (seccion) => {
    setSeccionesCompletadas([...seccionesCompletadas, seccion])
    setSeccionActual(seccion + 1)
  }

  const validarSignosVitales = async () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

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
      setMensajeFinal(mensajeAlertaTemp)
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

  const calcularRiesgo = () => {
    // Implementar cálculo del algoritmo
    let puntuacion = 0

    // Síntomas
    if (sintomasSeleccionados.includes("dolor")) puntuacion += 1.5
    if (sintomasSeleccionados.includes("sangrado")) puntuacion += 1.2
    if (sintomasSeleccionados.includes("mareo")) puntuacion += 0.8

    // Factores de riesgo
    if (factoresSeleccionados.includes("infertilidad")) puntuacion += 2.0
    if (factoresSeleccionados.includes("cirugia_previa")) puntuacion += 1.8
    if (factoresSeleccionados.includes("ectopico_previo")) puntuacion += 2.5

    // TVUS
    if (tvus === "masa_anexial") puntuacion += 3.0
    if (tvus === "liquido_libre") puntuacion += 2.0
    if (tvus === "normal") puntuacion -= 1.0

    // HCG
    const hcg = Number.parseFloat(hcgValor)
    if (hcg > 2000) puntuacion += 1.5
    if (hcg < 1000) puntuacion -= 0.5

    if (variacionHcg === "disminuye") puntuacion += 2.0
    if (variacionHcg === "aumenta_lento") puntuacion += 1.5

    // Convertir a probabilidad
    const probabilidad = Math.max(0, Math.min(1, puntuacion / 10))
    setResultado(probabilidad)

    // Guardar datos completos
    const datosCompletos = {
      id: idSeguimiento,
      fechaCreacion: new Date().toISOString(),
      fechaUltimaActualizacion: new Date().toISOString(),
      usuarioCreador: usuarioActual,
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
      variacionHcg,
      hcgAnterior: hcgAnterior ? Number.parseFloat(hcgAnterior) : null,
      resultado: probabilidad,
      consultaCompleta: true,
    }

    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(datosCompletos))
    enviarDatosAlBackend(datosCompletos)

    setMensajeFinal("Evaluación completada exitosamente")
    setProtocoloFinalizado(true)
  }

  const generarInformePDF = () => {
    // Implementar generación de PDF
    alert("Funcionalidad de PDF en desarrollo")
  }

  const volverAInicio = () => {
    // Resetear todos los estados
    setProtocoloFinalizado(false)
    setMensajeFinal("")
    setIdSeguimiento("")
    setNombrePaciente("")
    setEdadPaciente("")
    setSeccionesCompletadas([])
    setSeccionActual(1)
    setResultado(null)
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
    setUsuarioActual("")
  }

  const toggleSintoma = (sintoma) => {
    setSintomasSeleccionados((prev) =>
      prev.includes(sintoma) ? prev.filter((s) => s !== sintoma) : [...prev, sintoma],
    )
  }

  const toggleFactor = (factor) => {
    setFactoresSeleccionados((prev) => (prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]))
  }

  if (protocoloFinalizado) {
    return (
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
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Calculadora de Riesgo de Embarazo Ectópico</CardTitle>
          <p className="text-center text-blue-100">
            Herramienta de apoyo clínico para la evaluación del riesgo de embarazo ectópico
          </p>
        </CardHeader>
      </Card>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso de la Evaluación</span>
          <span className="text-sm text-gray-500">{seccionesCompletadas.length}/5 secciones</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(seccionesCompletadas.length / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Sección 1: Información del Paciente */}
      {seccionActual === 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Información del Paciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usuario">Médico/Usuario *</Label>
                <input
                  id="usuario"
                  type="text"
                  value={usuarioActual}
                  onChange={(e) => setUsuarioActual(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese su nombre"
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre del Paciente *</Label>
                <input
                  id="nombre"
                  type="text"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="edad">Edad *</Label>
                <input
                  id="edad"
                  type="number"
                  value={edadPaciente}
                  onChange={(e) => setEdadPaciente(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Edad en años"
                  min="15"
                  max="50"
                />
              </div>
            </div>
            <div className="text-center">
              <Button
                onClick={iniciarEvaluacion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
              >
                Iniciar Evaluación
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección 2: Signos Vitales */}
      {seccionActual === 2 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <span>Signos Vitales</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="fc">Frecuencia Cardíaca (lpm)</Label>
                <input
                  id="fc"
                  type="number"
                  value={frecuenciaCardiaca}
                  onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="60-100"
                />
              </div>
              <div>
                <Label htmlFor="sistolica">Presión Sistólica (mmHg)</Label>
                <input
                  id="sistolica"
                  type="number"
                  value={presionSistolica}
                  onChange={(e) => setPresionSistolica(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="90-140"
                />
              </div>
              <div>
                <Label htmlFor="diastolica">Presión Diastólica (mmHg)</Label>
                <input
                  id="diastolica"
                  type="number"
                  value={presionDiastolica}
                  onChange={(e) => setPresionDiastolica(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="60-90"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="conciencia">Estado de Conciencia</Label>
              <select
                id="conciencia"
                value={estadoConciencia}
                onChange={(e) => setEstadoConciencia(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione...</option>
                <option value="alerta">Alerta</option>
                <option value="somnolenta">Somnolenta</option>
                <option value="estuporosa">Estuporosa</option>
                <option value="comatosa">Comatosa</option>
              </select>
            </div>
            <div className="text-center">
              <Button
                onClick={async () => {
                  if (await validarSignosVitales()) {
                    completarSeccion(2)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección 3: Prueba de Embarazo */}
      {seccionActual === 3 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-green-600" />
              <span>Prueba de Embarazo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>¿Se realizó prueba de embarazo cualitativa?</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pruebaEmbarazo"
                    value="si"
                    checked={pruebaEmbarazoRealizada === "si"}
                    onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pruebaEmbarazo"
                    value="no"
                    checked={pruebaEmbarazoRealizada === "no"}
                    onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {pruebaEmbarazoRealizada === "si" && (
              <div>
                <Label>Resultado de la prueba</Label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resultadoPrueba"
                      value="positiva"
                      checked={resultadoPruebaEmbarazo === "positiva"}
                      onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                      className="mr-2"
                    />
                    Positiva
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resultadoPrueba"
                      value="negativa"
                      checked={resultadoPruebaEmbarazo === "negativa"}
                      onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                      className="mr-2"
                    />
                    Negativa
                  </label>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={async () => {
                  if (await validarPruebaEmbarazo()) {
                    completarSeccion(3)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección 4: Evaluación Previa */}
      {seccionActual === 4 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span>Evaluación Previa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="exploracion">Hallazgos de Exploración Física</Label>
              <textarea
                id="exploracion"
                value={hallazgosExploracion}
                onChange={(e) => setHallazgosExploracion(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describa los hallazgos relevantes..."
              />
            </div>

            <div>
              <Label>¿Tiene ecografía transabdominal?</Label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tieneEco"
                    value="si"
                    checked={tieneEcoTransabdominal === "si"}
                    onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tieneEco"
                    value="no"
                    checked={tieneEcoTransabdominal === "no"}
                    onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>

            {tieneEcoTransabdominal === "si" && (
              <div>
                <Label>Resultado de la ecografía</Label>
                <select
                  value={resultadoEcoTransabdominal}
                  onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="saco_embrion_fc">Saco gestacional con embrión y frecuencia cardíaca</option>
                  <option value="saco_vitelino_embrion">Saco gestacional con saco vitelino y embrión</option>
                  <option value="saco_vitelino_sin_embrion">Saco gestacional con saco vitelino sin embrión</option>
                  <option value="saco_sin_embrion">Saco gestacional sin embrión</option>
                  <option value="saco_10mm_decidual_2mm">Saco &gt;10mm con decidua &gt;2mm</option>
                  <option value="utero_vacio">Útero vacío</option>
                  <option value="masa_anexial">Masa anexial</option>
                  <option value="liquido_libre">Líquido libre</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={async () => {
                  if (await validarEcoTransabdominal()) {
                    completarSeccion(4)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección 5: Algoritmo de Cálculo */}
      {seccionActual === 5 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <span>Evaluación de Riesgo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Síntomas */}
            <div>
              <Label className="text-lg font-semibold">Síntomas Presentes</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {[
                  { id: "dolor", label: "Dolor pélvico/abdominal" },
                  { id: "sangrado", label: "Sangrado vaginal" },
                  { id: "mareo", label: "Mareo/síncope" },
                  { id: "nauseas", label: "Náuseas/vómitos" },
                  { id: "dolor_hombro", label: "Dolor de hombro" },
                  { id: "amenorrea", label: "Amenorrea" },
                ].map((sintoma) => (
                  <label key={sintoma.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={sintomasSeleccionados.includes(sintoma.id)}
                      onChange={() => toggleSintoma(sintoma.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{sintoma.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Factores de Riesgo */}
            <div>
              <Label className="text-lg font-semibold">Factores de Riesgo</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {[
                  { id: "infertilidad", label: "Historia de infertilidad" },
                  { id: "cirugia_previa", label: "Cirugía tubárica previa" },
                  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
                  { id: "diu", label: "DIU in situ" },
                  { id: "tabaquismo", label: "Tabaquismo" },
                  { id: "endometriosis", label: "Endometriosis" },
                ].map((factor) => (
                  <label key={factor.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={factoresSeleccionados.includes(factor.id)}
                      onChange={() => toggleFactor(factor.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{factor.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TVUS */}
            <div>
              <Label htmlFor="tvus">Ecografía Transvaginal (TVUS)</Label>
              <select
                id="tvus"
                value={tvus}
                onChange={(e) => setTvus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione...</option>
                <option value="masa_anexial">Masa anexial</option>
                <option value="liquido_libre">Líquido libre en pelvis</option>
                <option value="utero_vacio">Útero vacío</option>
                <option value="normal">Normal</option>
                <option value="no_realizada">No realizada</option>
              </select>
            </div>

            {/* HCG */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hcg">β-HCG actual (mUI/mL)</Label>
                <input
                  id="hcg"
                  type="number"
                  value={hcgValor}
                  onChange={(e) => setHcgValor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Valor actual"
                />
              </div>
              <div>
                <Label htmlFor="hcg-anterior">β-HCG anterior (mUI/mL)</Label>
                <input
                  id="hcg-anterior"
                  type="number"
                  value={hcgAnterior}
                  onChange={(e) => setHcgAnterior(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Valor previo (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="variacion">Variación de β-HCG</Label>
                <select
                  id="variacion"
                  value={variacionHcg}
                  onChange={(e) => setVariacionHcg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione...</option>
                  <option value="aumenta_normal">Aumenta normalmente (&gt;66% en 48h)</option>
                  <option value="aumenta_lento">Aumenta lentamente (&lt;66% en 48h)</option>
                  <option value="estable">Estable</option>
                  <option value="disminuye">Disminuye</option>
                  <option value="no_disponible">No disponible</option>
                </select>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={calcularRiesgo}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 text-lg"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calcular Riesgo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CMGFooter />
    </div>
  )
}

export default Page
