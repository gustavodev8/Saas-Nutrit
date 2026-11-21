import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronRight, Clock, Flame, Utensils,
} from "lucide-react";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchWorkspaceTemplateById, type WorkspaceDietTemplate, type WorkspaceDietTemplateMeal } from "@/lib/workspaceTemplates";

const STRATEGY_LABELS: Record<string, string> = {
  low_carb: "Low Carb",
  mediterranea: "Mediterrânea",
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  ganho_peso: "Ganho de peso",
  vegetariano: "Vegetariano",
  alta_proteina: "Alta proteína",
  maintenance: "Manutenção",
};

function calcMealKcal(meal: WorkspaceDietTemplateMeal): number {
  return (meal.foods ?? []).reduce((sum, f) => {
    return sum + ((f.kcal_per_100g ?? 0) * (f.quantity ?? 0)) / 100;
  }, 0);
}

function MealCard({ meal, defaultOpen }: { meal: WorkspaceDietTemplateMeal; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const kcal = calcMealKcal(meal);
  const isSubstitution = meal.is_substitution_of != null;

  return (
    <div className={cn("border rounded-xl overflow-hidden", isSubstitution && "border-dashed border-muted-foreground/40")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg p-1.5", isSubstitution ? "bg-muted" : "bg-[#166b50]/10")}>
            <Utensils size={14} className={isSubstitution ? "text-muted-foreground" : "text-[#166b50]"} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isSubstitution ? (
                <span className="text-muted-foreground">↳ Substituição: </span>
              ) : null}
              {meal.meal_name}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {meal.time_suggestion && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {meal.time_suggestion}
                </span>
              )}
              {kcal > 0 && (
                <span className="flex items-center gap-1">
                  <Flame size={11} /> {Math.round(kcal)} kcal
                </span>
              )}
              <span>{(meal.foods ?? []).length} alimento{(meal.foods ?? []).length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Alimento</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Qtd</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Kcal</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">P</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">C</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">G</th>
              </tr>
            </thead>
            <tbody>
              {(meal.foods ?? []).map((food) => {
                const kcalFood = ((food.kcal_per_100g ?? 0) * (food.quantity ?? 0)) / 100;
                const pFood = ((food.protein_per_100g ?? 0) * (food.quantity ?? 0)) / 100;
                const cFood = ((food.carbs_per_100g ?? 0) * (food.quantity ?? 0)) / 100;
                const fFood = ((food.fat_per_100g ?? 0) * (food.quantity ?? 0)) / 100;
                return (
                  <tr key={food.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-2.5">{food.food_name}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">
                      {food.quantity} {food.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{Math.round(kcalFood)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{pFood.toFixed(1)}g</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{cFood.toFixed(1)}g</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{fFood.toFixed(1)}g</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td className="px-4 py-2 text-xs font-medium text-muted-foreground" colSpan={2}>Subtotal</td>
                <td className="px-4 py-2 text-right text-xs font-semibold">{Math.round(kcal)}</td>
                <td colSpan={3} className="hidden sm:table-cell" />
              </tr>
            </tfoot>
          </table>
          {meal.notes && (
            <p className="px-4 py-2 text-xs text-muted-foreground italic border-t">{meal.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkspaceModeloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<WorkspaceDietTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Optional: patientId for "Usar modelo" flow
  const patientId = searchParams.get("patientId");

  useEffect(() => {
    if (!id) return;
    fetchWorkspaceTemplateById(Number(id)).then((data) => {
      setTemplate(data);
      setLoading(false);
    });
  }, [id]);

  function handleUsarModelo() {
    if (!template) return;
    if (patientId) {
      navigate(`/workspace/patients/${patientId}?tab=planos&templateId=${template.id}`);
    } else {
      navigate(`/workspace/patients?selectFor=template&templateId=${template.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LeafLoader size="lg" label="Carregando modelo…" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-muted-foreground">Modelo não encontrado</p>
        <Link to="/workspace/modelos">
          <Button variant="outline">Voltar aos modelos</Button>
        </Link>
      </div>
    );
  }

  const mainMeals = (template.meals ?? []).filter((m) => m.is_substitution_of == null);
  const substitutions = (template.meals ?? []).filter((m) => m.is_substitution_of != null);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/workspace/modelos" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={14} /> Modelos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{template.name}</span>
      </div>

      {/* Header card */}
      <div className="border rounded-xl p-5 mb-6 bg-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold">{template.name}</h1>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {template.strategy && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#166b50]/10 text-[#166b50] font-medium">
                  {STRATEGY_LABELS[template.strategy] ?? template.strategy}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleUsarModelo}
            className="bg-[#166b50] hover:bg-[#145e45] text-white shrink-0"
          >
            Usar modelo
          </Button>
        </div>

        {/* Totais */}
        {(template.total_kcal || template.protein_g || template.carbs_g || template.fat_g) && (
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t">
            {[
              { label: "Kcal", value: Math.round(template.total_kcal ?? 0), unit: "" },
              { label: "Proteína", value: Math.round(template.protein_g ?? 0), unit: "g" },
              { label: "Carboidratos", value: Math.round(template.carbs_g ?? 0), unit: "g" },
              { label: "Gorduras", value: Math.round(template.fat_g ?? 0), unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">
                  {value}
                  {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refeições */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Refeições — {mainMeals.length} cadastradas
        </h2>
        <div className="flex flex-col gap-3">
          {mainMeals.map((meal, i) => (
            <MealCard key={meal.id} meal={meal} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      {substitutions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Substituições — {substitutions.length}
          </h2>
          <div className="flex flex-col gap-3">
            {substitutions.map((meal) => (
              <MealCard key={meal.id} meal={meal} defaultOpen={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
