import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, ChevronDown, ChevronRight, Clock, Flame, Utensils,
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
    <div className={cn("overflow-hidden rounded-md border border-border", isSubstitution && "border-dashed border-muted-foreground/40")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-16 w-full items-center justify-between gap-3 bg-card px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("shrink-0 rounded-md p-1.5", isSubstitution ? "bg-muted" : "bg-primary/10")}>
            <Utensils size={14} className={isSubstitution ? "text-muted-foreground" : "text-primary"} />
          </div>
          <div className="min-w-0">
            <p className="break-words text-sm font-medium text-foreground">
              {isSubstitution ? (
                <span className="text-muted-foreground">↳ Substituição: </span>
              ) : null}
              {meal.meal_name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
        {open ? <ChevronDown size={16} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={16} className="shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[360px] text-sm">
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
                  <tr key={food.id} className="border-t border-border hover:bg-muted/20">
                    <td className="max-w-48 break-words px-4 py-2.5 text-foreground">{food.food_name}</td>
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
  const { templateId: id } = useParams<{ templateId: string }>();
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
      <div className="mx-auto flex min-h-[50vh] w-full max-w-7xl flex-col items-start justify-center gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><BookOpen size={21} aria-hidden="true" /></span>
        <div className="max-w-lg">
          <h1 className="text-lg font-semibold text-foreground">Modelo não encontrado</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Este modelo não está disponível. Consulte a lista para escolher outro protocolo.</p>
        </div>
        <Button asChild variant="outline"><Link to="/workspace/modelos">Voltar aos modelos</Link></Button>
      </div>
    );
  }

  const mainMeals = (template.meals ?? []).filter((m) => m.is_substitution_of == null);
  const substitutions = (template.meals ?? []).filter((m) => m.is_substitution_of != null);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-5 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <Link to="/workspace/modelos" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft size={14} /> Modelos
        </Link>
        <span>/</span>
        <span className="min-w-0 truncate font-medium text-foreground" title={template.name}>{template.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 border-y border-border py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="break-words text-2xl font-semibold text-foreground">{template.name}</h1>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {template.strategy && (
                <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {STRATEGY_LABELS[template.strategy] ?? template.strategy}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={handleUsarModelo}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Usar modelo
          </Button>
        </div>

        {/* Totais */}
        {(template.total_kcal || template.protein_g || template.carbs_g || template.fat_g) && (
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
            {[
              { label: "Kcal", value: Math.round(template.total_kcal ?? 0), unit: "" },
              { label: "Proteína", value: Math.round(template.protein_g ?? 0), unit: "g" },
              { label: "Carboidratos", value: Math.round(template.carbs_g ?? 0), unit: "g" },
              { label: "Gorduras", value: Math.round(template.fat_g ?? 0), unit: "g" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="min-w-0">
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
      <div className="mb-2 max-w-5xl">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Refeições — {mainMeals.length} cadastradas
        </h2>
        <div className="flex flex-col gap-3">
          {mainMeals.map((meal, i) => (
            <MealCard key={meal.id} meal={meal} defaultOpen={i === 0} />
          ))}
          {mainMeals.length === 0 && (
            <p className="border-y border-border py-8 text-sm text-muted-foreground">Este modelo ainda não tem refeições cadastradas.</p>
          )}
        </div>
      </div>

      {substitutions.length > 0 && (
        <div className="mt-6 max-w-5xl">
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
