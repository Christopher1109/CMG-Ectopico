"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Heart,
  User,
  Activity,
  Stethoscope,
  TestTube,
  Eye,
  AlertTriangle,
  CheckCircle,
  Search,
  ArrowRight,
} from "lucide-react"

// Tipos de datos
interface ConsultaData {
  id: string
  usuario_creador: string
  nombre_paciente: string
  edad_paciente: number | null
  frecuencia_cardiaca: number | null
  presion_sistolica: number | null
  presion_diastolica: number | null
  estado_conciencia: string | null
  prueba_embarazo_realizada: boolean | null
  resultado_prueba_embarazo: string | null
  hallazgos_exploracion: string | null
  tiene_eco_transabdominal: boolean | null
  resultado_eco_transabdominal: string | null
  sintomas_seleccionados: string[]
  factores_seleccionados: string[]
  tvus: string | null
  hcg_valor: number | null
  variacion_hcg: number | null
  hcg_anterior: number | null
  resultado: number | null
  fecha_creacion: string
  fecha_actualizacion: string
}

// Opciones para los campos
const SINTOMAS_OPTIONS = [
  "Dolor abdominal",
  "Sangrado vaginal",
  "Amenorrea",
  "Náuseas/vómitos",
  "Mareos",
  "Dolor pélvico",
  "Dolor en hombro",
  "Síncope",
]

const FACTORES_RIESGO_OPTIONS = [
  "Embarazo ectópico previo",
  "Cirugía tubárica previa",
  "Enfermedad inflamatoria pélvica",
  "Endometriosis",
  "Uso de DIU",
  "Fertilización in vitro",
  "Tabaquismo",
  "Edad materna avanzada",
]

const ESTADO_CONCIENCIA_OPTIONS = ["Alerta", "Somnoliento", "Confuso", "Inconsciente"]

const TVUS_OPTIONS = [
  "Normal",
  "Masa anexial",
  "Líquido libre",
  "Saco gestacional intrauterino",
  "Saco gestacional extrauterino",
  "No concluyente",
]

export default function CalculadoraEctopico() {
  // Estados principales
  const [paso, setPaso] = useState<
    | "buscar"
    | "datos-paciente"
    | "signos-vitales"
    | "exploracion"
    | "sintomas"
    | "factores"
    | "tvus"
    | "hcg"
    | "resultado"
    | "consulta-encontrada"
  >("buscar")
  const [consultaId, setConsultaId] = useState("")
  const [consultaCargada, setConsultaCargada] = useState<ConsultaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Estados del formulario
  const [nombrePaciente, setNombrePaciente] = useState("")
  const [edadPaciente, setEdadPaciente] = useState("")
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("")
  const [presionSistolica, setPresionSistolica] = useState("")
  const [presionDiastolica, setPresionDiastolica] = useState("")
  const [estadoConciencia, setEstadoConciencia] = useState("")
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState<boolean | null>(null)
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("")
  const [hallazgosExploracion, setHallazgosExploracion] = useState("")
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState<boolean | null>(null)
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState("")
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")
  const [resultado, setResultado] = useState<number | null>(null)

  // Función para generar ID único
  const generarId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 100000)
    const id = `ID-${String(random).padStart(5, "0")}`
    return id
  }

  // Función para buscar consulta
  const buscarConsulta = async () => {
    if (!consultaId.trim()) {
      setError("Por favor ingrese un ID de consulta")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/consultas/${encodeURIComponent(consultaId)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al buscar la consulta")
      }

      setConsultaCargada(result.data)
      setPaso("consulta-encontrada")
    } catch (err: any) {
      setError(err.message || "Error al buscar la consulta")
    } finally {
      setLoading(false)
    }
  }

  // Función para continuar con consulta existente
  const continuarConsulta = () => {
    if (consultaCargada) {
      // Cargar datos de la consulta anterior
      setNombrePaciente(consultaCargada.nombre_paciente || "")
      setEdadPaciente(consultaCargada.edad_paciente?.toString() || "")
      setFrecuenciaCardiaca(consultaCargada.frecuencia_cardiaca?.toString() || "")
      setPresionSistolica(consultaCargada.presion_sistolica?.toString() || "")
      setPresionDiastolica(consultaCargada.presion_diastolica?.toString() || "")
      setEstadoConciencia(consultaCargada.estado_conciencia || "")
      setPruebaEmbarazoRealizada(consultaCargada.prueba_embarazo_realizada)
      setResultadoPruebaEmbarazo(consultaCargada.resultado_prueba_embarazo || "")
      setHallazgosExploracion(consultaCargada.hallazgos_exploracion || "")
      setTieneEcoTransabdominal(consultaCargada.tiene_eco_transabdominal)
      setResultadoEcoTransabdominal(consultaCargada.resultado_eco_transabdominal || "")
      setSintomasSeleccionados(consultaCargada.sintomas_seleccionados || [])
      setFactoresSeleccionados(consultaCargada.factores_seleccionados || [])
      setTvus(consultaCargada.tvus || "")
      setHcgAnterior(consultaCargada.hcg_valor?.toString() || "")

      // Ir directamente al paso de β-hCG para nueva medición
      setPaso("hcg")
    }
  }

  // Función para nueva consulta
  const nuevaConsulta = () => {
    // Limpiar todos los estados
    setConsultaId("")
    setConsultaCargada(null)
    setNombrePaciente("")
    setEdadPaciente("")
    setFrecuenciaCardiaca("")
    setPresionSistolica("")
    setPresionDiastolica("")
    setEstadoConciencia("")
    setPruebaEmbarazoRealizada(null)
    setResultadoPruebaEmbarazo("")
    setHallazgosExploracion("")
    setTieneEcoTransabdominal(null)
    setResultadoEcoTransabdominal("")
    setSintomasSeleccionados([])
    setFactoresSeleccionados([])
    setTvus("")
    setHcgValor("")
    setHcgAnterior("")
    setResultado(null)
    setError("")

    // Generar nuevo ID y ir a datos del paciente
    setConsultaId(generarId())
    setPaso("datos-paciente")
  }

  // Función para calcular resultado usando algoritmo bayesiano
  const calcularResultado = () => {
    let probabilidad = 0.1 // Probabilidad base del 10%

    // Factores de riesgo (aumentan probabilidad)
    if (factoresSeleccionados.includes("Embarazo ectópico previo")) probabilidad *= 3
    if (factoresSeleccionados.includes("Cirugía tubárica previa")) probabilidad *= 2.5
    if (factoresSeleccionados.includes("Enfermedad inflamatoria pélvica")) probabilidad *= 2
    if (factoresSeleccionados.includes("Endometriosis")) probabilidad *= 1.8
    if (factoresSeleccionados.includes("Uso de DIU")) probabilidad *= 1.5
    if (factoresSeleccionados.includes("Fertilización in vitro")) probabilidad *= 2.2
    if (factoresSeleccionados.includes("Tabaquismo")) probabilidad *= 1.3
    if (factoresSeleccionados.includes("Edad materna avanzada")) probabilidad *= 1.4

    // Síntomas (aumentan probabilidad)
    if (sintomasSeleccionados.includes("Dolor abdominal")) probabilidad *= 1.8
    if (sintomasSeleccionados.includes("Sangrado vaginal")) probabilidad *= 1.6
    if (sintomasSeleccionados.includes("Amenorrea")) probabilidad *= 1.4
    if (sintomasSeleccionados.includes("Dolor pélvico")) probabilidad *= 1.7
    if (sintomasSeleccionados.includes("Dolor en hombro")) probabilidad *= 2.5
    if (sintomasSeleccionados.includes("Síncope")) probabilidad *= 3

    // TVUS
    if (tvus === "Masa anexial") probabilidad *= 4
    if (tvus === "Líquido libre") probabilidad *= 3
    if (tvus === "Saco gestacional extrauterino") probabilidad *= 10
    if (tvus === "Saco gestacional intrauterino") probabilidad *= 0.1
    if (tvus === "Normal") probabilidad *= 0.5

    // β-hCG
    const hcgNum = Number.parseFloat(hcgValor)
    const hcgAntNum = Number.parseFloat(hcgAnterior)

    if (!isNaN(hcgNum)) {
      if (hcgNum < 1000) probabilidad *= 2
      else if (hcgNum > 3000) probabilidad *= 0.5

      if (!isNaN(hcgAntNum) && hcgAntNum > 0) {
        const variacion = ((hcgNum - hcgAntNum) / hcgAntNum) * 100
        if (variacion < 35)
          probabilidad *= 3 // Aumento lento sugiere ectópico
        else if (variacion > 65) probabilidad *= 0.3 // Aumento normal sugiere intrauterino
      }
    }

    // Signos vitales (inestabilidad hemodinámica)
    const fcNum = Number.parseFloat(frecuenciaCardiaca)
    const psNum = Number.parseFloat(presionSistolica)

    if (!isNaN(fcNum) && fcNum > 100) probabilidad *= 1.5
    if (!isNaN(psNum) && psNum < 90) probabilidad *= 2
    if (estadoConciencia === "Confuso" || estadoConciencia === "Inconsciente") probabilidad *= 3

    // Limitar probabilidad entre 0.1% y 99.9%
    probabilidad = Math.min(Math.max(probabilidad, 0.001), 0.999)

    return Math.round(probabilidad * 100 * 10) / 10 // Redondear a 1 decimal
  }

  // Función para guardar consulta
  const guardarConsulta = async () => {
    const resultadoCalculado = calcularResultado()
    setResultado(resultadoCalculado)

    const consultaData = {
      id: consultaId,
      usuario_creador: "Christopher",
      nombre_paciente: nombrePaciente,
      edad_paciente: Number.parseInt(edadPaciente) || null,
      frecuencia_cardiaca: Number.parseInt(frecuenciaCardiaca) || null,
      presion_sistolica: Number.parseInt(presionSistolica) || null,
      presion_diastolica: Number.parseInt(presionDiastolica) || null,
      estado_conciencia: estadoConciencia || null,
      prueba_embarazo_realizada: pruebaEmbarazoRealizada,
      resultado_prueba_embarazo: resultadoPruebaEmbarazo || null,
      hallazgos_exploracion: hallazgosExploracion || null,
      tiene_eco_transabdominal: tieneEcoTransabdominal,
      resultado_eco_transabdominal: resultadoEcoTransabdominal || null,
      sintomas_seleccionados: sintomasSeleccionados,
      factores_seleccionados: factoresSeleccionados,
      tvus: tvus || null,
      hcg_valor: Number.parseFloat(hcgValor) || null,
      hcg_anterior: Number.parseFloat(hcgAnterior) || null,
      variacion_hcg:
        Number.parseFloat(hcgAnterior) && Number.parseFloat(hcgValor)
          ? ((Number.parseFloat(hcgValor) - Number.parseFloat(hcgAnterior)) / Number.parseFloat(hcgAnterior)) * 100
          : null,
      resultado: resultadoCalculado,
    }

    setLoading(true)
    try {
      const response = await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar")
      }

      setPaso("resultado")
    } catch (err: any) {
      setError(err.message || "Error al guardar la consulta")
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar selección múltiple
  const toggleSeleccion = (item: string, lista: string[], setLista: (lista: string[]) => void) => {
    if (lista.includes(item)) {
      setLista(lista.filter((i) => i !== item))
    } else {
      setLista([...lista, item])
    }
  }

  // Renderizado condicional según el paso
  const renderPaso = () => {
    switch (paso) {
      case "buscar":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Calculadora de Embarazo Ectópico</CardTitle>
              <p className="text-gray-600">Sistema de Evaluación Diagnóstica Avanzada</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="consultaId" className="text-sm font-medium text-gray-700">
                    ID de Consulta (opcional)
                  </Label>
                  <input
                    id="consultaId"
                    type="text"
                    value={consultaId}
                    onChange={(e) => setConsultaId(e.target.value)}
                    placeholder="Ej: ID-00001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={buscarConsulta}
                    disabled={loading || !consultaId.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Buscando..." : "Buscar Consulta"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">O</span>
                    </div>
                  </div>

                  <Button
                    onClick={nuevaConsulta}
                    variant="outline"
                    className="w-full border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                  >
                    Nueva Consulta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "consulta-encontrada":
        if (!consultaCargada) return null

        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Consulta Encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumen de la Consulta Previa</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>ID:</strong> {consultaCargada.id}
                  </div>
                  <div>
                    <strong>TVUS:</strong> {consultaCargada.tvus || "No especificado"}
                  </div>
                  <div>
                    <strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}
                  </div>
                  <div>
                    <strong>Resultado anterior:</strong>{" "}
                    {consultaCargada.resultado ? `${consultaCargada.resultado}%` : "No disponible"}
                  </div>
                  <div>
                    <strong>Edad:</strong>{" "}
                    {consultaCargada.edad_paciente ? `${consultaCargada.edad_paciente} años` : "No especificado"}
                  </div>
                  <div>
                    <strong>Fecha:</strong>{" "}
                    {consultaCargada.fecha_creacion
                      ? new Date(consultaCargada.fecha_creacion).toLocaleDateString()
                      : "No disponible"}
                  </div>
                  <div>
                    <strong>β-hCG anterior:</strong>{" "}
                    {consultaCargada.hcg_valor ? `${consultaCargada.hcg_valor} mUI/mL` : "No especificado"}
                  </div>
                  <div>
                    <strong>Frecuencia Cardíaca:</strong>{" "}
                    {consultaCargada.frecuencia_cardiaca
                      ? `${consultaCargada.frecuencia_cardiaca} lpm`
                      : "No especificado"}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Signos Vitales:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Presión Arterial:</strong>{" "}
                      {consultaCargada.presion_sistolica && consultaCargada.presion_diastolica
                        ? `${consultaCargada.presion_sistolica}/${consultaCargada.presion_diastolica} mmHg`
                        : "No especificado"}
                    </div>
                    <div>
                      <strong>Estado de Conciencia:</strong> {consultaCargada.estado_conciencia || "No especificado"}
                    </div>
                    <div>
                      <strong>Prueba Embarazo:</strong> {consultaCargada.resultado_prueba_embarazo || "No especificado"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Consulta de Seguimiento</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Al continuar, se cargará automáticamente la información de la consulta previa. El valor de β-hCG
                      anterior se configurará automáticamente para calcular la variación. Solo necesitará ingresar el
                      nuevo valor de β-hCG.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button onClick={continuarConsulta} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continuar Consulta
                </Button>
                <Button onClick={() => setPaso("buscar")} variant="outline" className="px-6 py-2">
                  Buscar Otra Consulta
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "datos-paciente":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Datos del Paciente</CardTitle>
              <p className="text-sm text-gray-600">ID: {consultaId}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre del Paciente</Label>
                <input
                  id="nombre"
                  type="text"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="edad">Edad (años)</Label>
                <input
                  id="edad"
                  type="number"
                  value={edadPaciente}
                  onChange={(e) => setEdadPaciente(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 28"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("buscar")} variant="outline">
                  Atrás
                </Button>
                <Button
                  onClick={() => setPaso("signos-vitales")}
                  disabled={!nombrePaciente.trim() || !edadPaciente.trim()}
                >
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "signos-vitales":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <Activity className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Signos Vitales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fc">Frecuencia Cardíaca (lpm)</Label>
                <input
                  id="fc"
                  type="number"
                  value={frecuenciaCardiaca}
                  onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sistolica">Presión Sistólica</Label>
                  <input
                    id="sistolica"
                    type="number"
                    value={presionSistolica}
                    onChange={(e) => setPresionSistolica(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="diastolica">Presión Diastólica</Label>
                  <input
                    id="diastolica"
                    type="number"
                    value={presionDiastolica}
                    onChange={(e) => setPresionDiastolica(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80"
                  />
                </div>
              </div>

              <div>
                <Label>Estado de Conciencia</Label>
                <div className="mt-2 space-y-2">
                  {ESTADO_CONCIENCIA_OPTIONS.map((estado) => (
                    <label key={estado} className="flex items-center">
                      <input
                        type="radio"
                        name="conciencia"
                        value={estado}
                        checked={estadoConciencia === estado}
                        onChange={(e) => setEstadoConciencia(e.target.value)}
                        className="mr-2"
                      />
                      {estado}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("datos-paciente")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={() => setPaso("exploracion")}>Siguiente</Button>
              </div>
            </CardContent>
          </Card>
        )

      case "exploracion":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Stethoscope className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Exploración Física</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>¿Se realizó prueba de embarazo?</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pruebaEmbarazo"
                      checked={pruebaEmbarazoRealizada === true}
                      onChange={() => setPruebaEmbarazoRealizada(true)}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pruebaEmbarazo"
                      checked={pruebaEmbarazoRealizada === false}
                      onChange={() => setPruebaEmbarazoRealizada(false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {pruebaEmbarazoRealizada && (
                <div>
                  <Label htmlFor="resultadoEmbarazo">Resultado de la prueba</Label>
                  <select
                    id="resultadoEmbarazo"
                    value={resultadoPruebaEmbarazo}
                    onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Positivo">Positivo</option>
                    <option value="Negativo">Negativo</option>
                    <option value="Dudoso">Dudoso</option>
                  </select>
                </div>
              )}

              <div>
                <Label htmlFor="hallazgos">Hallazgos de exploración</Label>
                <textarea
                  id="hallazgos"
                  value={hallazgosExploracion}
                  onChange={(e) => setHallazgosExploracion(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describa los hallazgos relevantes..."
                />
              </div>

              <div>
                <Label>¿Tiene ecografía transabdominal?</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ecoTrans"
                      checked={tieneEcoTransabdominal === true}
                      onChange={() => setTieneEcoTransabdominal(true)}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ecoTrans"
                      checked={tieneEcoTransabdominal === false}
                      onChange={() => setTieneEcoTransabdominal(false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {tieneEcoTransabdominal && (
                <div>
                  <Label htmlFor="resultadoEco">Resultado de la ecografía</Label>
                  <textarea
                    id="resultadoEco"
                    value={resultadoEcoTransabdominal}
                    onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Describa los hallazgos ecográficos..."
                  />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("signos-vitales")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={() => setPaso("sintomas")}>Siguiente</Button>
              </div>
            </CardContent>
          </Card>
        )

      case "sintomas":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle>Síntomas Presentes</CardTitle>
              <p className="text-sm text-gray-600">Seleccione todos los que apliquen</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {SINTOMAS_OPTIONS.map((sintoma) => (
                  <label
                    key={sintoma}
                    className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={sintomasSeleccionados.includes(sintoma)}
                      onChange={() => toggleSeleccion(sintoma, sintomasSeleccionados, setSintomasSeleccionados)}
                      className="mr-3"
                    />
                    <span className="text-sm">{sintoma}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("exploracion")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={() => setPaso("factores")}>Siguiente</Button>
              </div>
            </CardContent>
          </Card>
        )

      case "factores":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-yellow-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle>Factores de Riesgo</CardTitle>
              <p className="text-sm text-gray-600">Seleccione todos los que apliquen</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {FACTORES_RIESGO_OPTIONS.map((factor) => (
                  <label
                    key={factor}
                    className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={factoresSeleccionados.includes(factor)}
                      onChange={() => toggleSeleccion(factor, factoresSeleccionados, setFactoresSeleccionados)}
                      className="mr-3"
                    />
                    <span className="text-sm">{factor}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("sintomas")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={() => setPaso("tvus")}>Siguiente</Button>
              </div>
            </CardContent>
          </Card>
        )

      case "tvus":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Ecografía Transvaginal (TVUS)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Resultado de TVUS</Label>
                <div className="mt-2 space-y-2">
                  {TVUS_OPTIONS.map((opcion) => (
                    <label
                      key={opcion}
                      className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="tvus"
                        value={opcion}
                        checked={tvus === opcion}
                        onChange={(e) => setTvus(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm">{opcion}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("factores")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={() => setPaso("hcg")} disabled={!tvus}>
                  Siguiente
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "hcg":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-pink-100 rounded-full w-fit">
                <TestTube className="h-8 w-8 text-pink-600" />
              </div>
              <CardTitle>Valores de β-hCG</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hcgAnterior && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>β-hCG anterior:</strong> {hcgAnterior} mUI/mL
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="hcgActual">β-hCG actual (mUI/mL)</Label>
                <input
                  id="hcgActual"
                  type="number"
                  step="0.1"
                  value={hcgValor}
                  onChange={(e) => setHcgValor(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1250.5"
                />
              </div>

              {!hcgAnterior && (
                <div>
                  <Label htmlFor="hcgPrevio">β-hCG anterior (mUI/mL) - Opcional</Label>
                  <input
                    id="hcgPrevio"
                    type="number"
                    step="0.1"
                    value={hcgAnterior}
                    onChange={(e) => setHcgAnterior(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 800.2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si tiene un valor previo, ayudará a calcular la variación
                  </p>
                </div>
              )}

              {hcgValor && hcgAnterior && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>Variación:</strong>{" "}
                    {(
                      ((Number.parseFloat(hcgValor) - Number.parseFloat(hcgAnterior)) /
                        Number.parseFloat(hcgAnterior)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button onClick={() => setPaso("tvus")} variant="outline">
                  Atrás
                </Button>
                <Button onClick={guardarConsulta} disabled={!hcgValor || loading}>
                  {loading ? "Calculando..." : "Calcular Resultado"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "resultado":
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div
                className={`mx-auto mb-4 p-3 rounded-full w-fit ${
                  resultado && resultado > 50 ? "bg-red-100" : "bg-green-100"
                }`}
              >
                <Heart className={`h-8 w-8 ${resultado && resultado > 50 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <CardTitle className="text-2xl font-bold">Resultado del Análisis</CardTitle>
              <p className="text-sm text-gray-600">ID: {consultaId}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${
                    resultado && resultado > 50 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  Probabilidad de Embarazo Ectópico: {resultado}%
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-l-4 ${
                  resultado && resultado > 50 ? "bg-red-50 border-red-400" : "bg-green-50 border-green-400"
                }`}
              >
                <h3 className={`font-semibold ${resultado && resultado > 50 ? "text-red-800" : "text-green-800"}`}>
                  Interpretación:
                </h3>
                <p className={`text-sm mt-1 ${resultado && resultado > 50 ? "text-red-700" : "text-green-700"}`}>
                  {resultado && resultado > 50
                    ? "Alta probabilidad de embarazo ectópico. Se recomienda evaluación inmediata y seguimiento estrecho."
                    : "Baja probabilidad de embarazo ectópico. Continuar con seguimiento rutinario del embarazo."}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Resumen de Datos:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <strong>Paciente:</strong> {nombrePaciente}
                  </div>
                  <div>
                    <strong>Edad:</strong> {edadPaciente} años
                  </div>
                  <div>
                    <strong>TVUS:</strong> {tvus}
                  </div>
                  <div>
                    <strong>β-hCG:</strong> {hcgValor} mUI/mL
                  </div>
                  <div>
                    <strong>Síntomas:</strong> {sintomasSeleccionados.length}
                  </div>
                  <div>
                    <strong>Factores de riesgo:</strong> {factoresSeleccionados.length}
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <Button
                  onClick={() => {
                    setPaso("buscar")
                    // Limpiar estados
                    setConsultaId("")
                    setConsultaCargada(null)
                    setNombrePaciente("")
                    setEdadPaciente("")
                    setFrecuenciaCardiaca("")
                    setPresionSistolica("")
                    setPresionDiastolica("")
                    setEstadoConciencia("")
                    setPruebaEmbarazoRealizada(null)
                    setResultadoPruebaEmbarazo("")
                    setHallazgosExploracion("")
                    setTieneEcoTransabdominal(null)
                    setResultadoEcoTransabdominal("")
                    setSintomasSeleccionados([])
                    setFactoresSeleccionados([])
                    setTvus("")
                    setHcgValor("")
                    setHcgAnterior("")
                    setResultado(null)
                    setError("")
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                >
                  Nueva Consulta
                </Button>

                <p className="text-xs text-gray-500">
                  Desarrollado por <strong>CMG Health Solutions</strong> - Sistema de Evaluación Diagnóstica Avanzada
                </p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Calculadora de Embarazo Ectópico</h1>
                <p className="text-blue-100 text-sm">Sistema de Evaluación Diagnóstica Avanzada</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">Sesión activa:</p>
              <p className="font-semibold">Christopher</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                onClick={() => {
                  // Lógica de cerrar sesión
                  alert("Cerrando sesión...")
                }}
              >
                <User className="h-4 w-4 mr-1" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderPaso()}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            Desarrollado por <strong>CMG Health Solutions</strong> - Sistema de Evaluación Diagnóstica Avanzada
          </div>
        </div>
      </footer>
    </div>
  )
}
