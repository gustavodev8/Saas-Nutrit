import { useMemo, useState } from "react";
import { Info, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_OPTIONS,
  applyAdjustment,
  calcEnergy,
  canUseCunningham,
  type ActivityLevel,
  type EnergyFormula,
  type EnergyInput,
  type EnergyResult,
} from "@/lib/energyUtils";

/**
 * Estado + derivados do motor de gasto energético (TMB/GET + ajuste).
 * Compartilhado entre o editor do admin e o do workspace.
 */
export interface EnergyPlanningState {
  formula: EnergyFormula;
  setFormula: (formula: EnergyFormula) => void;
  activity: ActivityLevel;
  setActivity: (activity: ActivityLevel) => void;
  adjustment: number;
  setAdjustment: (adjustment: number) => void;
  cunninghamAvailable: boolean;
  resolvedFormula: EnergyFormula;
  result: EnergyResult | null;
  suggestedKcal: number | null;
}

export function useEnergyPlanning(energyInput: EnergyInput | null): EnergyPlanningState {
  const [formula, setFormula] = useState<EnergyFormula>("mifflin");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [adjustment, setAdjustment] = useState(0);
  return useMemo(() => {
    const cunninghamAvailable = energyInput ? canUseCunningham(energyInput) : false;
    const resolvedFormula: EnergyFormula = formula === "cunningham" && !cunninghamAvailable ? "mifflin" : formula;
    const result = energyInput ? calcEnergy(energyInput, resolvedFormula, activity) : null;
    const suggestedKcal = result ? applyAdjustment(result.get, adjustment) : null;
    return {
      formula, setFormula, activity, setActivity, adjustment, setAdjustment,
      cunninghamAvailable, resolvedFormula, result, suggestedKcal,
    };
  }, [energyInput, formula, activity, adjustment]);
}

interface EnergyEnginePanelProps {
  energyInput: EnergyInput | null;
  state: EnergyPlanningState;
  onApply: (kcal: number) => void;
  /** Id da avaliação usada no cálculo (exibido no rodapé). */
  measurementId?: number;
  emptyMessage?: string;
}

const FORMULA_LABELS: Record<EnergyFormula, string> = {
  mifflin: "Mifflin-St Jeor",
  harris_benedict: "Harris-Benedict",
  cunningham: "Cunningham (MLG)",
};

export function EnergyEnginePanel({ energyInput, state, onApply, measurementId, emptyMessage }: EnergyEnginePanelProps) {
  const { adjustment, result, suggestedKcal, resolvedFormula, cunninghamAvailable } = state;
  const formulas: EnergyFormula[] = cunninghamAvailable
    ? ["mifflin", "harris_benedict", "cunningham"]
    : ["mifflin", "harris_benedict"];

  return (
    <section className="bg-card border border-border/60 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/60 bg-muted/30">
        <Zap size={14} className="text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Motor de Gasto Energético</p>
      </div>

      {!energyInput || !result ? (
        <div className="flex items-center gap-2.5 px-5 py-4 text-sm text-muted-foreground">
          <Info size={14} className="shrink-0" />
          {emptyMessage ?? "Registre uma avaliação antropométrica com peso, altura e gênero do paciente para calcular o GET automaticamente."}
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fórmula</Label>
              <div className="flex gap-2 flex-wrap">
                {formulas.map((val) => (
                  <button key={val} type="button" onClick={() => state.setFormula(val)}
                    className={cn("flex-1 h-8 rounded-md text-xs font-medium border transition-all min-w-[120px]",
                      resolvedFormula === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50")}>
                    {FORMULA_LABELS[val]}
                  </button>
                ))}
              </div>
              {cunninghamAvailable && resolvedFormula === "cunningham" && (
                <p className="text-[10px] text-muted-foreground">
                  MLG: <strong className="text-foreground">{energyInput.lean_mass} kg</strong> — TMB = 500 + 22 × MLG
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nível de atividade</Label>
              <select
                value={state.activity}
                onChange={(e) => state.setActivity(e.target.value as ActivityLevel)}
                className="w-full h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              >
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label} — {o.description}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted/40 border border-border/60 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">TMB</p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-0.5">{result.tmb} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">GET</p>
              <p className="text-xl font-bold tabular-nums text-foreground mt-0.5">{result.get} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
            </div>

            <div className="sm:col-span-2 rounded-lg bg-muted/40 border border-border/60 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {adjustment < 0 ? "Déficit" : adjustment > 0 ? "Superávit" : "Manutenção"}
                </p>
                <span className={cn("text-xs font-bold tabular-nums",
                  adjustment < 0 ? "text-blue-600" : adjustment > 0 ? "text-emerald-600" : "text-muted-foreground")}>
                  {adjustment > 0 ? "+" : ""}{adjustment}%
                </span>
              </div>
              <input type="range" min={-40} max={40} step={5} value={adjustment}
                aria-label="Ajuste calórico"
                onChange={(e) => state.setAdjustment(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer" />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>−40% (corte agressivo)</span><span>+40% (bulk)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/60 flex-wrap">
            <div className="flex items-center gap-3">
              {adjustment < 0 ? <TrendingDown size={16} className="text-blue-500 shrink-0" /> : adjustment > 0 ? <TrendingUp size={16} className="text-emerald-500 shrink-0" /> : <Zap size={16} className="text-primary shrink-0" />}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Meta calórica sugerida</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{suggestedKcal} <span className="text-sm font-normal text-muted-foreground">kcal/dia</span></p>
              </div>
            </div>
            <Button type="button" size="sm" variant="outline"
              onClick={() => { if (suggestedKcal != null) onApply(suggestedKcal); }}
              className="gap-1.5 shrink-0">
              Aplicar ao plano
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Calculado com: {energyInput.weight} kg · {energyInput.height} cm · {energyInput.age} anos · {energyInput.gender === "F" ? "Feminino" : "Masculino"}
            {energyInput.lean_mass ? ` · MLG ${energyInput.lean_mass} kg` : ""}
            {" "}— avaliação mais recente
            {measurementId != null && (
              <span className="ml-1 opacity-50">(avaliação #{measurementId})</span>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
