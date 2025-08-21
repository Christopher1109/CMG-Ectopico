import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))

// --- añade esto en lib/utils.ts ---
export function normalizaId(param: string | number): number {
  if (typeof param === "number") return param;
  const limpio = String(param).trim();

  // "98" -> 98
  if (/^\d+$/.test(limpio)) return Number(limpio);

  // "ID-00098" -> 98
  const m = limpio.match(/^ID-0*(\d+)$/i);
  if (m) return Number(m[1]);

  throw new Error(`ID de consulta inválido: ${param}`);
}
