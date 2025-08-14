// app/api/consultas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <-- Service Role (server)

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// GET /api/consultas?limit=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 20);

    const { data, error } = await supabase
      .from("consultas")
      .select("*")
      .order("fecha_creacion", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

// POST /api/consultas  (Crea la Consulta 1)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ No generamos "CONS-...". Respetamos el ID que manda el frontend (ID-00001, etc.)
    if (!body?.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Falta 'id' (ID-00001...)" }, { status: 400 });
    }

    const payload = {
      id: body.id.slice(0, 20),
      usuario_creador: body.usuario_creador ?? body.usuarioCreador ?? "anon",

      nombre_paciente: body.nombre_paciente ?? body.nombrePaciente ?? "N/A",
      edad_paciente: body.edad_paciente ?? body.edadPaciente ?? null,

      frecuencia_cardiaca: body.frecuencia_cardiaca ?? body.frecuenciaCardiaca ?? null,
      presion_sistolica: body.presion_sistolica ?? body.presionSistolica ?? null,
      presion_diastolica: body.presion_diastolica ?? body.presionDiastolica ?? null,
      estado_conciencia: body.estado_conciencia ?? body.estadoConciencia ?? null,

      prueba_embarazo_realizada: body.prueba_embarazo_realizada ?? body.pruebaEmbarazoRealizada ?? null,
      resultado_prueba_embarazo: body.resultado_prueba_embarazo ?? body.resultadoPruebaEmbarazo ?? null,

      hallazgos_exploracion: body.hallazgos_exploracion ?? body.hallazgosExploracion ?? null,
      tiene_eco_transabdominal: body.tiene_eco_transabdominal ?? body.tieneEcoTransabdominal ?? null,
      resultado_eco_transabdominal: body.resultado_eco_transabdominal ?? body.resultadoEcoTransabdominal ?? null,

      sintomas_seleccionados: body.sintomas_seleccionados ?? body.sintomasSeleccionados ?? [],
      factores_seleccionados: body.factores_seleccionados ?? body.factoresSeleccionados ?? [],

      tvus: body.tvus ?? null,
      hcg_valor: body.hcg_valor ?? body.hcgValor ?? null,
      variacion_hcg: body.variacion_hcg ?? body.variacionHcg ?? null,
      hcg_anterior: body.hcg_anterior ?? body.hcgAnterior ?? null,

      resultado: body.resultado ?? null,

      // Si desde el front mandas cierres tempranos:
      es_finalizado: body.es_finalizado ?? false,
      motivo_finalizacion: body.motivo_finalizacion ?? null,
    };

    const { data, error } = await supabase
      .from("consultas")
      .insert([payload])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
