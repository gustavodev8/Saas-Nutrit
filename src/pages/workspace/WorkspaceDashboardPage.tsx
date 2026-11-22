import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, CalendarDays, ChevronRight, FolderOpen, TrendingUp, Users } from "lucide-react";
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
  const { membership, userEmail } = useWorkspaceAuth();
  const [data, setData]   = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!membership?.workspace_id) return;
    fetchDashboardData(membership.workspace_id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [membership?.workspace_id]);

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {membership?.workspace_id && (
        <WorkspaceOnboarding workspaceId={membership.workspace_id} />
      )}

      {/* Welcome */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1eb] shrink-0">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M20 36 C20 36 18 28 20 20" stroke="#166b50" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M20 20 C20 20 8 18 6 8 C6 8 16 4 24 10 C30 14 20 20 20 20Z" fill="#166b50" fillOpacity="0.85" />
            <path d="M20 20 C20 20 28 14 32 6 C32 6 24 2 18 8 C14 12 20 20 20 20Z" fill="#1a8464" fillOpacity="0.6" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Olá, {firstName}</h1>
          <p className="text-sm text-muted-foreground">Bem-vindo à sua área clínica</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users,       label: "Pacientes",         value: data?.patientCount ?? 0,          sub: "total" },
          { icon: TrendingUp,  label: "Novos este mês",    value: data?.patientsThisMonth ?? 0,     sub: "adicionados" },
          { icon: CalendarDays,label: "Consultas",          value: data?.consultationsThisMonth ?? 0,sub: "este mês" },
          { icon: TrendingUp,  label: "Ativos 30 dias",    value: data?.patientsWithRecentMeasurement ?? 0, sub: "avaliados" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <div className="rounded-lg bg-[#e6f1eb] p-2 w-fit">
              <Icon size={16} className="text-[#166b50]" />
            </div>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            <div>
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {inactiveCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {inactiveCount} paciente{inactiveCount !== 1 ? "s" : ""} sem avaliação nos últimos 30 dias
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Considere agendar retorno para manter o acompanhamento em dia.
            </p>
          </div>
          <Link
            to="/workspace/patients"
            className="shrink-0 text-xs font-semibold text-amber-700 hover:underline"
          >
            Ver pacientes →
          </Link>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: "/workspace/patients",  Icon: Users,        title: "Pacientes",          desc: "Ver e adicionar pacientes" },
          { to: "/workspace/agenda",    Icon: CalendarDays, title: "Agenda",             desc: "Histórico de consultas" },
          { to: "/workspace/modelos",   Icon: BookOpen,     title: "Modelos de Dieta",   desc: "Biblioteca de protocolos" },
        ].map(({ to, Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group border rounded-xl p-4 bg-card hover:border-[#166b50]/50 hover:shadow-sm transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#e6f1eb] p-2">
                <Icon size={18} className="text-[#166b50]" />
              </div>
              <div>
                <p className="text-sm font-medium group-hover:text-[#166b50] transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-[#166b50] transition-colors" />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent consultations */}
        {data && data.recentConsultations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Últimas consultas</h2>
              <Link to="/workspace/agenda" className="text-xs text-[#166b50] hover:underline">Ver agenda</Link>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y overflow-hidden">
              {data.recentConsultations.map((c) => {
                const meta = CONSULTATION_STATUS_META[c.status];
                const typeLabel = CONSULTATION_TYPE_LABELS[c.type as keyof typeof CONSULTATION_TYPE_LABELS] ?? c.type;
                return (
                  <Link
                    key={c.id}
                    to={`/workspace/patients/${c.patient_id}?tab=consultas`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f1eb] text-[#166b50] text-xs font-semibold">
                      {getInitials(c.patient_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.patient_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", meta.cls)}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(c.consulted_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent patients */}
        {(data?.recentPatients?.length ?? 0) > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pacientes recentes</h2>
              <Link to="/workspace/patients" className="text-xs text-[#166b50] hover:underline">Ver todos</Link>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y overflow-hidden">
              {data?.recentPatients.map((p) => (
                <Link
                  key={p.id}
                  to={`/workspace/patients/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e6f1eb] text-[#166b50] text-xs font-semibold">
                    {getInitials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-[#166b50] transition-colors">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Adicionado {timeAgo(p.created_at)}</p>
                  </div>
                  <FolderOpen size={15} className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {data?.patientCount === 0 && (
        <div className="border rounded-xl p-10 bg-card flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-[#e6f1eb] p-4">
            <Users size={28} className="text-[#166b50]" />
          </div>
          <div>
            <p className="font-medium">Nenhum paciente ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro paciente para começar</p>
          </div>
          <Link to="/workspace/patients" className="bg-[#166b50] hover:bg-[#145e45] text-white text-sm px-4 py-2 rounded-lg transition-colors">
            Adicionar paciente
          </Link>
        </div>
      )}
    </div>
  );
}
