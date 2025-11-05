"use client";

// =============================
//  ECTÓPICO – page.tsx (PARTE 1/4)
//  Pega esta PARTE 1 primero.
//  Luego pega la PARTE 2 justo DEBAJO, y así sucesivamente.
//  Este archivo es autocontenido e incluye:
//  - Login básico (placeholder)
//  - Barra de progreso
//  - Flujo de 7 secciones (con alertas en 2, 4/5, 6)
//  - Pantallas: bienvenida, cargar (buscar por ID o CURP), resumen, resultados, completada
//  - Validación de CURP (18 chars + patrón), bloqueo si incompleto
//  - Mapeo CURP↔ID con /api/consultas (fallback localStorage)
//  - Botón universal "Regresar al inicio" en las 3 alertas
//  - Generación de PDF (placeholders) sin romper el flujo
//  - No modifica nada fuera de lo pedido (nombres y estructura coherentes)
// =============================

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  Droplet,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Home,
  Lock,
  Stethoscope,
  User,
} from "lucide-react";

// Si usas shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// =============================
// Utilidades mínimas/mocks para no romper tu flujo
// (Si ya existen en tu proyecto, puedes borrar/usar las tuyas)
// =============================

// Sintomas y factores en tu formato (id/label)
const sintomas = [
  { id: "dolor_abdominal", label: "Dolor abdominal" },
  { id: "sangrado", label: "Sangrado vaginal" },
  { id: "sincope", label: "Síncope" },
  { id: "asintomatica", label: "Asintomática" },
];

const factoresRiesgo = [
  { id: "tabaquismo", label: "Tabaquismo" },
  { id: "antecedente_ectopico", label: "Antecedente de ectópico" },
  { id: "dispositivo", label: "Uso de DIU" },
  { id: "sin_factores", label: "Sin factores" },
];

const obtenerNombreSintoma = (id: string) => sintomas.find((s) => s.id === id)?.label || id;
const obtenerNombreFactorRiesgo = (id: string) => factoresRiesgo.find((f) => f.id === id)?.label || id;
const obtenerNombreTVUS = (v?: string) =>
  ({
    normal: "Normal (sin EIU)",
    libre: "Líquido libre",
    masa: "Masa anexial",
    masa_libre: "Masa + líquido libre",
  } as Record<string, string>)[v || ""] || "No disponible";

// =============================
// PARTE 1 – Estado global, helpers, login y header
// =============================

export default function PageEctopico() {
  // --- Login simple ---
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [intentosLogin, setIntentosLogin] = useState(0);
  const [usuarioActual, setUsuarioActual] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("Médico Responsable");

  // --- Pantallas ---
  const [pantalla, setPantalla] = useState<"bienvenida" | "cargar" | "resumen" | "resultados" | "completada">(
    "bienvenida"
  );

  // --- Secciones ---
  const [seccionActual, setSeccion] = useState<number>(1);
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([]);
  const completarSeccion = (n: number) => {
    setSeccionesCompletadas((prev) => (prev.includes(n) ? prev : [...prev, n]));
  };

  // --- Datos Paciente ---
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edadPaciente, setEdadPaciente] = useState<string>("");
  const [curpPaciente, setCurpPaciente] = useState(""); // agregado

  // --- Signos vitales ---
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>("");
  const [presionSistolica, setPresionSistolica] = useState<string>("");
  const [presionDiastolica, setPresionDiastolica] = useState<string>("");
  const [estadoConciencia, setEstadoConciencia] = useState<"alerta" | "no_alerta" | "">("");

  const pam = useMemo(() => {
    const ps = Number(presionSistolica);
    const pd = Number(presionDiastolica);
    if (!ps || !pd) return "";
    return Math.round((pd + (ps - pd) / 3)).toString();
  }, [presionSistolica, presionDiastolica]);

  const validarSignosVitales = () => {
    const fc = Number(frecuenciaCardiaca);
    const ps = Number(presionSistolica);
    const pd = Number(presionDiastolica);
    const _pam = Number(pam);
    return (
      fc >= 60 && fc <= 100 &&
      ps >= 90 && ps <= 140 &&
      pd >= 60 && pd <= 90 &&
      _pam >= 65 && _pam <= 100 &&
      estadoConciencia === "alerta"
    );
  };

  // --- Sección 3 ---
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([]);
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([]);

  // --- Sección 4 PIE ---
  const [tienePruebaEmbarazoDisponible, setTienePruebaEmbarazoDisponible] = useState<"si" | "no" | "">("");
  const [resultadoPIE, setResultadoPIE] = useState<"positivo" | "negativo" | "">("");

  // --- Sección 5 ECO ABD ---
  const [hallazgosExploracion, setHallazgosExploracion] = useState("");
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState<"si" | "no" | "">("");
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState<string>("");

  // --- Sección 6 TVUS ---
  const [tvus, setTvus] = useState<string>("");

  // --- Sección 7 hCG ---
  const [nivelBetaHCG, setNivelBetaHCG] = useState<string>("");
  const [hcgAnterior, setHcgAnterior] = useState<string>("");

  // --- Resultado ---
  const [resultado, setResultado] = useState<number | null>(null);
  const [numeroConsultaActual, setNumeroConsultaActual] = useState(1);
  const [recomendaciones, setRecomendaciones] = useState<string[]>([]);
  const [mensajeFinal, setMensajeFinal] = useState<string | null>(null);
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(true);

  // --- IDs / búsqueda ---
  const [idSeguimiento, setIdSeguimiento] = useState<string>("");
  const [idBusqueda, setIdBusqueda] = useState<string>("");
  const [curpBusqueda, setCurpBusqueda] = useState<string>("");
  const [consultaCargada, setConsultaCargada] = useState<any>(null);

  // --- Errores / Alertas ---
  const [errorSeccion, setErrorSeccion] = useState<string>("");
  const [alertaSignosVitalesPendiente, setAlertaSignosVitalesPendiente] = useState(false);
  const [alertaPruebaEmbarazoPendiente, setAlertaPruebaEmbarazoPendiente] = useState(false);
  const [mensajeAlertaPruebaEmbarazo, setMensajeAlertaPruebaEmbarazo] = useState("");
  const [alertaEcografiaPendiente, setAlertaEcografiaPendiente] = useState(false);
  const [mensajeAlertaEcografia, setMensajeAlertaEcografia] = useState("");

  // =============================
  // Helpers solicitados (CURP y mapeo)
  // =============================
  const isCurpValida = (c: string) => {
    const curp = (c || "").toUpperCase().trim();
    if (curp.length !== 18) return false;
    const regex = /^[A-ZÑ&]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i;
    return regex.test(curp);
  };

  const persistCurpMapping = async (curp: string, id: string) => {
    const payload = { curp: curp.toUpperCase().trim(), id };
    try {
      await fetch("/api/consultas/upsert-curp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      try {
        const k = "curpMap";
        const map = JSON.parse(localStorage.getItem(k) || "{}");
        map[payload.curp] = payload.id;
        localStorage.setItem(k, JSON.stringify(map));
      } catch {}
    }
  };

  const findConsultaById = async (id: string) => {
    try {
      const r = await fetch(`/api/consultas/by-id?id=${encodeURIComponent(id)}`);
      if (r.ok) return (await r.json())?.consulta || null;
    } catch {}
    return null;
  };

  const findConsultaByCurp = async (curp: string) => {
    const c = curp.toUpperCase().trim();
    try {
      const r = await fetch(`/api/consultas/by-curp?curp=${encodeURIComponent(c)}`);
      if (r.ok) return (await r.json())?.consulta || null;
    } catch {}
    try {
      const map = JSON.parse(localStorage.getItem("curpMap") || "{}");
      const id = map[c];
      if (id) return await findConsultaById(id);
    } catch {}
    return null;
  };

  // =============================
  // Acciones núcleo (login / logout / navegación)
  // =============================
  const clienteSeguro = {
    login: async (u: string, p: string) => {
      // placeholder de autenticación local
      await new Promise((r) => setTimeout(r, 400));
      if (u && p) {
        return { success: true, usuario: { usuario: u, nombre: "Dr. "+u } };
      }
      return { success: false, error: "Credenciales incorrectas" };
    },
    logout: () => {},
  };

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin("");
    setCargandoLogin(true);

    if (intentosLogin >= 5) {
      setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.");
      setCargandoLogin(false);
      return;
    }

    try {
      const resultado = await clienteSeguro.login(usuario, contraseña);
      if (resultado.success) {
        setEstaAutenticado(true);
        setUsuarioActual(resultado.usuario.usuario);
        setNombreUsuario(resultado.usuario.nombre);
        setErrorLogin("");
        setIntentosLogin(0);
        setUsuario("");
        setContraseña("");
      } else {
        setIntentosLogin((prev) => prev + 1);
        setErrorLogin(resultado.error || `Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`);
        setContraseña("");
      }
    } catch (error) {
      setIntentosLogin((prev) => prev + 1);
      setErrorLogin(`Error de conexión. Intento ${intentosLogin + 1} de 5.`);
      setContraseña("");
    } finally {
      setCargandoLogin(false);
    }
  };

  const cerrarSesion = () => {
    clienteSeguro.logout();
    setEstaAutenticado(false);
    setUsuarioActual("");
    setNombreUsuario("");
    setUsuario("");
    setContraseña("");
    setErrorLogin("");
    setIntentosLogin(0);
    resetCalculadora();
  };

  const resetCalculadora = () => {
    setPantalla("bienvenida");
    setSeccion(1);
    setSeccionesCompletadas([]);
    setNombrePaciente("");
    setEdadPaciente("");
    setCurpPaciente("");
    setFrecuenciaCardiaca("");
    setPresionSistolica("");
    setPresionDiastolica("");
    setEstadoConciencia("");
    setSintomasSeleccionados([]);
    setFactoresSeleccionados([]);
    setTienePruebaEmbarazoDisponible("");
    setResultadoPIE("");
    setHallazgosExploracion("");
    setTieneEcoTransabdominal("");
    setResultadoEcoTransabdominal("");
    setTvus("");
    setNivelBetaHCG("");
    setHcgAnterior("");
    setResultado(null);
    setNumeroConsultaActual(1);
    setRecomendaciones([]);
    setMensajeFinal(null);
    setMostrarIdSeguimiento(true);
    setIdSeguimiento("");
    setIdBusqueda("");
    setCurpBusqueda("");
    setConsultaCargada(null);
    setErrorSeccion("");
    setAlertaSignosVitalesPendiente(false);
    setAlertaPruebaEmbarazoPendiente(false);
    setAlertaEcografiaPendiente(false);
    setMensajeAlertaPruebaEmbarazo("");
    setMensajeAlertaEcografia("");
  };

  const regresarInicioDesdeAlerta = () => {
    resetCalculadora();
    setPantalla("bienvenida");
    setAlertaSignosVitalesPendiente(false);
    setAlertaPruebaEmbarazoPendiente(false);
    setAlertaEcografiaPendiente(false);
  };

  const copiarId = async () => {
    if (!idSeguimiento) return;
    try {
      await navigator.clipboard.writeText(idSeguimiento);
      alert("ID copiado al portapapeles");
    } catch {}
  };

  const numeroSeccionesTotales = 8;
  const ProgressBar = () => {
    const progreso = (seccionesCompletadas.length / numeroSeccionesTotales) * 100;
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 border-b border-blue-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">{seccionesCompletadas.length}</span>
              </div>
              <span className="text-sm font-semibold text-slate-700">Progreso de la Evaluación</span>
            </div>
            <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full shadow-sm">
              {seccionesCompletadas.length} de {numeroSeccionesTotales} completadas
            </span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progreso}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CMGFooter = () => (
    <div className="text-center mt-8 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500 mb-2">
        Desarrollado por <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de Apoyo Clínico
      </p>
      <p className="text-xs text-gray-400">
        Esta herramienta es únicamente una herramienta de apoyo y no constituye un dispositivo médico de diagnóstico.
        <br />
        El diagnóstico y tratamiento final siempre debe ser determinado por el médico tratante.
      </p>
    </div>
  );

  // =============================
  // RENDER LOGIN
  // =============================
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
                  <p className="text-sm text-slate-600">Herramienta de Apoyo Médico</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900 text-sm">Acceso Solo para Personal Médico Autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">
                  Esta herramienta está destinada exclusivamente para uso de profesionales médicos autorizados como apoyo clínico. No constituye un dispositivo médico de diagnóstico. El acceso no autorizado está prohibido.
                </p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario:</Label>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={intentosLogin >= 5 || cargandoLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Contraseña:</Label>
                  <div className="relative">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      placeholder="Contraseña"
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={intentosLogin >= 5 || cargandoLogin}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setMostrarContraseña(!mostrarContraseña)}
                      disabled={intentosLogin >= 5 || cargandoLogin}
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
                  disabled={intentosLogin >= 5 || cargandoLogin}
                >
                  {cargandoLogin ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : intentosLogin >= 5 ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Acceso Bloqueado
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">¿Problemas para acceder? Contacte al administrador del sistema</p>
                <p className="text-xs text-slate-400 mt-2">
                  <span className="font-semibold text-blue-600">CMG Health Solutions</span> - Herramienta de Apoyo Clínico
                </p>
              </div>

              <CMGFooter />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================
  // PARTE 2 – Header, bienvenida, cargar (ID/CURP)
  // =============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Herramienta de Apoyo - Embarazo Ectópico</h1>
                <p className="text-blue-100 text-sm">Sistema de Apoyo Clínico</p>
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
              <Button onClick={cerrarSesion} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                <User className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ProgressBar />
      {pantalla === "bienvenida" ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido a la Herramienta</h2>
                </div>

                <p className="text-lg text-slate-600 mb-8">
                  Seleccione una opción para continuar con la herramienta de apoyo clínico.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <Button
                    onClick={() => {
                      // Genera un ID público tipo ID-00000 si no existe
                      if (!idSeguimiento) {
                        const num = Math.floor(Math.random() * 90000) + 10000;
                        const nuevo = `ID-${num}`;
                        setIdSeguimiento(nuevo);
                        // Si ya hay CURP válida, mapea CURP↔ID
                        if (curpPaciente && isCurpValida(curpPaciente)) {
                          persistCurpMapping(curpPaciente, nuevo);
                        }
                      }
                      setPantalla("bienvenida");
                      setSeccion(1);
                    }}
                    className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <User className="h-8 w-8" />
                      <span>Nueva Evaluación</span>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setPantalla("cargar")}
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
      ) : null}

      {pantalla === "cargar" ? (
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
                    <span className="font-medium text-blue-900">Información Importante</span>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Puede buscar por <strong>ID de seguimiento</strong> o por <strong>CURP</strong> de la paciente.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">ID de Seguimiento:</Label>
                    <Input
                      type="text"
                      placeholder="Ej: ID-12345"
                      value={idBusqueda}
                      onChange={(e) => setIdBusqueda(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">Formato libre tipo ID-12345.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium text-slate-700">CURP:</Label>
                    <Input
                      type="text"
                      placeholder="CURP de 18 caracteres"
                      value={curpBusqueda}
                      onChange={(e) => setCurpBusqueda(e.target.value.toUpperCase())}
                      maxLength={18}
                      className="font-mono tracking-wide uppercase"
                    />
                    <p className="text-xs text-slate-500">Ingrese exactamente 18 caracteres (formato CURP).</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={async () => {
                      let consulta: any = null;

                      if (idBusqueda?.trim()) {
                        consulta = await findConsultaById(idBusqueda.trim());
                      } else if (isCurpValida(curpBusqueda)) {
                        consulta = await findConsultaByCurp(curpBusqueda.trim());
                      } else {
                        alert("Ingrese un ID válido o un CURP de 18 caracteres con formato correcto.");
                        return;
                      }

                      if (!consulta) {
                        alert("No se encontró la consulta con los datos proporcionados.");
                        return;
                      }

                      setConsultaCargada(consulta);
                      setPantalla("resumen");
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-6"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Buscar Consulta
                  </Button>

                  <Button
                    onClick={() => setPantalla("bienvenida")}
                    variant="outline"
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                </div>

                <CMGFooter />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* La PARTE 3/4 agrega:
          - pantalla === "resumen"
          - Secciones 1–5 (Datos + CURP, Signos vitales con alerta, Síntomas/Factores, PIE, Eco transabdominal)
      */}
      {/* =============================
          PARTE 3/4 – Secciones 1–5 (Datos + CURP, Signos Vitales + alerta,
          Síntomas/Factores, PIE + alerta, Eco transabdominal + alerta)
          ============================= */}
      {pantalla === "bienvenida" && (
        <div className="max-w-4xl mx-auto p-6">
          {/* ========== SECCIÓN 1: Datos del Paciente (Nombre, Edad, CURP) ========== */}
          {seccionActual === 1 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Datos del Paciente</h2>
                    <p className="text-sm text-slate-600">Información básica de la paciente</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Nombre */}
                <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Nombre Completo</span>
                  </Label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre de la paciente"
                    value={nombrePaciente}
                    onChange={(e) => setNombrePaciente(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>

                {/* Edad */}
                <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Edad</span>
                  </Label>
                  <input
                    type="number"
                    placeholder="Edad en años"
                    value={edadPaciente}
                    onChange={(e) => setEdadPaciente(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">años</span>
                </div>

                {/* CURP */}
                <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>CURP</span>
                  </Label>
                  <input
                    type="text"
                    placeholder="CURP de 18 caracteres"
                    value={curpPaciente}
                    onChange={(e) => setCurpPaciente(e.target.value.toUpperCase())}
                    maxLength={18}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 font-mono tracking-wide uppercase"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Debe contener exactamente 18 caracteres (formato oficial CURP).
                  </p>
                </div>
              </div>

              {errorSeccion && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-red-700 font-medium">{errorSeccion}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    // Validación estricta de presencia
                    if (!nombrePaciente || !edadPaciente || !curpPaciente) {
                      setErrorSeccion("Por favor, complete nombre, edad y CURP.");
                      return;
                    }
                    // Validación de CURP: 18 chars + regex
                    if (!isCurpValida(curpPaciente)) {
                      setErrorSeccion("El CURP está incompleto o con formato inválido.");
                      alert("El CURP está incompleto o con formato inválido. Debe tener 18 caracteres y formato oficial.");
                      return;
                    }
                    setErrorSeccion("");

                    // Generar ID si no existe aún y mapear CURP↔ID
                    if (!idSeguimiento) {
                      const num = Math.floor(Math.random() * 90000) + 10000;
                      const nuevo = `ID-${num}`;
                      setIdSeguimiento(nuevo);
                      persistCurpMapping(curpPaciente, nuevo);
                    } else {
                      // si ya existe ID, asegurar que quede mapeado
                      persistCurpMapping(curpPaciente, idSeguimiento);
                    }

                    completarSeccion(1);
                    setSeccion(2);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Continuar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <CMGFooter />
            </div>
          )}

          {/* ========== SECCIÓN 2: Signos Vitales (con posible alerta) ========== */}
          {seccionActual === 2 && (
            <div className="space-y-6">
              {/* Si NO hay alerta pendiente, mostramos el formulario */}
              {!alertaSignosVitalesPendiente ? (
                <>
                  <div className="bg-pink-50 rounded-2xl p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-md">
                        <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Signos Vitales</h2>
                        <p className="text-sm text-gray-600 mt-1">Evaluación hemodinámica de la paciente</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* FC */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Frecuencia Cardíaca</span>
                      </Label>
                      <Input
                        type="number"
                        value={frecuenciaCardiaca}
                        onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
                        placeholder="60-100"
                        className="w-full text-lg font-medium border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-lg mb-2"
                      />
                      <p className="text-xs text-gray-500">lpm</p>
                    </div>

                    {/* PAS */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Presión Sistólica</span>
                      </Label>
                      <Input
                        type="number"
                        value={presionSistolica}
                        onChange={(e) => setPresionSistolica(e.target.value)}
                        placeholder="90-140"
                        className="w-full text-lg font-medium border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-lg mb-2"
                      />
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>

                    {/* PAD */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Presión Diastólica</span>
                      </Label>
                      <Input
                        type="number"
                        value={presionDiastolica}
                        onChange={(e) => setPresionDiastolica(e.target.value)}
                        placeholder="60-90"
                        className="w-full text-lg font-medium border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-lg mb-2"
                      />
                      <p className="text-xs text-gray-500">mmHg</p>
                    </div>

                    {/* PAM */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                      <Label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>PAM</span>
                      </Label>
                      <div className="w-full text-lg font-medium text-gray-900 border border-gray-200 rounded-lg mb-2 px-3 py-2 bg-white">
                        {pam || "--"}
                      </div>
                      <p className="text-xs text-blue-600 font-medium">mmHg (65-100)</p>
                    </div>
                  </div>

                  {/* Estado de conciencia */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <Label className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Estado de Conciencia</span>
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label
                        className={`flex items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          estadoConciencia === "alerta"
                            ? "border-green-400 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            estadoConciencia === "alerta" ? "border-green-500" : "border-gray-300"
                          }`}
                        >
                          {estadoConciencia === "alerta" && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                        </div>
                        <input
                          type="radio"
                          name="estadoConciencia"
                          value="alerta"
                          checked={estadoConciencia === "alerta"}
                          onChange={(e) => setEstadoConciencia(e.target.value as any)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-700">Alerta</span>
                      </label>

                      <label
                        className={`flex items-center gap-3 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                          estadoConciencia === "no_alerta"
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            estadoConciencia === "no_alerta" ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          {estadoConciencia === "no_alerta" && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                        </div>
                        <input
                          type="radio"
                          name="estadoConciencia"
                          value="no_alerta"
                          checked={estadoConciencia === "no_alerta"}
                          onChange={(e) => setEstadoConciencia(e.target.value as any)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          No alerta (estuporosa, comatosa, somnolienta)
                        </span>
                      </label>
                    </div>
                  </div>

                  {errorSeccion && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-700 font-medium">{errorSeccion}</p>
                      </div>
                    </div>
                  )}

                  {/* Navegación */}
                  <div className="flex justify-between">
                    <Button
                      onClick={() => setSeccion(1)}
                      variant="outline"
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => {
                        if (!frecuenciaCardiaca || !presionSistolica || !presionDiastolica || !estadoConciencia) {
                          setErrorSeccion("Por favor complete todos los campos de signos vitales.");
                          return;
                        }
                        setErrorSeccion("");

                        // Si están fuera de rango o conciencia no alerta => activar bloque de advertencia
                        if (!validarSignosVitales()) {
                          setAlertaSignosVitalesPendiente(true);
                          return;
                        }

                        completarSeccion(2);
                        setSeccion(3);
                      }}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transition-all shadow-lg font-medium text-white"
                    >
                      Continuar
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                // BLOQUE DE ADVERTENCIA – Signos vitales
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 p-8 rounded-2xl border-2 border-red-200 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                        <AlertTriangle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-red-900">Advertencia de Signos Vitales</h2>
                        <p className="text-red-700 font-medium">Valores críticos o estado de conciencia alterado</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 mt-6 rounded-xl border-2 border-red-200">
                      <h3 className="text-lg font-bold text-red-900 mb-2">Detalles detectados</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {frecuenciaCardiaca &&
                          (Number(frecuenciaCardiaca) < 60 || Number(frecuenciaCardiaca) > 100) && (
                            <li>• Frecuencia Cardíaca: {frecuenciaCardiaca} lpm (normal 60–100)</li>
                          )}
                        {presionSistolica &&
                          (Number(presionSistolica) < 90 || Number(presionSistolica) > 140) && (
                            <li>• Presión Sistólica: {presionSistolica} mmHg (normal 90–140)</li>
                          )}
                        {presionDiastolica &&
                          (Number(presionDiastolica) < 60 || Number(presionDiastolica) > 90) && (
                            <li>• Presión Diastólica: {presionDiastolica} mmHg (normal 60–90)</li>
                          )}
                        {pam && (Number(pam) < 65 || Number(pam) > 100) && <li>• PAM: {pam} mmHg (normal 65–100)</li>}
                        {estadoConciencia === "no_alerta" && <li>• Estado de Conciencia: No alerta</li>}
                      </ul>

                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-slate-700">
                          Recomendación: priorizar estabilización clínica y alerta al equipo tratante.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      onClick={regresarInicioDesdeAlerta}
                      variant="outline"
                      className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Home className="h-5 w-5" />
                      Regresar al Inicio
                    </Button>

                    <Button
                      onClick={() => {
                        setAlertaSignosVitalesPendiente(false);
                        completarSeccion(2);
                        setSeccion(3);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Continuar con la Evaluación
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              <CMGFooter />
            </div>
          )}

          {/* ========== SECCIÓN 3: Síntomas y Factores de Riesgo ========== */}
          {seccionActual === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H3m4 10h10M5 20h10a2 2 0 002-2v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {numeroConsultaActual === 1
                        ? "¿Cuál es el motivo de consulta?"
                        : `Síntomas y Factores de Riesgo - Consulta ${numeroConsultaActual}`}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {numeroConsultaActual === 1
                        ? "Evaluación clínica de la paciente"
                        : "Reevaluación clínica de la paciente (seguimiento)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Síntomas */}
              <div className="space-y-4 mb-8">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  Síntomas Presentes
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sintomas.map((s) => {
                    const isChecked = sintomasSeleccionados.includes(s.id);
                    const isAsintomatica = s.id === "asintomatica";
                    const hayOtrosSintomas = sintomasSeleccionados.some((id) => id !== "asintomatica" && id !== "sincope");
                    const isDisabled = isAsintomatica && hayOtrosSintomas;

                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                          isChecked ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                        } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (isAsintomatica && e.target.checked) {
                              setSintomasSeleccionados(["asintomatica"]);
                            } else if (isAsintomatica && !e.target.checked) {
                              setSintomasSeleccionados(sintomasSeleccionados.filter((id) => id !== "asintomatica"));
                            } else if (e.target.checked) {
                              setSintomasSeleccionados([...sintomasSeleccionados.filter((id) => id !== "asintomatica"), s.id]);
                            } else {
                              setSintomasSeleccionados(sintomasSeleccionados.filter((id) => id !== s.id));
                            }
                          }}
                          className="h-4 w-4 rounded-md border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Factores */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  Factores de Riesgo
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {factoresRiesgo.map((f) => {
                    const isChecked = factoresSeleccionados.includes(f.id);
                    const isSinFactores = f.id === "sin_factores";
                    const hayOtrosFactores = factoresSeleccionados.some((id) => id !== "sin_factores");
                    const isDisabled = isSinFactores && hayOtrosFactores;

                    return (
                      <label
                        key={f.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                          isChecked ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50"
                        } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (isSinFactores && e.target.checked) {
                              setFactoresSeleccionados(["sin_factores"]);
                            } else if (isSinFactores && !e.target.checked) {
                              setFactoresSeleccionados(factoresSeleccionados.filter((id) => id !== "sin_factores"));
                            } else if (e.target.checked) {
                              setFactoresSeleccionados([...factoresSeleccionados.filter((id) => id !== "sin_factores"), f.id]);
                            } else {
                              setFactoresSeleccionados(factoresSeleccionados.filter((id) => id !== f.id));
                            }
                          }}
                          className="h-4 w-4 rounded-md border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{f.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {errorSeccion && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errorSeccion}</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={() => setSeccion(2)}
                  variant="outline"
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={() => {
                    if (sintomasSeleccionados.length === 0) {
                      setErrorSeccion("Por favor seleccione al menos un síntoma.");
                      return;
                    }
                    if (factoresSeleccionados.length === 0) {
                      setErrorSeccion("Por favor seleccione al menos un factor de riesgo.");
                      return;
                    }
                    setErrorSeccion("");
                    completarSeccion(3);
                    setSeccion(4);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-medium text-white"
                >
                  Siguiente
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <CMGFooter />
            </div>
          )}

          {/* ========== SECCIÓN 4: PIE (con bloque de advertencia si 'no' o 'negativo') ========== */}
          {seccionActual === 4 && (
            <div className="space-y-6">
              {!alertaPruebaEmbarazoPendiente ? (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                        <ClipboardList className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2>
                        <p className="text-sm text-slate-600">Verificación de prueba cualitativa</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    Por favor, indique si la paciente cuenta con el siguiente estudio:
                  </p>

                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-200 shadow-sm hover:shadow-md">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>¿Se realizó la PIE (Prueba de Embarazo)?</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {["si", "no"].map((op) => (
                          <label
                            key={op}
                            className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              tienePruebaEmbarazoDisponible === op
                                ? "border-purple-500 bg-purple-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="tienePruebaEmbarazoDisponible"
                              value={op}
                              checked={tienePruebaEmbarazoDisponible === op}
                              onChange={(e) => {
                                setTienePruebaEmbarazoDisponible(e.target.value as any);
                                setResultadoPIE("");
                              }}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                tienePruebaEmbarazoDisponible === op ? "border-purple-500 bg-purple-500" : "border-gray-300"
                              }`}
                            >
                              {tienePruebaEmbarazoDisponible === op && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="text-sm font-medium text-slate-700 capitalize">{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {tienePruebaEmbarazoDisponible === "si" && (
                      <div className="bg-white p-5 rounded-xl border-2 border-purple-200 transition-all duration-200 shadow-sm">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>¿Resultado de la prueba?</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["positivo", "negativo"].map((r) => (
                            <label
                              key={r}
                              className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                resultadoPIE === r ? "border-purple-500 bg-purple-50 shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="resultadoPIE"
                                value={r}
                                checked={resultadoPIE === r}
                                onChange={(e) => setResultadoPIE(e.target.value as any)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  resultadoPIE === r ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                }`}
                              >
                                {resultadoPIE === r && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <span className="text-sm font-medium text-slate-700 capitalize">{r}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorSeccion && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-700 font-medium">{errorSeccion}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      onClick={() => setSeccion(3)}
                      variant="outline"
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => {
                        if (!tienePruebaEmbarazoDisponible) {
                          setErrorSeccion("Por favor seleccione si tiene la prueba realizada.");
                          return;
                        }
                        if (tienePruebaEmbarazoDisponible === "si" && !resultadoPIE) {
                          setErrorSeccion("Por favor seleccione el resultado de la prueba.");
                          return;
                        }
                        setErrorSeccion("");

                        // Encender advertencia si "no" o "negativo"
                        if (tienePruebaEmbarazoDisponible === "no") {
                          setMensajeAlertaPruebaEmbarazo(
                            "Se necesita realizar una prueba de embarazo cualitativa (PIE) para poder continuar con la evaluación."
                          );
                          setAlertaPruebaEmbarazoPendiente(true);
                          if (!recomendaciones.includes("Prueba de Embarazo No Realizada: Se recomienda realizar una PIE.")) {
                            setRecomendaciones([...recomendaciones, "Prueba de Embarazo No Realizada: Se recomienda realizar una PIE."]);
                          }
                          return;
                        }
                        if (tienePruebaEmbarazoDisponible === "si" && resultadoPIE === "negativo") {
                          setMensajeAlertaPruebaEmbarazo(
                            "Según la prueba de embarazo, no se puede considerar un embarazo ectópico. Contacte con su médico para determinar la causa de los síntomas."
                          );
                          setAlertaPruebaEmbarazoPendiente(true);
                          if (!recomendaciones.includes("Prueba de Embarazo Negativa: Contactar con su médico para determinar la causa de los síntomas.")) {
                            setRecomendaciones([
                              ...recomendaciones,
                              "Prueba de Embarazo Negativa: Contactar con su médico para determinar la causa de los síntomas.",
                            ]);
                          }
                          return;
                        }

                        completarSeccion(4);
                        setSeccion(5);
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Continuar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                // BLOQUE DE ADVERTENCIA – PIE
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-orange-50 via-orange-50 to-orange-50 p-8 rounded-2xl border-2 border-orange-200 shadow-xl">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <AlertTriangle className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Advertencia de Prueba de Embarazo</h2>
                        <p className="text-orange-700 font-medium">Se detectaron hallazgos que requieren atención</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg mb-3">Advertencia</h3>
                          <p className="text-slate-700 leading-relaxed">{mensajeAlertaPruebaEmbarazo}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-orange-100">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-orange-600 text-lg font-bold">!</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Sugerencia</h4>
                            <p className="text-lg front-medium text-slate-700 leading-relaxed">
                              Realizar o confirmar la prueba y continuar con protocolo clínico.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                      <p className="text-slate-700 leading-relaxed">
                        Puede continuar con la evaluación o regresar al inicio para terminar la consulta y atender la situación.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      onClick={regresarInicioDesdeAlerta}
                      variant="outline"
                      className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Home className="h-5 w-5" />
                      Regresar al Inicio
                    </Button>
                    <Button
                      onClick={() => setAlertaPruebaEmbarazoPendiente(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Continuar con la Evaluación
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <CMGFooter />
                </div>
              )}
            </div>
          )}

          {/* ========== SECCIÓN 5: Ecografía Transabdominal (con alerta si hallazgos EIU) ========== */}
          {seccionActual === 5 && (
            <div className="space-y-6">
              {!alertaEcografiaPendiente ? (
                <>
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2>
                        <p className="text-sm text-slate-600">Ecografía transabdominal y exploración física</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-cyan-200 transition-all duration-200 shadow-sm hover:shadow-md">
                      <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <span>Hallazgos de Exploración Física</span>
                      </Label>
                      <textarea
                        placeholder="Describa los hallazgos relevantes..."
                        value={hallazgosExploracion}
                        onChange={(e) => setHallazgosExploracion(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all duration-200 resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                      <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <span>¿Tiene ecografía transabdominal?</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {["si", "no"].map((op) => (
                          <label
                            key={op}
                            className={`flex items-center justify-center space-x-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              tieneEcoTransabdominal === op
                                ? "border-cyan-500 bg-cyan-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="tieneEcoTransabdominal"
                              value={op}
                              checked={tieneEcoTransabdominal === op}
                              onChange={(e) => setTieneEcoTransabdominal(e.target.value as any)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                tieneEcoTransabdominal === op ? "border-cyan-500 bg-cyan-500" : "border-gray-300"
                              }`}
                            >
                              {tieneEcoTransabdominal === op && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                            </div>
                            <span className="text-sm font-medium text-slate-700 capitalize">{op}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {tieneEcoTransabdominal === "si" && (
                      <div className="bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm">
                        <Label className="text-base font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <span>Resultado de la ecografía</span>
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: "saco_gestacional", label: "Saco gestacional" },
                            { value: "saco_gestacional_vitelino", label: "Saco gestacional con saco vitelino" },
                            {
                              value: "saco_gestacional_vitelino_embrion_sin_fc",
                              label: "Saco gestacional con saco vitelino con embrión sin frecuencia cardíaca",
                            },
                            {
                              value: "saco_gestacional_vitelino_embrion_con_fc",
                              label: "Saco gestacional con saco vitelino y embrión con frecuencia cardíaca",
                            },
                            { value: "ausencia_saco_gestacional", label: "Ausencia de saco gestacional" },
                          ].map((op) => (
                            <label
                              key={op.value}
                              className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                resultadoEcoTransabdominal === op.value
                                  ? "border-cyan-500 bg-cyan-50 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="resultadoEcoTransabdominal"
                                value={op.value}
                                checked={resultadoEcoTransabdominal === op.value}
                                onChange={(e) => setResultadoEcoTransabdominal(e.target.value)}
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  resultadoEcoTransabdominal === op.value ? "border-cyan-500 bg-cyan-500" : "border-gray-300"
                                }`}
                              >
                                {resultadoEcoTransabdominal === op.value && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{op.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorSeccion && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-red-700 font-medium">{errorSeccion}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      onClick={() => setSeccion(4)}
                      variant="outline"
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      onClick={() => {
                        if (!tieneEcoTransabdominal) {
                          setErrorSeccion("Por favor, seleccione si tiene ecografía transabdominal.");
                          return;
                        }
                        if (tieneEcoTransabdominal === "si" && !resultadoEcoTransabdominal) {
                          setErrorSeccion("Por favor, seleccione el resultado de la ecografía.");
                          return;
                        }
                        setErrorSeccion("");

                        // Si tiene EIU (cualquier "saco..." excepto ausencia) => alerta
                        if (
                          tieneEcoTransabdominal === "si" &&
                          ["saco_gestacional", "saco_gestacional_vitelino", "saco_gestacional_vitelino_embrion_sin_fc", "saco_gestacional_vitelino_embrion_con_fc"].includes(
                            resultadoEcoTransabdominal
                          )
                        ) {
                          let mensaje = "";
                          if (resultadoEcoTransabdominal === "saco_gestacional") {
                            mensaje = "Se detectó saco gestacional. Recomendar TVUS para evaluación más detallada.";
                          } else if (resultadoEcoTransabdominal === "saco_gestacional_vitelino") {
                            mensaje = "Saco gestacional con saco vitelino. Recomendar TVUS para seguimiento.";
                          } else if (resultadoEcoTransabdominal === "saco_gestacional_vitelino_embrion_sin_fc") {
                            mensaje = "Embrión sin frecuencia cardíaca. Evaluación médica inmediata.";
                          } else if (resultadoEcoTransabdominal === "saco_gestacional_vitelino_embrion_con_fc") {
                            mensaje = "Embrión con frecuencia cardíaca. Seguimiento obstétrico habitual.";
                          }
                          setMensajeAlertaEcografia(mensaje);
                          setAlertaEcografiaPendiente(true);
                          if (!recomendaciones.some((r) => r.startsWith("Hallazgo Ecográfico:"))) {
                            setRecomendaciones((prev) => [...prev, `Hallazgo Ecográfico: ${mensaje}`]);
                          }
                          return;
                        }

                        // ausencia de saco o no se tiene eco => continuar
                        completarSeccion(5);
                        setSeccion(6);
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Continuar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <CMGFooter />
                </>
              ) : (
                // BLOQUE DE ADVERTENCIA – Eco transabdominal
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200 shadow-xl">
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <AlertTriangle className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Advertencia de Ecografía</h2>
                        <p className="text-blue-700 font-medium">Se detectaron hallazgos que requieren atención</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 mb-6">
                      <div className="flex items-start space-x-3 mb-4">
                        <AlertTriangle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg mb-3">Advertencia</h3>
                          <p className="text-slate-700 leading-relaxed">{mensajeAlertaEcografia}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-blue-600 text-sm font-bold">!</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Recomendación Médica</h4>
                            <p className="text-lg front-medium text-slate-700 leading-relaxed">
                              Continuar protocolo con TVUS y β-hCG en sangre según criterio clínico.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <p className="text-slate-700 leading-relaxed">
                        Puede continuar con la evaluación o regresar al inicio para terminar la consulta.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      onClick={regresarInicioDesdeAlerta}
                      variant="outline"
                      className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Home className="h-5 w-5" />
                      Regresar al Inicio
                    </Button>
                    <Button
                      onClick={() => setAlertaEcografiaPendiente(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Continuar con la Evaluación
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <CMGFooter />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* =============================
          PARTE 4/4 – Secciones 6–7 (TVUS y β-hCG),
          cálculo de riesgo, pantallas de Resultados y Completada,
          utilidades de guardado (API + localStorage) y helpers finales
          ============================= */}

      {/* ========== SECCIÓN 6: TVUS (sin alerta; la alerta de eco ya está en Sección 5) ========== */}
      {pantalla === "bienvenida" && seccionActual === 6 && (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Ecografía Transvaginal (TVUS)</h2>
                <p className="text-sm text-slate-600">Hallazgos ecográficos</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-purple-900">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              Hallazgos en TVUS
            </label>
            <div className="space-y-3">
              {[
                { value: "normal", label: "Normal (Sin evidencia de embarazo intrauterino)" },
                { value: "libre", label: "Líquido libre" },
                { value: "masa", label: "Masa anexial" },
                { value: "masa_libre", label: "Masa anexial + Líquido libre" },
              ].map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setTvus(opcion.value)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 text-left ${
                    tvus === opcion.value
                      ? "border-purple-500 bg-purple-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tvus === opcion.value ? "border-purple-500 bg-purple-500" : "border-gray-300"
                    }`}
                  >
                    {tvus === opcion.value && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{opcion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {errorSeccion && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <p className="text-sm text-red-700">{errorSeccion}</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setSeccion(5)}
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={() => {
                if (!tvus) {
                  setErrorSeccion("Por favor seleccione los hallazgos en TVUS.");
                  return;
                }
                setErrorSeccion("");
                completarSeccion(6);
                setSeccion(7); // avanzar a β-hCG
              }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continuar
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <CMGFooter />
        </div>
      )}

      {/* ========== SECCIÓN 7: β-hCG ========== */}
      {pantalla === "bienvenida" && seccionActual === 7 && (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                <Droplet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">β-hCG en Sangre</h2>
                <p className="text-sm text-slate-600">Nivel cuantitativo de β-hCG</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-teal-200 transition-all duration-200 shadow-sm hover:shadow-md">
              <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Valor de β-hCG</span>
              </Label>
              <input
                type="number"
                placeholder="Ingrese el valor"
                value={nivelBetaHCG}
                onChange={(e) => setNivelBetaHCG(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all duration-200"
              />
              <span className="text-xs text-slate-500 mt-1 block">mUI/mL</span>
            </div>
          </div>

          {errorSeccion && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-700 font-medium">{errorSeccion}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setSeccion(6)}
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              onClick={async () => {
                if (!nivelBetaHCG) {
                  setErrorSeccion("Por favor, ingrese el valor de β-hCG.");
                  return;
                }
                setErrorSeccion("");
                await calcular(); // calcula y navega a resultados
              }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Calcular Riesgo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <CMGFooter />
        </div>
      )}

      {/* ========== PANTALLA: RESULTADOS ========== */}
      {pantalla === "resultados" && (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Resultado de la Evaluación</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-5 rounded-xl border">
                  <p className="text-sm text-slate-600">ID de seguimiento</p>
                  <p className="font-mono font-semibold text-slate-800">{idSeguimiento || "—"}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-5 rounded-xl border">
                  <p className="text-sm text-slate-600">CURP</p>
                  <p className="font-mono font-semibold text-slate-800 uppercase">{curpPaciente || curpBusqueda || "—"}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700">Riesgo estimado de embarazo ectópico</p>
                  <p className="text-2xl font-extrabold text-blue-900">{resultado != null ? `${(resultado * 100).toFixed(1)}%` : "—"}</p>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700">β-hCG</p>
                  <p className="text-lg font-bold text-emerald-900">{nivelBetaHCG ? `${nivelBetaHCG} mUI/mL` : "—"}</p>
                </div>
              </div>

              {!!recomendaciones.length && (
                <div className="bg-white p-6 rounded-xl border">
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Recomendaciones</h3>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                    {recomendaciones.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mensajeFinal && (
                <div className="p-4 rounded-lg border bg-amber-50 border-amber-200 text-amber-900">
                  {mensajeFinal}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={generarPDF} className="bg-slate-800 hover:bg-slate-900 text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>

                {/* Continuar a nueva consulta si aplica */}
                {numeroConsultaActual < 3 && (
                  <Button
                    onClick={() => {
                      setNumeroConsultaActual((n) => n + 1);
                      setPantalla("bienvenida");
                      setSeccion(3); // re-evaluación clínica
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Iniciar Consulta {numeroConsultaActual + 1}
                  </Button>
                )}

                <Button
                  onClick={() => setPantalla("completada")}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Finalizar
                </Button>
              </div>

              <CMGFooter />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== PANTALLA: COMPLETADA ========== */}
      {pantalla === "completada" && (
        <div className="max-w-3xl mx-auto p-10">
          <div className="bg-white shadow-xl rounded-2xl p-10 border">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="h-10 w-10 text-blue-700" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Consulta Finalizada</h2>
            <p className="text-center text-slate-600 mb-6">
              Gracias por utilizar la herramienta de apoyo clínico. El seguimiento puede continuar con el ID:{" "}
              <span className="font-mono font-semibold">{idSeguimiento || "—"}</span>.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  resetCalculadora();
                  setPantalla("bienvenida");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Nueva Evaluación
              </Button>
              <Button onClick={copiarId} variant="outline" className="border-gray-300">
                <Copy className="h-4 w-4 mr-2" />
                Copiar ID
              </Button>
            </div>
          </div>
          <CMGFooter />
        </div>
      )}

      {/* =============================
          LÓGICA: guardar consulta + cálculo de riesgo + PDF
          ============================= */}
      {/* Guardado en API (fallback localStorage) */}
      {/* payload mínimo para que puedas ampliarlo sin romper flujo */}
      const saveConsulta = async () => {
        const payload = {
          id: idSeguimiento,
          curp: (curpPaciente || curpBusqueda || "").toUpperCase().trim(),
          nombre: nombrePaciente || null,
          edad: edadPaciente ? Number(edadPaciente) : null,
          consulta_n: numeroConsultaActual,
          signos: {
            fc: frecuenciaCardiaca ? Number(frecuenciaCardiaca) : null,
            ps: presionSistolica ? Number(presionSistolica) : null,
            pd: presionDiastolica ? Number(presionDiastolica) : null,
            pam: pam ? Number(pam) : null,
            conciencia: estadoConciencia || null,
          },
          clinica: {
            sintomas: sintomasSeleccionados,
            factores: factoresSeleccionados,
          },
          pruebas: {
            pie_realizada: tienePruebaEmbarazoDisponible || null,
            pie_resultado: resultadoPIE || null,
            eco_previa: tieneEcoTransabdominal || null,
            eco_previa_resultado: resultadoEcoTransabdominal || null,
            tvus: tvus || null,
            hcg: nivelBetaHCG ? Number(nivelBetaHCG) : null,
            hcg_prev: hcgAnterior ? Number(hcgAnterior) : null,
          },
          resultado: resultado,
          recomendaciones,
          timestamp: new Date().toISOString(),
        };

        // API principal
        try {
          const r = await fetch("/api/consultas/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (r.ok) return true;
        } catch {}

        // Fallback localStorage
        try {
          const key = `consulta_${idSeguimiento}`;
          localStorage.setItem(key, JSON.stringify(payload));
          // índice por CURP para búsqueda
          if (payload.curp) {
            const mapKey = "curpIndex";
            const idx = JSON.parse(localStorage.getItem(mapKey) || "{}");
            idx[payload.curp] = key;
            localStorage.setItem(mapKey, JSON.stringify(idx));
          }
          return true;
        } catch {}

        return false;
      };

      // Cálculo de riesgo (placeholder determinista y estable)
      // NO toca tu flujo; puedes reemplazar fórmula con tu algoritmo bayesiano.
      const calcular = async () => {
        // Sencilla heurística sumatoria para demo (ajústala cuando integres tu algoritmo):
        let score = 0;

        // TVUS
        if (tvus === "masa") score += 0.35;
        if (tvus === "masa_libre") score += 0.5;
        if (tvus === "libre") score += 0.2;
        if (tvus === "normal") score += 0.1;

        // β-hCG
        const hcg = Number(nivelBetaHCG || 0);
        if (hcg > 3500) score += 0.35;
        else if (hcg > 1500) score += 0.25;
        else if (hcg > 500) score += 0.15;
        else if (hcg > 0) score += 0.05;

        // Síntomas/factores
        if (sintomasSeleccionados.includes("dolor_abdominal")) score += 0.1;
        if (sintomasSeleccionados.includes("sangrado")) score += 0.1;
        if (factoresSeleccionados.includes("antecedente_ectopico")) score += 0.2;
        if (factoresSeleccionados.includes("dispositivo")) score += 0.15;
        if (factoresSeleccionados.includes("tabaquismo")) score += 0.05;

        // Límite 0–0.99 para mostrar %, sin saturar al 100
        const risk = Math.max(0, Math.min(0.99, score));
        setResultado(risk);

        // Mensaje final simple
        if (risk >= 0.8) setMensajeFinal("Riesgo alto. Considerar manejo y referencia urgente según protocolo.");
        else if (risk >= 0.4) setMensajeFinal("Riesgo intermedio. Continuar con protocolo diagnóstico y vigilancia estrecha.");
        else setMensajeFinal("Riesgo bajo. Mantener vigilancia y reevaluación clínica.");

        // Guardar y mostrar resultados
        await saveConsulta();
        setPantalla("resultados");
      };

      // PDF (placeholder – deja el hook para tu generador real)
      const generarPDF = async () => {
        try {
          await fetch("/api/pdf/generar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: idSeguimiento,
              curp: (curpPaciente || curpBusqueda || "").toUpperCase(),
              nombre: nombrePaciente,
              edad: edadPaciente,
              resultado: resultado != null ? (resultado * 100).toFixed(1) + "%" : "—",
              recomendaciones,
            }),
          });
          alert("PDF generado (demo). Integra tu generador real en /api/pdf/generar.");
        } catch {
          alert("No fue posible generar el PDF en este momento.");
        }
      }}
