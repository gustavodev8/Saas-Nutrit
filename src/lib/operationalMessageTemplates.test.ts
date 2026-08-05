import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_MESSAGE_TEMPLATE_KEYS,
  buildOperationalMessageVariables,
  getOperationalMessageTemplate,
  listOperationalMessageTemplates,
  renderOperationalMessage,
} from "@/lib/operationalMessageTemplates";

describe("operationalMessageTemplates", () => {
  it("exposes the expected operational templates", () => {
    expect(listOperationalMessageTemplates().map((template) => template.key)).toEqual(
      [...OPERATIONAL_MESSAGE_TEMPLATE_KEYS],
    );
    expect(getOperationalMessageTemplate("confirmacao").title).toBe(
      "Confirmacao de consulta",
    );
  });

  it("builds variables from booking and patient context", () => {
    const variables = buildOperationalMessageVariables({
      professionalName: "Dra. Helena",
      booking: {
        client_name: "Maria Souza",
        appointment_date: "2026-08-05",
        appointment_time: "09:30:00",
        plan_name: "Consulta inicial",
        type: "online",
      },
    });

    expect(variables).toMatchObject({
      patient_name: "Maria Souza",
      patient_first_name: "Maria",
      professional_name: "Dra. Helena",
      appointment_date: "05/08/2026",
      appointment_time: "09:30",
      appointment_datetime: "05/08/2026 as 09:30",
      booking_summary: "05/08/2026 as 09:30 (online)",
      plan_name: "Consulta inicial",
      consultation_type: "(online)",
    });
  });

  it("renders confirmation message with interpolated scheduling data", () => {
    const message = renderOperationalMessage("confirmacao", {
      professionalName: "Dra. Helena",
      booking: {
        client_name: "Maria Souza",
        appointment_date: "2026-08-05",
        appointment_time: "09:30:00",
        plan_name: "Consulta inicial",
        type: "presencial",
      },
    });

    expect(message).toContain("Oi Maria!");
    expect(message).toContain("Consulta inicial");
    expect(message).toContain("05/08/2026 as 09:30 (presencial)");
    expect(message).toContain("Dra. Helena");
    expect(message).not.toContain("{{");
  });

  it("allows custom variables for exam and follow-up scenarios", () => {
    const examMessage = renderOperationalMessage("exame_pendente", {
      patientName: "Carlos Eduardo",
      customVariables: {
        exam_name: "o hemograma e a ferritina",
      },
    });
    const postConsultMessage = renderOperationalMessage("pos_consulta", {
      patientName: "Carlos Eduardo",
      customVariables: {
        follow_up_channel: "por aqui ou pelo WhatsApp",
      },
    });

    expect(examMessage).toContain("Oi Carlos!");
    expect(examMessage).toContain("o hemograma e a ferritina");
    expect(postConsultMessage).toContain("por aqui ou pelo WhatsApp");
  });

  it("uses sane defaults when optional details are missing", () => {
    const message = renderOperationalMessage("lembrete_retorno", {
      patientName: "Ana Paula",
    });

    expect(message).toContain("Oi Ana!");
    expect(message).toContain("os proximos dias");
    expect(message).toContain("Dr. Fillipe");
  });
});
