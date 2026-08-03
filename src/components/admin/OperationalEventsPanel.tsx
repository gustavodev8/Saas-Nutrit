import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarCheck, CheckCircle2, Clock, FileText, Mail, ReceiptText, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearOperationalLogs,
  readOperationalLogs,
  summarizeOperationalLogs,
  type OperationalArea,
  type OperationalLogEvent,
  type OperationalStatus,
} from "@/lib/operationalLogs";
import { cn } from "@/lib/utils";

const areaLabels: Record<OperationalArea, string> = {
  email: "Email",
  pdf: "PDF",
  payment: "Pagamento",
  booking: "Agenda",
  system: "Sistema",
};

const statusLabels: Record<OperationalStatus, string> = {
  success: "OK",
  warning: "Atencao",
  error: "Erro",
};

const AreaIcon = ({ area, className }: { area: OperationalArea; className?: string }) => {
  const icons: Record<OperationalArea, typeof Activity> = {
    email: Mail,
    pdf: FileText,
    payment: ReceiptText,
    booking: CalendarCheck,
    system: Activity,
  };
  const Icon = icons[area];
  return <Icon className={className} />;
};

const statusClass = (status: OperationalStatus) =>
  ({
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
  })[status];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const OperationalEventsPanel = () => {
  const [logs, setLogs] = useState<OperationalLogEvent[]>([]);
  const [areaFilter, setAreaFilter] = useState<OperationalArea | "all">("all");

  const refresh = () => setLogs(readOperationalLogs());

  useEffect(() => {
    refresh();
    window.addEventListener("operational-logs-updated", refresh);
    return () => window.removeEventListener("operational-logs-updated", refresh);
  }, []);

  const summary = useMemo(() => summarizeOperationalLogs(logs), [logs]);
  const filteredLogs = useMemo(
    () => logs.filter((log) => areaFilter === "all" || log.area === areaFilter),
    [areaFilter, logs],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Operacao</h1>
            <p className="text-sm text-muted-foreground">Eventos tecnicos salvos neste navegador</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl text-destructive hover:text-destructive" onClick={clearOperationalLogs}>
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Eventos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Falhas</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{summary.errorCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Alertas</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{summary.warningCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Sucessos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.successCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "booking", "payment", "email", "pdf", "system"] as const).map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => setAreaFilter(area)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              areaFilter === area ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {area === "all" ? "Todos" : `${areaLabels[area]} (${summary.byArea[area]})`}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
          <p className="font-semibold text-foreground">Nenhum evento registrado</p>
          <p className="mt-1 text-sm text-muted-foreground">Falhas de email, PDF, pagamento e agenda vao aparecer aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                    <AreaIcon area={log.area} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <Badge variant="outline" className={cn("border", statusClass(log.status))}>
                        {log.status === "error" ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                        {statusLabels[log.status]}
                      </Badge>
                      <Badge variant="outline">{areaLabels[log.area]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{log.message}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(log.createdAt)}
                </div>
              </div>

              {log.context && Object.keys(log.context).length > 0 && (
                <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(log.context).map(([key, value]) => (
                    <div key={key} className="min-w-0 rounded-xl bg-muted/45 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/55">{key}</p>
                      <p className="mt-0.5 truncate text-xs font-medium text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
