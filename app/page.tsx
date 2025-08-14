"use client"

import { useState } from "react"
import type React from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Heart, Stethoscope, FileText, Calculator, User, Activity, AlertTriangle,
  Copy, Lock, Eye, EyeOff, CheckCircle, Download, ArrowRight,
} from "lucide-react"
import { crearConsulta, actualizarConsulta, obtenerConsulta } from "@/lib/api/consultas"

// ==================== SUPABASE (fallback directo) ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==================== USUARIOS AUTORIZADOS ====================
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "dra.lopez", contraseña: "DocAuth2024!", nombre: "Dra. López" },
  { usuario: "admin", contraseña: "CMGAdmin2024#", nombre: "Administrador" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
]

// ==================== HELPERS ====================
const numOrNull = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const esNumero = (v: any) => Number.isFinite(Number(v))

function generarIdConsulta(): string {
  const ids: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith("ectopico_ID-")) {
      const idCompleto = k.replace("ectopico_", "")
      const n = Number.parseInt(idCompleto.replace("ID-", ""))
      if (!Number.isNaN(n)) ids.push(n)
    }
  }
  const next = ids.length > 0 ? Math.max(...ids) + 1 : 1
  return `ID-${String(next).padStart(5, "0")}`
}

function normalizarConsulta(d: any) {
  if (!d) return null
  return {
    id: d.id,
    fecha_creacion: d.fecha_creacion ?? d.fechaCreacion ?? null,
    fecha_ultima_actualizacion: d.fecha_ultima_actualizacion ?? d.fechaUltimaActualizacion ?? null,
    usuario_creador: d.usuario_creador ?? d.usuarioCreador ?? null,

    nombre_paciente: d.nombre_paciente ?? d.nombrePaciente ?? null,
    edad_paciente: d.edad_paciente ?? d.edadPaciente ?? null,

    frecuencia_cardiaca: d.frecuencia_cardiaca ?? d.frecuenciaCardiaca ?? null,
    presion_sistolica: d.presion_sistolica ?? d.presionSistolica ?? null,
    presion_diastolica: d.presion_diastolica ?? d.presionDiastolica ?? null,
    estado_conciencia: d.estado_conciencia ?? d.estadoConciencia ?? null,

    prueba_embarazo_realizada: d.prueba_embarazo_realizada ?? d.pruebaEmbarazoRealizada ?? null,
    resultado_prueba_embarazo: d.resultado_prueba_embarazo ?? d.resultadoPruebaEmbarazo ?? null,

    hallazgos_exploracion: d.hallazgos_exploracion ?? d.hallazgosExploracion ?? null,
    tiene_eco_transabdominal: d.tiene_eco_transabdominal ?? d.tieneEcoTransabdominal ?? null,
    resultado_eco_transabdominal: d.resultado_eco_transabdominal ?? d.resultadoEcoTransabdominal ?? null,

    sintomas_seleccionados: d.sintomas_seleccionados ?? d.sintomasSeleccionados ?? [],
    factores_seleccionados: d.factores_seleccionados ?? d.factoresSeleccionados ?? [],

    tvus: d.tvus ?? null,
    hcg_valor: d.hcg_valor ?? d.hcgValor ?? null,
    variacion_hcg: d.variacion_hcg ?? d.variacionHcg ?? null,
    hcg_anterior: d.hcg_anterior ?? d.hcgAnterior ?? null,

    resultado: d.resultado ?? null,
    consulta_numero: d.consulta_numero ?? null,

    consulta1_tvus: d.consulta1_tvus ?? null,
    consulta1_hcg_valor: d.consulta1_hcg_valor ?? null,
    consulta1_resultado: d.consulta1_resultado ?? null,
    consulta1_fecha: d.consulta1_fecha ?? null,
    consulta1_usuario: d.consulta1_usuario ?? null,

    consulta2_tvus: d.consulta2_tvus ?? null,
    consulta2_hcg_valor: d.consulta2_hcg_valor ?? null,
    consulta2_variacion_hcg: d.consulta2_variacion_hcg ?? null,
    consulta2_resultado: d.consulta2_resultado ?? null,
    consulta2_fecha: d.consulta2_fecha ?? null,
    consulta2_usuario: d.consulta2_usuario ?? null,

    consulta3_tvus: d.consulta3_tvus ?? null,
    consulta3_hcg_valor: d.consulta3_hcg_valor ?? null,
    consulta3_variacion_hcg: d.consulta3_variacion_hcg ?? null,
    consulta3_resultado: d.consulta3_resultado ?? null,
    consulta3_fecha: d.consulta3_fecha ?? null,
    consulta3_usuario: d.consulta3_usuario ?? null,
  }
}

async function leerDatosDesdeBackend(id: string) {
  try {
    const res = await obtenerConsulta(id)
    if (res?.error) return null
    return res?.data ?? null
  } catch {
    return null
  }
}

async function rowExists(id: string) {
  try {
    const r = await obtenerConsulta(id)
    if (r && !r.error && r.data) return true
  } catch {}
  try {
    const { data, error } = await supabase.from("consultas").select("id").eq("id", id).maybeSingle()
    if (!error && data?.id) return true
  } catch {}
  return false
}

async function insertDirectSupabase(payloadMin: any) {
  try {
    const { error } = await supabase.from("consultas").insert(payloadMin)
    return !error
  } catch {
    return false
  }
}
async function updateDirectSupabase(id: string, patchMin: any) {
  try {
    const { error } = await supabase.from("consultas").update(patchMin).eq("id", id)
    return !error
  } catch {
    return false
  }
}

// Asegura fila para C2/C3
async function asegurarFilaEnBD(id: string, usuarioActual: string, nombrePaciente?: string, edad?: string) {
  if (await rowExists(id)) return true
  const payloadMin = {
    id,
    usuario_creador: usuarioActual || null,
    nombre_paciente: nombrePaciente ?? null,
    edad_paciente: numOrNull(edad),
    consulta_numero: 1 as const,
  }
  try {
    const r = await crearConsulta(payloadMin)
    if (!r?.error) return true
  } catch {}
  return await insertDirectSupabase(payloadMin)
}

// Guardado robusto por consulta (incluye fallbacks en cascada)
async function guardarEnDB_porConsulta(
  id: string,
  numeroConsulta: 1 | 2 | 3,
  datos: {
    usuarioActual: string
    tvus?: string
    hcgValor?: string
    hcgAnterior?: string | null
    variacionHcg?: string | null
    resultado: number | null

    nombrePaciente?: string
    edadPaciente?: string
    frecuenciaCardiaca?: string
    presionSistolica?: string
    presionDiastolica?: string
    estadoConciencia?: string
    pruebaEmbarazoRealizada?: string
    resultadoPruebaEmbarazo?: string
    hallazgosExploracion?: string
    tieneEcoTransabdominal?: string
    resultadoEcoTransabdominal?: string
    sintomasSeleccionados?: string[]
    factoresSeleccionados?: string[]
  },
): Promise<boolean> {
  const fechaISO = new Date().toISOString()

  // ---- CONSULTA 1: crear si no existe, si existe actualiza ----
  if (numeroConsulta === 1) {
    const payloadFull = {
      id,
      usuario_creador: datos.usuarioActual || null,

      nombre_paciente: datos.nombrePaciente ?? null,
      edad_paciente: numOrNull(datos.edadPaciente),

      frecuencia_cardiaca: numOrNull(datos.frecuenciaCardiaca),
      presion_sistolica: numOrNull(datos.presionSistolica),
      presion_diastolica: numOrNull(datos.presionDiastolica),
      estado_conciencia: datos.estadoConciencia ?? null,

      prueba_embarazo_realizada: datos.pruebaEmbarazoRealizada ?? null,
      resultado_prueba_embarazo: datos.resultadoPruebaEmbarazo ?? null,

      hallazgos_exploracion: datos.hallazgosExploracion ?? null,
      tiene_eco_transabdominal: datos.tieneEcoTransabdominal ?? null,
      resultado_eco_transabdominal: datos.resultadoEcoTransabdominal ?? null,

      sintomas_seleccionados: datos.sintomasSeleccionados ?? [],
      factores_seleccionados: datos.factoresSeleccionados ?? [],

      tvus: datos.tvus ?? null,
      hcg_valor: numOrNull(datos.hcgValor),
      hcg_anterior: numOrNull(datos.hcgAnterior),
      variacion_hcg: datos.variacionHcg ?? null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,

      consulta_numero: 1 as const,
      consulta1_tvus: datos.tvus ?? null,
      consulta1_hcg_valor: numOrNull(datos.hcgValor),
      consulta1_resultado: datos.resultado,
      consulta1_fecha: fechaISO,
      consulta1_usuario: datos.usuarioActual || null,
    }

    const payloadMin = {
      id,
      usuario_creador: datos.usuarioActual || null,
      nombre_paciente: datos.nombrePaciente ?? null,
      edad_paciente: numOrNull(datos.edadPaciente),
      tvus: datos.tvus ?? null,
      hcg_valor: numOrNull(datos.hcgValor),
      hcg_anterior: numOrNull(datos.hcgAnterior),
      variacion_hcg: datos.variacionHcg ?? null,
      resultado: typeof datos.resultado === "number" ? datos.resultado : null,
      consulta_numero: 1 as const,
    }

    // 1) Si ya existe → actualiza
    if (await rowExists(id)) {
      try {
        const r = await actualizarConsulta(id, payloadFull)
        if (!r?.error) return true
      } catch {}
      try {
        const r2 = await actualizarConsulta(id, payloadMin)
        if (!r2?.error) return true
      } catch {}
      return await updateDirectSupabase(id, payloadMin)
    }

    // 2) No existe → crea
    try {
      const r = await crearConsulta(payloadFull)
      if (!r?.error) return true
    } catch {}
    try {
      const r2 = await crearConsulta(payloadMin)
      if (!r2?.error) return true
    } catch {}
    return await insertDirectSupabase(payloadMin)
  }

  // ---- CONSULTA 2/3: asegurar fila y actualizar con fallback mínimo ----
  const comunes = {
    tvus: datos.tvus ?? null,
    hcg_valor: numOrNull(datos.hcgValor),
    hcg_anterior: numOrNull(datos.hcgAnterior),
    variacion_hcg: datos.variacionHcg ?? null,
    resultado: typeof datos.resultado === "number" ? datos.resultado : datos.resultado === null ? null : null,
  }

  if (numeroConsulta === 2) {
    const full = {
      ...comunes,
      consulta_numero: 2 as const,
      consulta2_tvus: datos.tvus ?? null,
      consulta2_hcg_valor: numOrNull(datos.hcgValor),
      consulta2_variacion_hcg: datos.variacionHcg ?? null,
      consulta2_resultado: datos.resultado,
      consulta2_fecha: fechaISO,
      consulta2_usuario: datos.usuarioActual || null,
    }
    try {
      const r = await actualizarConsulta(id, full)
      if (!r?.error) return true
    } catch {}
    try {
      const r2 = await actualizarConsulta(id, { ...comunes, consulta_numero: 2 as const })
      if (!r2?.error) return true
    } catch {}
    return await updateDirectSupabase(id, { ...comunes, consulta_numero: 2 as const })
  }

  const full3 = {
    ...comunes,
    consulta_numero: 3 as const,
    consulta3_tvus: datos.tvus ?? null,
    consulta3_hcg_valor: numOrNull(datos.hcgValor),
    consulta3_variacion_hcg: datos.variacionHcg ?? null,
    consulta3_resultado: datos.resultado,
    consulta3_fecha: fechaISO,
    consulta3_usuario: datos.usuarioActual || null,
  }
  try {
    const r = await actualizarConsulta(id, full3)
    if (!r?.error) return true
  } catch {}
  try {
    const r2 = await actualizarConsulta(id, { ...comunes, consulta_numero: 3 as const })
    if (!r2?.error) return true
  } catch {}
  return await updateDirectSupabase(id, { ...comunes, consulta_numero: 3 as const })
}

// Bayes
function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb)
  for (const LR of LRs) odds *= LR
  return +(odds / (1 + odds)).toFixed(4)
}

// ==================== MAPAS Tabla 1 ====================
const probabilidadesSinFactores = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 }
const probabilidadesConFactores = { asintomatica: 0.05, sangrado: 0.08, dolor: 0.4, dolor_sangrado: 0.46 }
const tvusMap = { normal: 0.07, libre: 2.4, masa: 38, masa_libre: 47 }
const hcgMap = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
}
const variacionHcgMap = {
  reduccion_1_35: 16.6, reduccion_35_50: 0.8, reduccion_mayor_50: 0, aumento: 3.3, no_disponible: 1,
}

// ==================== LISTAS ====================
const factoresRiesgo = [
  { id: "infertilidad", label: "Historia de infertilidad" },
  { id: "ectopico_previo", label: "Embarazo ectópico previo" },
  { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
  { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
]
const sintomasList = [
  { id: "sangrado", label: "Sangrado vaginal" },
  { id: "dolor", label: "Dolor pélvico/abdominal" },
  { id: "dolor_sangrado", label: "Sangrado vaginal + Dolor pélvico/abdominal" },
  { id: "sincope", label: "Síncope o mareo" },
]

// ============================================================================
//                               COMPONENTE
// ============================================================================
export default function CalculadoraEctopico() {
  // ----- auth -----
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState("")
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [usuario, setUsuario] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [mostrarContraseña, setMostrarContraseña] = useState(false)
  const [errorLogin, setErrorLogin] = useState("")
  const [intentosLogin, setIntentosLogin] = useState(0)

  // ----- navegación -----
  const [seccionActual, setSeccionActual] = useState(1)
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([])
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true)

  // ----- datos base -----
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

  // ----- seguimiento & consultas -----
  const [idSeguimiento, setIdSeguimiento] = useState("")
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false)
  const [esConsultaSeguimiento, setEsConsultaSeguimiento] = useState(false)

  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([])
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([])
  const [tvus, setTvus] = useState("")
  const [hcgValor, setHcgValor] = useState("")
  const [variacionHcg, setVariacionHcg] = useState("")
  const [hcgAnterior, setHcgAnterior] = useState("")

  // ----- resultados / UI -----
  const [resultado, setResultado] = useState<number | null>(null)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [mensajeFinal, setMensajeFinal] = useState("")
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")

  // ----- búsqueda de consulta -----
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false)
  const [idBusqueda, setIdBusqueda] = useState("")
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false)
  const [consultaCargada, setConsultaCargada] = useState<any>(null)

  // ==================== UI helpers ====================
  const ProgressBar = () => {
    const steps = [
      { id: 1, name: "Expediente Clínico", icon: User },
      { id: 2, name: "Signos Vitales", icon: Activity },
      { id: 3, name: "Prueba Embarazo", icon: FileText },
      { id: 4, name: "Evaluación Previa", icon: Stethoscope },
      { id: 5, name: "Consultas", icon: Calculator },
    ]
    return (
      <div className="bg-gray-100 py-6 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = seccionesCompletadas.includes(step.id)
              const isCurrent = seccionActual === step.id
              const isAccessible = step.id <= Math.max(...seccionesCompletadas, seccionActual)
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-blue-500 text-white" : isAccessible ? "bg-gray-300 text-gray-600" : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-20 ${isCurrent ? "font-semibold text-blue-600" : "text-gray-600"}`}>{step.name}</span>
                  </div>
                  {index < steps.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400 mx-4 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema de Evaluación Diagnóstica Avanzada
      </p>
    </div>
  )

  const completarSeccion = (seccion: number) => {
    if (!seccionesCompletadas.includes(seccion)) setSeccionesCompletadas([...seccionesCompletadas, seccion])
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
  }

  const copiarId = () => {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento)
      alert("ID copiado al portapapeles")
    }
  }

  // ==================== LOGIN ====================
  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorLogin("")
    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.")
      return
    }
    const u = USUARIOS_AUTORIZADOS.find(
      (x) => x.usuario.toLowerCase() === usuario.toLowerCase() && x.contraseña === contraseña,
    )
    if (u) {
      setEstaAutenticado(true)
      setUsuarioActual(u.usuario)
      setNombreUsuario(u.nombre)
      setIntentosLogin(0)
      setUsuario("")
      setContraseña("")
    } else {
      setIntentosLogin((p) => p + 1)
      setErrorLogin(`Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`)
      setContraseña("")
    }
  }
  const cerrarSesion = () => {
    setEstaAutenticado(false)
    setUsuarioActual("")
    setNombreUsuario("")
    resetCalculadora()
  }

  // ==================== INICIO / CONTINUAR ====================
  const iniciarNuevaEvaluacion = async () => {
    const nuevoId = generarIdConsulta()
    resetCalculadora()
    setIdSeguimiento(nuevoId)
    setMostrarPantallaBienvenida(false)
    setEsConsultaSeguimiento(false)
  }

  const continuarConsultaCargada = async () => {
    if (!consultaCargada) return
    setIdSeguimiento(consultaCargada.id)
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
    setTvus("") // no preseleccionado
    setHcgAnterior(consultaCargada.hcg_valor?.toString() || "")
    setHcgValor("")
    setEsConsultaSeguimiento(true)
    setSeccionesCompletadas([1, 2, 3, 4])
    setMostrarResumenConsulta(false)
    setModoCargarConsulta(false)
    setMostrarPantallaBienvenida(false)
    setSeccionActual(5)
  }

  // ==================== BÚSQUEDA ====================
  const buscarConsulta = async () => {
    const id = idBusqueda.trim().toUpperCase()
    if (!id.startsWith("ID-") || id.length !== 8) {
      alert("Formato de ID incorrecto. Debe ser ID-NNNNN (ejemplo: ID-00001)")
      return
    }

    let encontrada: any = null
    const local = localStorage.getItem(`ectopico_${id}`)
    if (local) {
      try {
        encontrada = normalizarConsulta(JSON.parse(local))
      } catch {}
    }
    if (!encontrada) {
      const row = await leerDatosDesdeBackend(id)
      if (row) {
        const n = normalizarConsulta(row)
        encontrada = n
        localStorage.setItem(`ectopico_${id}`, JSON.stringify(n))
      }
    }
    if (encontrada) {
      setConsultaCargada(encontrada)
      setMostrarResumenConsulta(true)
      setModoCargarConsulta(false)
    } else {
      alert("No se encontró ninguna consulta con ese ID")
    }
  }

  // ==================== CORTES TEMPRANOS ====================
  async function registrarCorteTemprano(resultadoInferido: number | null, motivo: string) {
    try {
      const id = idSeguimiento || generarIdConsulta()
      if (!idSeguimiento) setIdSeguimiento(id)
      let numero: 1 | 2 | 3 = esConsultaSeguimiento ? 2 : 1
      if (esConsultaSeguimiento) {
        const fila = await leerDatosDesdeBackend(id)
        numero = fila?.consulta2_fecha ? 3 : 2
      }
      await asegurarFilaEnBD(id, usuarioActual, nombrePaciente, edadPaciente)
      await guardarEnDB_porConsulta(id, numero, {
        usuarioActual,
        tvus,
        hcgValor,
        hcgAnterior,
        variacionHcg,
        resultado: resultadoInferido,
        nombrePaciente,
        edadPaciente,
        frecuenciaCardiaca,
        presionSistolica,
        presionDiastolica,
        estadoConciencia,
        pruebaEmbarazoRealizada,
        resultadoPruebaEmbarazo,
        hallazgosExploracion,
        tieneEcoTransabdominal,
        resultadoEcoTransabdominal,
        sintomasSeleccionados,
        factoresSeleccionados,
      })
    } catch {}
  }

  // ==================== VALIDACIONES ====================
  const validarSignosVitales = () => {
    const fc = Number.parseFloat(frecuenciaCardiaca)
    const sistolica = Number.parseFloat(presionSistolica)
    const diastolica = Number.parseFloat(presionDiastolica)

    setMostrarAlerta(false)
    setMensajeAlerta("")

    if (sistolica >= 180 || diastolica >= 110) {
      setMensajeFinal("🚨 Crisis hipertensiva. Traslado inmediato.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "crisis_hipertensiva")
      return false
    }
    if (fc > 100 && (sistolica <= 90 || diastolica <= 60)) {
      setMensajeFinal("🚨 Taquicardia con hipotensión. Traslado inmediato.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "taquicardia_hipotension")
      return false
    }
    if (fc > 120) {
      setMensajeFinal("🚨 Taquicardia severa. Traslado inmediato.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "taquicardia_severa")
      return false
    }
    if (fc < 50) {
      setMensajeFinal("🚨 Bradicardia severa. Traslado inmediato.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "bradicardia_severa")
      return false
    }
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa") {
      setMensajeFinal("🚨 Alteración severa de la conciencia. Traslado inmediato.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "alteracion_conciencia")
      return false
    }

    if (sistolica < 90 || diastolica < 60) {
      setMostrarAlerta(true); setMensajeAlerta("Hipotensión arterial. Evaluar de inmediato.")
    } else if (sistolica >= 140 || diastolica >= 90) {
      setMostrarAlerta(true); setMensajeAlerta("Hipertensión arterial. Requiere seguimiento.")
    } else if (fc > 100) {
      setMostrarAlerta(true); setMensajeAlerta("Taquicardia. Monitoreo recomendado.")
    } else if (fc < 60) {
      setMostrarAlerta(true); setMensajeAlerta("Bradicardia. Evaluación recomendada.")
    }
    return true
  }

  const validarPruebaEmbarazo = () => {
    if (pruebaEmbarazoRealizada === "no") {
      setMensajeFinal("Se requiere prueba de embarazo cualitativa antes de continuar.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(null, "sin_prueba_embarazo")
      return false
    }
    if (resultadoPruebaEmbarazo === "negativa") {
      setMensajeFinal("Prueba de embarazo negativa. Ectópico descartado.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(0, "prueba_negativa")
      return false
    }
    return true
  }

  const validarEcoTransabdominal = () => {
    const confirmatorias = [
      "saco_embrion_fc", "saco_vitelino_embrion", "saco_vitelino_sin_embrion",
      "saco_sin_embrion", "saco_10mm_decidual_2mm",
    ]
    if (tieneEcoTransabdominal === "si" && confirmatorias.includes(resultadoEcoTransabdominal)) {
      setMensajeFinal("Hallazgos compatibles con embarazo intrauterino.")
      setProtocoloFinalizado(true)
      registrarCorteTemprano(0, "evidencia_intrauterina")
      return false
    }
    return true
  }

  // ==================== CÁLCULO + GUARDADO ====================
  const calcular = async () => {
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Por favor complete: síntomas, TVUS y β-hCG.")
      return
    }

    const tieneFactores = factoresSeleccionados.length > 0
    const sintomasParaCalculo = sintomasSeleccionados.filter((s) => s !== "sincope")
    let clave: "asintomatica" | "sangrado" | "dolor" | "dolor_sangrado" = "asintomatica"
    if (sintomasParaCalculo.includes("dolor_sangrado") || (sintomasParaCalculo.includes("sangrado") && sintomasParaCalculo.includes("dolor")))
      clave = "dolor_sangrado"
    else if (sintomasParaCalculo.includes("sangrado")) clave = "sangrado"
    else if (sintomasParaCalculo.includes("dolor")) clave = "dolor"
    const tabla = tieneFactores ? probabilidadesConFactores : probabilidadesSinFactores
    const probPre = tabla[clave]

    const LRs: number[] = []
    const lrTvus = tvusMap[tvus as keyof typeof tvusMap]
    if (lrTvus) LRs.push(lrTvus)

    const hcgNum = Number.parseFloat(hcgValor)
    const nivel = hcgNum >= 2000 ? "alto" : "bajo"
    const lrHcg = hcgMap[tvus as keyof typeof hcgMap]?.[nivel as "alto" | "bajo"]
    if (lrHcg) LRs.push(lrHcg)

    let variacionCalculada: keyof typeof variacionHcgMap | "no_disponible" = "no_disponible"
    if (hcgAnterior && hcgValor) {
      const prev = Number.parseFloat(hcgAnterior)
      const now = Number.parseFloat(hcgValor)
      if (esNumero(prev) && esNumero(now)) {
        if (now > prev) variacionCalculada = "aumento"
        else {
          const pct = ((prev - now) / prev) * 100
          if (pct >= 50) variacionCalculada = "reduccion_mayor_50"
          else if (pct >= 35) variacionCalculada = "reduccion_35_50"
          else if (pct >= 1) variacionCalculada = "reduccion_1_35"
          else variacionCalculada = "aumento"
        }
        setVariacionHcg(variacionCalculada)
        const lrVar = variacionHcgMap[variacionCalculada as keyof typeof variacionHcgMap]
        if (lrVar) LRs.push(lrVar)
      }
    }

    const probPost = calcularProbabilidad(probPre, LRs)
    setResultado(probPost)

    const fechaActual = new Date().toISOString()
    const paqueteLocal = {
      id: idSeguimiento,
      fechaCreacion: fechaActual,
      fechaUltimaActualizacion: fechaActual,
      usuarioCreador: usuarioActual,
      nombrePaciente,
      edadPaciente: numOrNull(edadPaciente),
      frecuenciaCardiaca: numOrNull(frecuenciaCardiaca),
      presionSistolica: numOrNull(presionSistolica),
      presionDiastolica: numOrNull(presionDiastolica),
      estadoConciencia,
      pruebaEmbarazoRealizada,
      resultadoPruebaEmbarazo,
      hallazgosExploracion,
      tieneEcoTransabdominal,
      resultadoEcoTransabdominal,
      sintomasSeleccionados,
      factoresSeleccionados,
      tvus,
      hcgValor: numOrNull(hcgValor),
      variacionHcg: variacionCalculada,
      hcgAnterior: hcgAnterior ? numOrNull(hcgAnterior) : null,
      resultado: probPost,
    }
    localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(paqueteLocal))

    let numeroConsulta: 1 | 2 | 3 = 1
    if (!esConsultaSeguimiento) numeroConsulta = 1
    else {
      const fila = await leerDatosDesdeBackend(idSeguimiento)
      numeroConsulta = fila?.consulta2_fecha ? 3 : 2
    }

    try {
      // Asegurar fila para cualquier caso (si ya existía por corte temprano o similar)
      await asegurarFilaEnBD(idSeguimiento, usuarioActual, nombrePaciente, edadPaciente)
      const ok = await guardarEnDB_porConsulta(idSeguimiento, numeroConsulta, {
        usuarioActual,
        tvus,
        hcgValor,
        hcgAnterior,
        variacionHcg: variacionCalculada,
        resultado: probPost,
        nombrePaciente,
        edadPaciente,
        frecuenciaCardiaca,
        presionSistolica,
        presionDiastolica,
        estadoConciencia,
        pruebaEmbarazoRealizada,
        resultadoPruebaEmbarazo,
        hallazgosExploracion,
        tieneEcoTransabdominal,
        resultadoEcoTransabdominal,
        sintomasSeleccionados,
        factoresSeleccionados,
      })
      if (!ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")
    } catch (e) {
      console.error("Error sincronizando con DB:", e)
      alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.")
    }

    if (probPost >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (≥95%). Proceder con manejo.")
      setProtocoloFinalizado(true)
    } else if (probPost < 0.01) {
      setMensajeFinal("Ectópico descartado (<1%).")
      setProtocoloFinalizado(true)
    } else {
      setMostrarResultados(true)
      setMostrarIdSeguimiento(true)
    }
  }

  const obtenerNombreSintoma = (id: string) => sintomasList.find((s) => s.id === id)?.label ?? id
  const obtenerNombreFactor = (id: string) => factoresRiesgo.find((f) => f.id === id)?.label ?? id
  const obtenerNombreTVUS = (id: string) =>
    id === "normal" ? "Normal" : id === "libre" ? "Líquido libre" : id === "masa" ? "Masa anexial" : id === "masa_libre" ? "Masa anexial + líquido libre" : "No especificado"

  const generarInforme = () => {
    try {
      const contenido = `
INFORME MÉDICO - EVALUACIÓN DE EMBARAZO ECTÓPICO
================================================
ID: ${idSeguimiento}
Fecha: ${new Date().toLocaleDateString()}
Médico: ${nombreUsuario}

Paciente: ${nombrePaciente}
Edad: ${edadPaciente || "N/D"} años

Signos Vitales:
FC: ${frecuenciaCardiaca || "N/D"} lpm
PA: ${presionSistolica || "N/D"}/${presionDiastolica || "N/D"} mmHg
Conciencia: ${estadoConciencia || "N/D"}

TVUS: ${obtenerNombreTVUS(tvus)}
β-hCG actual: ${hcgValor || "N/D"} mUI/mL
${hcgAnterior ? `β-hCG anterior: ${hcgAnterior} mUI/mL` : ""}

Síntomas:
${sintomasSeleccionados.map((s) => `- ${obtenerNombreSintoma(s)}`).join("\n")}

Factores de riesgo:
${factoresSeleccionados.map((f) => `- ${obtenerNombreFactor(f)}`).join("\n") || "- Ninguno"}

Resultado:
${resultado !== null ? `Probabilidad de ectópico: ${(resultado * 100).toFixed(1)}%` : "No calculado"}

Conclusión:
${
  mensajeFinal ||
  (resultado
    ? resultado >= 0.95
      ? "Alta probabilidad - Confirmar diagnóstico"
      : resultado < 0.01
      ? "Baja probabilidad - Descartar diagnóstico"
      : "Probabilidad intermedia - Seguimiento"
    : "Evaluación en proceso")
}
================================================
CMG Health Solutions
`
      const a = document.createElement("a")
      const file = new Blob([contenido], { type: "text/plain" })
      a.href = URL.createObjectURL(file)
      a.download = `Informe_Ectopico_${idSeguimiento}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      alert("Informe generado.")
    } catch {
      alert("No se pudo generar el informe.")
    }
  }

  // ==================== LOGIN VIEW ====================
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
                  <p className="text-sm text-slate-600">Sistema Médico Autorizado</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900 text-sm">Acceso Solo para Personal Médico Autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">Ingrese con sus credenciales institucionales.</p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario</Label>
                  <input
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={intentosLogin >= 5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Contraseña</Label>
                  <div className="relative">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setMostrarContraseña(!mostrarContraseña)}
                      disabled={intentosLogin >= 5}
                    >
                      {mostrarContraseña ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
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
                  <Lock className="mr-2 h-4 w-4" />
                  {intentosLogin >= 5 ? "Acceso Bloqueado" : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">¿Problemas para acceder? Contacte al administrador del sistema.</p>
                <p className="text-xs text-slate-400 mt-2">
                  <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema Seguro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ==================== APP ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Calculadora de Embarazo Ectópico</h1>
                <p className="text-blue-100 text-sm">Sistema de Evaluación Diagnóstica Avanzada</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {idSeguimiento && (
                <div className="bg-white/20 px-4 py-2 rounded-full flex items-center space-x-2">
                  <span className="text-sm font-mono">ID: {idSeguimiento}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20" onClick={copiarId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-blue-100">Sesión activa:</p>
                <p className="font-semibold">{nombreUsuario}</p>
              </div>
              <Button onClick={cerrarSesion} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <User className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pantallas */}
      {mostrarPantallaBienvenida ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido al Sistema</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">Seleccione una opción para comenzar</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button onClick={iniciarNuevaEvaluacion} className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold">
                    <div className="flex flex-col items-center space-y-2">
                      <User className="h-8 w-8" />
                      <span>Nueva Evaluación</span>
                    </div>
                  </Button>
                  <Button
                    onClick={() => { setMostrarPantallaBienvenida(false); setModoCargarConsulta(true) }}
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
                    <span className="font-medium text-blue-900">Información</span>
                  </div>
                  <p className="text-blue-800 text-sm">Ingrese el ID que recibió al finalizar la consulta anterior.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de seguimiento</Label>
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
                    <Button onClick={buscarConsulta} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold">
                      <FileText className="h-4 w-4 mr-2" />
                      Buscar Consulta
                    </Button>
                    <Button onClick={() => { setModoCargarConsulta(false); setMostrarPantallaBienvenida(true) }} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
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
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800">Consulta Encontrada</h2>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de la consulta previa</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>ID:</strong> {consultaCargada.id}</p>
                      <p><strong>Paciente:</strong> {consultaCargada.nombre_paciente || "No especificado"}</p>
                      <p><strong>Edad:</strong> {consultaCargada.edad_paciente || "No especificado"} años</p>
                      <p><strong>β-hCG anterior:</strong> {consultaCargada.hcg_valor || "No especificado"} mUI/mL</p>
                    </div>
                    <div>
                      <p><strong>TVUS:</strong> {obtenerNombreTVUS(consultaCargada.tvus)}</p>
                      <p><strong>Resultado previo:</strong> {consultaCargada.resultado ? `${(consultaCargada.resultado * 100).toFixed(1)}%` : "No calculado"}</p>
                      <p><strong>Fecha:</strong> {consultaCargada.fecha_creacion ? new Date(consultaCargada.fecha_creacion).toLocaleDateString() : "No disponible"}</p>
                      <p><strong>Frecuencia Cardíaca:</strong> {consultaCargada.frecuencia_cardiaca || "N/A"} lpm</p>
                    </div>
                  </div>

                  {consultaCargada.sintomas_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium">Síntomas:</p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.sintomas_seleccionados.map((s: string) => <li key={s}>{obtenerNombreSintoma(s)}</li>)}
                      </ul>
                    </div>
                  )}

                  {consultaCargada.factores_seleccionados?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium">Factores de riesgo:</p>
                      <ul className="list-disc list-inside text-sm text-blue-800">
                        {consultaCargada.factores_seleccionados.map((f: string) => <li key={f}>{obtenerNombreFactor(f)}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button onClick={continuarConsultaCargada} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continuar Consulta
                  </Button>
                  <Button onClick={() => { setMostrarResumenConsulta(false); setModoCargarConsulta(true); setConsultaCargada(null) }} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                    Buscar Otra Consulta
                  </Button>
                </div>
                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : protocoloFinalizado ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Evaluación Completada</h2>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <p className="text-blue-900 font-medium">{mensajeFinal}</p>
              </div>

              {resultado !== null && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                  <p className="text-blue-800 text-sm">
                    {resultado >= 0.95 ? "Alta probabilidad - Confirmar diagnóstico" : resultado < 0.01 ? "Baja probabilidad - Descartar diagnóstico" : "Probabilidad intermedia - Seguimiento"}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={generarInforme} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Download className="h-4 w-4 mr-2" />
                  Generar Informe
                </Button>
                <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white">
                  <User className="h-4 w-4 mr-2" />
                  Nueva Evaluación
                </Button>
              </div>
              <CMGFooter />
            </CardContent>
          </Card>
        </div>
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Resultado de la Evaluación</h2>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad de Embarazo Ectópico</h3>
                <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                <p className="text-blue-800 text-sm">
                  {resultado >= 0.95 ? "Alta probabilidad - Confirmar diagnóstico" : resultado < 0.01 ? "Baja probabilidad - Descartar diagnóstico" : "Probabilidad intermedia - Seguimiento"}
                </p>
              </div>

              {mostrarIdSeguimiento && idSeguimiento && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-900">Seguimiento</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-800">Guarde este ID:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                      <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-yellow-300">
                      <h4 className="font-medium text-yellow-900 mb-2">Indicaciones</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• Regrese en 48–72 horas para la siguiente consulta.</li>
                        <li>• Mantenga vigilancia de síntomas.</li>
                        <li>• Acuda de inmediato ante dolor intenso, sangrado abundante o signos de choque.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={generarInforme} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Download className="h-4 w-4 mr-2" />
                  Generar Informe
                </Button>
                <Button onClick={resetCalculadora} className="bg-green-600 hover:bg-green-700 text-white">
                  <User className="h-4 w-4 mr-2" />
                  Nueva Evaluación
                </Button>
              </div>

              <CMGFooter />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <ProgressBar />
          <div className="max-w-4xl mx-auto p-6">
            <Card className="shadow-lg">
              <CardContent className="p-8">
                {/* Sección 1 */}
                {seccionActual === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <User className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Nombre del paciente</Label>
                        <input
                          type="text"
                          placeholder="Nombre del paciente"
                          value={nombrePaciente}
                          onChange={(e) => setNombrePaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-slate-500">Escriba el nombre del paciente.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Edad</Label>
                        <input
                          type="number"
                          placeholder="Años cumplidos"
                          value={edadPaciente}
                          onChange={(e) => setEdadPaciente(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-slate-500">Ingrese la edad en años.</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => completarSeccion(1)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 2 */}
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
                          <span className="font-medium text-yellow-900">Alerta</span>
                        </div>
                        <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Frecuencia cardíaca (lpm)</Label>
                        <input
                          type="number"
                          placeholder="Ej. 80"
                          value={frecuenciaCardiaca}
                          onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-slate-500">Ingrese la frecuencia cardíaca.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión sistólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Ej. 110"
                            value={presionSistolica}
                            onChange={(e) => setPresionSistolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Presión diastólica (mmHg)</Label>
                          <input
                            type="number"
                            placeholder="Ej. 70"
                            value={presionDiastolica}
                            onChange={(e) => setPresionDiastolica(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Estado de conciencia</Label>
                        <select
                          value={estadoConciencia}
                          onChange={(e) => setEstadoConciencia(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        >
                          <option value="">Seleccione</option>
                          <option value="alerta">Alerta</option>
                          <option value="somnolienta">Somnolienta</option>
                          <option value="estuporosa">Estuporosa</option>
                          <option value="comatosa">Comatosa</option>
                        </select>
                        <p className="text-xs text-slate-500">Seleccione el estado actual.</p>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(1)} variant="outline" className="border-gray-300">
                        Anterior
                      </Button>
                      <Button onClick={() => { if (validarSignosVitales()) completarSeccion(2) }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 3 */}
                {seccionActual === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó la prueba?</Label>
                        <select
                          value={pruebaEmbarazoRealizada}
                          onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        >
                          <option value="">Seleccione</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                        <p className="text-xs text-slate-500">Indique si se realizó la prueba cualitativa.</p>
                      </div>
                      {pruebaEmbarazoRealizada === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado de la prueba</Label>
                          <select
                            value={resultadoPruebaEmbarazo}
                            onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                          >
                            <option value="">Seleccione</option>
                            <option value="positiva">Positiva</option>
                            <option value="negativa">Negativa</option>
                          </select>
                          <p className="text-xs text-slate-500">Seleccione el resultado.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(2)} variant="outline" className="border-gray-300">
                        Anterior
                      </Button>
                      <Button onClick={() => { if (validarPruebaEmbarazo()) completarSeccion(3) }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 4 */}
                {seccionActual === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Stethoscope className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Hallazgos en la exploración</Label>
                        <textarea
                          placeholder="Describa hallazgos clínicos relevantes"
                          value={hallazgosExploracion}
                          onChange={(e) => setHallazgosExploracion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-slate-500">Describa los hallazgos de la exploración física.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">¿Se realizó ecografía transabdominal?</Label>
                        <select
                          value={tieneEcoTransabdominal}
                          onChange={(e) => setTieneEcoTransabdominal(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        >
                          <option value="">Seleccione</option>
                          <option value="si">Sí</option>
                          <option value="no">No</option>
                        </select>
                        <p className="text-xs text-slate-500">Indique si se cuenta con un estudio transabdominal.</p>
                      </div>
                      {tieneEcoTransabdominal === "si" && (
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-slate-700">Resultado de ecografía</Label>
                          <select
                            value={resultadoEcoTransabdominal}
                            onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                          >
                            <option value="">Seleccione</option>
                            <option value="saco_embrion_fc">Saco embrionario con FC</option>
                            <option value="saco_vitelino_embrion">Saco vitelino con embrión</option>
                            <option value="saco_vitelino_sin_embrion">Saco vitelino sin embrión</option>
                            <option value="saco_sin_embrion">Saco sin embrión</option>
                            <option value="saco_10mm_decidual_2mm">Saco ≥10mm con anillo decidual ≥2mm</option>
                            <option value="ausencia_saco">Ausencia de saco</option>
                          </select>
                          <p className="text-xs text-slate-500">Seleccione el hallazgo principal.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(3)} variant="outline" className="border-gray-300">
                        Anterior
                      </Button>
                      <Button onClick={() => { if (validarEcoTransabdominal()) completarSeccion(4) }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sección 5 */}
                {seccionActual === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Calculator className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-slate-800">Consultas {esConsultaSeguimiento ? "(Consulta 2/3)" : "(Consulta 1)"}</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Síntomas</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sintomasList.map((s) => (
                            <label key={s.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={sintomasSeleccionados.includes(s.id)}
                                onChange={(e) =>
                                  setSintomasSeleccionados((prev) =>
                                    e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                                  )
                                }
                                className="h-5 w-5 border-gray-300 rounded"
                              />
                              <span className="text-sm text-slate-700">{s.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">Marque los síntomas presentes.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Factores de riesgo</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {factoresRiesgo.map((f) => (
                            <label key={f.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={factoresSeleccionados.includes(f.id)}
                                onChange={(e) =>
                                  setFactoresSeleccionados((prev) =>
                                    e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                                  )
                                }
                                className="h-5 w-5 border-gray-300 rounded"
                              />
                              <span className="text-sm text-slate-700">{f.label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">Seleccione los factores de riesgo del paciente (si aplica).</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">Resultado de TVUS</Label>
                        <select
                          value={tvus}
                          onChange={(e) => setTvus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        >
                          <option value="">Seleccione</option>
                          <option value="normal">Normal</option>
                          <option value="libre">Líquido libre</option>
                          <option value="masa">Masa anexial</option>
                          <option value="masa_libre">Masa anexial + líquido libre</option>
                        </select>
                        <p className="text-xs text-slate-500">Elija el hallazgo predominante del estudio transvaginal.</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">β-hCG actual (mUI/mL)</Label>
                        <input
                          type="number"
                          placeholder="Ej. 1600"
                          value={hcgValor}
                          onChange={(e) => setHcgValor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-slate-500">Ingrese el valor actual de β-hCG.</p>
                      </div>

                      {esConsultaSeguimiento && hcgAnterior && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800"><strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL</p>
                          <p className="text-xs text-blue-600 mt-1">Se calculará automáticamente la variación con el valor actual.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button onClick={() => setSeccionActual(4)} variant="outline" className="border-gray-300">
                        Anterior
                      </Button>
                      <Button onClick={calcular} className="bg-green-600 hover:bg-green-700 text-white">
                        Calcular
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
