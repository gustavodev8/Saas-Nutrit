import {
  ArrowRight,
  ClipboardList,
  FileWarning,
  HeartPulse,
  ListTodo,
  TimerReset,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OperationalFocusCounts {
  overdueReturns: number;
  inactivePatients: number;
  withoutPlan: number;
  pendingExams: number;
}

type OperationalItemTone = "default" | "warning" | "danger" | "success";

interface OperationalFocusItem {
  id: string;
  patientName: string;
  title: string;
  description: string;
  actionLabel: string;
  route: string;
  tone?: OperationalItemTone;
}

interface OperationalFocusPanelProps {
  counts: OperationalFocusCounts;
  items: OperationalFocusItem[];
  onOpen(route: string): void;
  className?: string;
  maxItems?: number;
}

const metricCards = [
  {
    key: "overdueReturns",
    label: "Retornos vencidos",
    icon: TimerReset,
  },
  {
    key: "inactivePatients",
    label: "Inativos 30d+",
    icon: HeartPulse,
  },
  {
    key: "withoutPlan",
    label: "Sem plano ativo",
    icon: ClipboardList,
  },
  {
    key: "pendingExams",
    label: "Exames pendentes",
    icon: FileWarning,
  },
] as const satisfies ReadonlyArray<{
  key: keyof OperationalFocusCounts;
  label: string;
  icon: typeof TimerReset;
}>;

const toneStyles: Record<OperationalItemTone, string> = {
  default: "border-border/70 bg-background",
  warning: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20",
  danger: "border-rose-200/80 bg-rose-50/70 dark:border-rose-900/70 dark:bg-rose-950/20",
  success: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/70 dark:bg-emerald-950/20",
};

export function OperationalFocusPanel({
  counts,
  items,
  onOpen,
  className,
  maxItems = 5,
}: OperationalFocusPanelProps) {
  const priorityItems = items.slice(0, maxItems);
  const totalOpenItems = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <Card className={cn("border-border/70 shadow-sm", className)}>
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ListTodo className="h-3.5 w-3.5" />
              Central do dia
            </div>
            <CardTitle className="text-lg">Foco operacional</CardTitle>
            <CardDescription>
              Prioridades do dia para agir rapido sem perder contexto do paciente.
            </CardDescription>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-right">
            <div className="text-2xl font-semibold leading-none text-foreground">
              {totalOpenItems}
            </div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              sinais ativos
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-semibold leading-none text-foreground">
                  {counts[key]}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {priorityItems.length > 0 ? (
          <div className="space-y-3">
            {priorityItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between",
                  toneStyles[item.tone ?? "default"],
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    {item.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.patientName}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpen(item.route)}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {item.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
              <ListTodo className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              Nenhuma prioridade critica agora
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Os indicadores estao sob controle no momento. Quando surgirem pendencias
              operacionais, elas aparecem aqui para orientar a proxima acao.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
