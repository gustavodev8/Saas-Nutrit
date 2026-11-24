import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, TrendingUp, Users } from "lucide-react";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { WorkspaceOnboarding } from "@/components/workspace/WorkspaceOnboarding";
import {
  fetchRecentConsultations,
  fetchConsultationCountThisMonth,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_META,
  type ConsultationStatus,
} from "@/lib/workspaceConsultations";
import { cn } from "@/lib/utils";

interface RecentPatient { id: number; name: string; created_at: string }

interface DashboardData {
  patientCount: number;
  patientsThisMonth: number;
  patientsWithRecentMeasurement: number;
  recentPatients: RecentPatient[];
  consultationsThisMonth: number;
  recentConsultations: Array<{
    id: number; patient_id: number; patient_name: string;
    consulted_at: string; type: string; status: ConsultationStatus; duration_min: number | null;
  }>;
}

async function fetchDashboardData(workspaceId: string): Promise<DashboardData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ago30 = thirtyDaysAgo.toISOString().slice(0, 10);

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);
  const monthStart = firstOfMonth.toISOString();

  const [countRes, monthRes, recentRes, measuredRes, consultMonth, recentConsult] = await Promise.all([
    workspaceSupabase
      .from("patients").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    workspaceSupabase
      .from("patients").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).gte("created_at", monthStart),
    workspaceSupabase
      .from("patients").select("id, name, created_at")
      .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(5),
    workspaceSupabase
      .from("measurements").select("patient_id")
      .eq("workspace_id", workspaceId).gte("assessment_date", ago30),
    fetchConsultationCountThisMonth(workspaceId).catch(() => 0),
    fetchRecentConsultations(workspaceId, 5).catch(() => []),
  ]);

  const measuredPatientIds = new Set(
    ((measuredRes.data ?? []) as { patient_id: number }[]).map((r) => r.patient_id)
  );

  return {
    patientCount:                countRes.count   ?? 0,
    patientsThisMonth:           monthRes.count   ?? 0,
    patientsWithRecentMeasurement: measuredPatientIds.size,
    recentPatients:              (recentRes.data  ?? []) as RecentPatient[],
    consultationsThisMonth:      consultMonth,
    recentConsultations:         recentConsult,
  };
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  return `${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""} atrás`;
}

export function WorkspaceDashboardPage() {
  type ActivityItem =
    | { kind: "patient"; key: string; date: number; id: number; name: string }
    | { kind: "consultation"; key: string; date: number; patientId: number; patientName: string; status: ConsultationStatus; typeLabel: string };

  const { membership, userEmail } = useWorkspaceAuth();
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const workspaceId = membership?.workspaceId ?? null;

  useEffect(() => {
    if (!workspaceId) return;
    fetchDashboardData(workspaceId)
      .then(setData)
      .catch(() => setData({ patientCount: 0, patientsThisMonth: 0, patientsWithRecentMeasurement: 0, recentPatients: [], consultationsThisMonth: 0, recentConsultations: [] }))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Feed unificado: pacientes novos + consultas recentes, mais recentes primeiro.
  const activity = useMemo<ActivityItem[]>(() => {
    if (!data) return [];
    const patientItems = data.recentPatients.map((p): ActivityItem => ({
      kind: "patient",
      key: `p${p.id}`,
      date: new Date(p.created_at).getTime(),
      id: p.id,
      name: p.name,
    }));
    const consultationItems = data.recentConsultations.map((c): ActivityItem => ({
      kind: "consultation",
      key: `c${c.id}`,
      date: new Date(c.consulted_at + "T12:00:00").getTime(),
      patientId: c.patient_id,
      patientName: c.patient_name,
      status: c.status,
      typeLabel: CONSULTATION_TYPE_LABELS[c.type as keyof typeof CONSULTATION_TYPE_LABELS] ?? c.type,
    }));
    return [...patientItems, ...consultationItems]
      .sort((a, b) => b.date - a.date)
      .slice(0, 6);
  }, [data]);

  const firstName = userEmail?.split("@")[0] ?? "Nutricionista";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LeafLoader size="lg" label="Carregando dashboard..." />
      </div>
    );
  }

  const inactiveCount = data
    ? Math.max(0, data.patientCount - data.patientsWithRecentMeasurement)
    : 0;

  const stats = [
    { icon: Users,        label: "Pacientes",      value: data?.patientCount ?? 0,                  sub: "total",      to: "/workspace/patients" },
    { icon: TrendingUp,   label: "Novos este mês", value: data?.patientsThisMonth ?? 0,             sub: "adicionados", to: "/workspace/patients" },
    { icon: CalendarDays, label: "Consultas",      value: data?.consultationsThisMonth ?? 0,        sub: "este mês",   to: "/workspace/agenda" },
    { icon: TrendingUp,   label: "Ativos 30 dias", value: data?.patientsWithRecentMeasurement ?? 0, sub: "avaliados",  to: "/workspace/patients" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <h1 className="break-all text-2xl font-semibold text-foreground">Olá, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua área clínica</p>
        </div>
        <Link to="/workspace/patients" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Users size={16} aria-hidden="true" /> Ver pacientes <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {/* Stats grid (cada card leva à lista relevante) */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, sub, to }) => (
          <Link
            key={label}
            to={to}
            className="flex min-h-28 flex-col justify-between gap-3 bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon size={16} className="text-primary" aria-hidden="true" />{label}</div>
            <div className="flex items-baseline gap-2"><span className="text-3xl font-semibold leading-none text-foreground">{value}</span><span className="text-xs text-muted-foreground">{sub}</span></div>
          </Link>
        ))}
      </div>

      {/* Corpo: feed (2/3) + aside (1/3). A grade é sempre preenchida. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Atividade recente</h2>
            <Link to="/workspace/agenda" className="text-xs font-medium text-primary hover:underline">Ver agenda</Link>
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card divide-y divide-border">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <div className="rounded-md bg-primary/10 p-3 text-primary">
                  <CalendarDays size={22} aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-foreground">Sem atividade recente</p>
                <Link to="/workspace/patients" className="text-xs font-medium text-primary hover:underline">
                  Adicionar paciente
                </Link>
              </div>
            ) : (
              activity.map((item) =>
                item.kind === "patient" ? (
                  <Link
                    key={item.key}
                    to={`/workspace/patients/${item.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users size={12} aria-hidden="true" />
                        Novo paciente
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(new Date(item.date).toISOString())}
                    </p>
                  </Link>
                ) : (
                  <Link
                    key={item.key}
                    to={`/workspace/patients/${item.patientId}?tab=consultas`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(item.patientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.patientName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CalendarDays size={12} className="text-muted-foreground" aria-hidden="true" />
                        <span className="text-[10px] text-muted-foreground">Consulta</span>
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold dark:border-border dark:bg-muted dark:text-foreground", CONSULTATION_STATUS_META[item.status].cls)}>
                          {CONSULTATION_STATUS_META[item.status].label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{item.typeLabel}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </Link>
                )
              )
            )}
          </div>
        </section>

        <aside className="space-y-5">
          {/* Pendências (sempre presente) */}
          {inactiveCount > 0 ? (
            <div className="flex flex-col gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                    {inactiveCount} paciente{inactiveCount !== 1 ? "s" : ""} sem avaliação nos últimos 30 dias
                  </p>
                  <p className="mt-0.5 text-xs text-amber-900 dark:text-amber-200">
                    Considere agendar retorno para manter o acompanhamento em dia.
                  </p>
                </div>
              </div>
              <Link
                to="/workspace/patients"
                className="self-start text-xs font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
              >
                Ver pacientes →
              </Link>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Acompanhamento em dia</p>
                <p className="mt-0.5 text-xs text-emerald-900 dark:text-emerald-200">Nenhuma pendência de avaliação.</p>
              </div>
            </div>
          )}

          {/* Acesso rápido */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Acesso rápido</h2>
            <div className="overflow-hidden rounded-md border border-border bg-border space-y-px">
              {[
                { to: "/workspace/patients",  Icon: Users,        title: "Pacientes",        desc: "Ver e adicionar pacientes" },
                { to: "/workspace/agenda",    Icon: CalendarDays, title: "Agenda",           desc: "Histórico de consultas" },
                { to: "/workspace/modelos",   Icon: BookOpen,     title: "Modelos de Dieta", desc: "Biblioteca de protocolos" },
              ].map(({ to, Icon, title, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex min-h-20 items-center justify-between gap-3 bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/10 p-2 text-primary">
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Empty state */}
      {data?.patientCount === 0 && (
        <div className="flex flex-wrap items-center gap-4 border-y border-border py-6">
          <div className="rounded-md bg-primary/10 p-3">
            <Users size={22} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum paciente ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro paciente para começar</p>
          </div>
          <Link to="/workspace/patients" className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto">
            Adicionar paciente
          </Link>
        </div>
      )}

      {workspaceId && <WorkspaceOnboarding workspaceId={workspaceId} />}
    </div>
  );
}
