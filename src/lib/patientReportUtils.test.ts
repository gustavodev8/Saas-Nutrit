import { describe, expect, it } from "vitest";

import type { PatientReport } from "@/lib/supabase";
import {
  appendReportSnippet,
  filterPatientReports,
  getEstimatedReadMinutes,
  getReportEditorMeta,
  getReportWordCount,
} from "@/lib/patientReportUtils";

const makeReport = (overrides: Partial<PatientReport>): PatientReport => ({
  patient_id: 1,
  title: "Relatório",
  report_date: "2026-08-05",
  report_text: "Paciente com boa evolução",
  ...overrides,
});

describe("patientReportUtils", () => {
  it("appends snippet without keeping trailing whitespace", () => {
    expect(appendReportSnippet("Linha inicial   \n", "Novo bloco")).toBe(
      "Linha inicial\n\nNovo bloco",
    );
  });

  it("returns snippet directly when report is empty", () => {
    expect(appendReportSnippet("   ", "Estrutura")).toBe("Estrutura");
  });

  it("filters and sorts reports by query and recency", () => {
    const reports = [
      makeReport({
        id: 1,
        title: "Primeira evolução",
        report_date: "2026-08-01",
      }),
      makeReport({
        id: 2,
        title: "Retorno com foco intestinal",
        report_date: "2026-08-03",
      }),
      makeReport({
        id: 3,
        title: "Outro caso",
        report_date: "2026-07-29",
      }),
    ];

    const filtered = filterPatientReports(reports, "intestinal", "recent");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(2);
  });

  it("computes dirty and unsaved state for a new edited draft", () => {
    const meta = getReportEditorMeta({
      draft: {
        title: "Evolução clínica — 05 de ago.",
        report_date: "2026-08-05",
        report_text: "Texto preenchido",
      },
      lastSavedSignature: "",
      saving: false,
      today: "2026-08-05",
    });

    expect(meta.isDirty).toBe(true);
    expect(meta.hasDraftChangesBeyondDefault).toBe(true);
    expect(meta.saveStatus).toBe("unsaved");
  });

  it("computes saved state for a persisted unchanged draft", () => {
    const draft = {
      id: 7,
      title: "Evolução clínica — 05/08/2026",
      report_date: "2026-08-05",
      report_text: "Tudo salvo",
    };
    const meta = getReportEditorMeta({
      draft,
      lastSavedSignature: JSON.stringify(draft),
      saving: false,
      today: "2026-08-05",
    });

    expect(meta.isDirty).toBe(false);
    expect(meta.saveStatus).toBe("saved");
  });

  it("counts words and estimates reading time", () => {
    expect(getReportWordCount("um dois três")).toBe(3);
    expect(getEstimatedReadMinutes(3)).toBe(1);
    expect(getEstimatedReadMinutes(540)).toBe(3);
  });
});
