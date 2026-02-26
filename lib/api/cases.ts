export interface Case {
  id: string
  hospital_id: string
  folio: string
  patient_name: string
  patient_age: number | null
  created_at: string
  updated_at: string
  last_consult_started_at: string | null
  last_consult_finished_at: string | null
  last_risk_probability: number | null
  status: "ACTIVE" | "CLOSED_NO_ECTOPIC" | "CLOSED_ECTOPIC" | "LOST_FOLLOWUP"
  closure_reason: string | null
  closed_at: string | null
  doctor_name: string | null
  consulta_id: number | null
}

export type CaseStatus = Case["status"]

export type TimeColor = "green" | "yellow" | "red" | "neutral"

export function getTimeColor(caso: Case): TimeColor {
  const ref = caso.last_consult_finished_at ?? caso.last_consult_started_at
  if (!ref) return "neutral"
  const hours = (Date.now() - new Date(ref).getTime()) / 3_600_000
  if (hours < 48) return "green"
  if (hours < 72) return "yellow"
  return "red"
}

export function getHoursElapsed(caso: Case): number | null {
  const ref = caso.last_consult_finished_at ?? caso.last_consult_started_at
  if (!ref) return null
  return (Date.now() - new Date(ref).getTime()) / 3_600_000
}

export function formatHours(hours: number | null): string {
  if (hours === null) return "Sin registro"
  if (hours < 24) return `${Math.floor(hours)}h`
  const days = Math.floor(hours / 24)
  const rem = Math.floor(hours % 24)
  return `${days}d ${rem}h`
}

export async function fetchCases(hospital_id: string, status?: string): Promise<Case[]> {
  const params = new URLSearchParams({ hospital_id })
  if (status) params.set("status", status)
  const res = await fetch(`/api/cases?${params.toString()}`)
  if (!res.ok) throw new Error("Error al obtener casos")
  const json = await res.json()
  return json.data ?? []
}

export async function closeCase(
  id: string,
  status: CaseStatus,
  closure_reason: string,
): Promise<void> {
  const res = await fetch(`/api/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      closure_reason,
      closed_at: new Date().toISOString(),
    }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error ?? "Error al cerrar caso")
  }
}

// ---- Mock data para preview sin backend ----
export const MOCK_CASES: Case[] = [
  {
    id: "mock-1",
    hospital_id: "CMG",
    folio: "ECT-2024-001",
    patient_name: "M.G.L.",
    patient_age: 28,
    created_at: new Date(Date.now() - 10 * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 3_600_000).toISOString(),
    last_consult_started_at: new Date(Date.now() - 10 * 3_600_000).toISOString(),
    last_consult_finished_at: new Date(Date.now() - 10 * 3_600_000).toISOString(),
    last_risk_probability: 0.72,
    status: "ACTIVE",
    closure_reason: null,
    closed_at: null,
    doctor_name: "Dra. Fany",
    consulta_id: null,
  },
  {
    id: "mock-2",
    hospital_id: "CMG",
    folio: "ECT-2024-002",
    patient_name: "A.R.M.",
    patient_age: 33,
    created_at: new Date(Date.now() - 55 * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 3_600_000).toISOString(),
    last_consult_started_at: new Date(Date.now() - 55 * 3_600_000).toISOString(),
    last_consult_finished_at: new Date(Date.now() - 55 * 3_600_000).toISOString(),
    last_risk_probability: 0.41,
    status: "ACTIVE",
    closure_reason: null,
    closed_at: null,
    doctor_name: "Dr. Ponce",
    consulta_id: null,
  },
  {
    id: "mock-3",
    hospital_id: "CMG",
    folio: "ECT-2024-003",
    patient_name: "L.H.T.",
    patient_age: 25,
    created_at: new Date(Date.now() - 80 * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 80 * 3_600_000).toISOString(),
    last_consult_started_at: new Date(Date.now() - 80 * 3_600_000).toISOString(),
    last_consult_finished_at: new Date(Date.now() - 80 * 3_600_000).toISOString(),
    last_risk_probability: null,
    status: "ACTIVE",
    closure_reason: null,
    closed_at: null,
    doctor_name: "Dra. Mirthala",
    consulta_id: null,
  },
  {
    id: "mock-4",
    hospital_id: "CMG",
    folio: "ECT-2024-004",
    patient_name: "C.V.P.",
    patient_age: 30,
    created_at: new Date(Date.now() - 5 * 24 * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3_600_000).toISOString(),
    last_consult_started_at: new Date(Date.now() - 5 * 24 * 3_600_000).toISOString(),
    last_consult_finished_at: new Date(Date.now() - 5 * 24 * 3_600_000).toISOString(),
    last_risk_probability: 0.15,
    status: "CLOSED_NO_ECTOPIC",
    closure_reason: "USG confirmó IUP. Paciente asintomática dada de alta.",
    closed_at: new Date(Date.now() - 4 * 24 * 3_600_000).toISOString(),
    doctor_name: "Dra. Alma",
    consulta_id: null,
  },
  {
    id: "mock-5",
    hospital_id: "CMG",
    folio: "ECT-2024-005",
    patient_name: "R.E.S.",
    patient_age: 27,
    created_at: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(),
    last_consult_started_at: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(),
    last_consult_finished_at: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(),
    last_risk_probability: 0.89,
    status: "CLOSED_ECTOPIC",
    closure_reason: "Confirmado ectópico por laparoscopia.",
    closed_at: new Date(Date.now() - 6 * 24 * 3_600_000).toISOString(),
    doctor_name: "Dr. Mario",
    consulta_id: null,
  },
]
