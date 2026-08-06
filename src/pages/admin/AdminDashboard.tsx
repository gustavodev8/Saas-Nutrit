import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Leaf,
  LayoutList,
  Loader2,
  Plus,
  ReceiptText,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchBookings,
  fetchPatientOperationalIndicators,
  fetchPatients,
  type Booking,
  type Patient,
  type PatientOperationalIndicators,
} from "@/lib/supabase";
import {
  buildAdminDashboardData,
  buildAdminOperationalDashboardData,
  formatShortDate,
} from "@/lib/adminDashboardUtils";
import { OperationalFocusPanel } from "@/components/admin/dashboard/OperationalFocusPanel";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint: string;
  tone?: "primary" | "amber" | "blue" | "muted";
}

const SummaryCard = ({ icon: Icon, label, value, hint, tone = "muted" }: SummaryCardProps) => {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
    muted: "bg-muted text-muted-foreground",
  }[tone];

  return (
    <div className="rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  to: string;
}

const QuickAction = ({ icon: Icon, label, description, to }: QuickActionProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{description}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [operationalIndicators, setOperationalIndicators] = useState<PatientOperationalIndicators>({
    withoutNextBookingIds: [],
    withoutActiveMealPlanIds: [],
    pendingExamRequestPatientIds: [],
    lastInteractionDates: {},
    nextBookingDates: {},
    nextReturnDates: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([fetchBookings(), fetchPatients()])
      .then(async ([bookingRows, patientRows]) => {
        if (!mounted) return;
        setBookings(bookingRows);
        setPatients(patientRows);

        const indicators = await fetchPatientOperationalIndicators(patientRows);
        if (!mounted) return;
        setOperationalIndicators(indicators);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const dashboard = useMemo(() => buildAdminDashboardData(bookings, patients), [bookings, patients]);
  const operationalDashboard = useMemo(
    () => buildAdminOperationalDashboardData(patients, operationalIndicators),
    [patients, operationalIndicators],
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Central do dia
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Painel de rotina clínica
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Visão rápida de agenda, pacientes e pendências para operar o atendimento sem
              precisar caçar informações em várias telas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/admin/agendamentos")} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Nova consulta
            </Button>
            <Button asChild variant="outline" className="rounded-xl bg-background/70">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver site
              </a>
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={CalendarDays}
              label="Hoje"
              value={dashboard.todayBookings.length}
              hint="consultas agendadas para hoje"
              tone="primary"
            />
            <SummaryCard
              icon={CreditCard}
              label="Pagamentos"
              value={dashboard.pendingPayments.length}
              hint="pendências financeiras ativas"
              tone={dashboard.pendingPayments.length ? "amber" : "muted"}
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Concluídas"
              value={dashboard.completedThisMonth.length}
              hint="sessões finalizadas neste mês"
              tone="blue"
            />
            <SummaryCard
              icon={Users}
              label="Pacientes"
              value={patients.length}
              hint="cadastros no prontuário"
              tone="muted"
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr] xl:items-start">
            <div className="space-y-5">
              <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm lg:p-5 xl:self-start">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Próximos atendimentos</h2>
                  <p className="text-xs text-muted-foreground">Agenda ativa em ordem de prioridade.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/agendamentos")}>
                  Abrir agenda
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {dashboard.nextBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">Nenhum atendimento futuro</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Crie uma consulta inicial ou retorno para manter a rotina clínica em movimento.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5 rounded-xl"
                    onClick={() => navigate("/admin/agendamentos")}
                  >
                    Abrir agenda
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dashboard.nextBookings.map((booking) => (
                    <button
                      key={`${booking.booking_group_id}-${booking.session_number}-${booking.id ?? booking.appointment_time}`}
                      type="button"
                      onClick={() => navigate("/admin/agendamentos")}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border/70 px-3 py-3 text-left transition hover:border-primary/30 hover:bg-primary/[0.03]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                        <Clock3 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {booking.client_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatShortDate(booking.appointment_date)} às {booking.appointment_time} ·{" "}
                          {booking.type === "online" ? "online" : "presencial"}
                        </span>
                      </span>
                      <span className="rounded-full border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {booking.payment_status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              </div>

              <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                <QuickAction
                  icon={FileText}
                  label="Conteudo do site"
                  description="Editar paginas publicas"
                  to="/admin/hero"
                />
                <QuickAction
                  icon={CalendarCheck}
                  label="Disponibilidade"
                  description="Ajustar horarios disponiveis"
                  to="/admin/disponibilidade"
                />
                <QuickAction
                  icon={ReceiptText}
                  label="Auditoria"
                  description="Ver alteracoes em pacientes"
                  to="/admin/auditoria"
                />
              </section>
            </div>

            <div className="space-y-5">
              <OperationalFocusPanel
                counts={operationalDashboard.counts}
                items={operationalDashboard.items}
                onOpen={(route) => navigate(route)}
              />
              <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm lg:p-5">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-foreground">Ações rápidas</h2>
                  <p className="text-xs text-muted-foreground">Atalhos para as rotinas mais usadas.</p>
                </div>
                <div className="grid gap-2">
                  <QuickAction
                    icon={UserPlus}
                    label="Novo paciente"
                    description="Abrir cadastro do prontuário"
                    to="/admin/pacientes"
                  />
                  <QuickAction
                    icon={LayoutList}
                    label="Modelos de dieta"
                    description="Importar ou revisar cardápios"
                    to="/admin/modelos"
                  />
                  <QuickAction
                    icon={Leaf}
                    label="Banco de alimentos"
                    description="Consultar ingredientes e medidas"
                    to="/admin/alimentos"
                  />
                  <QuickAction
                    icon={ReceiptText}
                    label="Pagamentos"
                    description="Ver pendências e aprovações"
                    to="/admin/pagamentos"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm lg:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Pacientes recentes</h2>
                    <p className="text-xs text-muted-foreground">Últimos cadastros no sistema.</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>

                {dashboard.recentPatients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
                    <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-foreground">Nenhum paciente cadastrado</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 rounded-xl"
                      onClick={() => navigate("/admin/pacientes")}
                    >
                      Cadastrar paciente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboard.recentPatients.map((patient) => (
                      <button
                        key={patient.id ?? patient.name}
                        type="button"
                        onClick={() => patient.id && navigate(`/admin/pacientes/${patient.id}`)}
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-muted/50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {patient.name
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {patient.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {patient.email || patient.phone || "Sem contato informado"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="hidden">
            <QuickAction
              icon={FileText}
              label="Conteúdo do site"
              description="Editar páginas públicas"
              to="/admin/hero"
            />
            <QuickAction
              icon={CalendarCheck}
              label="Disponibilidade"
              description="Ajustar horários disponíveis"
              to="/admin/disponibilidade"
            />
            <QuickAction
              icon={ReceiptText}
              label="Auditoria"
              description="Ver alterações em pacientes"
              to="/admin/auditoria"
            />
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
