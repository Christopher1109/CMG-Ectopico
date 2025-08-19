"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, CheckCircle, Download } from "lucide-react"

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
  const [protocoloFinalizado, setProtocoloFinalizado] = React.useState(false)
  const [mensajeFinal, setMensajeFinal] = React.useState("")
  const [idSeguimiento, setIdSeguimiento] = React.useState("")
  const [nombrePaciente, setNombrePaciente] = React.useState("")
  const [edadPaciente, setEdadPaciente] = React.useState("")
  const [seccionesCompletadas, setSeccionesCompletadas] = React.useState([])
  const [seccionActual, setSeccionActual] = React.useState(1)
  const [resultado, setResultado] = React.useState(null)
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = React.useState("")
  const [presionSistolica, setPresionSistolica] = React.useState("")
  const [presionDiastolica, setPresionDiastolica] = React.useState("")
  const [estadoConciencia, setEstadoConciencia] = React.useState("")
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = React.useState("")
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = React.useState("")
  const [hallazgosExploracion, setHallazgosExploracion] = React.useState("")
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = React.useState("")
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = React.useState("")
  const [sintomasSeleccionados, setSintomasSeleccionados] = React.useState([])
  const [factoresSeleccionados, setFactoresSeleccionados] = React.useState([])
  const [tvus, setTvus] = React.useState("")
  const [hcgValor, setHcgValor] = React.useState("")
  const [variacionHcg, setVariacionHcg] = React.useState("")
  const [hcgAnterior, setHcgAnterior] = React.useState("")
  const [usuarioActual, setUsuarioActual] = React.useState("")

  const generarIdConsulta = () => {
    // Implement logic to generate a unique consultation ID
    return Math.random().toString(36).substr(2, 9)
  }

  const enviarDatosAlBackend = async (data) => {
    // Implement logic to send data to the backend
    return true
  }

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

  const completarSeccion = (seccion) => {
    // Implement logic to complete a section
    setSeccionesCompletadas([...seccionesCompletadas, seccion])
  }

  const generarInformePDF = () => {
    // Implement logic to generate PDF report
  }

  const volverAInicio = () => {
    // Implement logic to start a new evaluation
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

  return (
    <div>
      {/* Section 2: Signos Vitales */}
      <Button
        onClick={async () => {
          if (await validarSignosVitales()) completarSeccion(2)
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
      >
        Continuar
      </Button>

      {/* Section 3: Prueba de Embarazo */}
      <Button
        onClick={async () => {
          if (await validarPruebaEmbarazo()) completarSeccion(3)
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
      >
        Continuar
      </Button>

      {/* Section 4: Evaluación Previa */}
      <Button
        onClick={async () => {
          if (await validarEcoTransabdominal()) completarSeccion(4)
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6"
      >
        Continuar
      </Button>

      {protocoloFinalizado ? (
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

                {/* Información de la consulta guardada */}
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
      ) : (
        <div>{/* Placeholder for other sections */}</div>
      )}
    </div>
  )
}

export default Page
