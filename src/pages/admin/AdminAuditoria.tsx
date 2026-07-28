import { useEffect, useMemo, useState } from "react";
import { Activity, FileSearch, FilterX, Loader2, ShieldAlert, UserRound } from "lucide-react";
import {
  adminCardClass,
  adminEmptyStateClass,
  adminEyebrowClass,
  adminFieldLabelClass,
  adminInputClass,
  adminSecondaryButtonClass,
  adminSelectClass,
} from "@/components/admin/adminStyles";
import { fetchPatientAuditLogs, type PatientAuditAction, type PatientAuditLog } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  perfil: "Perfil do paciente",
  anamnese: "Anamnese",
  relatorio_clinico: "Relatório clínico",
  antropometria: "Antropometria",
  plano_alimentar: "Plano alimentar",
  protocolos_exames: "Protocolos de exames",
  prescricao: "Prescrição",
};

const ACTION_LABELS: Record<PatientAuditAction, string> = {
  create: "Criação",
  update: "Edição",
  delete: "Exclusão",
};

const ACTION_BADGE_CLASS: Record<PatientAuditAction, string> = {
  create: "border-emerald-200 bg-emerald-50 text-emerald-700",
  update: "border-blue-200 bg-blue-50 text-blue-700",
  delete: "border-red-200 bg-red-50 text-red-700",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className={cn(adminCardClass, "p-4")}>
      <p className={adminEyebrowClass}>{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function AdminAuditoria() {
  const [logs, setLogs] = useState<PatientAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<"all" | PatientAuditAction>("all");

  useEffect(() => {
    let mounted = true;

    void fetchPatientAuditLogs()
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      if (sectionFilter !== "all" && log.section_key !== sectionFilter) return false;
      if (actionFilter !== "all" && log.action !== actionFilter) return false;

      if (!query) return true;

      const haystack = [
        log.patient_name,
        log.summary,
        log.actor_email ?? "",
        log.section_label,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [actionFilter, logs, search, sectionFilter]);

  const todayLogs = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter((log) => log.created_at.slice(0, 10) === today).length;
  }, [logs]);

  const createdCount = useMemo(() => logs.filter((log) => log.action === "create").length, [logs]);
  const updatedCount = useMemo(() => logs.filter((log) => log.action === "update").length, [logs]);

  return (
    <div className="space-y-5 p-4 md:p-5 lg:p-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          <ShieldAlert className="h-3.5 w-3.5" />
          Auditoria clínica
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Auditoria das áreas de paciente</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Histórico centralizado de criação, edição e exclusão nos setores clínicos do paciente. O foco é rastrear quem alterou, quando alterou e em qual setor a mudança ocorreu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eventos" value={logs.length} hint="Registros carregados na auditoria" />
        <StatCard label="Hoje" value={todayLogs} hint="Movimentações registradas hoje" />
        <StatCard label="Criações" value={createdCount} hint="Novos registros clínicos" />
        <StatCard label="Edições" value={updatedCount} hint="Atualizações em setores existentes" />
      </div>

      <div className={cn(adminCardClass, "p-4")}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_220px_auto] lg:items-end">
          <div className="space-y-1.5">
            <label className={adminFieldLabelClass}>Buscar</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Paciente, resumo ou responsável..."
              className={adminInputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className={adminFieldLabelClass}>Setor</label>
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className={adminSelectClass}>
              <option value="all">Todos os setores</option>
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={adminFieldLabelClass}>Tipo de ação</label>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value as "all" | PatientAuditAction)}
              className={adminSelectClass}
            >
              <option value="all">Todas</option>
              <option value="create">Criação</option>
              <option value="update">Edição</option>
              <option value="delete">Exclusão</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSectionFilter("all");
              setActionFilter("all");
            }}
            className={adminSecondaryButtonClass}
          >
            <FilterX className="h-4 w-4" />
            Limpar
          </button>
        </div>
      </div>

      {loading ? (
        <div className={cn(adminEmptyStateClass, "flex flex-col items-center gap-3 p-12 text-center")}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Carregando auditoria</p>
            <p className="text-sm text-muted-foreground">Buscando os últimos eventos dos setores de paciente.</p>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className={cn(adminEmptyStateClass, "p-10 text-center")}>
          <FileSearch className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h2 className="mt-4 text-base font-semibold text-foreground">Nenhum evento encontrado</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Não houve eventos com os filtros atuais ou a migração da auditoria ainda não foi aplicada no banco.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className={cn(adminCardClass, "p-4")}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", ACTION_BADGE_CLASS[log.action])}>
                      {ACTION_LABELS[log.action]}
                    </span>
                    <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {SECTION_LABELS[log.section_key] ?? log.section_label}
                    </span>
                    {log.entity_id ? (
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        ID {log.entity_id}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground">{log.patient_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{log.summary}</p>
                  </div>

                  {log.changed_fields && log.changed_fields.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {log.changed_fields.slice(0, 8).map((field) => (
                        <span key={field} className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                          {field}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 space-y-2 text-sm text-muted-foreground lg:text-right">
                  <div className="flex items-center gap-2 lg:justify-end">
                    <Activity className="h-4 w-4" />
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 lg:justify-end">
                    <UserRound className="h-4 w-4" />
                    <span>{log.actor_email ?? "Usuário não identificado"}</span>
                  </div>
                </div>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <details className="mt-3 rounded-xl border border-border/70 bg-muted/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">Detalhes do evento</summary>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-background px-3 py-2">
                        <p className={adminEyebrowClass}>{key}</p>
                        <p className="mt-1 break-words text-sm text-foreground">
                          {Array.isArray(value) ? value.join(", ") : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
