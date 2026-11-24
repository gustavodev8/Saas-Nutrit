import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMealCalorieTargets,
  MealSection,
  sumFoods,
  type EditorMeal,
} from "@/components/admin/MealTableEditor";
import { calculateFoodMacros } from "@/lib/calculateFoodMacros";
import { mealAdherence } from "@/lib/mealAdherence";
import { summarizeWorkspaceMealPlan } from "@/lib/workspaceMealPlanSummary";
import type { AlternativeMeal, MealFood } from "@/lib/supabase";
import type { WorkspaceMeal, WorkspaceMealFood, WorkspaceMealPlanInput } from "@/lib/workspaceMealPlans";

interface WorkspaceMealPlanEditorProps {
  workspaceId: string;
  scopeKey: string;
  initialPlan: WorkspaceMealPlanInput;
  onSave: (input: WorkspaceMealPlanInput) => Promise<void>;
  saving?: boolean;
  onAutosave?: (input: WorkspaceMealPlanInput) => Promise<void>;
  canAutosave?: boolean;
}

function clonePlan(plan: WorkspaceMealPlanInput): WorkspaceMealPlanInput {
  return {
    ...plan,
    meals: plan.meals.map((meal) => ({
      ...meal,
      foods: (meal.foods ?? []).map((food) => ({ ...food })),
      alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
        ...alternative,
        foods: (alternative.foods ?? []).map((food) => ({ ...food })),
      })),
      substitution_items: (meal.substitution_items ?? []).map((item) => ({ ...item })),
    })),
  };
}

function displayNumber(value?: number): string {
  return value == null ? "" : String(value);
}

function numeric(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

const nutritionNumber = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function toEditorMeal(meal: WorkspaceMeal): EditorMeal {
  // Keep workspace and row identifiers on the runtime object while adapting the
  // legacy editor's public shape; MealSection updates nested foods by spreading.
  return {
    ...meal,
    foods: (meal.foods ?? []).map((food) => ({ ...food })),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => ({ ...food })),
    })),
    substitution_items: (meal.substitution_items ?? []).map((item) => ({ ...item })),
  } as EditorMeal;
}

function fromEditorMeal(meal: EditorMeal, current: WorkspaceMeal, index: number): WorkspaceMeal {
  return {
    ...current,
    ...meal,
    workspace_id: current.workspace_id,
    plan_id: current.plan_id,
    id: current.id,
    sort_order: index,
    foods: (meal.foods ?? []).map((food) => ({ ...food })),
    alternative_meals: (meal.alternative_meals ?? []).map((alternative) => ({
      ...alternative,
      foods: (alternative.foods ?? []).map((food) => ({ ...food })),
    })) as AlternativeMeal[],
    substitution_items: (meal.substitution_items ?? []).map((item) => ({ ...item })),
  };
}

function blankMeal(plan: WorkspaceMealPlanInput): WorkspaceMeal {
  const template = plan.meals[0];
  return {
    workspace_id: template?.workspace_id ?? "",
    plan_id: plan.id ?? template?.plan_id ?? 0,
    meal_name: `Refeição ${plan.meals.length + 1}`,
    foods: [],
    alternative_meals: [],
    substitution_items: [],
    sort_order: plan.meals.length,
  };
}

export function WorkspaceMealPlanEditor({ workspaceId, scopeKey, initialPlan, onSave, saving = false, onAutosave, canAutosave = false }: WorkspaceMealPlanEditorProps) {
  const [draft, setDraft] = useState(() => clonePlan(initialPlan));
  const [error, setError] = useState("");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const lastSavedSnapshotRef = useRef<string>("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutosaveRef = useRef(onAutosave);
  onAutosaveRef.current = onAutosave;
  const summary = useMemo(() => summarizeWorkspaceMealPlan(draft), [draft]);
  const mainTotals = useMemo(() => sumFoods(draft.meals.flatMap((meal) =>
    (meal.foods ?? []).map((food) => calculateFoodMacros(food)),
  )), [draft.meals]);
  const calorieTargets = useMemo(
    () => getMealCalorieTargets(draft.meals, draft.daily_calories),
    [draft.meals, draft.daily_calories],
  );

  useEffect(() => {
    setDraft(clonePlan(initialPlan));
    setError("");
    lastSavedSnapshotRef.current = JSON.stringify(initialPlan);
    setAutosaveState("idle");
  }, [initialPlan, scopeKey]);

  useEffect(() => {
    if (!canAutosave) return;
    const serialized = JSON.stringify(draft);
    if (serialized === lastSavedSnapshotRef.current) return; // nada mudou
    if (saving) return; // não concorrer com salvamento manual
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const fn = onAutosaveRef.current;
      if (!fn) return;
      setAutosaveState("saving");
      void fn(draft)
        .then(() => {
          lastSavedSnapshotRef.current = serialized;
          setAutosaveState("saved");
          setLastSavedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        })
        .catch(() => setAutosaveState("error"));
    }, 2500);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [draft, canAutosave, saving]);

  const updateMeal = (index: number, updated: EditorMeal) => setDraft((current) => ({
    ...current,
    meals: current.meals.map((meal, mealIndex) => mealIndex === index
      ? fromEditorMeal(updated, meal, index)
      : meal),
  }));

  const moveMeal = (index: number, direction: -1 | 1) => setDraft((current) => {
    const target = index + direction;
    if (target < 0 || target >= current.meals.length) return current;
    const meals = [...current.meals];
    [meals[index], meals[target]] = [meals[target], meals[index]];
    return { ...current, meals: meals.map((meal, mealIndex) => ({ ...meal, sort_order: mealIndex })) };
  });

  const duplicateMeal = (index: number) => setDraft((current) => {
    const original = current.meals[index];
    const clone: WorkspaceMeal = {
      ...original,
      id: undefined,
      meal_name: `${original.meal_name} (cópia)`,
      foods: (original.foods ?? []).map((food: WorkspaceMealFood) => {
        const { id: _foodId, ...rest } = food;
        return rest;
      }),
      alternative_meals: (original.alternative_meals ?? []).map((alt) => ({
        ...alt,
        foods: (alt.foods ?? []).map((food) => ({ ...food })),
      })) as AlternativeMeal[],
      substitution_items: (original.substitution_items ?? []).map((item) => ({ ...item })),
    };
    const meals = [...current.meals];
    meals.splice(index + 1, 0, clone);
    return { ...current, meals: meals.map((meal, mealIndex) => ({ ...meal, sort_order: mealIndex })) };
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setError("");
    try {
      await onSave(draft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o plano.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <section className="grid gap-4 rounded-md border bg-background p-5 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="workspace-plan-title">Título do plano</Label><Input id="workspace-plan-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-start">Início</Label><Input id="workspace-plan-start" type="date" value={draft.start_date ?? ""} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-end">Fim</Label><Input id="workspace-plan-end" type="date" value={draft.end_date ?? ""} onChange={(event) => setDraft({ ...draft, end_date: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-calories">Calorias diárias</Label><Input id="workspace-plan-calories" type="number" min="0" step="any" value={displayNumber(draft.daily_calories)} onChange={(event) => setDraft({ ...draft, daily_calories: numeric(event.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-strategy">Estratégia</Label><Input id="workspace-plan-strategy" value={draft.strategy_type ?? ""} onChange={(event) => setDraft({ ...draft, strategy_type: event.target.value })} placeholder="manutenção, déficit..." /></div>
        <div className="space-y-1 sm:col-span-2"><Label htmlFor="workspace-plan-notes">Observações</Label><textarea id="workspace-plan-notes" className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-protein-target">Meta de proteínas (g/dia)</Label><Input id="workspace-plan-protein-target" type="number" min="0" step="any" value={displayNumber(draft.target_protein_g)} onChange={(event) => setDraft({ ...draft, target_protein_g: numeric(event.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-carbs-target">Meta de carboidratos (g/dia)</Label><Input id="workspace-plan-carbs-target" type="number" min="0" step="any" value={displayNumber(draft.target_carbs_g)} onChange={(event) => setDraft({ ...draft, target_carbs_g: numeric(event.target.value) })} /></div>
        <div className="space-y-1"><Label htmlFor="workspace-plan-fat-target">Meta de gorduras (g/dia)</Label><Input id="workspace-plan-fat-target" type="number" min="0" step="any" value={displayNumber(draft.target_fat_g)} onChange={(event) => setDraft({ ...draft, target_fat_g: numeric(event.target.value) })} /></div>
      </section>

      <section aria-labelledby="workspace-plan-summary-title" className="space-y-3">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo nutricional</p><h2 id="workspace-plan-summary-title" className="text-lg font-semibold">Totais das refeições principais</h2><p className="text-xs text-muted-foreground">Opções e substituições não são somadas ao total diário.</p></div>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Energia", value: mainTotals.cal, unit: "kcal", target: draft.daily_calories ?? draft.target_calories },
            { label: "Proteínas", value: mainTotals.prot, unit: "g", target: draft.target_protein_g },
            { label: "Carboidratos", value: mainTotals.carbs, unit: "g", target: draft.target_carbs_g },
            { label: "Gorduras", value: mainTotals.fat, unit: "g", target: draft.target_fat_g },
          ].map((item: { label: string; value: number; unit: string; target?: number }) => {
            const adh = mealAdherence(item.value, item.target);
            const barColor = adh.status === "under" ? "bg-amber-500" : adh.status === "over" ? "bg-red-500" : "bg-green-500";
            return (
              <div key={item.label} className="rounded-md border bg-background p-3">
                <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{nutritionNumber.format(item.value)} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></dd>
                {adh.status !== "none" && item.target != null ? (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${adh.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">meta {nutritionNumber.format(item.target)} {item.unit} · {Math.round(adh.rawPct)}%</p>
                  </>
                ) : null}
              </div>
            );
          })}
        </dl>
        <div aria-label="Alertas de consistência" className="space-y-2">
          {summary.alerts.map((alert) => (
            <div key={alert.id} role="status" className={`flex gap-2 rounded-md border p-3 text-sm ${alert.type === "danger" ? "border-destructive/40 bg-destructive/5 text-destructive" : alert.type === "warning" ? "border-amber-300 bg-amber-50 text-amber-950" : "border-sky-200 bg-sky-50 text-sky-950"}`}>
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p><span className="font-semibold">{alert.category}:</span> {alert.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Construção do cardápio</p><h2 className="text-lg font-semibold">Refeições e opções</h2></div>
          <Button type="button" variant="outline" onClick={() => setDraft((current) => ({ ...current, meals: [...current.meals, blankMeal(current)] }))}><Plus size={15} />Nova refeição</Button>
        </div>
        {draft.meals.map((meal, index) => {
          const editorMeal = toEditorMeal(meal);
          return (
            <div key={`${scopeKey}:${meal.id ?? "new"}:${index}`} className="relative">
              <div className="absolute right-16 top-4 z-10 flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label={`Subir refeição ${index + 1}`} onClick={() => moveMeal(index, -1)}><ChevronUp size={16} /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Descer refeição ${index + 1}`} onClick={() => moveMeal(index, 1)}><ChevronDown size={16} /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Duplicar refeição ${index + 1}`} onClick={() => duplicateMeal(index)}><Copy size={16} /></Button>
              </div>
              <MealSection
                meal={editorMeal}
                idx={index}
                targetCalories={calorieTargets[index]?.targetCalories}
                resetKey={`${scopeKey}:${meal.id ?? "new"}:${index}`}
                storageScope={workspaceId}
                onUpdate={(updated) => updateMeal(index, updated)}
                onRemove={() => setDraft((current) => ({ ...current, meals: current.meals.filter((_, mealIndex) => mealIndex !== index).map((item, mealIndex) => ({ ...item, sort_order: mealIndex })) }))}
              />
            </div>
          );
        })}
      </section>
      <div className="flex justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {autosaveState === "saving" ? "Salvando..." : autosaveState === "saved" ? `Salvo automaticamente às ${lastSavedAt}` : autosaveState === "error" ? "Falha ao salvar automaticamente" : ""}
        </span>
        <Button type="submit" disabled={saving}><Save size={16} />{saving ? "Salvando..." : "Salvar plano alimentar"}</Button></div>
    </form>
  );
}
