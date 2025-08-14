// app/api/consultas/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { data, error } = await supabaseAdmin
      .from('consultas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const patch: Record<string, any> = { ...body };
    delete patch.id; // no cambiar PK

    // Normaliza arrays para jsonb
    if (patch.sintomas_seleccionados && !Array.isArray(patch.sintomas_seleccionados)) {
      patch.sintomas_seleccionados = [];
    }
    if (patch.factores_seleccionados && !Array.isArray(patch.factores_seleccionados)) {
      patch.factores_seleccionados = [];
    }

    const { data, error } = await supabaseAdmin
      .from('consultas')
      .update(patch)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { error } = await supabaseAdmin.from('consultas').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
