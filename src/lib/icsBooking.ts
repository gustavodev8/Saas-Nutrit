/**
 * Utilitários puros para "Adicionar ao calendário" na confirmação de agendamento.
 * Sem DOM e sem dependências externas.
 */

export interface CalendarEventInput {
  title: string;
  description?: string;
  start: Date; // horário local de início
  durationMin: number;
  uid?: string;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Formata um Date como horário LOCAL flutuante "YYYYMMDDTHHMMSS" (sem Z, sem timezone). */
export function formatICSLocal(d: Date): string {
  const y = String(d.getFullYear()).padStart(4, "0");
  return `${y}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

/** Escapa texto conforme RFC 5545 (barra invertida, ponto e vírgula, vírgula e quebras de linha). */
function escapeICSText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function computeEnd(ev: CalendarEventInput): Date {
  return new Date(ev.start.getTime() + ev.durationMin * 60000);
}

/** Gera o conteúdo de um arquivo .ics (VCALENDAR/VEVENT) com linhas em CRLF. */
export function buildICS(ev: CalendarEventInput): string {
  const startStr = formatICSLocal(ev.start);
  const endStr = formatICSLocal(computeEnd(ev));
  const uid = ev.uid ?? `${startStr}-${ev.title.replace(/[^A-Za-z0-9]+/g, "-")}@nutri-booking`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nutri Booking//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeICSText(uid)}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapeICSText(ev.title)}`,
  ];
  if (ev.description) {
    lines.push(`DESCRIPTION:${escapeICSText(ev.description)}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** URL do Google Agenda (action=TEMPLATE) com título, datas locais e detalhes. */
export function googleCalendarUrl(ev: CalendarEventInput): string {
  const dates = `${formatICSLocal(ev.start)}/${formatICSLocal(computeEnd(ev))}`;
  const params: Array<[string, string]> = [
    ["action", "TEMPLATE"],
    ["text", ev.title],
    ["dates", dates],
  ];
  if (ev.description) {
    params.push(["details", ev.description]);
  }
  const query = params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  return `https://calendar.google.com/calendar/render?${query}`;
}
