"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ConsultaData {
  id: string
  nombre_paciente: string
  edad_paciente: number
  frecuencia_cardiaca: number
  presion_sistolica: number
  presion_diastolica: number
  estado_conciencia: string
  prueba_embarazo_realizada: boolean
  resultado_prueba_embarazo: string
  hallazgos_exploracion: string
  tiene_eco_transabdominal: boolean
  resultado_eco_transabdominal: string
  sintomas_seleccionados: string[]
  factores_seleccionados: string[]
  tvus_1: string
  hcg_valor_1: number
  resultado_1: number
  fecha_consulta_1: string
  usuario_consulta_1: string
  tvus_2?: string
  hcg_valor_2?: number
  variacion_hcg_2?: number
  resultado_2?: number
  fecha_consulta_2?: string
  tvus_3?: string
  hcg_valor_3?: number
  variacion_hcg_3?: number
  resultado_3?: number
  fecha_consulta_3?: string
  es_finalizado: boolean
  motivo_finalizacion?: string
}

export default function CalculadoraEctopico() {
  const [currentStep, setCurrentStep] = useState<
    | "buscar"
    | "encontrada"
    | "nueva"
    | "datos-paciente"
    | "signos-vitales"
    | "exploracion"
    | "sintomas"
    | "factores"
    | "tvus"
    | "resultado"
    | "seguimiento"
  >("buscar")
  const [consultaId, setConsultaId] = useState("")
  const [consultaData, setConsultaData] = useState<ConsultaData | null>(null)
  const [consultaNum, setConsultaNum] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Estados del formulario
  const [nombrePaciente, setNombrePaciente] = useState("")
  const [edadPaciente, setEdadPaciente] = useState("")
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("")
  const [presionSistolica, setPresionSistolica] = useState("")
  const [presionDiastolica, setPresionDiastolica] = useState("")
  const [estadoConciencia, setEstadoConciencia] = useState("")
  const [pruebaEmbarazo, setPruebaEmbarazo] = useState<boolean | null>(null)
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("")
  const [hallazgosExploracion, setHallazgosExploracion] = useState("")
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState<boolean | null>(null)
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState("")
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [resultado, setResultado] = useState<number | null>(null)

  const buscarConsulta = async () => {
    if (!consultaId.trim()) {
      setError("Por favor ingrese un ID de consulta")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/consultas/${encodeURIComponent(consultaId)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al buscar la consulta")
      }

      const data = result.data
      setConsultaData(data)

      // Determinar qué consulta sigue
      if (data.tvus_3 && data.hcg_valor_3) {
        setConsultaNum(4) // Ya tiene 3 consultas
      } else if (data.tvus_2 && data.hcg_valor_2) {
        setConsultaNum(3) // Tiene 2, sigue la 3
      } else {
        setConsultaNum(2) // Tiene 1, sigue la 2
      }

      setCurrentStep("encontrada")
    } catch (err: any) {
      setError(err.message || "Error al buscar la consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const crearConsulta = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_paciente: nombrePaciente,
          edad_paciente: Number.parseInt(edadPaciente),
          frecuencia_cardiaca: Number.parseInt(frecuenciaCardiaca),
          presion_sistolica: Number.parseInt(presionSistolica),
          presion_diastolica: Number.parseInt(presionDiastolica),
          estado_conciencia: estadoConciencia,
          prueba_embarazo_realizada: pruebaEmbarazo,
          resultado_prueba_embarazo: resultadoPruebaEmbarazo,
          hallazgos_exploracion: hallazgosExploracion,
          tiene_eco_transabdominal: tieneEcoTransabdominal,
          resultado_eco_transabdominal: resultadoEcoTransabdominal,
          sintomas_seleccionados: sintomasSeleccionados,
          factores_seleccionados: factoresSeleccionados,
          tvus_1: tvus,
          hcg_valor_1: Number.parseFloat(hcgValor),
          resultado_1: resultado,
          usuario_consulta_1: "Christopher",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear la consulta")
      }

      setConsultaData(result.data)
      setCurrentStep("resultado")
    } catch (err: any) {
      setError(err.message || "Error al crear la consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const continuarConsulta = async () => {
    if (!consultaData) return

    setIsLoading(true)
    setError("")

    try {
      const body: any = {
        consulta_num: consultaNum,
        tvus: tvus,
        hcg_valor: Number.parseFloat(hcgValor),
        usuario_creador: "Christopher",
      }

      // Calcular variación de β-hCG
      let hcgAnterior: number
      if (consultaNum === 2) {
        hcgAnterior = consultaData.hcg_valor_1
      } else if (consultaNum === 3) {
        hcgAnterior = consultaData.hcg_valor_2 || consultaData.hcg_valor_1
      } else {
        hcgAnterior = consultaData.hcg_valor_3 || consultaData.hcg_valor_2 || consultaData.hcg_valor_1
      }

      const variacion = ((Number.parseFloat(hcgValor) - hcgAnterior) / hcgAnterior) * 100
      body.variacion_hcg = variacion
      body.resultado = resultado

      const response = await fetch(`/api/consultas/${encodeURIComponent(consultaData.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la consulta")
      }

      setConsultaData(result.data)
      setCurrentStep("resultado")
    } catch (err: any) {
      setError(err.message || "Error al continuar la consulta")
    } finally {
      setIsLoading(false)
    }
  }

  const calcularRiesgo = () => {
    const hcgVal = Number.parseFloat(hcgValor)
    if (isNaN(hcgVal)) return

    // Algoritmo Bayesiano simplificado
    let riesgo = 0.5 // Prior de 50%

    // Factor β-hCG
    if (hcgVal < 1000) riesgo *= 0.3
    else if (hcgVal < 2000) riesgo *= 0.6
    else if (hcgVal < 5000) riesgo *= 0.8
    else riesgo *= 1.2

    // Factor TVUS
    if (tvus === "Normal") riesgo *= 0.4
    else if (tvus === "Líquido libre") riesgo *= 1.5
    else if (tvus === "Masa anexial") riesgo *= 2.0

    // Normalizar a porcentaje
    riesgo = Math.min(Math.max(riesgo * 100, 0), 100)
    setResultado(Math.round(riesgo * 10) / 10)
  }

  useEffect(() => {
    if (hcgValor && tvus) {
      calcularRiesgo()
    }
  }, [hcgValor, tvus])

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES")
  }

  const renderBuscarConsulta = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Buscar Consulta Existente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="consultaId">ID de Consulta</Label>
          <input
            id="consultaId"
            type="text"
            value={consultaId}
            onChange={(e) => setConsultaId(e.target.value)}
            placeholder="Ej: ID-00001"
            className="w-full p-2 border rounded-md"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={buscarConsulta} disabled={isLoading} className="flex-1">
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
          <Button variant="outline" onClick={() => setCurrentStep("nueva")} className="flex-1">
            Nueva Consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderConsultaEncontrada = () => (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          Consulta Encontrada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-3">Resumen de la Consulta Previa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>ID:</strong> {consultaData?.id}
              </p>
              <p>
                <strong>Paciente:</strong> {consultaData?.nombre_paciente || "No especificado"}
              </p>
              <p>
                <strong>Edad:</strong>{" "}
                {consultaData?.edad_paciente ? `${consultaData.edad_paciente} años` : "No especificado"}
              </p>
              <p>
                <strong>β-hCG anterior:</strong>{" "}
                {consultaData?.hcg_valor_1 ? `${consultaData.hcg_valor_1} mUI/mL` : "No especificado"}
              </p>
            </div>
            <div>
              <p>
                <strong>TVUS:</strong> {consultaData?.tvus_1 || "No especificado"}
              </p>
              <p>
                <strong>Resultado anterior:</strong>{" "}
                {consultaData?.resultado_1 ? `${consultaData.resultado_1}%` : "No especificado"}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {consultaData?.fecha_consulta_1 ? formatearFecha(consultaData.fecha_consulta_1) : "No disponible"}
              </p>
              <p>
                <strong>Frecuencia Cardíaca:</strong>{" "}
                {consultaData?.frecuencia_cardiaca ? `${consultaData.frecuencia_cardiaca} lpm` : "No especificado"}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Signos Vitales:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <p>
                <strong>Presión Arterial:</strong>{" "}
                {consultaData?.presion_sistolica && consultaData?.presion_diastolica
                  ? `${consultaData.presion_sistolica}/${consultaData.presion_diastolica} mmHg`
                  : "No especificado"}
              </p>
              <p>
                <strong>Estado de Conciencia:</strong> {consultaData?.estado_conciencia || "No especificado"}
              </p>
              <p>
                <strong>Prueba Embarazo:</strong> {consultaData?.resultado_prueba_embarazo || "No especificado"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600">⚠️</span>
            <h4 className="font-semibold text-yellow-800">Consulta de Seguimiento</h4>
          </div>
          <p className="text-yellow-700 text-sm">
            Al continuar, se cargará automáticamente la información de la consulta previa. El valor de β-hCG anterior se
            configurará automáticamente para calcular la variación. Solo necesitará ingresar el nuevo valor de β-hCG.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => setCurrentStep("tvus")} className="bg-green-600 hover:bg-green-700">
            ➤ Continuar Consulta
          </Button>
          <Button variant="outline" onClick={() => setCurrentStep("buscar")}>
            Buscar Otra Consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderTVUS = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Ecografía Transvaginal (TVUS)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Resultado de TVUS</Label>
          <div className="space-y-2 mt-2">
            {["Normal", "Líquido libre", "Masa anexial", "Embarazo intrauterino"].map((opcion) => (
              <label key={opcion} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="tvus"
                  value={opcion}
                  checked={tvus === opcion}
                  onChange={(e) => setTvus(e.target.value)}
                />
                <span>{opcion}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="hcgValor">Valor β-hCG (mUI/mL)</Label>
          <input
            id="hcgValor"
            type="number"
            value={hcgValor}
            onChange={(e) => setHcgValor(e.target.value)}
            placeholder="Ej: 1500"
            className="w-full p-2 border rounded-md"
          />
        </div>
        {resultado !== null && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Riesgo calculado:</strong> {resultado}%
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={consultaData ? continuarConsulta : () => setCurrentStep("resultado")}
            disabled={!tvus || !hcgValor || isLoading}
            className="flex-1"
          >
            {isLoading ? "Procesando..." : "Calcular Riesgo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderResultado = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Resultado del Análisis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-blue-800 mb-2">Riesgo de Embarazo Ectópico</h3>
          <p className="text-4xl font-bold text-blue-600 mb-2">{resultado}%</p>
          <p className="text-sm text-blue-700">
            {resultado && resultado < 20
              ? "Riesgo Bajo"
              : resultado && resultado < 50
                ? "Riesgo Moderado"
                : "Riesgo Alto"}
          </p>
        </div>

        {consultaData && (
          <div className="bg-gray-50 p-4 rounded-lg text-left">
            <h4 className="font-semibold mb-2">Información de la Consulta:</h4>
            <p className="text-sm">
              <strong>ID:</strong> {consultaData.id}
            </p>
            <p className="text-sm">
              <strong>Paciente:</strong> {consultaData.nombre_paciente}
            </p>
            <p className="text-sm">
              <strong>Consulta #{consultaNum}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => setCurrentStep("buscar")} variant="outline" className="flex-1">
            Nueva Búsqueda
          </Button>
          <Button onClick={() => setCurrentStep("nueva")} className="flex-1">
            Nueva Consulta
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl">💙</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Calculadora de Embarazo Ectópico</h1>
              <p className="text-blue-100 text-sm">Sistema de Evaluación Diagnóstica Avanzada</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm">Sesión activa:</p>
            <p className="font-semibold">Christopher</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {currentStep === "buscar" && renderBuscarConsulta()}
        {currentStep === "encontrada" && renderConsultaEncontrada()}
        {currentStep === "tvus" && renderTVUS()}
        {currentStep === "resultado" && renderResultado()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 p-4 text-center text-sm text-gray-600 mt-8">
        <p>
          Desarrollado por <strong>CMG Health Solutions</strong> - Sistema de Evaluación Diagnóstica Avanzada
        </p>
      </footer>
    </div>
  )
}
