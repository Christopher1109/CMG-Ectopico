'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { crearConsulta, actualizarConsulta, obtenerConsulta } from '@/lib/api/consultas'

/* -----------------------------------------------------------
   Utils
----------------------------------------------------------- */

function genId(): string {
  // ID-00001, ID-00002, ...
  const existentes: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k) continue
    if (!k.startsWith('ectopico_ID-')) continue
    const n = parseInt(k.replace('ectopico_ID-', ''), 10)
    if (!Number.isNaN(n)) existentes.push(n)
  }
  const siguiente = existentes.length ? Math.max(...existentes) + 1 : 1
  return `ID-${String(siguiente).padStart(5, '0')}`
}

function normalizarSnake(local: any) {
  if (!local || typeof local !== 'object') return {}
  return {
    id: local.id,
    usuario_creador: local.usuarioCreador ?? local.usuario_creador ?? null,
    nombre_paciente: local.nombrePaciente ?? local.nombre_paciente ?? null,
    edad_paciente: local.edadPaciente ?? local.edad_paciente ?? null,
    frecuencia_cardiaca: local.frecuenciaCardiaca ?? local.frecuencia_cardiaca ?? null,
    presion_sistolica: local.presionSistolica ?? local.presion_sistolica ?? null,
    presion_diastolica: local.presionDiastolica ?? local.presion_diastolica ?? null,
    estado_conciencia: local.estadoConciencia ?? local.estado_conciencia ?? null,
    prueba_embarazo_realizada: local.pruebaEmbarazoRealizada ?? local.prueba_embarazo_realizada ?? null,
    resultado_prueba_embarazo: local.resultadoPruebaEmbarazo ?? local.resultado_prueba_embarazo ?? null,
    hallazgos_exploracion: local.hallazgosExploracion ?? local.hallazgos_exploracion ?? null,
    tiene_eco_transabdominal: local.tieneEcoTransabdominal ?? local.tiene_eco_transabdominal ?? null,
    resultado_eco_transabdominal: local.resultadoEcoTransabdominal ?? local.resultado_eco_transabdominal ?? null,
    sintomas_seleccionados: local.sintomasSeleccionados ?? local.sintomas_seleccionados ?? [],
    factores_seleccionados: local.factoresSeleccionados ?? local.factores_seleccionados ?? [],
    tvus: local.tvus ?? null,
    hcg_valor: local.hcgValor ?? local.hcg_valor ?? null,
    hcg_anterior: local.hcgAnterior ?? local.hcg_anterior ?? null,
    variacion_hcg: local.variacionHcg ?? local.variacion_hcg ?? null,
    resultado: local.resultado ?? null,
  }
}

/** Devuelve 1, 2 o 3 según lo que ya exista en BD */
function resolverVisitaNo(regBD: any, esSeguimiento: boolean): 1 | 2 | 3 {
  if (!esSeguimiento || !regBD) return 1
  // Si ya hay datos de consulta_2, entonces vamos a consulta_3
  const tieneC2 = regBD.tvus_2 != null || regBD.hcg_valor_2 != null || regBD.resultado_2 != null
  return tieneC2 ? 3 : 2
}

/* -----------------------------------------------------------
   Tablas (según paper)
----------------------------------------------------------- */

const P0_SIN_FACT = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 }
const P0_CON_FACT = { asintomatica: 0.05, sangrado: 0.08, dolor: 0.4, dolor_sangrado: 0.46 }

const LR_TVUS: Record<'normal' | 'libre' | 'masa' | 'masa_libre', number> = {
  normal: 0.07,
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
}

const LR_HCG = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
} as const

const LR_VAR: Record<'reduccion_1_35' | 'reduccion_35_50' | 'reduccion_mayor_50' | 'aumento' | 'no_disponible', number> =
  { reduccion_1_35: 16.6, reduccion_35_50: 0.8, reduccion_mayor_50: 0, aumento: 3.3, no_disponible: 1 }

function bayes(prob: number, lrs: number[]) {
  let odds = prob / (1 - prob)
  for (const lr of lrs) odds *= lr
  return odds / (1 + odds)
}

function variacionHcgCalc(prev: number | null, actual: number | null) {
  if (prev == null || actual == null) return 'no_disponible' as const
  if (actual > prev) return 'aumento' as const
  const red = ((prev - actual) / prev) * 100
  if (red >= 50) return 'reduccion_mayor_50'
  if (red >= 35) return 'reduccion_35_50'
  if (red >= 1) return 'reduccion_1_35'
  return 'aumento'
}

/* -----------------------------------------------------------
   Componente principal
----------------------------------------------------------- */

export default function Page() {
  /* --------- estados base --------- */
  const [id, setId] = useState('')
  const [esSeguimiento, setEsSeguimiento] = useState(false)
  const [regBD, setRegBD] = useState<any>(null)

  // expediente
  const [nombre, setNombre] = useState('')
  const [edad, setEdad] = useState('')

  // consulta
  const [sintomas, setSintomas] = useState<string[]>([])
  const [factores, setFactores] = useState<string[]>([])
  const [tvus, setTvus] = useState('') // no preseleccionar (pedido)
  const [hcg, setHcg] = useState('')
  const [hcgPrev, setHcgPrev] = useState('') // para seguimiento
  const [prob, setProb] = useState<number | null>(null)

  /* --------- cargar si es seguimiento --------- */
  useEffect(() => {
    if (!id || !esSeguimiento) return
    obtenerConsulta(id).then((r) => {
      if (r?.data) {
        setRegBD(r.data)
        // prellenar hcgPrev con el último disponible (2 o 1)
        const prev =
          r.data.hcg_valor_2 ?? r.data.hcg_valor ?? null
        setHcgPrev(prev != null ? String(prev) : '')
      }
    })
  }, [id, esSeguimiento])

  /* --------- helpers UI --------- */
  const tieneFactores = factores.length > 0
  const claveSintoma = useMemo(() => {
    const set = new Set(sintomas.filter((s) => s !== 'sincope'))
    if (set.has('dolor') && set.has('sangrado')) return 'dolor_sangrado'
    if (set.has('dolor')) return 'dolor'
    if (set.has('sangrado')) return 'sangrado'
    return 'asintomatica'
  }, [sintomas])

  /* --------- calcular + guardar --------- */
  async function calcularYGuardar() {
    if (!id) {
      alert('Asigna un ID antes de calcular.')
      return
    }
    if (!tvus || !hcg) {
      alert('Completa TVUS y β-hCG actual.')
      return
    }

    // 1) Pretest
    const p0 = (tieneFactores ? P0_CON_FACT : P0_SIN_FACT)[claveSintoma as keyof typeof P0_SIN_FACT]

    // 2) LR TVUS + HCG zona discriminatoria
    const lrs: number[] = []
    const lrTv = LR_TVUS[tvus as keyof typeof LR_TVUS] ?? 1
    lrs.push(lrTv)

    const actual = Number(hcg)
    const zona = actual >= 2000 ? 'alto' : 'bajo'
    const lrH = (LR_HCG as any)[tvus]?.[zona] ?? 1
    lrs.push(lrH)

    // 3) variación si hay previo (solo seguimiento)
    let varStr = 'no_disponible' as keyof typeof LR_VAR
    const prevNum = hcgPrev ? Number(hcgPrev) : null
    if (prevNum != null) {
      varStr = variacionHcgCalc(prevNum, actual) as keyof typeof LR_VAR
      lrs.push(LR_VAR[varStr])
    }

    // 4) Bayes
    const pPost = Number(bayes(p0, lrs).toFixed(4))
    setProb(pPost)

    // 5) Guardar local
    const local = {
      id,
      usuarioCreador: 'medico',
      nombrePaciente: nombre || 'N/A',
      edadPaciente: edad ? Number(edad) : null,
      sintomasSeleccionados: sintomas,
      factoresSeleccionados: factores,
      tvus,
      hcgValor: actual,
      hcgAnterior: prevNum,
      variacionHcg: varStr,
      resultado: pPost,
    }
    localStorage.setItem(`ectopico_${id}`, JSON.stringify(local))

    // 6) Sincronizar backend
    const visita = resolverVisitaNo(regBD, esSeguimiento)
    let ok = false
    try {
      if (visita === 1) {
        ok = await enviarPrimera(local)
      } else {
        ok = await enviarSeguimiento(id, visita, local)
      }
    } catch (e) {
      ok = false
      console.error(e)
    }
    if (!ok) {
      alert(`Guardado local OK. FALLO al actualizar en base de datos (Consulta ${visita}/3).`)
    } else {
      alert(`Consulta ${visita}/3 guardada correctamente.`)
      // refrescar regBD para siguiente visita
      const r = await obtenerConsulta(id)
      if (r?.data) setRegBD(r.data)
    }
  }

  async function enviarPrimera(local: any) {
    const payload = normalizarSnake(local) // snake_case para el backend POST
    const r = await crearConsulta(payload)
    return !r?.error
  }

  async function enviarSeguimiento(id: string, visita: 2 | 3, local: any) {
    // Enviamos campos “genéricos”; el backend los sufijará a *_2 o *_3
    const patch = {
      sintomas_seleccionados: local.sintomasSeleccionados,
      factores_seleccionados: local.factoresSeleccionados,
      tvus: local.tvus,
      hcg_valor: local.hcgValor,
      hcg_anterior: local.hcgAnterior,
      variacion_hcg: local.variacionHcg,
      resultado: local.resultado,
      usuario_editor: 'medico',
    }
    const r = await actualizarConsulta(id, visita, patch)
    return !r?.error
  }

  /* -----------------------------------------------------------
     UI
  ----------------------------------------------------------- */
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Calculadora de Embarazo Ectópico</h1>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Gestión de consulta</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="block text-sm font-medium">ID de seguimiento</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={id}
                onChange={(e) => setId(e.target.value.trim().toUpperCase())}
                placeholder="ID-00001"
                className="w-full"
              />
              <button
                onClick={() => setId(genId())}
                style={{ whiteSpace: 'nowrap' }}
              >
                Nuevo ID
              </button>
            </div>
            <p className="text-xs text-gray-500">Usa un ID único por paciente (se sugiere formato ID-00001).</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Modo</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label>
                <input
                  type="radio"
                  checked={!esSeguimiento}
                  onChange={() => setEsSeguimiento(false)}
                />{' '}
                Primera consulta
              </label>
              <label>
                <input
                  type="radio"
                  checked={esSeguimiento}
                  onChange={() => setEsSeguimiento(true)}
                />{' '}
                Seguimiento (2ª/3ª)
              </label>
            </div>
            <p className="text-xs text-gray-500">
              En seguimiento se obtiene la última β-hCG previa de la base de datos para calcular la variación.
            </p>
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Expediente clínico</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="block text-sm font-medium">Nombre del paciente</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
            <p className="text-xs text-gray-500">Escribe el nombre del paciente.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Edad</label>
            <input type="number" value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Edad en años" />
            <p className="text-xs text-gray-500">Edad en años.</p>
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontWeight: 600, marginBottom: 8 }}>Consultas (1/2/3)</h2>

        <div style={{ marginBottom: 12 }}>
          <label className="block text-sm font-medium">Síntomas</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {[
              { id: 'sangrado', label: 'Sangrado vaginal' },
              { id: 'dolor', label: 'Dolor pélvico/abdominal' },
              { id: 'dolor_sangrado', label: 'Sangrado + Dolor' },
              { id: 'sincope', label: 'Síncope o mareo' },
            ].map((s) => (
              <label key={s.id}>
                <input
                  type="checkbox"
                  checked={sintomas.includes(s.id)}
                  onChange={(e) =>
                    setSintomas((prev) =>
                      e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id),
                    )
                  }
                />{' '}
                {s.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">Marca los síntomas presentes.</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="block text-sm font-medium">Factores de riesgo</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {[
              { id: 'infertilidad', label: 'Historia de infertilidad' },
              { id: 'ectopico_previo', label: 'Embarazo ectópico previo' },
              { id: 'enfermedad_pelvica', label: 'Enfermedad inflamatoria pélvica previa' },
              { id: 'cirugia_tubarica', label: 'Cirugía tubárica previa' },
            ].map((f) => (
              <label key={f.id}>
                <input
                  type="checkbox"
                  checked={factores.includes(f.id)}
                  onChange={(e) =>
                    setFactores((prev) =>
                      e.target.checked ? [...prev, f.id] : prev.filter((x) => x !== f.id),
                    )
                  }
                />{' '}
                {f.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500">Selecciona los factores de riesgo del paciente (si aplica).</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="block text-sm font-medium">Resultado de TVUS</label>
          <select value={tvus} onChange={(e) => setTvus(e.target.value)}>
            <option value="">Seleccione…</option>
            <option value="normal">Normal</option>
            <option value="libre">Líquido libre</option>
            <option value="masa">Masa anexial</option>
            <option value="masa_libre">Masa anexial + líquido libre</option>
          </select>
          <p className="text-xs text-gray-500">Elija el hallazgo predominante del estudio transvaginal.</p>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="block text-sm font-medium">β-hCG actual (mUI/mL)</label>
          <input type="number" value={hcg} onChange={(e) => setHcg(e.target.value)} placeholder="Ej. 1500" />
          <p className="text-xs text-gray-500">Ingrese el valor actual de β-hCG.</p>
        </div>

        {esSeguimiento && (
          <div style={{ marginBottom: 12, background: '#F1F5F9', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 12 }}>
              <strong>β-hCG de consulta anterior:</strong> {hcgPrev || 'N/D'}
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              Se calculará automáticamente la variación con el valor actual.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={calcularYGuardar} style={{ background: '#16a34a', color: 'white', padding: '8px 14px', borderRadius: 6 }}>
            Calcular y guardar
          </button>
        </div>

        {prob != null && (
          <div style={{ marginTop: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, color: '#1D4ED8' }}>
              Probabilidad de embarazo ectópico: {(prob * 100).toFixed(1)}%
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
