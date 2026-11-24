export type AdherenceStatus = "none" | "under" | "on" | "over";

export interface Adherence {
  pct: number; // 0..100 (clampado) — largura da barra
  rawPct: number; // atual/meta*100 sem clamp (pode passar de 100)
  status: AdherenceStatus;
}

const NONE: Adherence = { pct: 0, rawPct: 0, status: "none" };

/**
 * Aderência de um valor atual a uma meta.
 * - target <= 0 (ou não finito) => status "none" (sem barra).
 * - rawPct < 90  => "under"; 90..110 => "on"; > 110 => "over".
 * - pct = clamp(rawPct, 0, 100).
 */
export function mealAdherence(actual: number, target: number | undefined | null): Adherence {
  if (target == null || !Number.isFinite(target) || target <= 0) return NONE;

  const safeActual = Number.isFinite(actual) ? actual : 0;
  // Multiplicar antes de dividir evita erros de ponto flutuante nas bordas (ex.: 110% => 110).
  const rawPct = (safeActual * 100) / target;

  let status: AdherenceStatus;
  if (rawPct < 90) status = "under";
  else if (rawPct <= 110) status = "on";
  else status = "over";

  const pct = Math.min(100, Math.max(0, rawPct));
  return { pct, rawPct, status };
}
