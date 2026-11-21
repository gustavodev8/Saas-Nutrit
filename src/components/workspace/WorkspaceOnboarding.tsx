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
    <div className="mb-6 overflow-hidden rounded-xl border border-[#c8ddd2] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf1ed] bg-[#f7faf8] px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-[#153f34]">Primeiros passos</p>
          <p className="text-xs text-[#5c6e66]">{doneCount} de {steps.length} concluídos</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="rounded-md p-1 text-[#8aA09a] transition-colors hover:bg-[#edf1ed] hover:text-[#153f34]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* progress bar */}
      <div className="h-1 w-full bg-[#edf1ed]">
        <div
          className="h-full bg-[#166b50] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="divide-y divide-[#f1f4f2]">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3 px-5 py-3.5">
            <span className={`mt-0.5 shrink-0 ${step.done ? "text-[#166b50]" : "text-[#c0d0cc]"}`}>
              {step.done
                ? <CheckCircle2 size={18} aria-hidden="true" />
                : <Circle size={18} aria-hidden="true" />
              }
            </span>
            <div>
              <p className={`text-sm font-medium ${step.done ? "text-[#8aA09a] line-through" : "text-[#1a2f26]"}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-xs text-[#7a918a]">{step.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
