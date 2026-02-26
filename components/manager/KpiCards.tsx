"use client"

import { type Case, getTimeColor } from "@/lib/api/cases"

interface KpiCardsProps {
  cases: Case[]
}

export function KpiCards({ cases }: KpiCardsProps) {
  const activos = cases.filter((c) => c.status === "ACTIVE")
  const cerradosNoEctopico = cases.filter((c) => c.status === "CLOSED_NO_ECTOPIC")
  const cerradosEctopico = cases.filter((c) => c.status === "CLOSED_ECTOPIC")
  const perdidos = cases.filter((c) => c.status === "LOST_FOLLOWUP")

  const verdes = activos.filter((c) => getTimeColor(c) === "green").length
  const amarillos = activos.filter((c) => getTimeColor(c) === "yellow").length
  const rojos = activos.filter((c) => getTimeColor(c) === "red").length
  const sinRegistro = activos.filter((c) => getTimeColor(c) === "neutral").length

  const totalCerrados = cerradosNoEctopico.length + cerradosEctopico.length
  const totalIncluidos = cases.length
  const pctCierre = totalIncluidos > 0 ? Math.round((totalCerrados / totalIncluidos) * 100) : 0

  const kpis = [
    {
      label: "Activos",
      value: activos.length,
      sub: `${verdes} verde · ${amarillos} amarillo · ${rojos} rojo`,
      color: "border-blue-400 bg-blue-50 text-blue-700",
    },
    {
      label: "En alerta (>72h)",
      value: rojos,
      sub: "requieren atención urgente",
      color: "border-red-400 bg-red-50 text-red-700",
    },
    {
      label: "Cerrados — NO ectópico",
      value: cerradosNoEctopico.length,
      sub: "ciclo cerrado sin ectópico",
      color: "border-green-400 bg-green-50 text-green-700",
    },
    {
      label: "Cerrados — Ectópico",
      value: cerradosEctopico.length,
      sub: "confirmados como ectópico",
      color: "border-orange-400 bg-orange-50 text-orange-700",
    },
    {
      label: "% Cierre",
      value: `${pctCierre}%`,
      sub: `${totalCerrados} de ${totalIncluidos} totales`,
      color: "border-slate-400 bg-slate-50 text-slate-700",
    },
    {
      label: "Sin seguimiento",
      value: perdidos.length + sinRegistro,
      sub: `${perdidos.length} perdidos · ${sinRegistro} sin registro`,
      color: "border-yellow-400 bg-yellow-50 text-yellow-700",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div
          key={k.label}
          className={`rounded-xl border-l-4 p-4 shadow-sm ${k.color}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{k.label}</p>
          <p className="text-3xl font-bold mt-1">{k.value}</p>
          <p className="text-xs mt-1 opacity-60">{k.sub}</p>
        </div>
      ))}
    </div>
  )
}
