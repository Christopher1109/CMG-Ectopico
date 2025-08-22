"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { clienteSeguro } from "@/lib/api/clienteSeguro"
import { calcularRiesgo } from "@/lib/api/calculos"
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
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

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
      sintomas_seleccionados: Array.isArray(datos.sintomasSeleccionados) ? datos.sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(datos.factoresSeleccionados) ? datos.factoresSeleccionados : [],
      tvus: datos.tvus || null,
      hcg_valor: Number.isFinite(+datos.hcgValor) ? +datos.hcgValor : null,
      variacion_hcg: datos.variacionHcg || null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
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

// ==================== FUNCIONES AUXILIARES ====================
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
// ==================== COMPONENTE PRINCIPAL ====================
export default function CalculadoraEctopico() {
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [autenticado, setAutenticado] = useState(false)
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState("")

  const [seccionActual, setSeccionActual] = useState(1)
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
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")
  const [variacionHcg, setVariacionHcg] = useState<number | null>(null)

  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mensajeFinal, setMensajeFinal] = useState<React.ReactNode>("")
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // ==================== VALIDACIONES ====================
  async function validarPruebaEmbarazo(): Promise<boolean> {
    if (!pruebaEmbarazoRealizada) {
      setMostrarAlerta(true)
      setMensajeAlerta("Debe seleccionar si se realizó la prueba de embarazo.")
      return false
    }
    if (pruebaEmbarazoRealizada === "no") {
      setMostrarAlerta(true)
      setMensajeAlerta("Se recomienda realizar la prueba de embarazo antes de proseguir.")
      return false
    }
    if (pruebaEmbarazoRealizada === "si" && !resultadoPruebaEmbarazo) {
      setMostrarAlerta(true)
      setMensajeAlerta("Debe seleccionar el resultado de la prueba de embarazo.")
      return false
    }
    return true
  }

  // ==================== RENDER ====================
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">
              Iniciar sesión
            </h1>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">Usuario</Label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Contraseña</Label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  >
                    {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={() => {
                  const user = USUARIOS_AUTORIZADOS.find(
                    (u) => u.usuario === usuario && u.contraseña === contraseña,
                  )
                  if (user) {
                    setAutenticado(true)
                    setNombreUsuario(user.nombre)
                  } else {
                    setMostrarAlerta(true)
                    setMensajeAlerta("Usuario o contraseña incorrectos.")
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ingresar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">
              Herramienta de Apoyo - Embarazo Ectópico
            </h1>
            
            {/* ==================== ALERTAS GLOBALES ==================== */}
            {mostrarAlerta && (
              <div className="bg-yellow-50 p-4 mb-6 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">Aviso</span>
                </div>
                <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
              </div>
            )}
            {/* ==================== SECCIÓN 1: Datos del paciente y signos ==================== */}
            {seccionActual === 1 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-800">Datos del Paciente</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Nombre del paciente</Label>
                    <input
                      type="text"
                      value={nombrePaciente}
                      onChange={(e) => setNombrePaciente(e.target.value)}
                      placeholder="Nombre y apellidos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Edad</Label>
                    <input
                      type="number"
                      value={edadPaciente}
                      onChange={(e) => setEdadPaciente(e.target.value)}
                      placeholder="Años"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Frecuencia cardiaca (lpm)</Label>
                    <input
                      type="number"
                      value={frecuenciaCardiaca}
                      onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                      placeholder="p. ej. 82"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Presión sistólica (mmHg)</Label>
                    <input
                      type="number"
                      value={presionSistolica}
                      onChange={(e) => setPresionSistolica(e.target.value)}
                      placeholder="p. ej. 120"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Presión diastólica (mmHg)</Label>
                    <input
                      type="number"
                      value={presionDiastolica}
                      onChange={(e) => setPresionDiastolica(e.target.value)}
                      placeholder="p. ej. 80"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Estado de conciencia</Label>
                  <select
                    value={estadoConciencia}
                    onChange={(e) => setEstadoConciencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Seleccione…</option>
                    <option value="alerta">Alerta</option>
                    <option value="somnolienta">Somnolienta</option>
                    <option value="inconsciente">Inconsciente</option>
                  </select>
                </div>

                <div className="flex justify-between">
                  <div />
                  <Button
                    onClick={() => {
                      setMostrarAlerta(false)
                      setMensajeAlerta("")
                      setSeccionActual(2)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* ==================== SECCIÓN 2: Hallazgos de exploración ==================== */}
            {seccionActual === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-800">Exploración Física</h2>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">
                    Hallazgos de la exploración
                  </Label>
                  <textarea
                    value={hallazgosExploracion}
                    onChange={(e) => setHallazgosExploracion(e.target.value)}
                    rows={4}
                    placeholder="Describa los hallazgos relevantes…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
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
                      setMostrarAlerta(false)
                      setMensajeAlerta("")
                      setSeccionActual(3)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* ==================== SECCIÓN 3: Prueba de Embarazo (MODIFICADO) ==================== */}
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
                    {/* Sí */}
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

                    {/* No */}
                    <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 min-h-[60px]">
                      <input
                        type="radio"
                        name="pruebaEmbarazo"
                        value="no"
                        checked={pruebaEmbarazoRealizada === "no"}
                        onChange={async (e) => {
                          setPruebaEmbarazoRealizada(e.target.value)
                          // 🔔 ALERTA INMEDIATA
                          setMostrarAlerta(true)
                          setMensajeAlerta("Se recomienda realizar una prueba de embarazo antes de proseguir.")
                        }}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-base font-medium text-slate-700">No</span>
                    </label>
                  </div>
                </div>

                {/* Alerta visible inmediata al seleccionar "No" */}
                {pruebaEmbarazoRealizada === "no" && mostrarAlerta && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Sugerencia</span>
                    </div>
                    <p className="text-yellow-800 text-sm">
                      {mensajeAlerta || "Se recomienda realizar una prueba de embarazo antes de proseguir."}
                    </p>
                  </div>
                )}

                {/* Si es "Sí", mostrar resultado */}
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
                          onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
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
                        // Valida bloqueando la continuación si marcan "no"
                        const ok = await validarPruebaEmbarazo()
                        if (ok) setSeccionActual(4)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                      disabled={pruebaEmbarazoRealizada === "no"}
                      aria-disabled={pruebaEmbarazoRealizada === "no"}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SECCIÓN 4: Ecografía transabdominal ==================== */}
            {seccionActual === 4 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
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

                <div className="flex justify-between">
                  <Button
                    onClick={() => setSeccionActual(3)}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setSeccionActual(5)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            )}

            {/* ==================== SECCIÓN 5: Cálculo de riesgo (resumen mínimo) ==================== */}
            {seccionActual === 5 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <Calculator className="h-8 w-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Calculadora de Riesgo de Embarazo Ectópico</h2>
                      <p className="text-blue-100 text-sm">
                        Herramienta de apoyo clínico para la evaluación del riesgo
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
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

                  {/* Factores de riesgo */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Factores de Riesgo</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: "infertilidad", label: "Historia de infertilidad" },
                        { id: "ectopico_previo", label: "Embarazo ectópico previo" },
                        { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
                        { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
                      ].map((factor) => (
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

                  {/* TVUS y HCG */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Ecografía Transvaginal (TVUS)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">β-hCG (mUI/mL)</h4>
                      <input
                        type="number"
                        placeholder="Valor actual"
                        value={hcgValor}
                        onChange={(e) => setHcgValor(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        if (!tvus || !hcgValor) {
                          setMostrarAlerta(true)
                          setMensajeAlerta("Por favor complete TVUS y β-hCG.")
                          return
                        }
                        // Aquí podrías llamar a tu backend calcularRiesgo si lo deseas; lo omitimos para no cambiar tu diseño/lógica global.
                        setMostrarAlerta(false)
                        setMensajeAlerta("")
                        alert("Cálculo ejecutado (placeholder). Integra aquí tu llamada real si lo deseas.")
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg"
                    >
                      <Calculator className="h-5 w-5 mr-2" />
                      Calcular Riesgo
                    </Button>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-center mt-8 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de Apoyo Clínico
                    </p>
                    <p className="text-xs text-gray-400">
                      Esta aplicación es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico. <br />
                      El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
