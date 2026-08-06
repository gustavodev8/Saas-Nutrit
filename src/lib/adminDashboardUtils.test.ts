import { describe, expect, it } from "vitest";
import type { Booking, Patient, PatientOperationalIndicators } from "@/lib/supabase";
import {
  buildAdminDashboardData,
  buildAdminOperationalDashboardData,
  isActiveBooking,
  parseBookingDateTime,
} from "@/lib/adminDashboardUtils";

const booking = (overrides: Partial<Booking>): Booking => ({
  booking_group_id: "group-1",
  session_number: 1,
  total_sessions: 1,
  client_name: "Maria Souza",
  client_email: "maria@example.com",
  client_phone: "75999999999",
  plan_name: "Consulta inicial",
  plan_index: 0,
  appointment_date: "2026-08-03",
  appointment_time: "09:00",
  type: "online",
  status: "confirmed",
  payment_status: "paid",
  ...overrides,
});

const patient = (id: number, createdAt: string, overrides: Partial<Patient> = {}): Patient => ({
  id,
  name: `Paciente ${id}`,
  email: `paciente${id}@example.com`,
  phone: "75999999999",
  birth_date: "1990-01-10",
  cpf: `0000000000${id}`.slice(-11),
  city: "Alagoinhas",
  gender: "F",
  occupation: "Professora",
  created_at: createdAt,
  ...overrides,
});

const indicators = (
  overrides: Partial<PatientOperationalIndicators> = {},
): PatientOperationalIndicators => ({
  withoutNextBookingIds: [],
  withoutActiveMealPlanIds: [],
  pendingExamRequestPatientIds: [],
  lastInteractionDates: {},
  nextBookingDates: {},
  nextReturnDates: {},
  ...overrides,
});

describe("adminDashboardUtils", () => {
  it("keeps only operational active bookings in dashboard cards", () => {
    const now = new Date("2026-08-03T08:00:00");
    const data = buildAdminDashboardData(
      [
        booking({ id: 1, appointment_time: "10:00", payment_status: "pending" }),
        booking({ id: 2, appointment_time: "08:30", payment_status: "paid" }),
        booking({ id: 3, status: "cancelled", appointment_time: "11:00" }),
        booking({ id: 4, status: "no_show", appointment_time: "12:00" }),
        booking({
          id: 5,
          status: "completed",
          appointment_date: "2026-08-01",
          payment_status: "pending",
        }),
      ],
      [],
      now,
    );

    expect(data.todayBookings.map((item) => item.id)).toEqual([2, 1]);
    expect(data.pendingPayments.map((item) => item.id)).toEqual([1]);
    expect(data.completedThisMonth.map((item) => item.id)).toEqual([5]);
  });

  it("sorts upcoming bookings and recent patients for daily operation", () => {
    const now = new Date("2026-08-03T08:00:00");
    const data = buildAdminDashboardData(
      [
        booking({ id: 1, appointment_date: "2026-08-04", appointment_time: "14:00" }),
        booking({ id: 2, appointment_date: "2026-08-03", appointment_time: "09:00" }),
        booking({ id: 3, appointment_date: "2026-08-02", appointment_time: "09:00" }),
      ],
      [
        patient(1, "2026-08-01T10:00:00"),
        patient(2, "2026-08-03T10:00:00"),
        patient(3, "2026-07-31T10:00:00"),
        patient(4, "2026-08-02T10:00:00"),
        patient(5, "2026-07-30T10:00:00"),
        patient(6, "2026-07-29T10:00:00"),
      ],
      now,
    );

    expect(data.nextBookings.map((item) => item.id)).toEqual([2, 1]);
    expect(data.recentPatients.map((item) => item.id)).toEqual([2, 4, 1, 3, 5]);
  });

  it("parses date/time and classifies inactive statuses", () => {
    const parsed = parseBookingDateTime(
      booking({ appointment_date: "2026-08-04", appointment_time: "" }),
    );
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(4);
    expect(parsed.getHours()).toBe(0);
    expect(isActiveBooking(booking({ status: "confirmed" }))).toBe(true);
    expect(isActiveBooking(booking({ status: "cancelled" }))).toBe(false);
    expect(isActiveBooking(booking({ status: "no_show" }))).toBe(false);
  });

  it("builds operational card counts from patient indicators and segments", () => {
    const now = new Date("2026-08-05T09:00:00");
    const data = buildAdminOperationalDashboardData(
      [
        patient(1, "2026-07-20T10:00:00"),
        patient(2, "2026-07-25T10:00:00"),
        patient(3, "2026-07-28T10:00:00"),
        patient(4, "2026-07-29T10:00:00"),
        patient(5, "2026-07-30T10:00:00", { phone: "", city: "" }),
        patient(6, "2026-06-10T10:00:00"),
      ],
      indicators({
        withoutNextBookingIds: [1, 2],
        withoutActiveMealPlanIds: [3],
        pendingExamRequestPatientIds: [4],
        lastInteractionDates: {
          1: "2026-08-01",
          2: "2026-08-04",
          3: "2026-08-02",
          4: "2026-08-02",
          5: "2026-08-02",
          6: "2026-06-20",
        },
        nextBookingDates: {
          3: "2026-08-10",
          4: "2026-08-11",
          5: "2026-08-12",
          6: "2026-08-15",
        },
        nextReturnDates: {
          1: "2026-08-03",
        },
      }),
      now,
    );

    expect(data.counts).toEqual({
      overdueReturns: 1,
      inactivePatients: 1,
      withoutPlan: 1,
      pendingExams: 1,
    });
  });

  it("orders the operational queue by actionable priority", () => {
    const now = new Date("2026-08-05T09:00:00");
    const data = buildAdminOperationalDashboardData(
      [
        patient(1, "2026-07-20T10:00:00"),
        patient(2, "2026-07-25T10:00:00"),
        patient(3, "2026-07-28T10:00:00"),
        patient(4, "2026-07-29T10:00:00"),
        patient(5, "2026-07-30T10:00:00", { phone: "", city: "" }),
        patient(6, "2026-06-10T10:00:00"),
      ],
      indicators({
        withoutNextBookingIds: [1, 2],
        withoutActiveMealPlanIds: [3],
        pendingExamRequestPatientIds: [4],
        lastInteractionDates: {
          1: "2026-08-01",
          2: "2026-08-04",
          3: "2026-08-02",
          4: "2026-08-02",
          5: "2026-08-02",
          6: "2026-06-20",
        },
        nextBookingDates: {
          3: "2026-08-10",
          4: "2026-08-11",
          5: "2026-08-12",
          6: "2026-08-15",
        },
        nextReturnDates: {
          1: "2026-08-03",
        },
      }),
      now,
    );

    expect(
      data.items.map((item) => ({
        patientId: item.patientId,
        segment: item.segment,
        priority: item.priority,
      })),
    ).toEqual([
      { patientId: 1, segment: "retorno_vencido", priority: 10 },
      { patientId: 2, segment: "sem_proximo_agendamento", priority: 20 },
      { patientId: 3, segment: "sem_plano_ativo", priority: 30 },
      { patientId: 4, segment: "exames_pendentes", priority: 40 },
      { patientId: 5, segment: "cadastro_incompleto", priority: 50 },
      { patientId: 6, segment: "inativo_30d", priority: 60 },
    ]);
  });

  it("returns the expected action routes for each operational item", () => {
    const now = new Date("2026-08-05T09:00:00");
    const data = buildAdminOperationalDashboardData(
      [
        patient(1, "2026-07-20T10:00:00"),
        patient(2, "2026-07-25T10:00:00"),
        patient(3, "2026-07-28T10:00:00"),
        patient(4, "2026-07-29T10:00:00"),
        patient(5, "2026-07-30T10:00:00", { phone: "", city: "" }),
        patient(6, "2026-06-10T10:00:00"),
      ],
      indicators({
        withoutNextBookingIds: [1, 2],
        withoutActiveMealPlanIds: [3],
        pendingExamRequestPatientIds: [4],
        lastInteractionDates: {
          1: "2026-08-01",
          2: "2026-08-04",
          3: "2026-08-02",
          4: "2026-08-02",
          5: "2026-08-02",
          6: "2026-06-20",
        },
        nextBookingDates: {
          3: "2026-08-10",
          4: "2026-08-11",
          5: "2026-08-12",
          6: "2026-08-15",
        },
        nextReturnDates: {
          1: "2026-08-03",
        },
      }),
      now,
    );

    expect(data.items.map((item) => [item.segment, item.route, item.actionLabel])).toEqual([
      ["retorno_vencido", "/admin/agendamentos?new=return&patientId=1", "Agendar retorno"],
      ["sem_proximo_agendamento", "/admin/agendamentos?new=return&patientId=2", "Agendar consulta"],
      ["sem_plano_ativo", "/admin/pacientes/3?tab=planos", "Criar plano"],
      ["exames_pendentes", "/admin/pacientes/4?tab=protocolos", "Abrir exames"],
      ["cadastro_incompleto", "/admin/pacientes/5?tab=perfil", "Completar cadastro"],
      ["inativo_30d", "/admin/pacientes/6?tab=central", "Abrir prontuário"],
    ]);
  });
});
