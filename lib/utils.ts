import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizaId(id: string): number {
  // Extrae la parte numérica del ID formato "ID-00098"
  if (typeof id === "string" && id.startsWith("ID-")) {
    return Number.parseInt(id.replace("ID-", ""), 10)
  }
  // Si ya es un número, lo devuelve tal como está
  if (typeof id === "number") {
    return id
  }
  // Si es un string numérico, lo convierte
  const numericId = Number.parseInt(id, 10)
  if (!isNaN(numericId)) {
    return numericId
  }
  throw new Error(`Invalid ID format: ${id}`)
}
