import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardList,
  FileText,
  FlaskConical,
  Loader2,
  Pill,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PatientOnboardingChecklist } from "@/components/admin/patient/PatientOnboardingChecklist";
import type { PatientAdminTabKey } from "@/components/admin/patient/patientAdminTypes";
import { buildPatientOnboarding, type PatientOnboardingItem } from "@/lib/patientOnboarding";
import { bookingBelongsToPatient } from "@/lib/patientBookingMatch";
import {
  fetchBookings,
  fetchConsultationRecords,
  fetchExamRequests,
  fetchMealPlans,
  fetchMeasurements,
  fetchPatientReports,
  fetchPrescriptions,
  isPendingBookingExpired,
  type Booking,
  type ConsultationRecord,
  type MealPlan,
  type Measurement,
  type Patient,
  type PatientExamRequest,
  type PatientReport,
  type SavedPrescription,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ClinicalCentralData {
  measurements: Measurement[];
  mealPlans: MealPlan[];
  reports: PatientReport[];
  examRequests: PatientExamRequest[];
  prescriptions: SavedPrescription[];
  bookings: Booking[];
  consultationRecords: ConsultationRecord[];
}

interface ClinicalTimelineEvent {
  id: string;
  dateValue: string;
  sortValue: number;
  timeValue?: string | null;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  toneClass: string;
  actionTab?: PatientAdminTabKey;
  route?: string;
}

interface ClinicalAction {
  id: string;
  title: string;
  description: string;
  tab?: PatientAdminTabKey;
  route?: string;
  icon: LucideIcon;
  priority: number;
}

interface ClinicalSummaryCard {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tab?: PatientAdminTabKey;
  route?: string;
}

const emptyClinicalData: ClinicalCentralData = {
  measurements: [],
  mealPlans: [],
  reports: [],
  examRequests: [],
  prescriptions: [],
  bookings: [],
  consultationRecords: [],
};

const todayISO = () => new Date().toISOString().split("T")[0];

const dateOnly = (value?: string | null) => {
  if (!value) return null;
  return value.includes("T") ? value.split("T")[0] : value;
};

const dateTimeValue = (date?: string | null, time?: string | null) => {
  if (!date) return 0;
  const normalizedDate = dateOnly(date);
  const iso = time ? `${normalizedDate}T${time}` : `${normalizedDate}T12:00:00`;
  const parsed = new Date(iso).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const instantDateValue = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatClinicalDate = (date?: string | null, time?: string | null) => {
  const normalizedDate = dateOnly(date);
  if (!normalizedDate) return "Sem data";
  const label = new Date(`${normalizedDate}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return time ? `${label} às ${time.slice(0, 5)}` : label;
};

const bookingStatusLabel = (status?: Booking["status"]) => {
  const map: Record<NonNullable<Booking["status"]>, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    completed: "Concluída",
    no_show: "Falta",
    cancelled: "Cancelada",
  };
  return status ? map[status] : "Agendada";
};

const paymentStatusLabel = (status?: Booking["payment_status"]) => {
  const map: Record<NonNullable<Booking["payment_status"]>, string> = {
    pending: "Pagamento pendente",
    paid: "Pagamento aprovado",
    cancelled: "Pagamento cancelado",
    free: "Sem cobrança",
  };
  return status ? map[status] : "Pagamento não informado";
};

const pluralLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

interface ClinicalCentralTabProps {
  patient: Patient;
  onNavigateTab: (tab: PatientAdminTabKey) => void;
}

export function ClinicalCentralTab({
  patient,
  onNavigateTab,
}: ClinicalCentralTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClinicalCentralData>(emptyClinicalData);

  useEffect(() => {
    if (!patient.id) return;
    let active = true;
    setLoading(true);

    const loadCentral = async () => {
      const [measurements, mealPlans, reports, examRequests, prescriptions, allBookings] =
        await Promise.all([
          fetchMeasurements(patient.id),
          fetchMealPlans(patient.id),
          fetchPatientReports(patient.id),
          fetchExamRequests(patient.id),
          fetchPrescriptions(patient.id),
          fetchBookings(),
        ]);

      const bookings = allBookings.filter((booking) =>
        bookingBelongsToPatient(patient, booking),
      );

      const bookingGroupIds = Array.from(
        new Set(bookings.map((booking) => booking.booking_group_id).filter(Boolean)),
      );
      const consultationRecords = (
        await Promise.all(
          bookingGroupIds.map((groupId) => fetchConsultationRecords(groupId)),
        )
      ).flat();

      return {
        measurements,
        mealPlans,
        reports,
        examRequests,
        prescriptions,
        bookings,
        consultationRecords,
      };
    };

    loadCentral()
      .then((centralData) => {
        if (!active) return;
        setData(centralData);
      })
      .catch(() => toast.error("Erro ao carregar a central clínica."))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patient.id, patient.name, patient.email, patient.phone, patient.cpf]);

  const now = Date.now();
  const today = todayISO();
  const latestMeasurement = data.measurements[0];
  const latestReport = data.reports[0];
  const activePlan = data.mealPlans.find((plan) => {
    const startsOk = !plan.start_date || plan.start_date <= today;
    const endsOk = !plan.end_date || plan.end_date >= today;
    return startsOk && endsOk;
  });
  const latestPlan = data.mealPlans[0];
  const pendingExamRequests = data.examRequests.filter(
    (request) => request.status !== "completed",
  );
  const upcomingBookings = data.bookings
    .filter((booking) => !["completed", "cancelled", "no_show"].includes(booking.status ?? ""))
    .filter((booking) => !isPendingBookingExpired(booking))
    .filter(
      (booking) =>
        dateTimeValue(booking.appointment_date, booking.appointment_time) >= now,
    )
    .sort(
      (a, b) =>
        dateTimeValue(a.appointment_date, a.appointment_time) -
        dateTimeValue(b.appointment_date, b.appointment_time),
    );
  const nextBooking = upcomingBookings[0];
  const recordSessionKeys = new Set(
    data.consultationRecords
      .filter((record) => record.booking_group_id && record.session_number != null)
      .map((record) => `${record.booking_group_id}-${record.session_number}`),
  );
  const timelineBookings = data.bookings.filter((booking) => {
    const key = `${booking.booking_group_id}-${booking.session_number}`;
    return !(booking.status === "completed" && recordSessionKeys.has(key));
  });

  const pendingActions: ClinicalAction[] = [
    !nextBooking
      ? {
          id: "booking",
          title: "Agendar retorno",
          description: "Nenhuma consulta futura encontrada.",
          route: patient.id
            ? `/admin/agendamentos?new=return&patientId=${patient.id}`
            : "/admin/agendamentos",
          icon: CalendarCheck,
          priority: 10,
        }
      : null,
    !latestMeasurement
      ? {
          id: "measurement",
          title: "Registrar primeira avaliação",
          description: "Sem medidas antropométricas registradas.",
          tab: "antropometria",
          icon: Activity,
          priority: 20,
        }
      : null,
    pendingExamRequests.length > 0
      ? {
          id: "exams",
          title: "Lançar resultados de exames",
          description: `${pluralLabel(
            pendingExamRequests.length,
            "solicitação pendente",
            "solicitações pendentes",
          )}.`,
          tab: "protocolos",
          icon: FlaskConical,
          priority: 30,
        }
      : null,
    !activePlan
      ? {
          id: "plan",
          title: "Criar plano alimentar",
          description: "Paciente sem plano ativo.",
          tab: "planos",
          icon: Utensils,
          priority: 40,
        }
      : null,
    !latestReport
      ? {
          id: "report",
          title: "Registrar evolução clínica",
          description: "Sem relatório clínico no histórico.",
          tab: "relatorio",
          icon: FileText,
          priority: 50,
        }
      : null,
  ]
    .filter((item): item is ClinicalAction => item !== null)
    .sort((a, b) => a.priority - b.priority);

  const openClinicalTarget = (target: {
    tab?: PatientAdminTabKey;
    route?: string;
  }) => {
    if (target.route) {
      navigate(target.route);
      return;
    }
    if (target.tab) onNavigateTab(target.tab);
  };

  const onboardingItems = buildPatientOnboarding({
    patient,
    hasNextBooking: Boolean(nextBooking),
    hasMeasurement: Boolean(latestMeasurement),
    hasActivePlan: Boolean(activePlan),
    hasExamRequest: data.examRequests.length > 0,
    hasReport: Boolean(latestReport),
  });

  const openOnboardingItem = (item: PatientOnboardingItem) => {
    openClinicalTarget(item);
  };

  const timeline: ClinicalTimelineEvent[] = [
    ...timelineBookings.map((booking) => ({
      id: `booking-${booking.id ?? booking.booking_group_id}-${booking.session_number}`,
      dateValue: booking.appointment_date,
      sortValue: dateTimeValue(booking.appointment_date, booking.appointment_time),
      timeValue: booking.appointment_time,
      title:
        booking.session_number > 1
          ? `Retorno ${booking.session_number - 1}`
          : "Consulta inicial",
      description: `${booking.plan_name || "Consulta"} · ${
        booking.type === "online" ? "Online" : "Presencial"
      } · ${paymentStatusLabel(booking.payment_status)}`,
      badge: bookingStatusLabel(booking.status),
      icon: CalendarCheck,
      toneClass:
        booking.status === "completed"
          ? "text-emerald-700 bg-emerald-50 border-emerald-100"
          : "text-blue-700 bg-blue-50 border-blue-100",
      route: "/admin/agendamentos",
    })),
    ...data.consultationRecords.map((record) => ({
      id: `record-${record.id ?? record.booking_group_id}-${
        record.session_number ?? "sem-sessao"
      }`,
      dateValue: record.created_at ?? today,
      sortValue: instantDateValue(record.created_at ?? today),
      title:
        record.session_number && record.session_number > 1
          ? `Evolução do retorno ${record.session_number - 1}`
          : "Evolução da consulta",
      description:
        [
          record.weight != null ? `${record.weight} kg` : null,
          record.next_return_date
            ? `retorno ${formatClinicalDate(record.next_return_date)}`
            : null,
          record.next_steps?.trim()
            ? record.next_steps.trim()
            : record.notes?.trim()
              ? record.notes.trim()
              : null,
        ].filter(Boolean).join(" · ") || "Registro clínico da sessão concluída.",
      badge: "Evolução",
      icon: ClipboardList,
      toneClass: "text-teal-700 bg-teal-50 border-teal-100",
      route: "/admin/agendamentos",
    })),
    ...data.measurements.map((measurement) => ({
      id: `measurement-${measurement.id}`,
      dateValue: measurement.assessment_date,
      sortValue: dateTimeValue(measurement.assessment_date),
      title: "Avaliação antropométrica",
      description:
        [
          measurement.weight != null ? `${measurement.weight} kg` : null,
          measurement.body_fat != null
            ? `${measurement.body_fat}% gordura`
            : null,
          measurement.waist != null ? `cintura ${measurement.waist} cm` : null,
        ].filter(Boolean).join(" · ") || "Medidas registradas no prontuário.",
      badge: "Medidas",
      icon: Activity,
      toneClass: "text-primary bg-primary/10 border-primary/10",
      actionTab: "antropometria",
    })),
    ...data.mealPlans.map((plan) => ({
      id: `plan-${plan.id}`,
      dateValue: plan.start_date ?? plan.created_at ?? today,
      sortValue: plan.start_date
        ? dateTimeValue(plan.start_date)
        : instantDateValue(plan.created_at),
      title: plan.title || "Plano alimentar",
      description:
        [
          plan.daily_calories ? `${plan.daily_calories} kcal/dia` : null,
          plan.strategy_type ? `estratégia: ${plan.strategy_type}` : null,
          plan.end_date ? `até ${formatClinicalDate(plan.end_date)}` : null,
        ].filter(Boolean).join(" · ") || "Plano alimentar criado.",
      badge: "Plano",
      icon: Utensils,
      toneClass: "text-emerald-700 bg-emerald-50 border-emerald-100",
      route:
        plan.id && patient.id
          ? `/admin/pacientes/${patient.id}/plano/${plan.id}`
          : undefined,
      actionTab: "planos",
    })),
    ...data.examRequests.map((request) => ({
      id: `exam-${request.id}`,
      dateValue: request.created_at ?? today,
      sortValue: instantDateValue(request.created_at),
      title:
        request.status === "completed"
          ? "Resultados de exames lançados"
          : "Pedido de exames solicitado",
      description: `${pluralLabel(
        request.items?.length ?? 0,
        "exame",
        "exames",
      )} · ${pluralLabel(
        request.results?.length ?? 0,
        "resultado registrado",
        "resultados registrados",
      )}`,
      badge: request.status === "completed" ? "Concluído" : "Pendente",
      icon: FlaskConical,
      toneClass:
        request.status === "completed"
          ? "text-emerald-700 bg-emerald-50 border-emerald-100"
          : "text-amber-700 bg-amber-50 border-amber-100",
      actionTab: "protocolos",
    })),
    ...data.reports.map((report) => ({
      id: `report-${report.id}`,
      dateValue: report.report_date,
      sortValue: dateTimeValue(report.report_date),
      title: report.title || "Relatório clínico",
      description: `${report.report_text.trim().length} caracteres · atualizado ${formatClinicalDate(
        report.updated_at ?? report.created_at ?? report.report_date,
      )}`,
      badge: "Relatório",
      icon: FileText,
      toneClass: "text-slate-700 bg-slate-50 border-slate-100",
      actionTab: "relatorio",
    })),
    ...data.prescriptions.map((prescription) => ({
      id: `prescription-${prescription.id}`,
      dateValue: prescription.created_at,
      sortValue: instantDateValue(prescription.created_at),
      title: "Prescrição magistral",
      description: `${pluralLabel(
        prescription.blocks.length,
        "bloco",
        "blocos",
      )} · ${pluralLabel(
        prescription.blocks.reduce((acc, block) => acc + block.items.length, 0),
        "ativo",
        "ativos",
      )}`,
      badge: "Prescrição",
      icon: Pill,
      toneClass: "text-violet-700 bg-violet-50 border-violet-100",
      actionTab: "prescricao",
    })),
  ].sort((a, b) => b.sortValue - a.sortValue);

  const summaryCards: ClinicalSummaryCard[] = [
    {
      label: "Próxima consulta",
      value: nextBooking
        ? formatClinicalDate(nextBooking.appointment_date, nextBooking.appointment_time)
        : "Não agendada",
      detail: nextBooking
        ? `${nextBooking.plan_name} · ${bookingStatusLabel(nextBooking.status)}`
        : "Sem retorno futuro encontrado",
      icon: CalendarCheck,
      tab: "perfil",
    },
    {
      label: activePlan ? "Plano ativo" : "Último plano",
      value: activePlan?.title ?? latestPlan?.title ?? "Sem plano cadastrado",
      detail: activePlan?.daily_calories
        ? `${activePlan.daily_calories} kcal/dia`
        : latestPlan
          ? "Fora do período ativo"
          : "Conduta alimentar não vinculada",
      icon: Utensils,
      route:
        (activePlan?.id ?? latestPlan?.id) && patient.id
          ? `/admin/pacientes/${patient.id}/plano/${activePlan?.id ?? latestPlan?.id}`
          : undefined,
      tab: "planos",
    },
    {
      label: "Última avaliação",
      value: latestMeasurement
        ? formatClinicalDate(latestMeasurement.assessment_date)
        : "Sem medidas",
      detail: latestMeasurement?.weight
        ? `${latestMeasurement.weight} kg${
            latestMeasurement.body_fat
              ? ` · ${latestMeasurement.body_fat}% gordura`
              : ""
          }`
        : "Registre antropometria",
      icon: Activity,
      tab: "antropometria",
    },
    {
      label: "Exames",
      value:
        pendingExamRequests.length > 0
          ? pluralLabel(pendingExamRequests.length, "pendente", "pendentes")
          : "Sem pendências",
      detail: pluralLabel(
        data.examRequests.length,
        "pedido no histórico",
        "pedidos no histórico",
      ),
      icon: FlaskConical,
      tab: "protocolos",
    },
  ];

  const primaryAction = pendingActions[0];
  const statusLabel = nextBooking ? "Acompanhamento ativo" : "Retorno não agendado";
  const statusDetail = nextBooking
    ? `${formatClinicalDate(nextBooking.appointment_date, nextBooking.appointment_time)} · ${bookingStatusLabel(nextBooking.status)}`
    : "Defina a próxima consulta para manter o acompanhamento em dia.";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando central clínica...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              Resumo do acompanhamento
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">
              {statusLabel}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusDetail}</p>
          </div>

          {primaryAction ? (
            <button
              type="button"
              onClick={() => openClinicalTarget(primaryAction)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-amber-900 transition-all hover:-translate-y-0.5 hover:shadow-sm lg:max-w-[360px]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="rounded-xl bg-white/70 p-2 text-amber-700">
                  <primaryAction.icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-amber-700/80">
                    Próxima ação
                  </span>
                  <span className="block truncate text-sm font-black">
                    {primaryAction.title}
                  </span>
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </button>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900 lg:max-w-[320px]">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80">
                  Próxima ação
                </p>
                <p className="text-sm font-black">Sem pendências agora</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => openClinicalTarget(card)}
              className="rounded-2xl border border-border bg-background px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                    {card.label}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-black text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {card.detail}
                  </p>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <PatientOnboardingChecklist
            items={onboardingItems}
            onOpenItem={openOnboardingItem}
          />

          <section className="rounded-3xl border border-border bg-background p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Conduta sugerida
                </p>
                <h3 className="mt-1 text-base font-black text-foreground">
                  Ações recomendadas
                </h3>
              </div>
              {pendingActions.length === 0 ? (
                <CheckCircle2 size={20} className="text-emerald-600" />
              ) : (
                <AlertCircle size={20} className="text-amber-600" />
              )}
            </div>

            {pendingActions.length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                Sem pendências agora. Revise a linha do tempo antes do próximo atendimento.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingActions.slice(0, 5).map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => openClinicalTarget(action)}
                      className="w-full rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="rounded-xl bg-amber-50 p-1.5 text-amber-700">
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">
                            {action.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {action.description}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-border bg-background p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                Linha do tempo
              </p>
              <h3 className="mt-1 text-base font-black text-foreground">
                Últimos eventos
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {timeline.length} evento{timeline.length === 1 ? "" : "s"}
            </p>
          </div>

          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Clock3 className="mx-auto mb-3 text-muted-foreground/40" size={28} />
              <p className="text-sm font-semibold text-foreground">
                Nenhum evento clínico registrado ainda.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Salve uma anamnese, consulta ou relatório para começar o histórico.
              </p>
              {primaryAction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => openClinicalTarget(primaryAction)}
                >
                  {primaryAction.title}
                </Button>
              )}
            </div>
          ) : (
            <div className="relative space-y-2 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
              {timeline.slice(0, 8).map((event) => {
                const Icon = event.icon;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openClinicalTarget(event)}
                    className="relative flex w-full gap-3 rounded-2xl p-1.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        event.toneClass,
                      )}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 py-2.5">
                      <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">
                            {event.title}
                          </span>
                          <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">
                            {event.description}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {event.badge}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {formatClinicalDate(event.dateValue, event.timeValue)}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
