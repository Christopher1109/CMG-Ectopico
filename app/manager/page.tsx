"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type Case, type CaseStatus, MOCK_CASES, fetchCases } from "@/lib/api/cases"
import { KpiCards } from "@/components/manager/KpiCards"
import { CasesTable } from "@/components/manager/CasesTable"
import { CaseDrawer } from "@/components/manager/CaseDrawer"
import { Activity, LogOut, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const TABS = [
  { id: "ACTIVE", label: "Activos" },
  { id: "CLOSED_NO_ECTOPIC", label: "Cerrados — NO ectópico" },
  { id: "CLOSED_ECTOPIC", label: "Cerrados — Ectópico confirmado" },
  { id: "LOST_FOLLOWUP", label: "Seguimiento perdido" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function ManagerPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<{ nombre: string; hospital_id?: string } | null>(null)
  const [allCases, setAllCases] = useState<Case[]>(MOCK_CASES)
  const [activeTab, setActiveTab] = useState<TabId>("ACTIVE")
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Verificar autenticación y rol
  useEffect(() => {
    const token = localStorage.getItem("cmg_token")
    const userData = localStorage.getItem("cmg_usuario")
    if (!token || !userData) {
      router.replace("/")
      return
    }
    try {
      const u = JSON.parse(userData)
      if (u.rol !== "gerente" && u.rol !== "admin") {
        router.replace("/")
        return
      }
      setUsuario(u)
    } catch {
      router.replace("/")
    }
  }, [router])

  const loadCases = useCallback(async () => {
    if (!usuario) return
    setLoading(true)
    try {
      const data = await fetchCases(usuario.hospital_id ?? "CMG")
      if (data.length > 0) setAllCases(data)
      setLastRefresh(new Date())
    } catch {
      // Si falla la API, mantener mock data para el preview
    } finally {
      setLoading(false)
    }
  }, [usuario])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  // Auto-refresh cada 2 minutos
  useEffect(() => {
    const interval = setInterval(loadCases, 120_000)
    return () => clearInterval(interval)
  }, [loadCases])

  function handleCaseClosed(updated: Case) {
    setAllCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  const tabCases = allCases.filter((c) => c.status === activeTab)

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">Dashboard Gerencial</h1>
              <p className="text-xs text-slate-500">CMG — Ectópico · {usuario.nombre}</p>
            </div>
            <span className="hidden md:flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              <ShieldCheck className="h-3 w-3" />
              Gerente
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs text-slate-400">
              Actualizado: {lastRefresh.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={loadCases}
              disabled={loading}
              className="border-slate-300 text-slate-600 hover:border-blue-400"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.removeItem("cmg_token")
                localStorage.removeItem("cmg_usuario")
                router.replace("/")
              }}
              className="border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <section>
          <KpiCards cases={allCases} />
        </section>

        {/* Tabs */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tab nav */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {TABS.map((tab) => {
              const count = allCases.filter((c) => c.status === tab.id).length
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                    isActive
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {loading && tabCases.length === 0 ? (
              <SkeletonTable />
            ) : (
              <CasesTable
                cases={tabCases}
                onSelectCase={setSelectedCase}
                showStatus={activeTab !== "ACTIVE"}
              />
            )}
          </div>
        </section>
      </main>

      {/* Drawer de detalle */}
      {selectedCase && (
        <CaseDrawer
          caso={selectedCase}
          onClose={() => setSelectedCase(null)}
          onClosed={handleCaseClosed}
        />
      )}
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-32" />
          <div className="h-4 bg-slate-200 rounded w-12" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-20 ml-auto" />
        </div>
      ))}
    </div>
  )
}
