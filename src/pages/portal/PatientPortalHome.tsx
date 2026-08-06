import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Paperclip,
  Soup,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PatientPortalDisabledState from "@/components/patient/PatientPortalDisabledState";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";
import {
  fetchPortalBookings,
  fetchPortalConsultationRecords,
  fetchPortalExamRequests,
  fetchPortalMealPlans,
  fetchPortalMeasurements,
  fetchPortalPatientReports,
} from "@/lib/patientPortalApi";
import type {
  Booking,
  ConsultationRecord,
  MealPlan,
  Measurement,
  PatientExamRequest,
  PatientReport,
} from "@/lib/supabase";
import { formatPortalDateTime, formatPortalStatus, isFuturePortalDate } from "@/pages/portal/portalUtils";

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-3xl border-border/60">
      <CardContent className="flex items-center gap-3 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientPortalHome() {
  const { patient } = usePatientPortalAuth();
  const { settings } = usePatientPortalSettings();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [examRequests, setExamRequests] = useState<PatientExamRequest[]>([]);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);

  useEffect(() => {
    if (!patient?.id) {
      return;
    }

    setLoading(true);
    Promise.all([
      fetchPortalBookings(patient.id, patient.email ?? null),
      fetchPortalMealPlans(patient.id),
      fetchPortalMeasurements(patient.id),
      fetchPortalPatientReports(patient.id),
      fetchPortalExamRequests(patient.id),
      fetchPortalConsultationRecords(patient.id, patient.email ?? null),
    ])
      .then(
        ([
          nextBookings,
          nextPlans,
          nextMeasurements,
          nextReports,
          nextExamRequests,
          nextRecords,
        ]) => {
          setBookings(nextBookings);
          setPlans(nextPlans);
          setMeasurements(nextMeasurements);
          setReports(nextReports);
          setExamRequests(nextExamRequests);
          setRecords(nextRecords);
        },
      )
      .finally(() => setLoading(false));
  }, [patient?.email, patient?.id]);

  const nextBooking = useMemo(
    () =>
      bookings.find(
        (booking) =>
          isFuturePortalDate(booking.appointment_date) &&
          (booking.status === "confirmed" || booking.status === "pending"),
      ) ?? null,
    [bookings],
  );

  const latestPlan = plans[0] ?? null;
  const latestMeasurement = measurements[0] ?? null;
  const pendingExams = examRequests.filter((request) => request.status === "pending").length;
  const materialRecords = records.filter(
    (record) => (record.files?.length ?? 0) > 0 || Boolean(record.next_steps?.trim()),
  );
  const latestMaterial = materialRecords[0] ?? null;

  const showConsultationCard =
    settings.navigation.consultations && settings.home.nextConsultation;
  const showPlanCard = settings.navigation.plan && settings.home.currentPlan;
  const showAssessmentMetric = settings.home.latestAssessment;
  const showPendingExamsMetric = settings.home.pendingExams;
  const showReportsMetric = settings.home.reports;
  const showMaterialsMetric = settings.home.materials;
  const showGuidanceCard =
    settings.navigation.documents && settings.home.latestGuidance;
  const guidanceCardVisible = showGuidanceCard && Boolean(latestMaterial);

  const visiblePrimaryCards = [showConsultationCard, showPlanCard].filter(Boolean).length;
  const visibleMetricCards = [
    showAssessmentMetric,
    showPendingExamsMetric,
    showReportsMetric,
    showMaterialsMetric,
  ].filter(Boolean).length;

  if (!settings.navigation.home) {
    return (
      <PatientPortalDisabledState
        title="Central temporariamente oculta"
        description="O responsavel pelo portal retirou esta tela da navegacao por enquanto."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-primary px-5 py-6 text-primary-foreground shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">
          {settings.branding.portalSubtitle}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Tudo o que voce precisa acompanhar, em um so lugar.
        </h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">
          {settings.branding.welcomeMessage}
        </p>
      </section>

      {visiblePrimaryCards > 0 ? (
        <div className={`grid gap-4 ${visiblePrimaryCards === 1 ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {showConsultationCard ? (
            <Card className="rounded-3xl border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarDays size={18} />
                  <CardTitle className="text-lg">Proxima consulta</CardTitle>
                </div>
                <CardDescription>Seu proximo compromisso confirmado ou pendente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nextBooking ? (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{nextBooking.plan_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPortalDateTime(nextBooking.appointment_date, nextBooking.appointment_time)}
                      </p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                      {formatPortalStatus(nextBooking.status)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma consulta futura encontrada.</p>
                )}
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link to="/portal/consultas">
                    Ver consultas <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {showPlanCard ? (
            <Card className="rounded-3xl border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Soup size={18} />
                  <CardTitle className="text-lg">Plano atual</CardTitle>
                </div>
                <CardDescription>Seu plano alimentar mais recente liberado no sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestPlan ? (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{latestPlan.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {latestPlan.daily_calories ? `${latestPlan.daily_calories} kcal/dia` : "Calorias nao informadas"}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latestPlan.notes?.trim() || "Seu nutricionista pode incluir orientacoes gerais aqui."}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum plano alimentar publicado ainda.</p>
                )}
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link to="/portal/plano">
                    Abrir meu plano <ArrowRight size={16} className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {visibleMetricCards > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {showAssessmentMetric ? (
            <MetricCard
              icon={TrendingUp}
              label="Ultima avaliacao"
              value={
                latestMeasurement?.assessment_date
                  ? formatPortalDateTime(latestMeasurement.assessment_date)
                  : "Ainda nao registrada"
              }
            />
          ) : null}

          {showPendingExamsMetric ? (
            <MetricCard
              icon={ClipboardList}
              label="Exames pendentes"
              value={`${pendingExams} ${pendingExams === 1 ? "solicitacao" : "solicitacoes"}`}
            />
          ) : null}

          {showReportsMetric ? (
            <MetricCard
              icon={FileText}
              label="Relatorios"
              value={`${reports.length} ${reports.length === 1 ? "documento" : "documentos"}`}
            />
          ) : null}

          {showMaterialsMetric ? (
            <MetricCard
              icon={Paperclip}
              label="Materiais"
              value={`${materialRecords.length} ${materialRecords.length === 1 ? "registro" : "registros"}`}
            />
          ) : null}
        </div>
      ) : null}

      {guidanceCardVisible ? (
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Paperclip size={18} />
              <CardTitle className="text-lg">Ultimas orientacoes</CardTitle>
            </div>
            <CardDescription>
              Arquivos e proximos passos compartilhados apos sua consulta mais recente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestMaterial.next_steps?.trim() ? (
              <p className="text-sm text-foreground/80">{latestMaterial.next_steps}</p>
            ) : null}
            {(latestMaterial.files?.length ?? 0) > 0 ? (
              <p className="text-sm text-muted-foreground">
                {latestMaterial.files?.length} {latestMaterial.files?.length === 1 ? "arquivo disponivel" : "arquivos disponiveis"} para consulta.
              </p>
            ) : null}
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to="/portal/documentos">
                Abrir documentos <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && visiblePrimaryCards === 0 && visibleMetricCards === 0 && !guidanceCardVisible ? (
        <Card className="rounded-3xl border-dashed border-border/80">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Esta central esta ativa, mas os blocos visiveis foram ocultados pelo admin.
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Carregando seu portal...
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
