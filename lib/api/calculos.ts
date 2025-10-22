// app/api/consultas/[id]/route.ts
import { NextResponse } from "next/server";
// ⬇️ AJUSTA esta importación a tu helper real de Supabase (admin server-side)
import { createClient } from "@/lib/supabaseAdmin";

/**
 * Normaliza el id: acepta "ID-000123" o "123" y lo convierte en número.
 * Se usa como FOLIO visible (no el id interno).
 */
function normalizaFolio(raw: string): number {
  const limpio = raw.replace(/^ID-0*/, "");
  const n = Number.parseInt(limpio, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Folio inválido: ${raw}`);
  }
  return n;
}

/**
 * GET /api/consultas/:id
 * - ?scope=previous -> trae solo la consulta anterior (última visita) desde la vista consultas_visitas
 * - (sin scope)     -> trae el registro completo de la tabla consultas por folio
 */
export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const folio = normalizaFolio(ctx.params.id);

    if (scope === "previous") {
      const { data, error } = await supabase
        .from("consultas_visitas")
        .select("visit_number, visit_date, hcg, postprob, sintomas, factores, tvus")
        .eq("folio", folio)
        .order("visit_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json(
          { error: "No existe consulta previa para continuar." },
          { status: 404 }
        );
      }
      return NextResponse.json(data);
    }

    // Sin scope: devolver registro completo por folio
    const { data, error } = await supabase
      .from("consultas")
      .select("*")
      .eq("folio", folio)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error al obtener consulta" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/consultas/:id?visita=2|3
 * Update PARCIAL de columnas de la visita 2 o 3.
 * - Solo se permiten campos específicos por visita (whitelist).
 * - Si no viene fecha, se auto-asigna ahora.
 */
export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);
    const visita = url.searchParams.get("visita");
    const folio = normalizaFolio(ctx.params.id);
    const patch = (await req.json()) ?? {};

    if (visita !== "2" && visita !== "3") {
      return NextResponse.json(
        { error: "Parámetro 'visita' inválido. Usa 2 o 3." },
        { status: 400 }
      );
    }

    // Whitelists por visita para evitar sobrescribir columnas ajenas
    const allowV2 = new Set([
      "Sintomas_2",
      "Factores_2",
      "TVUS_2",
      "hCG_2",
      "Variacion_hCG_2",
      "Pronostico_2",
      "PostProb_2",
      "Consulta_2_Date",
    ]);
    const allowV3 = new Set([
      "Sintomas_3",
      "Factores_3",
      "TVUS_3",
      "hCG_3",
      "Variacion_hCG_3",
      "Pronostico_3",
      "PostProb_3",
      "Consulta_3_Date",
    ]);

    const allowed = visita === "2" ? allowV2 : allowV3;
    const updateBody: Record<string, any> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (allowed.has(k)) updateBody[k] = v;
    }

    // Autocompletar fecha si no se envió
    const dateKey = visita === "2" ? "Consulta_2_Date" : "Consulta_3_Date";
    if (!updateBody[dateKey]) {
      updateBody[dateKey] = new Date().toISOString();
    }

    if (Object.keys(updateBody).length === 0) {
      return NextResponse.json(
        { error: "Nada que actualizar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("consultas")
      .update(updateBody)
      .eq("folio", folio)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Error al actualizar consulta" },
      { status: 500 }
    );
  }
}

/**
 * (Opcional: si más adelante necesitas soportar DELETE o PUT, agrégalo aquí)
 */

