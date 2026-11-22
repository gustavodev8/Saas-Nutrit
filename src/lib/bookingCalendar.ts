import { toISODate } from "./bookingDates";

export interface CalendarDay {
  date: Date;
  iso: string; // "YYYY-MM-DD"
  inMonth: boolean; // false para células de preenchimento (dias de outro mês)
  selectable: boolean;
}

export interface MonthGridParams {
  year: number;
  month: number; // 0-based (0 = Janeiro)
  activeDows: Set<number>; // dias da semana com disponibilidade (0=Dom..6=Sáb)
  blocked: Set<string>; // ISOs bloqueados
  minDate: Date; // menor data selecionável (inclusive) — normalmente hoje 00:00
  maxDate: Date; // maior data selecionável (inclusive)
}

const GRID_SIZE = 42; // 6 semanas x 7 dias

/** Zera horas, minutos, segundos e ms — comparação por dia local. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Retorna exatamente 42 células (6 semanas), começando no DOMINGO. */
export function buildMonthGrid(p: MonthGridParams): CalendarDay[] {
  const minDay = startOfDay(p.minDate).getTime();
  const maxDay = startOfDay(p.maxDate).getTime();
  const firstOfMonth = new Date(p.year, p.month, 1);
  const leading = firstOfMonth.getDay(); // dias do mês anterior antes do dia 1
  const gridStart = new Date(p.year, p.month, 1 - leading);

  const cells: CalendarDay[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const inMonth = date.getMonth() === p.month && date.getFullYear() === p.year;
    const iso = toISODate(date);
    const t = startOfDay(date).getTime();
    const selectable =
      inMonth &&
      p.activeDows.has(date.getDay()) &&
      !p.blocked.has(iso) &&
      t >= minDay &&
      t <= maxDay;
    cells.push({ date, iso, inMonth, selectable });
  }
  return cells;
}

/**
 * True se existe algum dia selecionável em meses ANTERIORES ao (year,month) dentro de [minDate,...].
 * Basta o último dia do mês anterior ser >= minDate.
 */
export function canGoPrevMonth(year: number, month: number, minDate: Date): boolean {
  const prevLast = new Date(year, month, 0); // último dia do mês anterior
  return startOfDay(prevLast).getTime() >= startOfDay(minDate).getTime();
}

/**
 * True se existe algum dia selecionável em meses POSTERIORES ao (year,month) dentro de [..., maxDate].
 * Basta o primeiro dia do mês seguinte ser <= maxDate.
 */
export function canGoNextMonth(year: number, month: number, maxDate: Date): boolean {
  const nextFirst = new Date(year, month + 1, 1);
  return startOfDay(nextFirst).getTime() <= startOfDay(maxDate).getTime();
}

// Primeira data (ISO "YYYY-MM-DD") em [fromDate, maxDate] cujo dia-da-semana está em activeDows
// e não está em blocked. Retorna null se não houver. Comparação por dia (horas zeradas).
export function findNextAvailableDate(
  fromDate: Date,
  maxDate: Date,
  activeDows: Set<number>,
  blocked: Set<string>,
): string | null {
  const endTime = startOfDay(maxDate).getTime();
  const start = startOfDay(fromDate);
  for (let i = 0; ; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (date.getTime() > endTime) return null;
    const iso = toISODate(date);
    if (activeDows.has(date.getDay()) && !blocked.has(iso)) return iso;
  }
}
