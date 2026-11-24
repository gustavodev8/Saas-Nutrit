import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import {
  fetchRecentConsultations,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_META,
  type ConsultationStatus,
} from "@/lib/workspaceConsultations";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  patient_id: number;
  patient_name: string;
  consulted_at: string;
  type: string;
  status: ConsultationStatus;
  duration_min: number | null;
  notes: string | null;
};

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default function WorkspaceAgendaPage() {
  const { membership } = useWorkspaceAuth();
  const workspaceId = membership?.workspaceId ?? membership?.workspace_id ?? null;

  const [rows, setRows]             = useState<Row[]>([]);
  const [loading, setLoading]       = useState(true);
  const [migPending, setMigPending] = useState(false);
  const [filter, setFilter]         = useState<ConsultationStatus | "todas">("todas");

  useEffect(() => {
    if (!workspaceId) return;
    fetchRecentConsultations(workspaceId, 100)
      .then((data) => setRows(data as Row[]))
      .catch((e: Error) => {
        if (e.message === "MIGRATION_PENDING") setMigPending(true);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = filter === "todas" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consultas registradas no seu workspace</p>
        </div>
        <Link to="/workspace/patients" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Users size={16} aria-hidden="true" /> Pacientes <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {migPending && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold mb-1">Migration pendente</p>
          <p>Execute o SQL <code className="bg-amber-100 px-1 rounded">20261121060000_workspace_consultations_and_recalls.sql</code> no Supabase para habilitar a agenda.</p>
        </div>
      )}

      {/* Filter bar */}
      {!migPending && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar consultas">
          {(["todas", "agendada", "realizada", "cancelada"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
              className={cn(
                "min-h-9 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {s === "todas" ? "Todas" : CONSULTATION_STATUS_META[s].label}
              {s !== "todas" && (
                <span className="ml-1 opacity-70">
                  ({rows.filter((r) => r.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16"><LeafLoader label="Carregando agenda…" /></div>
      )}

      {!loading && !migPending && filtered.length === 0 && (
        <div className="flex min-h-[320px] flex-col items-start justify-center gap-4 border-y border-border py-10 sm:min-h-[380px] sm:py-14">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary"><CalendarDays size={23} aria-hidden="true" /></span>
          <div className="max-w-lg min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{rows.length === 0 ? "Nenhuma consulta registrada" : "Nenhuma consulta neste filtro"}</h2>
            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              {rows.length === 0 ? "Abra o perfil de um paciente para registrar a primeira consulta." : "As outras consultas continuam disponíveis. Selecione Todas para ver o histórico completo."}
            </p>
          </div>
          {rows.length === 0 ? (
            <Link to="/workspace/patients" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Ir para pacientes <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" onClick={() => setFilter("todas")} className="min-h-10 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Ver todas as consultas
            </button>
          )}
        </div>
      )}

      {!loading && !migPending && filtered.length > 0 && (
        <div className="overflow-hidden rounded-md border border-border divide-y divide-border">
          {filtered.map((r) => {
            const meta      = CONSULTATION_STATUS_META[r.status];
            const typeLabel = CONSULTATION_TYPE_LABELS[r.type as keyof typeof CONSULTATION_TYPE_LABELS] ?? r.type;
            return (
              <Link
                key={r.id}
                to={`/workspace/patients/${r.patient_id}?tab=consultas`}
                className="flex min-h-16 items-center gap-3 bg-card px-3 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:gap-5 sm:px-5"
              >
                <div className="w-16 shrink-0 border-r border-border pr-3 text-left sm:w-20">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {new Date(r.consulted_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.consulted_at + "T12:00:00").getFullYear()}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.patient_name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold dark:border-border dark:bg-muted dark:text-foreground", meta.cls)}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{typeLabel}</span>
                    {r.duration_min && (
                      <span className="text-[10px] text-muted-foreground">{r.duration_min} min</span>
                    )}
                  </div>
                </div>

                {r.notes && (
                  <p className="hidden sm:block text-xs text-muted-foreground truncate max-w-[200px]">{r.notes}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !migPending && rows.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {rows.length} consulta{rows.length !== 1 ? "s" : ""} no total · {fmtDate(rows[0].consulted_at)} foi a mais recente
        </p>
      )}
    </div>
  );
}
