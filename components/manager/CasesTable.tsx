"use client"

import { useState, useMemo } from "react"
import { type Case, type TimeColor, getTimeColor, getHoursElapsed, formatHours } from "@/lib/api/cases"
import { Button } from "@/components/ui/button"
import { Search, ChevronUp, ChevronDown } from "lucide-react"

interface CasesTableProps {
  cases: Case[]
  onSelectCase: (caso: Case) => void
  showStatus?: boolean
}

const ROW_COLOR: Record<TimeColor, string> = {
  green: "bg-green-50 border-l-4 border-green-400",
  yellow: "bg-yellow-50 border-l-4 border-yellow-400",
  red: "bg-red-50 border-l-4 border-red-400",
  neutral: "bg-slate-50 border-l-4 border-slate-300",
}

const BADGE_COLOR: Record<TimeColor, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  neutral: "bg-slate-100 text-slate-500",
}

type SortKey = "hours" | "risk" | "folio" | "name"
type SortDir = "asc" | "desc"

export function CasesTable({ cases, onSelectCase, showStatus = false }: CasesTableProps) {
  const [search, setSearch] = useState("")
  const [filterColor, setFilterColor] = useState<TimeColor | "all">("all")
  const [minRisk, setMinRisk] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("hours")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const filtered = useMemo(() => {
    let list = [...cases]

    // Filtro de búsqueda por folio o nombre
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.folio.toLowerCase().includes(s) ||
          c.patient_name.toLowerCase().includes(s)
      )
    }

    // Filtro por color
    if (filterColor !== "all") {
      list = list.filter((c) => getTimeColor(c) === filterColor)
    }

    // Filtro por riesgo mínimo
    const minR = parseFloat(minRisk)
    if (!isNaN(minR)) {
      list = list.filter(
        (c) => c.last_risk_probability !== null && c.last_risk_probability * 100 >= minR
      )
    }

    // Ordenamiento
    list.sort((a, b) => {
      let va: number, vb: number
      if (sortKey === "hours") {
        va = getHoursElapsed(a) ?? 0
        vb = getHoursElapsed(b) ?? 0
      } else if (sortKey === "risk") {
        va = a.last_risk_probability ?? -1
        vb = b.last_risk_probability ?? -1
      } else if (sortKey === "folio") {
        return sortDir === "asc"
          ? a.folio.localeCompare(b.folio)
          : b.folio.localeCompare(a.folio)
      } else {
        return sortDir === "asc"
          ? a.patient_name.localeCompare(b.patient_name)
          : b.patient_name.localeCompare(a.patient_name)
      }
      return sortDir === "asc" ? va - vb : vb - va
    })

    return list
  }, [cases, search, filterColor, minRisk, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por folio o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
          />
        </div>

        <select
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value as TimeColor | "all")}
          className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 transition"
        >
          <option value="all">Todos los colores</option>
          <option value="green">Verde (&lt;48h)</option>
          <option value="yellow">Amarillo (48-72h)</option>
          <option value="red">Rojo (&gt;72h)</option>
          <option value="neutral">Sin registro</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Riesgo &gt;</span>
          <input
            type="number"
            placeholder="%"
            value={minRisk}
            onChange={(e) => setMinRisk(e.target.value)}
            className="w-16 border-2 border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-blue-400 transition"
            min="0"
            max="100"
          />
        </div>

        <span className="text-xs text-slate-400">{filtered.length} resultados</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => toggleSort("folio")}>
                Folio <SortIcon k="folio" />
              </th>
              <th className="px-4 py-3 text-left font-semibold cursor-pointer select-none" onClick={() => toggleSort("name")}>
                Paciente <SortIcon k="name" />
              </th>
              <th className="px-4 py-3 text-center font-semibold">Edad</th>
              <th className="px-4 py-3 text-center font-semibold cursor-pointer select-none" onClick={() => toggleSort("risk")}>
                % Riesgo <SortIcon k="risk" />
              </th>
              <th className="px-4 py-3 text-center font-semibold cursor-pointer select-none" onClick={() => toggleSort("hours")}>
                Tiempo <SortIcon k="hours" />
              </th>
              {showStatus && (
                <th className="px-4 py-3 text-center font-semibold">Estado</th>
              )}
              <th className="px-4 py-3 text-center font-semibold">Doctor</th>
              <th className="px-4 py-3 text-center font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showStatus ? 8 : 7} className="px-4 py-10 text-center text-slate-400">
                  No hay casos que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtered.map((caso) => {
              const color = getTimeColor(caso)
              const hours = getHoursElapsed(caso)
              return (
                <tr key={caso.id} className={`${ROW_COLOR[color]} hover:brightness-95 transition`}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">{caso.folio}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{caso.patient_name}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{caso.patient_age ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {caso.last_risk_probability !== null ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        caso.last_risk_probability >= 0.5
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {(caso.last_risk_probability * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Sin %</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_COLOR[color]}`}>
                      {formatHours(hours)}
                    </span>
                  </td>
                  {showStatus && (
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {caso.status.replace(/_/g, " ")}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-slate-600 text-xs">{caso.doctor_name ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectCase(caso)}
                      className="text-xs border-slate-300 hover:border-blue-400 hover:text-blue-600 transition"
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
