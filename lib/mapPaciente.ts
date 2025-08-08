// lib/mapPaciente.ts
export type Paciente = {
  id: string
  fechaCreacion: string
  fechaUltimaActualizacion: string
  nombrePaciente: string
  edadPaciente: string
  frecuenciaCardiaca: string
  presionSistolica: string
  presionDiastolica: string
  estadoConciencia: string
  // Consulta 1
  sintomasSeleccionados1?: string[]
  factoresSeleccionados1?: string[]
  tvus1?: string
  hcgValor1?: string
  resultado1?: number | null
  // Consulta 2 (solo TVUS/hCG)
  tvus2?: string
  hcgValor2?: string
  variacion2?: string
  resultado2?: number | null
  // Consulta 3 (solo TVUS/hCG)
  tvus3?: string
  hcgValor3?: string
  variacion3?: string
  resultado3?: number | null
  notas?: string
}

export function pacienteToRow(p: Paciente) {
  return [
    p.id,
    p.fechaCreacion,
    p.fechaUltimaActualizacion,
    p.nombrePaciente || "",
    p.edadPaciente || "",
    p.frecuenciaCardiaca || "",
    p.presionSistolica || "",
    p.presionDiastolica || "",
    p.estadoConciencia || "",
    (p.sintomasSeleccionados1 || []).join(", "),
    (p.factoresSeleccionados1 || []).join(", "),
    p.tvus1 || "",
    p.hcgValor1 || "",
    p.resultado1 != null ? p.resultado1 : "",
    p.tvus2 || "",
    p.hcgValor2 || "",
    p.variacion2 || "",
    p.resultado2 != null ? p.resultado2 : "",
    p.tvus3 || "",
    p.hcgValor3 || "",
    p.variacion3 || "",
    p.resultado3 != null ? p.resultado3 : "",
    p.notas || "",
  ]
}

export function rowToPaciente(row: string[]): Paciente {
  return {
    id: row[0],
    fechaCreacion: row[1],
    fechaUltimaActualizacion: row[2],
    nombrePaciente: row[3],
    edadPaciente: row[4],
    frecuenciaCardiaca: row[5],
    presionSistolica: row[6],
    presionDiastolica: row[7],
    estadoConciencia: row[8],
    sintomasSeleccionados1: (row[9] || "").split(", ").filter(Boolean),
    factoresSeleccionados1: (row[10] || "").split(", ").filter(Boolean),
    tvus1: row[11],
    hcgValor1: row[12],
    resultado1: row[13] ? Number(row[13]) : null,
    tvus2: row[14],
    hcgValor2: row[15],
    variacion2: row[16],
    resultado2: row[17] ? Number(row[17]) : null,
    tvus3: row[18],
    hcgValor3: row[19],
    variacion3: row[20],
    resultado3: row[21] ? Number(row[21]) : null,
    notas: row[22] || "",
  }
}
