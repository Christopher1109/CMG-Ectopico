"use client";

import { useState } from "react";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

/* ==================== USUARIOS AUTORIZADOS ==================== */
const USUARIOS_AUTORIZADOS = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!", nombre: "Dr. Martínez" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#", nombre: "Dra. Rodríguez" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$", nombre: "Dr. García" },
  { usuario: "dra.lopez", contraseña: "DocAuth2024!", nombre: "Dra. López" },
  { usuario: "admin", contraseña: "CMGAdmin2024#", nombre: "Administrador" },
  { usuario: "Christopher", contraseña: "Matutito22", nombre: "Christopher" },
];

/* ==================== API HELPERS (Next API) ==================== */
async function apiCrearConsulta(row: any) {
  const r = await fetch("/api/consultas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function apiActualizarConsulta(id: string, patch: any) {
  const r = await fetch(`/api/consultas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function apiObtenerConsulta(id: string) {
  const r = await fetch(`/api/consultas/${encodeURIComponent(id)}`);
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

/* ==================== UTILIDADES ==================== */
function isNumberLike(v: any) {
  if (v === null || v === undefined || v === "") return false;
  const n = Number(v);
  return Number.isFinite(n);
}

function generarIdConsulta(): string {
  // Busca IDs existentes en localStorage y genera consecutivo ID-00001
  const nums: number[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) || "";
    if (k.startsWith("ectopico_ID-")) {
      const idStr = k.replace("ectopico_ID-", "");
      const n = parseInt(idStr, 10);
      if (!Number.isNaN(n)) nums.push(n);
    }
  }
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `ID-${String(next).padStart(5, "0")}`;
}

function calcularProbabilidad(pretestProb: number, LRs: number[]) {
  let odds = pretestProb / (1 - pretestProb);
  for (const lr of LRs) odds *= lr;
  const p = odds / (1 + odds);
  return Math.max(0, Math.min(1, +p.toFixed(4)));
}

/* ==================== MAPEOS DEL PROTOCOLO ==================== */
// Probabilidades base (Tabla 1)
const P0_SIN_FACT = { asintomatica: 0.017, sangrado: 0.03, dolor: 0.13, dolor_sangrado: 0.15 };
const P0_CON_FACT = { asintomatica: 0.05,  sangrado: 0.08, dolor: 0.40, dolor_sangrado: 0.46 };

// LR por TVUS (Tabla 1)
const LR_TVUS: Record<string, number> = {
  normal: 0.07,
  libre: 2.4,
  masa: 38,
  masa_libre: 47,
};

// LR por hCG (por zona 2000) según TVUS (Tabla 1)
const LR_HCG: Record<string, { bajo: number; alto: number }> = {
  normal: { bajo: 1, alto: 1 },
  libre: { bajo: 1.8, alto: 2.1 },
  masa: { bajo: 13, alto: 45 },
  masa_libre: { bajo: 17, alto: 55 },
};

// LR por variación de hCG entre consultas (Tabla 1)
const LR_VAR: Record<string, number> = {
  reduccion_1_35: 16.6,
  reduccion_35_50: 0.8,
  reduccion_mayor_50: 0,
  aumento: 3.3,
  no_disponible: 1,
};

function nombreTVUS(v: string) {
  switch (v) {
    case "normal": return "Normal";
    case "libre": return "Líquido libre";
    case "masa": return "Masa anexial";
    case "masa_libre": return "Masa anexial + líquido libre";
    default: return "No especificado";
  }
}

/* ==================== COMPONENTE ==================== */
export default function CalculadoraEctopico() {
  /* ---- auth ---- */
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");
  const [intentosLogin, setIntentosLogin] = useState(0);
  const [usuarioActual, setUsuarioActual] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");

  /* ---- navegación ---- */
  const [mostrarPantallaBienvenida, setMostrarPantallaBienvenida] = useState(true);
  const [seccionActual, setSeccionActual] = useState(1);
  const [seccionesCompletadas, setSeccionesCompletadas] = useState<number[]>([]);

  /* ---- persistencia / ids ---- */
  const [idSeguimiento, setIdSeguimiento] = useState("");
  const [mostrarIdSeguimiento, setMostrarIdSeguimiento] = useState(false);
  const [modoCargarConsulta, setModoCargarConsulta] = useState(false);
  const [idBusqueda, setIdBusqueda] = useState("");
  const [consultaCargada, setConsultaCargada] = useState<any>(null);
  const [mostrarResumenConsulta, setMostrarResumenConsulta] = useState(false);

  /* ---- control de consulta n ---- */
  const [numeroConsulta, setNumeroConsulta] = useState<1 | 2 | 3>(1);

  /* ---- expediente/signos ---- */
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edadPaciente, setEdadPaciente] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [presionSistolica, setPresionSistolica] = useState("");
  const [presionDiastolica, setPresionDiastolica] = useState("");
  const [estadoConciencia, setEstadoConciencia] = useState("");

  /* ---- embarazo/eco previa ---- */
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState("");
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("");
  const [hallazgosExploracion, setHallazgosExploracion] = useState("");
  const [tieneEcoTransabdominal, setTieneEcoTransabdominal] = useState("");
  const [resultadoEcoTransabdominal, setResultadoEcoTransabdominal] = useState("");

  /* ---- consultas ---- */
  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([]);
  const [factoresSeleccionados, setFactoresSeleccionados] = useState<string[]>([]);
  const [tvus, setTvus] = useState("");
  const [hcgValor, setHcgValor] = useState("");
  const [hcgAnterior, setHcgAnterior] = useState("");
  const [variacionHcg, setVariacionHcg] = useState("");

  /* ---- resultados ---- */
  const [resultado, setResultado] = useState<number | null>(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false);
  const [mensajeFinal, setMensajeFinal] = useState("");
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState("");

  /* ==================== UI helpers ==================== */
  const sintomas = [
    { id: "sangrado", label: "Sangrado vaginal" },
    { id: "dolor", label: "Dolor pélvico/abdominal" },
    { id: "dolor_sangrado", label: "Sangrado + Dolor pélvico/abdominal" },
    { id: "sincope", label: "Síncope o mareo" },
  ];

  const factoresRiesgo = [
    { id: "infertilidad", label: "Historia de infertilidad" },
    { id: "ectopico_previo", label: "Embarazo ectópico previo" },
    { id: "enfermedad_pelvica", label: "Enfermedad inflamatoria pélvica previa" },
    { id: "cirugia_tubarica", label: "Cirugía tubárica previa" },
  ];

  function completarSeccion(n: number) {
    if (!seccionesCompletadas.includes(n)) setSeccionesCompletadas([...seccionesCompletadas, n]);
    setSeccionActual(n + 1);
  }

  function resetCalculadora() {
    setSeccionActual(1);
    setSeccionesCompletadas([]);
    setNombrePaciente("");
    setEdadPaciente("");
    setFrecuenciaCardiaca("");
    setPresionSistolica("");
    setPresionDiastolica("");
    setEstadoConciencia("");
    setPruebaEmbarazoRealizada("");
    setResultadoPruebaEmbarazo("");
    setHallazgosExploracion("");
    setTieneEcoTransabdominal("");
    setResultadoEcoTransabdominal("");
    setSintomasSeleccionados([]);
    setFactoresSeleccionados([]);
    setTvus("");
    setHcgValor("");
    setHcgAnterior("");
    setVariacionHcg("");
    setResultado(null);
    setMostrarResultados(false);
    setProtocoloFinalizado(false);
    setMensajeFinal("");
    setMostrarAlerta(false);
    setMensajeAlerta("");
    setMostrarIdSeguimiento(false);
    setModoCargarConsulta(false);
    setIdBusqueda("");
    setConsultaCargada(null);
    setMostrarResumenConsulta(false);
    setMostrarPantallaBienvenida(true);
    setNumeroConsulta(1);
  }

  function copiarId() {
    if (idSeguimiento) {
      navigator.clipboard.writeText(idSeguimiento);
      alert("ID copiado al portapapeles");
    }
  }

  /* ==================== LOGIN ==================== */
  const manejarLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin("");
    if (intentosLogin >= 5) return setErrorLogin("Demasiados intentos fallidos. Contacte al administrador.");

    const match = USUARIOS_AUTORIZADOS.find(
      u => u.usuario.toLowerCase() === usuario.toLowerCase() && u.contraseña === contraseña
    );
    if (!match) {
      setIntentosLogin(v => v + 1);
      setErrorLogin(`Credenciales incorrectas. Intento ${intentosLogin + 1} de 5.`);
      setContraseña("");
      return;
    }
    setEstaAutenticado(true);
    setUsuarioActual(match.usuario);
    setNombreUsuario(match.nombre);
    setUsuario("");
    setContraseña("");
    setIntentosLogin(0);
  };

  const cerrarSesion = () => {
    setEstaAutenticado(false);
    setUsuarioActual("");
    setNombreUsuario("");
    resetCalculadora();
  };

  /* ==================== BUSCAR / CONTINUAR ==================== */
  async function buscarConsulta() {
    const id = idBusqueda.trim().toUpperCase();
    if (!/^ID-\d{5}$/.test(id)) {
      alert("Formato de ID incorrecto. Debe ser ID-00001");
      return;
    }

    // 1) localStorage
    let encontrada: any = null;
    const raw = localStorage.getItem(`ectopico_${id}`);
    if (raw) {
      try { encontrada = JSON.parse(raw); } catch {}
    }

    // 2) backend
    try {
      const r = await apiObtenerConsulta(id);
      if (r.ok && r.data?.data) {
        encontrada = r.data.data;
        localStorage.setItem(`ectopico_${id}`, JSON.stringify(encontrada));
      }
    } catch (e) {
      console.error("GET /api/consultas error:", e);
    }

    if (!encontrada) {
      alert("No se encontró ninguna consulta con ese ID");
      return;
    }

    setConsultaCargada(encontrada);
    setMostrarResumenConsulta(true);
    setModoCargarConsulta(false);
  }

  async function iniciarNuevaEvaluacion() {
    const nuevoId = generarIdConsulta();
    resetCalculadora();
    setIdSeguimiento(nuevoId);
    setMostrarPantallaBienvenida(false);
    setNumeroConsulta(1);
  }

  // Preparar datos para continuar (Consulta 2 o 3)
  function continuarConsultaCargada() {
    const d = consultaCargada;
    if (!d) return;

    // Datos fijos
    setIdSeguimiento(d.id);
    setNombrePaciente(d.nombre_paciente || "");
    setEdadPaciente(d.edad_paciente ? String(d.edad_paciente) : "");
    setFrecuenciaCardiaca(d.frecuencia_cardiaca ? String(d.frecuencia_cardiaca) : "");
    setPresionSistolica(d.presion_sistolica ? String(d.presion_sistolica) : "");
    setPresionDiastolica(d.presion_diastolica ? String(d.presion_diastolica) : "");
    setEstadoConciencia(d.estado_conciencia || "");
    setPruebaEmbarazoRealizada(d.prueba_embarazo_realizada || "");
    setResultadoPruebaEmbarazo(d.resultado_prueba_embarazo || "");
    setHallazgosExploracion(d.hallazgos_exploracion || "");
    setTieneEcoTransabdominal(d.tiene_eco_transabdominal || "");
    setResultadoEcoTransabdominal(d.resultado_eco_transabdominal || "");
    setSintomasSeleccionados(d.sintomas_seleccionados || []);
    setFactoresSeleccionados(d.factores_seleccionados || []);

    // Para seguimiento: usar el último hCG como "anterior"
    const ultimoHcg =
      isNumberLike(d.hcg_valor_3) ? d.hcg_valor_3 :
      isNumberLike(d.hcg_valor_2) ? d.hcg_valor_2 :
      d.hcg_valor ?? null;

    setHcgAnterior(isNumberLike(ultimoHcg) ? String(ultimoHcg) : "");
    setHcgValor("");
    setTvus(""); // <— SIN preselección como pediste

    // ¿Vamos a la 2 o a la 3?
    const yaTieneC2 = isNumberLike(d.hcg_valor_2) || d.tvus_2;
    setNumeroConsulta(yaTieneC2 ? 3 : 2);

    // Navegación
    setSeccionesCompletadas([1, 2, 3, 4]);
    setMostrarResumenConsulta(false);
    setModoCargarConsulta(false);
    setMostrarPantallaBienvenida(false);
    setSeccionActual(5);
  }

  /* ==================== CALCULO Y GUARDADO ==================== */

  // Construye el objeto base para DB (consulta 1 siempre)
  function buildBaseRow(probFinal: number | null) {
    return {
      id: idSeguimiento,
      usuario_creador: usuarioActual || null,
      nombre_paciente: nombrePaciente || null,
      edad_paciente: isNumberLike(edadPaciente) ? +edadPaciente : null,
      frecuencia_cardiaca: isNumberLike(frecuenciaCardiaca) ? +frecuenciaCardiaca : null,
      presion_sistolica: isNumberLike(presionSistolica) ? +presionSistolica : null,
      presion_diastolica: isNumberLike(presionDiastolica) ? +presionDiastolica : null,
      estado_conciencia: estadoConciencia || null,
      prueba_embarazo_realizada: pruebaEmbarazoRealizada || null,
      resultado_prueba_embarazo: resultadoPruebaEmbarazo || null,
      hallazgos_exploracion: hallazgosExploracion || null,
      tiene_eco_transabdominal: tieneEcoTransabdominal || null,
      resultado_eco_transabdominal: resultadoEcoTransabdominal || null,
      sintomas_seleccionados: Array.isArray(sintomasSeleccionados) ? sintomasSeleccionados : [],
      factores_seleccionados: Array.isArray(factoresSeleccionados) ? factoresSeleccionados : [],
      tvus: tvus || null,
      hcg_valor: isNumberLike(hcgValor) ? +hcgValor : null,
      variacion_hcg: variacionHcg || null,
      hcg_anterior: isNumberLike(hcgAnterior) ? +hcgAnterior : null,
      resultado: typeof probFinal === "number" ? probFinal : null,
    };
  }

  // Para PATCH de consulta 2/3
  function buildPatchForFollowUp(probFinal: number) {
    const nowISO = new Date().toISOString();
    if (numeroConsulta === 2) {
      return {
        tvus_2: tvus || null,
        hcg_valor_2: isNumberLike(hcgValor) ? +hcgValor : null,
        variacion_hcg_2: variacionHcg || null,
        resultado_2: probFinal,
        fecha_consulta_2: nowISO,
        usuario_consulta_2: usuarioActual || null,
      };
    }
    // consulta 3
    return {
      tvus_3: tvus || null,
      hcg_valor_3: isNumberLike(hcgValor) ? +hcgValor : null,
      variacion_hcg_3: variacionHcg || null,
      resultado_3: probFinal,
      fecha_consulta_3: nowISO,
      usuario_consulta_3: usuarioActual || null,
    };
  }

  // Guardado robusto
  async function guardarDB(probFinal: number | null, esFinal = false, motivo?: string) {
    try {
      if (!idSeguimiento) return;

      // LocalStorage (siempre)
      const payloadLocal = {
        id: idSeguimiento,
        numeroConsulta,
        fecha_local: new Date().toISOString(),
        usuario_local: usuarioActual,
        nombre_paciente: nombrePaciente,
        edad_paciente: isNumberLike(edadPaciente) ? +edadPaciente : null,
        frecuencia_cardiaca: isNumberLike(frecuenciaCardiaca) ? +frecuenciaCardiaca : null,
        presion_sistolica: isNumberLike(presionSistolica) ? +presionSistolica : null,
        presion_diastolica: isNumberLike(presionDiastolica) ? +presionDiastolica : null,
        estado_conciencia: estadoConciencia,
        prueba_embarazo_realizada: pruebaEmbarazoRealizada,
        resultado_prueba_embarazo: resultadoPruebaEmbarazo,
        hallazgos_exploracion: hallazgosExploracion,
        tiene_eco_transabdominal: tieneEcoTransabdominal,
        resultado_eco_transabdominal: resultadoEcoTransabdominal,
        sintomas_seleccionados: sintomasSeleccionados,
        factores_seleccionados: factoresSeleccionados,
        tvus,
        hcg_valor: isNumberLike(hcgValor) ? +hcgValor : null,
        hcg_anterior: isNumberLike(hcgAnterior) ? +hcgAnterior : null,
        variacion_hcg: variacionHcg || null,
        [`tvus_${numeroConsulta}`]: tvus || null,
        [`hcg_valor_${numeroConsulta}`]: isNumberLike(hcgValor) ? +hcgValor : null,
        [`variacion_hcg_${numeroConsulta}`]: variacionHcg || null,
        [`resultado_${numeroConsulta}`]: typeof probFinal === "number" ? probFinal : null,
        resultado: typeof probFinal === "number" ? probFinal : null,
        es_finalizado: esFinal || false,
        motivo_finalizacion: motivo || null,
      };
      localStorage.setItem(`ectopico_${idSeguimiento}`, JSON.stringify(payloadLocal));

      // Backend
      if (numeroConsulta === 1) {
        if (esFinal) {
          const row = { ...buildBaseRow(probFinal), es_finalizado: true, motivo_finalizacion: motivo || null };
          const r = await apiCrearConsulta(row);
          if (!r.ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.");
          return;
        }
        // No final, crear/insert normal
        const r = await apiCrearConsulta(buildBaseRow(probFinal));
        if (!r.ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.");
      } else {
        // consulta 2 o 3
        const patch = buildPatchForFollowUp(probFinal || 0);
        const finalPatch = esFinal ? { ...patch, es_finalizado: true, motivo_finalizacion: motivo || null } : patch;
        const r = await apiActualizarConsulta(idSeguimiento, finalPatch);
        if (!r.ok) alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.");
      }
    } catch (e) {
      console.error("Sync error:", e);
      alert("Advertencia: guardado local OK, pero falló la sincronización con la base de datos.");
    }
  }

  /* ---- VALIDACIONES que pueden finalizar ---- */
  function validarSignosVitales(): boolean {
    const fc = Number(frecuenciaCardiaca || 0);
    const sis = Number(presionSistolica || 0);
    const dias = Number(presionDiastolica || 0);

    setMostrarAlerta(false);
    setMensajeAlerta("");

    // EMERGENCIAS → finaliza y guarda
    const finalizar = (msg: string) => {
      setMensajeFinal(msg);
      setProtocoloFinalizado(true);
      guardarDB(null, true, msg);
      return false;
    };

    if (sis >= 180 || dias >= 110)
      return finalizar("EMERGENCIA: Crisis hipertensiva (≥ 180/110 mmHg). Traslado inmediato.");
    if (fc > 100 && (sis <= 90 || dias <= 60))
      return finalizar("EMERGENCIA: Taquicardia con hipotensión. Traslado inmediato.");
    if (fc > 120)
      return finalizar("EMERGENCIA: Taquicardia severa. Traslado inmediato.");
    if (fc < 50)
      return finalizar("EMERGENCIA: Bradicardia severa. Traslado inmediato.");
    if (estadoConciencia === "estuporosa" || estadoConciencia === "comatosa")
      return finalizar("EMERGENCIA: Alteración severa del estado de conciencia. Traslado inmediato.");

    // alertas no finales
    if (sis < 90 || dias < 60) {
      setMostrarAlerta(true);
      setMensajeAlerta("Hipotensión arterial. Requiere valoración.");
    } else if (sis >= 140 || dias >= 90) {
      setMostrarAlerta(true);
      setMensajeAlerta("Hipertensión arterial. Requiere seguimiento.");
    } else if (fc > 100) {
      setMostrarAlerta(true);
      setMensajeAlerta("Taquicardia. Vigilar evolución.");
    } else if (fc < 60) {
      setMostrarAlerta(true);
      setMensajeAlerta("Bradicardia. Valorar función cardiovascular.");
    }
    return true;
  }

  function validarPruebaEmbarazo(): boolean {
    if (pruebaEmbarazoRealizada === "no") {
      const msg = "Realizar prueba de embarazo cualitativa antes de continuar.";
      setMensajeFinal(msg);
      setProtocoloFinalizado(true);
      guardarDB(null, true, msg);
      return false;
    }
    if (resultadoPruebaEmbarazo === "negativa") {
      const msg = "Embarazo ectópico descartado por prueba negativa.";
      setMensajeFinal(msg);
      setProtocoloFinalizado(true);
      guardarDB(0, true, msg);
      return false;
    }
    return true;
  }

  function validarEcoTransabdominal(): boolean {
    const confirmatorias = [
      "saco_embrion_fc",
      "saco_vitelino_embrion",
      "saco_vitelino_sin_embrion",
      "saco_sin_embrion",
      "saco_10mm_decidual_2mm",
    ];
    if (tieneEcoTransabdominal === "si" && confirmatorias.includes(resultadoEcoTransabdominal)) {
      const msg = "Evidencia de embarazo intrauterino. Ectópico descartado.";
      setMensajeFinal(msg);
      setProtocoloFinalizado(true);
      guardarDB(0, true, msg);
      return false;
    }
    return true;
  }

  /* ---- Cálculo bayesiano según Tabla 1 ---- */
  function probPreTest(): number {
    // seleccionar síntoma clave (excluir síncope)
    const base = sintomasSeleccionados.filter(s => s !== "sincope");
    let clave: keyof typeof P0_SIN_FACT = "asintomatica";
    if (base.includes("dolor_sangrado") || (base.includes("dolor") && base.includes("sangrado"))) clave = "dolor_sangrado";
    else if (base.includes("dolor")) clave = "dolor";
    else if (base.includes("sangrado")) clave = "sangrado";
    const hayFactores = factoresSeleccionados.length > 0;
    return (hayFactores ? P0_CON_FACT : P0_SIN_FACT)[clave];
  }

  function calcVariacionEtiqueta(prev: number, actual: number): string {
    if (!isNumberLike(prev) || !isNumberLike(actual)) return "no_disponible";
    if (actual > prev) return "aumento";
    const reduccion = ((prev - actual) / prev) * 100;
    if (reduccion >= 50) return "reduccion_mayor_50";
    if (reduccion >= 35) return "reduccion_35_50";
    if (reduccion >= 1) return "reduccion_1_35";
    return "aumento";
  }

  async function calcular() {
    // validaciones mínimas de la sección 5
    if (!tvus || !hcgValor || sintomasSeleccionados.length === 0) {
      alert("Completa síntomas, TVUS y β-hCG.");
      return;
    }

    const p0 = probPreTest();
    const lrs: number[] = [];

    // LR TVUS
    if (LR_TVUS[tvus]) lrs.push(LR_TVUS[tvus]);

    // LR hCG (zona 2000)
    const nH = Number(hcgValor);
    const nivel: "alto" | "bajo" = nH >= 2000 ? "alto" : "bajo";
    const lrH = LR_HCG[tvus]?.[nivel];
    if (isNumberLike(lrH)) lrs.push(lrH as number);

    // variación si hay hcgAnterior
    let varTag: string = "no_disponible";
    if (isNumberLike(hcgAnterior)) {
      varTag = calcVariacionEtiqueta(Number(hcgAnterior), Number(hcgValor));
      setVariacionHcg(varTag);
      const lrV = LR_VAR[varTag] ?? 1;
      if (lrV) lrs.push(lrV);
    }

    // prob final
    const pFinal = calcularProbabilidad(p0, lrs);
    setResultado(pFinal);

    // guardar
    await guardarDB(pFinal, false);

    // Mostrar resultado
    if (pFinal >= 0.95) {
      setMensajeFinal("Embarazo ectópico confirmado (≥95%).");
      setProtocoloFinalizado(true);
      await guardarDB(pFinal, true, "Confirmado por probabilidad ≥95%");
    } else if (pFinal < 0.01) {
      setMensajeFinal("Embarazo ectópico descartado (<1%).");
      setProtocoloFinalizado(true);
      await guardarDB(pFinal, true, "Descartado por probabilidad <1%");
    } else {
      setMostrarResultados(true);
      setMostrarIdSeguimiento(true);
    }
  }

  /* ==================== INFORME (txt simple) ==================== */
  function generarInforme() {
    const txt = `
INFORME – EVALUACIÓN DE EMBARAZO ECTÓPICO
ID: ${idSeguimiento}
Fecha: ${new Date().toLocaleString()}
Médico: ${nombreUsuario}

Paciente: ${nombrePaciente}
Edad: ${edadPaciente || "N/D"}

Signos vitales: FC ${frecuenciaCardiaca || "N/D"} lpm, PA ${presionSistolica || "N/D"}/${presionDiastolica || "N/D"} mmHg
Estado de conciencia: ${estadoConciencia || "N/D"}

Consulta ${numeroConsulta}:
TVUS: ${nombreTVUS(tvus)}
β-hCG actual: ${hcgValor || "N/D"} mUI/mL
β-hCG anterior: ${hcgAnterior || "N/D"} mUI/mL
Variación: ${variacionHcg || "N/D"}

Probabilidad estimada: ${resultado !== null ? (resultado * 100).toFixed(1) + "%" : "N/D"}
Conclusión: ${mensajeFinal || "En seguimiento"}
`.trim();

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    a.download = `Informe_${idSeguimiento}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ==================== UI ==================== */

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
                  <span className="font-medium text-amber-900 text-sm">Solo personal médico autorizado</span>
                </div>
                <p className="text-amber-800 text-xs">Ingrese sus credenciales para continuar.</p>
              </div>

              <form onSubmit={manejarLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium text-slate-700">Usuario</Label>
                  <input
                    type="text"
                    placeholder="Usuario"
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
                      placeholder="Contraseña"
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

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 text-base" disabled={intentosLogin >= 5}>
                  <Lock className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
              </form>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">¿Problemas para acceder? Contacte al administrador</p>
                <p className="text-xs text-slate-400 mt-2"><span className="font-semibold text-blue-600">CMG Health Solutions</span> - Sistema Seguro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button onClick={cerrarSesion} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50">
                <User className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bienvenida / Buscar */}
      {mostrarPantallaBienvenida ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-full"><Calculator className="h-8 w-8 text-blue-600" /></div>
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido</h2>
                </div>
                <p className="text-lg text-slate-600 mb-8">Seleccione una opción para comenzar</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Button onClick={iniciarNuevaEvaluacion} className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-lg">
                    <div className="flex flex-col items-center space-y-2"><User className="h-8 w-8" /><span>Nueva Evaluación</span></div>
                  </Button>
                  <Button onClick={() => { setMostrarPantallaBienvenida(false); setModoCargarConsulta(true); }} variant="outline" className="h-24 border-blue-300 text-blue-600 font-semibold text-lg">
                    <div className="flex flex-col items-center space-y-2"><FileText className="h-8 w-8" /><span>Continuar Consulta</span></div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : modoCargarConsulta ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div><h2 className="text-2xl font-bold text-slate-800">Continuar Consulta Existente</h2></div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-blue-600" /><span className="font-medium text-blue-900">Ingrese el ID de seguimiento</span></div>
                <p className="text-blue-800 text-sm">Recibido al finalizar la consulta previa.</p>
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
                  <p className="text-xs text-slate-500">Formato: ID-00001</p>
                </div>
                <div className="flex gap-4">
                  <Button onClick={buscarConsulta} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <FileText className="h-4 w-4 mr-2" /> Buscar Consulta
                  </Button>
                  <Button onClick={() => { setModoCargarConsulta(false); setMostrarPantallaBienvenida(true); }} variant="outline" className="border-gray-300 text-gray-600">Cancelar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : mostrarResumenConsulta && consultaCargada ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                <h2 className="text-2xl font-bold text-slate-800">Consulta Encontrada</h2>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de la última consulta</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>ID:</strong> {consultaCargada.id}</p>
                    <p><strong>Paciente:</strong> {consultaCargada.nombre_paciente || "N/D"}</p>
                    <p><strong>Edad:</strong> {consultaCargada.edad_paciente ?? "N/D"} años</p>
                    <p><strong>β-hCG previo:</strong> {consultaCargada.hcg_valor_3 ?? consultaCargada.hcg_valor_2 ?? consultaCargada.hcg_valor ?? "N/D"} mUI/mL</p>
                  </div>
                  <div>
                    <p><strong>TVUS:</strong> {nombreTVUS(consultaCargada.tvus_3 || consultaCargada.tvus_2 || consultaCargada.tvus)}</p>
                    <p><strong>Probabilidad:</strong> {(() => {
                      const p = consultaCargada.resultado_3 ?? consultaCargada.resultado_2 ?? consultaCargada.resultado;
                      return isNumberLike(p) ? `${(p * 100).toFixed(1)}%` : "N/D";
                    })()}</p>
                    <p><strong>Última fecha:</strong> {new Date(consultaCargada.updated_at || consultaCargada.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /><span className="font-medium text-yellow-900">Seguimiento</span></div>
                <p className="text-yellow-800 text-sm">Se precargarán datos básicos y el β-hCG anterior; complete nuevamente los campos clínicos para la nueva consulta.</p>
              </div>

              <div className="flex gap-4">
                <Button onClick={continuarConsultaCargada} className="bg-green-600 text-white"><ArrowRight className="h-4 w-4 mr-2" /> Continuar</Button>
                <Button onClick={() => { setMostrarResumenConsulta(false); setModoCargarConsulta(true); setConsultaCargada(null); }} variant="outline" className="border-gray-300 text-gray-600">Buscar otra</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : protocoloFinalizado ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div><h2 className="text-2xl font-bold text-slate-800">Evaluación Completada</h2></div>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200"><p className="text-blue-900 font-medium">{mensajeFinal}</p></div>

              {resultado !== null && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad estimada</h3>
                  <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={generarInforme} variant="outline" className="border-blue-300 text-blue-600 bg-transparent"><Download className="h-4 w-4 mr-2" /> Generar Informe</Button>
                <Button onClick={resetCalculadora} className="bg-green-600 text-white"><User className="h-4 w-4 mr-2" /> Nueva Evaluación</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : mostrarResultados && resultado !== null ? (
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div><h2 className="text-2xl font-bold text-slate-800">Resultado de la Evaluación</h2></div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Probabilidad estimada</h3>
                <div className="text-4xl font-bold text-blue-700 mb-4">{(resultado * 100).toFixed(1)}%</div>
                <p className="text-blue-800 text-sm">
                  {resultado >= 0.95 ? "Alta probabilidad" : resultado < 0.01 ? "Baja probabilidad" : "Probabilidad intermedia – continuar seguimiento"}
                </p>
              </div>

              {mostrarIdSeguimiento && idSeguimiento && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-4"><AlertTriangle className="h-5 w-5 text-yellow-600" /><h3 className="text-lg font-semibold text-yellow-900">Seguimiento</h3></div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-800">Guarde este ID:</span>
                      <span className="font-mono bg-white px-2 py-1 rounded border">{idSeguimiento}</span>
                      <Button onClick={copiarId} variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent"><Copy className="h-3 w-3" /></Button>
                    </div>
                    <div className="bg-white p-4 rounded border border-yellow-300">
                      <h4 className="font-medium text-yellow-900 mb-2">Indicaciones</h4>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        <li>• Regrese en 48–72 horas para continuar la evaluación.</li>
                        <li>• Vigile la evolución de los síntomas.</li>
                        <li>• Acuda a urgencias ante dolor intenso, sangrado abundante o síntomas de choque.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={generarInforme} variant="outline" className="border-blue-300 text-blue-600 bg-transparent"><Download className="h-4 w-4 mr-2" /> Generar Informe</Button>
                <Button onClick={resetCalculadora} className="bg-green-600 text-white"><User className="h-4 w-4 mr-2" /> Nueva Evaluación</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // FORMULARIO PRINCIPAL
        <div className="max-w-4xl mx-auto p-6">
          <Card className="shadow-lg">
            <CardContent className="p-8 space-y-10">
              {/* Sección 1 – Expediente */}
              {seccionActual === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><User className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Expediente Clínico</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Nombre del paciente</Label>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={nombrePaciente}
                        onChange={(e) => setNombrePaciente(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500">Escriba el nombre con el que desea identificar al paciente.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">Edad (años)</Label>
                      <input
                        type="number"
                        placeholder="Edad"
                        value={edadPaciente}
                        onChange={(e) => setEdadPaciente(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500">Ingrese la edad en años completos.</p>
                    </div>
                  </div>
                  <div className="flex justify-end"><Button onClick={() => completarSeccion(1)} className="bg-blue-600 text-white">Continuar</Button></div>
                </div>
              )}

              {/* Sección 2 – Signos */}
              {seccionActual === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Activity className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Signos Vitales</h2></div>

                  {mostrarAlerta && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 mb-2"><AlertTriangle className="h-5 w-5 text-yellow-600" /><span className="font-medium text-yellow-900">Alerta</span></div>
                      <p className="text-yellow-800 text-sm">{mensajeAlerta}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Frecuencia cardíaca (lpm)</Label>
                      <input type="number" placeholder="Frecuencia" value={frecuenciaCardiaca} onChange={(e) => setFrecuenciaCardiaca(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      <p className="text-xs text-slate-500">Registre la frecuencia más reciente.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Presión sistólica (mmHg)</Label>
                        <input type="number" placeholder="Sistólica" value={presionSistolica} onChange={(e) => setPresionSistolica(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <Label>Presión diastólica (mmHg)</Label>
                        <input type="number" placeholder="Diastólica" value={presionDiastolica} onChange={(e) => setPresionDiastolica(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado de conciencia</Label>
                      <select value={estadoConciencia} onChange={(e) => setEstadoConciencia(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        <option value="alerta">Alerta</option>
                        <option value="somnolienta">Somnolienta</option>
                        <option value="estuporosa">Estuporosa</option>
                        <option value="comatosa">Comatosa</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(1)} variant="outline" className="border-gray-300 text-gray-600">Anterior</Button>
                    <Button onClick={() => { if (validarSignosVitales()) completarSeccion(2); }} className="bg-blue-600 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {/* Sección 3 – Prueba embarazo */}
              {seccionActual === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><FileText className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Prueba de Embarazo</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>¿Se realizó la prueba?</Label>
                      <select value={pruebaEmbarazoRealizada} onChange={(e) => setPruebaEmbarazoRealizada(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                      <p className="text-xs text-slate-500">Indique si se efectuó la prueba cualitativa.</p>
                    </div>
                    {pruebaEmbarazoRealizada === "si" && (
                      <div className="space-y-2">
                        <Label>Resultado</Label>
                        <select value={resultadoPruebaEmbarazo} onChange={(e) => setResultadoPruebaEmbarazo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione</option>
                          <option value="positiva">Positiva</option>
                          <option value="negativa">Negativa</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(2)} variant="outline" className="border-gray-300 text-gray-600">Anterior</Button>
                    <Button onClick={() => { if (validarPruebaEmbarazo()) completarSeccion(3); }} className="bg-blue-600 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {/* Sección 4 – Evaluación previa */}
              {seccionActual === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Stethoscope className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Evaluación Previa</h2></div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hallazgos en la exploración física</Label>
                      <textarea placeholder="Describa los hallazgos" value={hallazgosExploracion} onChange={(e) => setHallazgosExploracion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <Label>¿Se realizó ecografía transabdominal?</Label>
                      <select value={tieneEcoTransabdominal} onChange={(e) => setTieneEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    {tieneEcoTransabdominal === "si" && (
                      <div className="space-y-2">
                        <Label>Resultado de ecografía transabdominal</Label>
                        <select value={resultadoEcoTransabdominal} onChange={(e) => setResultadoEcoTransabdominal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                          <option value="">Seleccione</option>
                          <option value="saco_embrion_fc">Saco embrionario con FC</option>
                          <option value="saco_vitelino_embrion">Saco vitelino con embrión</option>
                          <option value="saco_vitelino_sin_embrion">Saco vitelino sin embrión</option>
                          <option value="saco_sin_embrion">Saco sin embrión</option>
                          <option value="saco_10mm_decidual_2mm">Saco ≥10mm con anillo decidual ≥2mm</option>
                          <option value="ausencia_saco">Ausencia de saco</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(3)} variant="outline" className="border-gray-300 text-gray-600">Anterior</Button>
                    <Button onClick={() => { if (validarEcoTransabdominal()) completarSeccion(4); }} className="bg-blue-600 text-white">Continuar</Button>
                  </div>
                </div>
              )}

              {/* Sección 5 – Consultas */}
              {seccionActual === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3"><Calculator className="h-6 w-6 text-blue-600" /><h2 className="text-2xl font-bold text-slate-800">Consultas {numeroConsulta}/3</h2></div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Síntomas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sintomas.map((s) => (
                          <label key={s.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={sintomasSeleccionados.includes(s.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSintomasSeleccionados(prev =>
                                  checked ? [...prev, s.id] : prev.filter(x => x !== s.id)
                                );
                              }}
                              className="h-5 w-5 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-slate-700">{s.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">Seleccione todos los síntomas presentes.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Factores de riesgo</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {factoresRiesgo.map((f) => (
                          <label key={f.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={factoresSeleccionados.includes(f.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFactoresSeleccionados(prev =>
                                  checked ? [...prev, f.id] : prev.filter(x => x !== f.id)
                                );
                              }}
                              className="h-5 w-5 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-slate-700">{f.label}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">Marque los factores de riesgo del paciente (si aplica).</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Resultado de TVUS</Label>
                      <select value={tvus} onChange={(e) => setTvus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">Seleccione</option>
                        <option value="normal">Normal</option>
                        <option value="libre">Líquido libre</option>
                        <option value="masa">Masa anexial</option>
                        <option value="masa_libre">Masa anexial + líquido libre</option>
                      </select>
                      <p className="text-xs text-slate-500">Elija el hallazgo predominante del estudio transvaginal.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>β-hCG actual (mUI/mL)</Label>
                      <input type="number" placeholder="Valor de β-hCG" value={hcgValor} onChange={(e) => setHcgValor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                      <p className="text-xs text-slate-500">Ingrese el valor actual de β-hCG.</p>
                    </div>

                    {isNumberLike(hcgAnterior) && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800"><strong>β-hCG de consulta anterior:</strong> {hcgAnterior} mUI/mL</p>
                        <p className="text-xs text-blue-600 mt-1">Se calculará automáticamente la variación con el valor actual.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button onClick={() => setSeccionActual(4)} variant="outline" className="border-gray-300 text-gray-600">Anterior</Button>
                    <Button onClick={calcular} className="bg-green-600 text-white">Calcular</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
