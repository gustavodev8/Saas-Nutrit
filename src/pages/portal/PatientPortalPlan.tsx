import { useEffect, useState } from "react";
import { Flame, Soup } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PatientPortalDisabledState from "@/components/patient/PatientPortalDisabledState";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";
import {
  fetchFullMealPlan,
  fetchMealPlans,
  type Meal,
  type MealPlan,
} from "@/lib/supabase";

export default function PatientPortalPlan() {
  const { patient } = usePatientPortalAuth();
  const { settings } = usePatientPortalSettings();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    if (!patient?.id) {
      return;
    }

    setLoading(true);
    fetchMealPlans(patient.id)
      .then((nextPlans) => {
        setPlans(nextPlans);
        setSelectedPlanId(nextPlans[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [patient?.id]);

  useEffect(() => {
    if (!selectedPlanId) {
      setMeals([]);
      return;
    }

    void fetchFullMealPlan(selectedPlanId).then(setMeals);
  }, [selectedPlanId]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const visibleSections = [
    settings.plan.summary,
    settings.plan.goals,
    settings.plan.meals,
  ].filter(Boolean).length;

  if (!settings.navigation.plan) {
    return (
      <PatientPortalDisabledState
        title="Plano temporariamente oculto"
        description="O responsavel pelo portal retirou este modulo da navegacao."
      />
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Meu plano</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Seu plano alimentar atual
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize refeicoes, orientacoes e metas liberadas para voce.
        </p>
      </section>

      {plans.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlanId(plan.id ?? null)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                plan.id === selectedPlanId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground"
              }`}
            >
              {plan.title}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Carregando plano alimentar...
          </CardContent>
        </Card>
      ) : null}

      {!loading && !selectedPlan ? (
        <Card className="rounded-3xl border-dashed border-border/80">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhum plano alimentar foi liberado ainda.
          </CardContent>
        </Card>
      ) : null}

      {selectedPlan ? (
        <>
          {(settings.plan.summary || settings.plan.goals) ? (
            <div className={`grid gap-4 ${settings.plan.summary && settings.plan.goals ? "md:grid-cols-3" : "md:grid-cols-1"}`}>
              {settings.plan.summary ? (
                <Card className={`rounded-3xl border-border/60 ${settings.plan.goals ? "md:col-span-2" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Soup size={18} />
                      <CardTitle className="text-lg">{selectedPlan.title}</CardTitle>
                    </div>
                    <CardDescription>
                      {settings.plan.notes
                        ? selectedPlan.notes?.trim() || "Seu nutricionista pode atualizar orientacoes gerais neste plano."
                        : "Resumo principal do plano liberado para acompanhamento."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : null}

              {settings.plan.goals ? (
                <Card className="rounded-3xl border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Flame size={18} />
                      <CardTitle className="text-lg">Metas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {settings.plan.calories ? (
                      <p>
                        <span className="font-semibold">Calorias:</span>{" "}
                        {selectedPlan.daily_calories ?? selectedPlan.target_calories ?? "Nao informado"}
                      </p>
                    ) : null}
                    {settings.plan.macros ? (
                      <>
                        <p>
                          <span className="font-semibold">Proteina:</span>{" "}
                          {selectedPlan.target_protein_g ?? "Nao informado"} g
                        </p>
                        <p>
                          <span className="font-semibold">Carboidratos:</span>{" "}
                          {selectedPlan.target_carbs_g ?? "Nao informado"} g
                        </p>
                        <p>
                          <span className="font-semibold">Gorduras:</span>{" "}
                          {selectedPlan.target_fat_g ?? "Nao informado"} g
                        </p>
                      </>
                    ) : null}
                    {!settings.plan.calories && !settings.plan.macros ? (
                      <p className="text-muted-foreground">Os detalhes nutricionais foram ocultados pelo admin.</p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}

          {settings.plan.meals ? (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <Card key={meal.id ?? `${meal.meal_name}-${index}`} className="rounded-3xl border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {meal.meal_name || `Refeicao ${index + 1}`}
                    </CardTitle>
                    <CardDescription>
                      {meal.time_suggestion?.trim() || "Horario livre"}
                      {settings.plan.notes && meal.notes?.trim() ? ` - ${meal.notes}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(meal.foods ?? []).length > 0 ? (
                      <div className="space-y-2">
                        {(meal.foods ?? []).map((food, foodIndex) => (
                          <div
                            key={`${food.food_name}-${foodIndex}`}
                            className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-foreground">{food.food_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {food.quantity ?? "Quantidade livre"} {food.unit ?? ""}
                              {settings.plan.notes && food.notes?.trim() ? ` - ${food.notes}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum alimento detalhado nesta refeicao.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          {visibleSections === 0 ? (
            <Card className="rounded-3xl border-dashed border-border/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                O modulo esta ativo, mas os blocos deste plano foram ocultados pelo admin.
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
