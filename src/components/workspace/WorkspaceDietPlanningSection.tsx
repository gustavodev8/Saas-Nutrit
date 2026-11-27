import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DietaryPlanningPanel } from "@/components/admin/DietaryPlanningPanel";
import { EnergyEnginePanel, useEnergyPlanning } from "@/components/diet/EnergyEnginePanel";
import type { EnergyInput } from "@/lib/energyUtils";
import { getMealNutritionTargets, type MacroGoals } from "@/lib/planningUtils";

/** Dados antropométricos/clínicos usados pelo motor energético do workspace. */
export interface WorkspaceEnergyProfile {
  weightKg?: number;
  heightCm?: number;
  leanMassKg?: number | null;
  ageYears?: number;
  gender?: "M" | "F";
  measurementId?: number;
}

export interface WorkspaceMacroTargetsPatch {
  daily_calories?: number;
  target_calories?: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
}

interface WorkspaceDietPlanningSectionProps {
  profile: WorkspaceEnergyProfile | null;
  dailyCalories?: number;
  actual: { cal: number; prot: number; carbs: number; fat: number };
  meals: Array<{ meal_name: string; time_suggestion?: string }>;
  onApplyCalories: (kcal: number) => void;
  onApplyMacroTargets: (patch: WorkspaceMacroTargetsPatch) => void;
}

const n0 = (value: number) => Math.round(value).toString();

function toEnergyInput(profile: WorkspaceEnergyProfile | null): EnergyInput | null {
  if (!profile?.weightKg || !profile.heightCm || !profile.gender || !profile.ageYears) return null;
  return {
    weight: profile.weightKg,
    height: profile.heightCm,
    age: profile.ageYears,
    gender: profile.gender,
    lean_mass: profile.leanMassKg ?? null,
  };
}

export function WorkspaceDietPlanningSection({
  profile, dailyCalories, actual, meals, onApplyCalories, onApplyMacroTargets,
}: WorkspaceDietPlanningSectionProps) {
  const energyInput = useMemo(() => toEnergyInput(profile), [profile]);
  const energy = useEnergyPlanning(energyInput);
  const [goals, setGoals] = useState<MacroGoals | null>(null);
  const mealTargets = useMemo(() => (goals ? getMealNutritionTargets(meals, goals) : []), [goals, meals]);

  return (
    <div className="space-y-4" aria-label="Planejamento dietético">
      <EnergyEnginePanel
        energyInput={energyInput}
        state={energy}
        onApply={onApplyCalories}
        measurementId={profile?.measurementId}
        emptyMessage="Registre uma avaliação antropométrica com peso e altura, e informe data de nascimento e sexo do paciente, para calcular o GET automaticamente."
      />
      <DietaryPlanningPanel
        weightKg={profile?.weightKg}
        totalKcal={dailyCalories}
        actual={actual}
        onGoalsChange={setGoals}
      />
      {goals && (
        <section className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Distribuição por refeição</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onApplyMacroTargets({
                daily_calories: goals.calories,
                target_calories: goals.calories,
                target_protein_g: goals.protein_g,
                target_carbs_g: goals.carbs_g,
                target_fat_g: goals.fat_g,
              })}
            >
              Aplicar metas ao plano
            </Button>
          </div>
          {mealTargets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 pr-3 font-medium">Refeição</th>
                    <th className="py-1 px-2 text-right font-medium">kcal</th>
                    <th className="py-1 px-2 text-right font-medium">PTN (g)</th>
                    <th className="py-1 px-2 text-right font-medium">CHO (g)</th>
                    <th className="py-1 pl-2 text-right font-medium">LIP (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {mealTargets.map((target, index) => (
                    <tr key={`${target.meal_name}:${index}`} className="border-t border-border/50">
                      <td className="py-1.5 pr-3">{target.meal_name}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{n0(target.calories)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{n0(target.protein_g)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{n0(target.carbs_g)}</td>
                      <td className="py-1.5 pl-2 text-right tabular-nums">{n0(target.fat_g)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
