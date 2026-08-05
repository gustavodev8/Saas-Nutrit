import {
  derivePatientSegments,
  getMissingPatientProfileFields,
  isReturnOverdue,
  PATIENT_SEGMENT_LABELS,
  resolvePatientOperationalFlags,
} from "@/lib/patientSegments";
import type { Patient, PatientOperationalIndicators } from "@/lib/supabase";

describe("patientSegments", () => {
  const now = "2026-08-05T12:00:00";

  const completePatient: Patient = {
    id: 7,
    name: "Maria Oliveira",
    email: "maria@example.com",
    phone: "(75) 99999-0000",
    birth_date: "1990-03-10",
    cpf: "123.456.789-00",
    city: "Alagoinhas",
    gender: "F",
    occupation: "Nutricionista",
    created_at: "2026-06-01T10:00:00",
  };

  it("resolves operational flags from aggregate indicator ids", () => {
    const indicators: PatientOperationalIndicators = {
      withoutNextBookingIds: [7, 12],
      withoutActiveMealPlanIds: [12],
      pendingExamRequestPatientIds: [7],
      lastInteractionDates: {},
      nextBookingDates: {},
      nextReturnDates: {},
    };

    expect(resolvePatientOperationalFlags(7, indicators)).toEqual({
      hasNextBooking: false,
      hasActiveMealPlan: true,
      hasPendingExams: true,
    });
  });

  it("detects missing profile fields for incomplete registrations", () => {
    expect(
      getMissingPatientProfileFields({
        ...completePatient,
        phone: " ",
        occupation: undefined,
      }),
    ).toEqual(["phone", "occupation"]);
  });

  it("derives operational and inactivity segments from patient context", () => {
    expect(
      derivePatientSegments({
        patient: {
          ...completePatient,
          email: "",
          created_at: "2026-04-20T09:00:00",
        },
        operationalFlags: {
          hasNextBooking: false,
          hasActiveMealPlan: false,
          hasPendingExams: true,
        },
        lastInteraction: {
          lastInteractionAt: "2026-04-20T09:00:00",
          nextReturnDate: "2026-08-01",
        },
        now,
      }),
    ).toEqual([
      "sem_proximo_agendamento",
      "sem_plano_ativo",
      "exames_pendentes",
      "cadastro_incompleto",
      "inativo_30d",
      "inativo_60d",
      "inativo_90d",
      "retorno_vencido",
    ]);
  });

  it("marks return overdue only when the target date passed and there is no next booking", () => {
    expect(
      isReturnOverdue(
        {
          nextReturnDate: "2026-08-01",
        },
        {
          hasNextBooking: false,
        },
        now,
      ),
    ).toBe(true);

    expect(
      isReturnOverdue(
        {
          nextReturnDate: "2026-08-01",
        },
        {
          hasNextBooking: true,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isReturnOverdue(
        {
          nextReturnDate: "2026-08-01",
          nextBookingDate: "2026-08-10",
        },
        {
          hasNextBooking: false,
        },
        now,
      ),
    ).toBe(false);
  });

  it("exposes stable labels for the new segment keys", () => {
    expect(PATIENT_SEGMENT_LABELS.retorno_vencido).toBe("Retorno vencido");
    expect(PATIENT_SEGMENT_LABELS.inativo_90d).toBe("Inativo ha 90 dias");
  });
});
