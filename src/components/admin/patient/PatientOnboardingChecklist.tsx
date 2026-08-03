import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { onboardingProgress, type PatientOnboardingItem } from "@/lib/patientOnboarding";

interface PatientOnboardingChecklistProps {
  items: PatientOnboardingItem[];
  onOpenItem: (item: PatientOnboardingItem) => void;
}

export function PatientOnboardingChecklist({ items, onOpenItem }: PatientOnboardingChecklistProps) {
  const progress = onboardingProgress(items);
  const pendingItems = items.filter((item) => !item.completed);

  return (
    <section className="rounded-3xl border border-border bg-background p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            Onboarding do paciente
          </p>
          <h3 className="mt-1 text-base font-black text-foreground">Checklist de prontuario</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {progress.completed} de {progress.total} etapas concluidas.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ClipboardCheck size={20} />
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {pendingItems.length === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          Prontuario pronto para acompanhamento recorrente.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onOpenItem(item)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                  item.completed
                    ? "border-emerald-100 bg-emerald-50/70 text-emerald-900"
                    : "border-border bg-card hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                <Icon
                  size={16}
                  className={cn("mt-0.5 shrink-0", item.completed ? "text-emerald-600" : "text-muted-foreground")}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                {!item.completed && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hidden h-8 shrink-0 rounded-xl px-2 text-xs sm:inline-flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenItem(item);
                    }}
                  >
                    {item.actionLabel}
                  </Button>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
