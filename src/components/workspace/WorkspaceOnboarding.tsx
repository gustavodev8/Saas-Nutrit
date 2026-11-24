import { useEffect, useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

type Step = {
  key: string;
  label: string;
  hint: string;
  done: boolean;
};

type Props = {
  workspaceId: string;
};

export function WorkspaceOnboarding({ workspaceId }: Props) {
  const [steps, setSteps] = useState<Step[]>([
    { key: "patient",     label: "Cadastre seu primeiro paciente",   hint: "Vá em Pacientes → Novo paciente", done: false },
    { key: "meal_plan",   label: "Crie um plano alimentar",          hint: "Acesse Planos → Novo plano",      done: false },
    { key: "measurement", label: "Registre uma medição",             hint: "No perfil do paciente → Medições", done: false },
  ]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = `onboarding_dismissed_${workspaceId}`;
    if (localStorage.getItem(key) === "1") {
      setDismissed(true);
      setLoading(false);
      return;
    }

    async function check() {
      const [{ count: patients }, { count: plans }, { count: measurements }] = await Promise.all([
        workspaceSupabase
          .from("patients")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        workspaceSupabase
          .from("meal_plans")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        workspaceSupabase
          .from("measurements")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
      ]);

      setSteps([
        { key: "patient",     label: "Cadastre seu primeiro paciente",   hint: "Vá em Pacientes → Novo paciente",   done: (patients ?? 0) > 0 },
        { key: "meal_plan",   label: "Crie um plano alimentar",          hint: "Acesse Planos → Novo plano",        done: (plans ?? 0) > 0 },
        { key: "measurement", label: "Registre uma medição",             hint: "No perfil do paciente → Medições",  done: (measurements ?? 0) > 0 },
      ]);
      setLoading(false);
    }

    void check();
  }, [workspaceId]);

  function dismiss() {
    localStorage.setItem(`onboarding_dismissed_${workspaceId}`, "1");
    setDismissed(true);
  }

  const allDone = steps.every((s) => s.done);

  if (loading || dismissed || allDone) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section aria-label="Primeiros passos" className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/40 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Primeiros passos</p>
          <p className="text-xs text-muted-foreground">{doneCount} de {steps.length} concluídos</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {steps.map((step) => (
          <li key={step.key} className="flex min-w-0 items-start gap-3 px-4 py-3">
            <span className={`mt-0.5 shrink-0 ${step.done ? "text-primary" : "text-muted-foreground"}`}>
              {step.done
                ? <CheckCircle2 size={18} aria-hidden="true" />
                : <Circle size={18} aria-hidden="true" />
              }
            </span>
            <div className="min-w-0">
              <p className={`break-words text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="mt-0.5 break-words text-xs text-muted-foreground">{step.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
