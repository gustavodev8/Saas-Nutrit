/**
 * Utilitários de data para agendamento, sempre baseados em componentes LOCAIS
 * (nunca toISOString, que converte para UTC e pode deslocar o dia).
 */

/** Formata uma Date como "YYYY-MM-DD" usando o dia local. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Converte "YYYY-MM-DD" em Date local ao meio-dia (evita problemas de DST/fuso). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** True se a data "YYYY-MM-DD" é anterior ao dia de hoje (comparação por dia local). */
export function isPastDate(s: string, now?: Date): boolean {
  const today = toISODate(now ?? new Date());
  return s < today;
}
