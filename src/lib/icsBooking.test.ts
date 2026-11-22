import { describe, it, expect } from "vitest";
import { buildICS, formatICSLocal, googleCalendarUrl, type CalendarEventInput } from "./icsBooking";

const ev: CalendarEventInput = {
  title: "Consulta — Dr. Fillipe",
  description: "Agendamento confirmado.",
  start: new Date(2026, 10, 30, 14, 0, 0),
  durationMin: 60,
};

describe("formatICSLocal", () => {
  it("formata horário local flutuante sem Z", () => {
    expect(formatICSLocal(new Date(2026, 10, 30, 14, 0, 0))).toBe("20261130T140000");
  });
});

describe("buildICS", () => {
  const ics = buildICS(ev);

  it("contém VCALENDAR e VEVENT", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("contém DTSTART e DTEND corretos (start + durationMin)", () => {
    expect(ics).toContain("DTSTART:20261130T140000");
    expect(ics).toContain("DTEND:20261130T150000");
  });

  it("contém SUMMARY com o título e DESCRIPTION", () => {
    expect(ics).toContain("SUMMARY:Consulta — Dr. Fillipe");
    expect(ics).toContain("DESCRIPTION:Agendamento confirmado.");
  });

  it("usa CRLF como separador de linhas", () => {
    expect(ics).toContain("\r\n");
    const withoutCrlf = ics.replace(/\r\n/g, "");
    expect(withoutCrlf).not.toContain("\n");
  });

  it("escapa vírgula e ponto e vírgula no texto", () => {
    const escaped = buildICS({ ...ev, title: "Consulta, retorno; ok" });
    expect(escaped).toContain("SUMMARY:Consulta\\, retorno\\; ok");
  });

  it("usa UID fornecido quando informado", () => {
    expect(buildICS({ ...ev, uid: "abc-123" })).toContain("UID:abc-123");
  });
});

describe("googleCalendarUrl", () => {
  const url = googleCalendarUrl(ev);
  const parsed = new URL(url);

  it("aponta para calendar.google.com com action=TEMPLATE", () => {
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("action=TEMPLATE");
    expect(parsed.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("contém dates=START/END (decodificado)", () => {
    expect(parsed.searchParams.get("dates")).toBe("20261130T140000/20261130T150000");
    expect(url).toContain("dates=20261130T140000%2F20261130T150000");
  });

  it("contém título e detalhes encodados", () => {
    expect(parsed.searchParams.get("text")).toBe("Consulta — Dr. Fillipe");
    expect(parsed.searchParams.get("details")).toBe("Agendamento confirmado.");
  });
});
