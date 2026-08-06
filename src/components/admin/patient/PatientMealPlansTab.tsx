import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Plus } from "lucide-react";

import { StrategyModal } from "@/components/admin/StrategyModal";
import { Button } from "@/components/ui/button";
import type { MacroResult, StrategyType } from "@/lib/strategyUtils";
import {
  buildMealPlanEnergyInput,
  buildMealPlanPayload,
  formatMealPlanCardMeta,
  STRATEGY_LABELS,
} from "@/lib/patientMealPlanUtils";
import {
  fetchMealPlans,
  fetchMeasurements,
  type MealPlan,
  type Measurement,
  type Patient,
  upsertMealPlan,
} from "@/lib/supabase";

interface PatientMealPlansTabProps {
  patientId: string;
  patientRouteId: string;
  patient: Patient;
}

export function PatientMealPlansTab({
  patientId,
  patientRouteId,
  patient,
}: PatientMealPlansTabProps) {
  const navigate = useNavigate();
  const pid = Number(patientId);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [latestMeasurement, setLatestMeasurement] = useState<Measurement | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchMealPlans(pid),
      fetchMeasurements(pid).then((measurements) => measurements[0] ?? null),
    ])
      .then(([patientPlans, latest]) => {
        if (!active) return;
        setPlans(patientPlans);
        setLatestMeasurement(latest);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pid]);

  const energyInput = buildMealPlanEnergyInput(patient, latestMeasurement);

  const handleModalConfirm = async (
    title: string,
    strategy: StrategyType | null,
    macros: MacroResult | null,
  ) => {
    setShowModal(false);
    const payload = buildMealPlanPayload({
      patientId: pid,
      title,
      strategy,
      macros,
    });
    const savedPlan = await upsertMealPlan(payload);
    if (savedPlan?.id) {
      navigate(`/admin/pacientes/${patientRouteId}/plano/${savedPlan.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <StrategyModal
          energyInput={energyInput}
          onConfirm={handleModalConfirm}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Planos alimentares
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
              Dietas e estratégias do paciente
            </h2>
            <p className="text-sm text-muted-foreground">
              Crie, revise e acompanhe os planos vinculados ao prontuário.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl h-10 px-5 font-bold shadow-sm"
          >
            <Plus size={16} className="mr-2" /> Novo plano
          </Button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">
              Nenhum plano alimentar criado
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Monte a primeira estratégia alimentar do paciente.
              {latestMeasurement
                ? " Use a última avaliação para estimar metas e macros."
                : " Quando houver medidas, as metas ficam mais rápidas de definir."}
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="mt-5 h-10 rounded-xl px-5 font-bold"
            >
              <Plus size={16} className="mr-2" />
              Criar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {plans.map((plan) => {
              const strategyInfo = plan.strategy_type
                ? STRATEGY_LABELS[plan.strategy_type]
                : null;

              return (
                <div
                  key={plan.id ?? `${plan.patient_id}-${plan.title}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen size={21} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-bold text-foreground">
                        {plan.title || "Plano sem título"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {strategyInfo && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${strategyInfo.cls}`}
                          >
                            {strategyInfo.label}
                          </span>
                        )}
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatMealPlanCardMeta(plan)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      plan.id &&
                      navigate(`/admin/pacientes/${patientRouteId}/plano/${plan.id}`)
                    }
                    disabled={!plan.id}
                    className="h-9 rounded-xl border-border/60 font-bold transition-all hover:border-primary hover:bg-primary hover:text-white"
                  >
                    Abrir plano
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
