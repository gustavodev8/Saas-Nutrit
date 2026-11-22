import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Loader2 } from "lucide-react";
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
  const workspaceId = membership?.workspace_id ?? null;

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
        <p className="text-sm text-muted-foreground">Histórico de consultas de todos os pacientes</p>
      </div>

      {migPending && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Migration pendente</p>
          <p>Execute o SQL <code className="bg-amber-100 px-1 rounded">20261121060000_workspace_consultations_and_recalls.sql</code> no Supabase para habilitar a agenda.</p>
        </div>
      )}

      {/* Filter bar */}
      {!migPending && (
        <div className="flex flex-wrap gap-2">
          {(["todas", "agendada", "realizada", "cancelada"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === s
                  ? "bg-[#166b50] text-white"
                  : "border border-border text-muted-foreground hover:border-[#166b50]/40 hover:text-foreground"
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
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando agenda…</span>
        </div>
      )}

      {!loading && !migPending && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground border border-dashed border-border rounded-xl">
          <CalendarDays size={32} className="opacity-30" />
          <p className="text-sm">
            {rows.length === 0
              ? "Nenhuma consulta registrada ainda. Acesse um paciente para adicionar."
              : "Nenhuma consulta com este filtro."}
          </p>
        </div>
      )}

      {!loading && !migPending && filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {filtered.map((r) => {
            const meta      = CONSULTATION_STATUS_META[r.status];
            const typeLabel = CONSULTATION_TYPE_LABELS[r.type as keyof typeof CONSULTATION_TYPE_LABELS] ?? r.type;
            return (
              <Link
                key={r.id}
                to={`/workspace/patients/${r.patient_id}?tab=consultas`}
                className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="shrink-0 w-20 text-center">
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
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", meta.cls)}>
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
