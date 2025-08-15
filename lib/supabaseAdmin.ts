// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

// Preferimos la service role key para evitar políticas RLS en el backend.
// Si no existe, caemos al anon (requiere tu política permisiva).
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Faltan variables de entorno de Supabase (URL o KEY).')
}

export const sb = createClient(url, key, { auth: { persistSession: false } })
