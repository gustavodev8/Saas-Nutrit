import {
  derivePatientSegments,
  getMissingPatientProfileFields,
  resolvePatientOperationalFlags,
  type PatientSegmentKey,
} from "@/lib/patientSegments";
import type { Booking, Patient, PatientOperationalIndicators } from "@/lib/supabase";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const formatShortDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

export const isActiveBooking = (booking: Booking) =>
  booking.status !== "cancelled" && booking.status !== "no_show";

export const parseBookingDateTime = (booking: Booking) =>
  new Date(`${booking.appointment_date}T${booking.appointment_time || "00:00"}`);

export interface AdminDashboardData {
  todayBookings: Booking[];
  nextBookings: Booking[];
  pendingPayments: Booking[];
  completedThisMonth: Booking[];
  recentPatients: Patient[];
}

export interface AdminDashboardOperationalCounts {
  overdueReturns: number;
  inactivePatients: number;
  withoutPlan: number;
  pendingExams: number;
}

export interface AdminDashboardOperationalItem {
  id: string;
  patientId: number;
  patientName: string;
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  tone: "danger" | "warning" | "info";
  segment: PatientSegmentKey;
  priority: number;
}

export interface AdminDashboardOperationalData {
  counts: AdminDashboardOperationalCounts;
  items: AdminDashboardOperationalItem[];
}

export function buildAdminDashboardData(
  bookings: Booking[],
  patients: Patient[],
  now = new Date(),
): AdminDashboardData {
  const today = now.toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const activeBookings = bookings.filter(isActiveBooking);
  const todayBookings = activeBookings
    .filter((booking) => booking.appointment_date === today)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

  const upcomingBookings = activeBookings
    .filter((booking) => parseBookingDateTime(booking) >= now)
    .sort((a, b) => parseBookingDateTime(a).getTime() - parseBookingDateTime(b).getTime());

  const pendingPayments = activeBookings.filter(
    (booking) => booking.payment_status === "pending" && booking.status !== "completed",
  );

  const completedThisMonth = activeBookings.filter(
    (booking) =>
      booking.status === "completed" && booking.appointment_date.slice(0, 7) === thisMonth,
  );

  const recentPatients = [...patients]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  return {
    todayBookings,
    nextBookings: upcomingBookings.slice(0, 5),
    pendingPayments,
    completedThisMonth,
    recentPatients,
  };
}

const formatOperationalDate = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.includes("T") ? value : `${value}T12:00:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

const PATIENT_FIELD_LABELS = {
  email: "e-mail",
  phone: "telefone",
  birth_date: "nascimento",
  cpf: "CPF",
  city: "cidade",
  gender: "gênero",
  occupation: "ocupação",
} as const;

const ACTIONABLE_SEGMENTS: PatientSegmentKey[] = [
  "retorno_vencido",
  "sem_proximo_agendamento",
  "sem_plano_ativo",
  "exames_pendentes",
  "cadastro_incompleto",
  "inativo_30d",
];

const SEGMENT_PRIORITY: Record<PatientSegmentKey, number> = {
  retorno_vencido: 10,
  sem_proximo_agendamento: 20,
  sem_plano_ativo: 30,
  exames_pendentes: 40,
  cadastro_incompleto: 50,
  inativo_30d: 60,
  inativo_60d: 61,
  inativo_90d: 62,
};

export function buildAdminOperationalDashboardData(
  patients: Patient[],
  indicators: PatientOperationalIndicators,
  now = new Date(),
): AdminDashboardOperationalData {
  const datedNow = now instanceof Date ? now : new Date(now);
  const items = patients
    .filter((patient): patient is Patient & { id: number } => typeof patient.id === "number")
    .map((patient) => {
      const segments = derivePatientSegments({
        patient,
        operationalFlags: resolvePatientOperationalFlags(patient.id, indicators),
        lastInteraction: {
          lastInteractionAt: indicators.lastInteractionDates[patient.id] ?? patient.created_at,
          nextBookingDate: indicators.nextBookingDates[patient.id],
          nextReturnDate: indicators.nextReturnDates[patient.id],
        },
        now: datedNow,
      });

      return { patient, segments };
    });

  const counts: AdminDashboardOperationalCounts = {
    overdueReturns: items.filter((entry) => entry.segments.includes("retorno_vencido")).length,
    inactivePatients: items.filter((entry) => entry.segments.includes("inativo_30d")).length,
    withoutPlan: items.filter((entry) => entry.segments.includes("sem_plano_ativo")).length,
    pendingExams: items.filter((entry) => entry.segments.includes("exames_pendentes")).length,
  };

  const focusItems = items
    .map(({ patient, segments }) => {
      const primarySegment = ACTIONABLE_SEGMENTS.find((segment) => segments.includes(segment));
      if (!primarySegment) return null;

      const lastInteraction = indicators.lastInteractionDates[patient.id] ?? patient.created_at;
      const nextReturnDate = indicators.nextReturnDates[patient.id];
      const missingFields = getMissingPatientProfileFields(patient)
        .slice(0, 3)
        .map((field) => PATIENT_FIELD_LABELS[field]);
      const inactiveDays = segments.includes("inativo_90d")
        ? 90
        : segments.includes("inativo_60d")
          ? 60
          : 30;

      const config: Record<
        typeof primarySegment,
        Pick<AdminDashboardOperationalItem, "title" | "actionLabel" | "route" | "tone"> & {
          description: string;
        }
      > = {
        retorno_vencido: {
          title: "Retorno vencido",
          actionLabel: "Agendar retorno",
          route: `/admin/agendamentos?new=return&patientId=${patient.id}`,
          tone: "danger",
          description: nextReturnDate
            ? `Retorno previsto para ${formatOperationalDate(nextReturnDate)} sem consulta futura.`
            : "A data prevista já passou e ainda não existe novo agendamento.",
        },
        sem_proximo_agendamento: {
          title: "Sem próxima consulta",
          actionLabel: "Agendar consulta",
          route: `/admin/agendamentos?new=return&patientId=${patient.id}`,
          tone: "warning",
          description: "Paciente sem consulta futura confirmada ou pendente.",
        },
        sem_plano_ativo: {
          title: "Sem plano ativo",
          actionLabel: "Criar plano",
          route: `/admin/pacientes/${patient.id}?tab=planos`,
          tone: "warning",
          description: "Não existe conduta alimentar vigente para o período atual.",
        },
        exames_pendentes: {
          title: "Exames pendentes",
          actionLabel: "Abrir exames",
          route: `/admin/pacientes/${patient.id}?tab=protocolos`,
          tone: "info",
          description: "Há solicitação de exames aguardando resultado ou revisão.",
        },
        cadastro_incompleto: {
          title: "Cadastro incompleto",
          actionLabel: "Completar cadastro",
          route: `/admin/pacientes/${patient.id}?tab=perfil`,
          tone: "info",
          description: missingFields.length > 0
            ? `Faltam: ${missingFields.join(", ")}.`
            : "Ainda faltam dados essenciais do cadastro clínico.",
        },
        inativo_30d: {
          title: `Paciente inativo há ${inactiveDays} dias`,
          actionLabel: "Abrir prontuário",
          route: `/admin/pacientes/${patient.id}?tab=central`,
          tone: "info",
          description: lastInteraction
            ? `Última interação registrada em ${formatOperationalDate(lastInteraction)}.`
            : "Sem interação recente registrada.",
        },
      };

      return {
        id: `${patient.id}-${primarySegment}`,
        patientId: patient.id,
        patientName: patient.name || `Paciente #${patient.id}`,
        segment: primarySegment,
        priority: SEGMENT_PRIORITY[primarySegment],
        ...config[primarySegment],
      } satisfies AdminDashboardOperationalItem;
    })
    .filter((item): item is AdminDashboardOperationalItem => item !== null)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.patientName.localeCompare(b.patientName, "pt-BR");
    });

  return {
    counts,
    items: focusItems.slice(0, 8),
  };
}
