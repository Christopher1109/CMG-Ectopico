"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  type Case,
  type CaseStatus,
  getTimeColor,
  getHoursElapsed,
  formatHours,
  closeCase,
} from "@/lib/api/cases"
import { X, Clock, User, Stethoscope, AlertTriangle, CheckCircle, FileX } from "lucide-react"

interface CaseDrawerProps {
  caso: Case | null
  onClose: () => void
  onClosed: (updatedCase: Case) => void
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  ACTIVE: "Activo",
  CLOSED_NO_ECTOPIC: "Cerrado — NO ectópico",
  CLOSED_ECTOPIC: "Cerrado — Ectópico confirmado",
  LOST_FOLLOWUP: "Seguimiento perdido",
}

const COLOR_MAP = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  neutral: "bg-slate-100 text-slate-600 border-slate-300",
}

export function CaseDrawer({ caso, onClose, onClosed }: CaseDrawerProps) {
  const [closingStatus, setClosingStatus] = useState<CaseStatus | null>(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!caso) return null

  const color = getTimeColor(caso)
  const hours = getHoursElapsed(caso)
  const isActive = caso.status === "ACTIVE"

  async function handleClose() {
    if (!closingStatus || !reason.trim() || !caso) return
    setLoading(true)
    setError(null)
    try {
      await closeCase(caso.id, closingStatus, reason.trim())
      onClosed({
        ...caso,
        status: closingStatus,
        closure_reason: reason.trim(),
        closed_at: new Date().toISOString(),
      })
      onClose()
    } catch (e: any) {
      setError(e.message ?? "Error al cerrar caso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{caso.patient_name}</h2>
            <p className="text-sm text-slate-500">Folio: {caso.folio}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Badge estado tiempo */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${COLOR_MAP[color]}`}>
            <Clock className="h-4 w-4" />
            {formatHours(hours)} desde última consulta
          </div>

          {/* Info básica */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={<User className="h-4 w-4" />} label="Edad" value={caso.patient_age ? `${caso.patient_age} años` : "N/A"} />
            <InfoItem icon={<Stethoscope className="h-4 w-4" />} label="Doctor" value={caso.doctor_name ?? "N/A"} />
            <InfoItem
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Último riesgo"
              value={
                caso.last_risk_probability !== null
                  ? `${(caso.last_risk_probability * 100).toFixed(1)}%`
                  : "Sin %"
              }
            />
            <InfoItem
              icon={<CheckCircle className="h-4 w-4" />}
              label="Estado"
              value={STATUS_LABELS[caso.status]}
            />
          </div>

          {/* Timestamps */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-semibold text-slate-700 mb-2">Historial de tiempos</p>
            <TimestampRow label="Caso creado" ts={caso.created_at} />
            <TimestampRow label="Inicio última consulta" ts={caso.last_consult_started_at} />
            <TimestampRow label="Fin última consulta" ts={caso.last_consult_finished_at} />
            {caso.closed_at && <TimestampRow label="Fecha de cierre" ts={caso.closed_at} />}
          </div>

          {/* Motivo de cierre si está cerrado */}
          {caso.closure_reason && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Motivo de cierre</p>
              <p className="text-sm text-blue-800">{caso.closure_reason}</p>
            </div>
          )}

          {/* Acciones de cierre — solo si activo */}
          {isActive && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-4">
              <p className="font-semibold text-slate-700">Acciones de cierre de ciclo</p>

              <div className="space-y-2">
                {(
                  [
                    { status: "CLOSED_NO_ECTOPIC" as CaseStatus, label: "Cerrar como NO ectópico", icon: <CheckCircle className="h-4 w-4" />, cls: "border-green-300 text-green-700 hover:bg-green-50" },
                    { status: "CLOSED_ECTOPIC" as CaseStatus, label: "Cerrar como Ectópico confirmado", icon: <AlertTriangle className="h-4 w-4" />, cls: "border-orange-300 text-orange-700 hover:bg-orange-50" },
                    { status: "LOST_FOLLOWUP" as CaseStatus, label: "Marcar como seguimiento perdido", icon: <FileX className="h-4 w-4" />, cls: "border-slate-300 text-slate-600 hover:bg-slate-50" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.status}
                    onClick={() => setClosingStatus(closingStatus === opt.status ? null : opt.status)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition ${opt.cls} ${closingStatus === opt.status ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {closingStatus && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Motivo / notas de cierre</Label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. USG confirmó IUP. Paciente asintomática dada de alta."
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none"
                    rows={3}
                  />
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <Button
                    onClick={handleClose}
                    disabled={!reason.trim() || loading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg transition"
                  >
                    {loading ? "Guardando..." : "Confirmar cierre"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function TimestampRow({ label, ts }: { label: string; ts: string | null }) {
  if (!ts) return (
    <div className="flex justify-between text-slate-400">
      <span>{label}</span>
      <span>—</span>
    </div>
  )
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">
        {new Date(ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
      </span>
    </div>
  )
}
