import { describe, expect, it } from "vitest";
import {
  buildPreConsultationNotesRecord,
  normalizePreConsultation,
  parsePreConsultationNotes,
  stringifyPreConsultationNotes,
} from "@/lib/preConsultation";

describe("preConsultation", () => {
  it("normalizes only known text fields and trims values", () => {
    expect(
      normalizePreConsultation({
        birthDate: " 1990-02-10 ",
        goal: " emagrecimento ",
        rotina: "  Turnos alternados  ",
        observacoes: "   ",
        city: " Salvador ",
      }),
    ).toEqual({
      birthDate: "1990-02-10",
      goal: "emagrecimento",
      rotina: "Turnos alternados",
      city: "Salvador",
    });
  });

  it("parses existing notes safely, including legacy _city", () => {
    expect(
      parsePreConsultationNotes(
        JSON.stringify({
          birthDate: "1995-05-01",
          sex: "feminino",
          allergies: " amendoim ",
          hadNutritionist: "sim",
          rotina: "trabalho noturno",
          obs: "prefere mensagem no WhatsApp",
          city: "  ",
          _city: "Alagoinhas",
          extra: "ignorar",
        }),
      ),
    ).toEqual({
      birthDate: "1995-05-01",
      sex: "feminino",
      allergies: "amendoim",
      hadNutritionist: "sim",
      rotina: "trabalho noturno",
      observacoes: "prefere mensagem no WhatsApp",
      city: "Alagoinhas",
    });

    expect(parsePreConsultationNotes("not-json")).toEqual({});
    expect(parsePreConsultationNotes(JSON.stringify(["not", "an", "object"]))).toEqual({});
  });

  it("builds and stringifies canonical notes preserving unrelated base data", () => {
    const base = JSON.stringify({
      city: "Cidade antiga",
      _city: "Legado",
      coupon: "PROMO10",
      internalFlag: true,
      symptoms: "legacy-key",
    });

    const merged = buildPreConsultationNotesRecord(
      {
        goal: " hipertrofia ",
        sintomas: " fadiga e inchaco ",
        suplementacao: " creatina ",
        city: "Salvador",
        observacoes: "",
      },
      base,
    );

    expect(merged).toEqual({
      coupon: "PROMO10",
      internalFlag: true,
      symptoms: "legacy-key",
      goal: "hipertrofia",
      sintomas: "fadiga e inchaco",
      suplementacao: "creatina",
      city: "Salvador",
    });

    expect(JSON.parse(stringifyPreConsultationNotes({ historicoNutri: "ja fez acompanhamento" }, merged) || "null")).toEqual({
      coupon: "PROMO10",
      internalFlag: true,
      symptoms: "legacy-key",
      goal: "hipertrofia",
      sintomas: "fadiga e inchaco",
      suplementacao: "creatina",
      city: "Salvador",
      historicoNutri: "ja fez acompanhamento",
    });
  });

  it("returns null when there is no structured content to persist", () => {
    expect(stringifyPreConsultationNotes()).toBeNull();
    expect(stringifyPreConsultationNotes({ city: "   " })).toBeNull();
  });
});
