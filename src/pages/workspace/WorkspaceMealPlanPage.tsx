import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Printer, Utensils } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WorkspaceMealPlanEditor } from "@/components/workspace/WorkspaceMealPlanEditor";
import { MealPlanPdfOptionsDialog } from "@/components/admin/MealPlanPdfOptionsDialog";
import { generateMealPlanPdf, type MealPlanPdfOptions } from "@/lib/generateMealPlanPdf";
import type { Meal, MealPlan, Patient } from "@/lib/supabase";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { fetchWorkspacePatient, type WorkspacePatient } from "@/lib/workspacePatients";
import {
  fetchWorkspaceMealPlan,
  isWorkspaceMealPlansEnabled,
  saveWorkspaceMealPlan,
  WORKSPACE_MEAL_PLANS_GATE_MESSAGE,
  type WorkspaceMealPlanInput,
} from "@/lib/workspaceMealPlans";

const DEFAULT_MEALS = [
  ["Café da manhã", "07:00 - 08:00"],
  ["Lanche da manhã", "10:00 - 10:30"],
  ["Almoço", "12:00 - 13:00"],
  ["Lanche da tarde", "15:30 - 16:00"],
  ["Jantar", "19:00 - 20:00"],
  ["Ceia", "21:30 - 22:00"],
] as const;

function parseId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function blankPlan(workspaceId: string, patientId: number): WorkspaceMealPlanInput {
  return {
    patient_id: patientId,
    title: "Plano Alimentar",
    meals: DEFAULT_MEALS.map(([meal_name, time_suggestion], sort_order) => ({ workspace_id: workspaceId, plan_id: 0, meal_name, time_suggestion, sort_order, foods: [], alternative_meals: [], substitution_items: [] })),
  };
}

export default function WorkspaceMealPlanPage() {
  const { membership } = useWorkspaceAuth();
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const navigate = useNavigate();
  const workspaceId = membership?.workspaceId ?? null;
  const patientId = useMemo(() => parseId(id), [id]);
  const numericPlanId = useMemo(() => parseId(planId), [planId]);
  const isNew = planId === "novo";
  const enabled = isWorkspaceMealPlansEnabled();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const scopeRef = useRef<string | null>(null);
  const scope = workspaceId && patientId ? `${workspaceId}:${patientId}:${planId ?? ""}` : null;
  scopeRef.current = scope;
  const [snapshot, setSnapshot] = useState<{ scope: string | null; patient: WorkspacePatient | null; plan: WorkspaceMealPlanInput | null }>({ scope: null, patient: null, plan: null });
  const scopedPatient = snapshot.scope === scope ? snapshot.patient : null;
  const scopedPlan = snapshot.scope === scope ? snapshot.plan : null;
  const [pdfScope, setPdfScope] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    if (!enabled || !workspaceId || isNew) return;
    let active = true;
    void (async () => {
      try {
        const { data, error } = await workspaceSupabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle();
        if (active) setIssuer({ id: workspaceId, name: error ? "" : data?.name ?? "" });
      } catch {
        if (active) setIssuer(null);
      }
    })();
    return () => { active = false; };
  }, [enabled, workspaceId, isNew]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setPdfScope(null);
    saveRequestRef.current += 1;
    setLoading(true); setSaving(false); setError(""); setSnapshot({ scope: null, patient: null, plan: null });
    if (!enabled) { setLoading(false); return; }
    if (!workspaceId || patientId == null || (!isNew && numericPlanId == null) || !scope) {
      setLoading(false); setError("Paciente ou plano inválido."); return;
    }
    try {
      const loadedPatient = await fetchWorkspacePatient(workspaceId, patientId);
      const loadedPlan = isNew ? blankPlan(workspaceId, patientId) : await fetchWorkspaceMealPlan(workspaceId, patientId, numericPlanId as number);
      if (requestId !== requestRef.current) return;
      if (loadedPatient.workspace_id !== workspaceId || loadedPatient.id !== patientId ||
          loadedPlan.patient_id !== patientId || (!isNew && (
            !("workspace_id" in loadedPlan) || loadedPlan.workspace_id !== workspaceId || loadedPlan.id !== numericPlanId
          ))) throw new Error("Plano ou paciente fora do workspace ativo.");
      setSnapshot({ scope, patient: loadedPatient, plan: loadedPlan });
    } catch (loadError) {
      if (requestId === requestRef.current) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o plano.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [enabled, isNew, numericPlanId, patientId, scope, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (input: WorkspaceMealPlanInput) => {
    if (!workspaceId || patientId == null || !scopedPatient || scopedPatient.workspace_id !== workspaceId) throw new Error("Paciente fora do workspace ativo.");
    const saveRequestId = ++saveRequestRef.current;
    const saveScope = scope;
    setSaving(true); setError("");
    try {
      const savedId = await saveWorkspaceMealPlan(workspaceId, patientId, input);
      if (saveRequestId !== saveRequestRef.current || scopeRef.current !== saveScope) return;
      if (!isNew && savedId === numericPlanId) await load();
      else navigate(`/workspace/patients/${patientId}/plan/${savedId}`, { replace: true });
    } catch (saveError) {
      if (saveRequestId !== saveRequestRef.current || scopeRef.current !== saveScope) throw saveError;
      const message = saveError instanceof Error ? saveError.message : "Não foi possível salvar o plano.";
      setError(message);
      throw saveError;
    } finally {
      if (saveRequestId === saveRequestRef.current && scopeRef.current === saveScope) setSaving(false);
    }
  };

  const canExport = enabled && !isNew && !loading && !saving && !!scopedPatient && !!scopedPlan?.id;
  const exportPdf = (selectedAlternatives: Record<number, number[]>, substitutionLayout: MealPlanPdfOptions["substitutionLayout"]) => {
    if (!canExport || !scope || pdfScope !== scope || scopeRef.current !== scope || !scopedPatient || !scopedPlan) return;
    try {
      const { meals, ...plan }: MealPlan & { meals: Meal[] } = scopedPlan;
      const patient: Patient = { name: scopedPatient.name, birth_date: scopedPatient.birth_date ?? undefined };
      const doc = generateMealPlanPdf(plan, meals, patient, {
        selectedAlternatives, substitutionLayout, workspaceName: issuer?.id === workspaceId ? issuer?.name : undefined,
      });
      const slug = patient.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      doc.save(`plano-alimentar-${slug || "paciente"}.pdf`);
    } catch {
      setError("Não foi possível gerar o PDF do plano.");
    } finally {
      setPdfScope(null);
    }
  };

  return (
    <main className="px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link to={`/workspace/patients/${id}`}><ArrowLeft size={16} />Voltar para o prontuário</Link></Button>
        {!enabled && <section role="status" className="rounded-md border border-dashed bg-background p-8"><div className="flex items-center gap-3"><Utensils className="text-muted-foreground" /><div><h1 className="text-xl font-semibold">Planos alimentares</h1><p className="mt-1 text-sm text-muted-foreground">{WORKSPACE_MEAL_PLANS_GATE_MESSAGE}</p></div></div></section>}
        {enabled && loading && <p role="status" className="rounded-md border bg-background p-6 text-sm text-muted-foreground">Carregando plano alimentar...</p>}
        {enabled && !loading && error && <p role="alert" className="rounded-md border border-destructive/30 bg-background p-4 text-sm text-destructive">{error}</p>}
        {canExport && scopedPlan && <>
          <Button type="button" variant="outline" onClick={() => setPdfScope(scope)}><Printer size={16} />PDF do plano salvo</Button>
          <MealPlanPdfOptionsDialog key={scope} open={pdfScope === scope} meals={scopedPlan.meals}
            title="Exportar plano alimentar" description="Escolha as opções que devem aparecer no PDF da versão salva."
            confirmLabel="Baixar PDF" emptyMessage="Nenhuma refeição com opções alternativas."
            onOpenChange={(open) => setPdfScope(open ? scope : null)} onConfirm={exportPdf} />
        </>}
        {enabled && !loading && scopedPatient && scopedPlan && <><header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace · Plano alimentar</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{scopedPatient.name}</h1><p className="mt-1 text-sm text-muted-foreground">{scopedPlan.id ? "Editar plano" : "Novo plano"} · gravação transacional workspace</p></div><div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">Paciente #{scopedPatient.id}</div></header><WorkspaceMealPlanEditor key={scope ?? "workspace-meal-plan-empty"} workspaceId={workspaceId ?? ""} scopeKey={scope ?? ""} initialPlan={scopedPlan} onSave={handleSave} saving={saving} /></>}
      </div>
    </main>
  );
}
