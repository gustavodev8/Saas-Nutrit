import { describe, expect, it } from "vitest";

import type { Patient } from "@/lib/supabase";
import { buildPatientOnboarding, onboardingProgress } from "@/lib/patientOnboarding";

const makePatient = (overrides: Partial<Patient> = {}): Patient => ({
  id: 42,
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "75999990000",
  birth_date: "1990-04-15",
  gender: "F",
  occupation: "Nutricionista",
  city: "Alagoinhas",
  cpf: "12345678900",
  notes: "Paciente em acompanhamento.",
  report_text: "Relatorio inicial.",
  created_at: "2026-08-01T10:00:00.000Z",
  ...overrides,
});

describe("patientOnboarding", () => {
  it("monta checklist completo com flags variadas", () => {
    const items = buildPatientOnboarding({
      patient: makePatient(),
      hasNextBooking: true,
      hasMeasurement: false,
      hasActivePlan: true,
      hasExamRequest: false,
      hasReport: true,
    });

    expect(items).toHaveLength(9);
    expect(items.map((item) => [item.key, item.completed])).toEqual([
      ["identity", true],
      ["contact", true],
      ["birthDate", true],
      ["clinicalNotes", true],
      ["booking", true],
      ["measurement", false],
      ["mealPlan", true],
      ["exams", false],
      ["report", true],
    ]);

    expect(items.find((item) => item.key === "booking")).toMatchObject({
      actionLabel: "Agendar retorno",
      route: "/admin/agendamentos?new=return&patientId=42",
    });
    expect(items.find((item) => item.key === "measurement")).toMatchObject({
      actionLabel: "Registrar medidas",
      tab: "antropometria",
    });
  });

  it("calcula onboardingProgress com total, concluidos e percentual", () => {
    const items = buildPatientOnboarding({
      patient: makePatient(),
      hasNextBooking: true,
      hasMeasurement: true,
      hasActivePlan: false,
      hasExamRequest: false,
      hasReport: false,
    });

    expect(onboardingProgress(items)).toEqual({
      completed: 6,
      total: 9,
      percent: 67,
    });
  });

  it("gera pendencias esperadas com labels, rotas e tabs estaveis para paciente incompleto", () => {
    const items = buildPatientOnboarding({
      patient: makePatient({
        id: undefined,
        email: "   ",
        phone: undefined,
        birth_date: undefined,
        gender: undefined,
        occupation: " ",
        city: undefined,
        cpf: "",
        notes: " ",
      }),
      hasNextBooking: false,
      hasMeasurement: false,
      hasActivePlan: false,
      hasExamRequest: false,
      hasReport: false,
    });

    const pendingItems = items.filter((item) => !item.completed);
    expect(pendingItems.map((item) => item.key)).toEqual([
      "identity",
      "contact",
      "birthDate",
      "clinicalNotes",
      "booking",
      "measurement",
      "mealPlan",
      "exams",
      "report",
    ]);

    expect(items.find((item) => item.key === "identity")).toMatchObject({
      label: "Identificacao basica",
      actionLabel: "Completar perfil",
      tab: "perfil",
    });
    expect(items.find((item) => item.key === "contact")).toMatchObject({
      label: "Contato validado",
      actionLabel: "Atualizar contato",
      tab: "perfil",
    });
    expect(items.find((item) => item.key === "birthDate")).toMatchObject({
      label: "Dados pessoais",
      actionLabel: "Revisar dados",
      tab: "perfil",
    });
    expect(items.find((item) => item.key === "booking")).toMatchObject({
      label: "Proxima consulta",
      route: "/admin/agendamentos",
    });
    expect(items.find((item) => item.key === "mealPlan")).toMatchObject({
      label: "Plano alimentar ativo",
      tab: "planos",
    });
    expect(items.find((item) => item.key === "exams")).toMatchObject({
      label: "Exames solicitados",
      tab: "protocolos",
    });
    expect(items.find((item) => item.key === "report")).toMatchObject({
      label: "Evolucao registrada",
      tab: "relatorio",
    });
  });
});
