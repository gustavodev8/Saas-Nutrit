import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bookmark, Printer, ShoppingCart } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildShoppingList, shoppingListToText } from "@/lib/shoppingList";
import { WorkspaceMealPlanEditor } from "@/components/workspace/WorkspaceMealPlanEditor";
import { MealPlanPdfOptionsDialog } from "@/components/admin/MealPlanPdfOptionsDialog";
import { generateMealPlanPdf, type MealPlanPdfOptions } from "@/lib/generateMealPlanPdf";
import type { Meal, MealPlan, Measurement, Patient } from "@/lib/supabase";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { fetchWorkspacePatient, type WorkspacePatient } from "@/lib/workspacePatients";
import {
  fetchWorkspaceMealPlan,
  saveWorkspaceMealPlan,
  templateToPlanInput,
  type WorkspaceMealPlanInput,
} from "@/lib/workspaceMealPlans";
import { fetchWorkspaceMeasurements } from "@/lib/workspaceMeasurements";
import type { WorkspaceEnergyProfile } from "@/components/workspace/WorkspaceDietPlanningSection";
import { createWorkspaceTemplate, fetchWorkspaceTemplateById } from "@/lib/workspaceTemplates";

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

function ageFromBirthDate(birthDate: string | null): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age > 0 ? age : undefined;
}

function buildEnergyProfile(patient: WorkspacePatient, latest: Measurement | undefined): WorkspaceEnergyProfile | null {
  if (!latest) return null;
  return {
    weightKg: latest.weight,
    heightCm: latest.height,
    leanMassKg: latest.lean_mass ?? null,
    ageYears: ageFromBirthDate(patient.birth_date),
    gender: patient.gender === "F" ? "F" : patient.gender === "M" ? "M" : undefined,
    measurementId: latest.id,
  };
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workspaceId = membership?.workspaceId ?? null;
  const templateId = useMemo(() => {
    const raw = searchParams.get("templateId");
    if (!raw || !/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }, [searchParams]);
  const patientId = useMemo(() => parseId(id), [id]);
  const numericPlanId = useMemo(() => parseId(planId), [planId]);
  const isNew = planId === "novo";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const scopeRef = useRef<string | null>(null);
  const scope = workspaceId && patientId ? `${workspaceId}:${patientId}:${planId ?? ""}:${templateId ?? ""}` : null;
  scopeRef.current = scope;
  const [snapshot, setSnapshot] = useState<{ scope: string | null; patient: WorkspacePatient | null; plan: WorkspaceMealPlanInput | null; energy: WorkspaceEnergyProfile | null }>({ scope: null, patient: null, plan: null, energy: null });
  const scopedPatient = snapshot.scope === scope ? snapshot.patient : null;
  const scopedPlan = snapshot.scope === scope ? snapshot.plan : null;
  const scopedEnergy = snapshot.scope === scope ? snapshot.energy : null;
  const [pdfScope, setPdfScope] = useState<string | null>(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplSaving, setTplSaving] = useState(false);
  const [tplMsg, setTplMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const shoppingItems = useMemo(() => (scopedPlan ? buildShoppingList(scopedPlan.meals) : []), [scopedPlan]);
  const [issuer, setIssuer] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    if (!workspaceId || isNew) return;
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
  }, [workspaceId, isNew]);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    setPdfScope(null);
    saveRequestRef.current += 1;
    setLoading(true); setSaving(false); setError(""); setSnapshot({ scope: null, patient: null, plan: null, energy: null });
    if (!workspaceId || patientId == null || (!isNew && numericPlanId == null) || !scope) {
      setLoading(false); setError("Paciente ou plano inválido."); return;
    }
    try {
      const loadedPatient = await fetchWorkspacePatient(workspaceId, patientId);
      let loadedPlan: WorkspaceMealPlanInput;
      if (isNew && templateId) {
        const tmpl = await fetchWorkspaceTemplateById(templateId);
        loadedPlan = tmpl ? templateToPlanInput(tmpl, workspaceId, patientId) : blankPlan(workspaceId, patientId);
      } else if (isNew) {
        loadedPlan = blankPlan(workspaceId, patientId);
      } else {
        loadedPlan = await fetchWorkspaceMealPlan(workspaceId, patientId, numericPlanId as number);
      }
      if (requestId !== requestRef.current) return;
      if (loadedPatient.workspace_id !== workspaceId || loadedPatient.id !== patientId ||
          loadedPlan.patient_id !== patientId || (!isNew && (
            !("workspace_id" in loadedPlan) || loadedPlan.workspace_id !== workspaceId || loadedPlan.id !== numericPlanId
          ))) throw new Error("Plano ou paciente fora do workspace ativo.");
      let energy: WorkspaceEnergyProfile | null = null;
      try {
        const measurements = await fetchWorkspaceMeasurements(workspaceId, patientId);
        energy = buildEnergyProfile(loadedPatient, measurements[0]);
      } catch {
        energy = null; // sem avaliação disponível: o painel mostra o aviso
      }
      if (requestId !== requestRef.current) return;
      setSnapshot({ scope, patient: loadedPatient, plan: loadedPlan, energy });
    } catch (loadError) {
      if (requestId === requestRef.current) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o plano.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [isNew, numericPlanId, patientId, scope, templateId, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const handleAutosave = useCallback(async (input: WorkspaceMealPlanInput) => {
    if (!workspaceId || patientId == null || isNew || !scopedPatient || scopedPatient.workspace_id !== workspaceId) return;
    await saveWorkspaceMealPlan(workspaceId, patientId, input, "autosave");
  }, [workspaceId, patientId, isNew, scopedPatient]);

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

  const openTemplateDialog = () => {
    setTplName(scopedPlan?.title ?? "");
    setTplMsg(null);
    setTplOpen(true);
  };
  const handleSaveAsTemplate = async () => {
    if (!workspaceId || !scopedPlan) return;
    setTplSaving(true);
    setTplMsg(null);
    try {
      await createWorkspaceTemplate(workspaceId, tplName, scopedPlan);
      setTplMsg({ type: "ok", text: "Modelo salvo! Ele já aparece na biblioteca de modelos do workspace." });
    } catch (e) {
      setTplMsg({ type: "err", text: e instanceof Error ? e.message : "Não foi possível salvar o modelo." });
    } finally {
      setTplSaving(false);
    }
  };

  const canExport = !isNew && !loading && !saving && !!scopedPatient && !!scopedPlan?.id;
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
    <main className="px-4 py-5 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"><Link to={`/workspace/patients/${id}`}><ArrowLeft size={16} />Voltar para o prontuário</Link></Button>
        {loading && <p role="status" className="rounded-md border bg-background p-6 text-sm text-muted-foreground">Carregando plano alimentar...</p>}
        {!loading && error && <p role="alert" className="rounded-md border border-destructive/30 bg-background p-4 text-sm text-destructive">{error}</p>}
        {canExport && scopedPlan && <>
          <Button type="button" variant="outline" onClick={() => setPdfScope(scope)}><Printer size={16} />PDF do plano salvo</Button>
          <Button type="button" variant="outline" onClick={() => setShoppingOpen(true)}>
            <ShoppingCart size={16} />Lista de compras
          </Button>
          <Dialog open={shoppingOpen} onOpenChange={setShoppingOpen}>
            <DialogContent className="flex max-h-[86vh] w-[min(92vw,40rem)] flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
              <DialogHeader>
                <DialogTitle>Lista de compras</DialogTitle>
                <DialogDescription>Alimentos agregados do plano salvo (soma das quantidades por refeição).</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                {shoppingItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nenhum alimento no plano.</p>
                ) : (
                  <ul className="divide-y">
                    {shoppingItems.map((item) => (
                      <li key={`${item.food_name}|${item.unit}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-foreground">{item.food_name}{item.food_group ? <span className="ml-2 text-xs text-muted-foreground">{item.food_group}</span> : null}</span>
                        <span className="tabular-nums text-muted-foreground">{item.quantity} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { void navigator.clipboard?.writeText(shoppingListToText(shoppingItems)); }}>Copiar lista</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button type="button" variant="outline" onClick={openTemplateDialog}>
            <Bookmark size={16} />Salvar como modelo
          </Button>
          <Dialog open={tplOpen} onOpenChange={setTplOpen}>
            <DialogContent className="w-[min(92vw,30rem)] rounded-2xl p-4 sm:p-5">
              <DialogHeader>
                <DialogTitle>Salvar como modelo</DialogTitle>
                <DialogDescription>Cria um modelo reutilizável a partir deste plano salvo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label htmlFor="tpl-name" className="text-sm font-medium">Nome do modelo</label>
                <Input id="tpl-name" value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Ex.: Low carb 1500 kcal" />
                {tplMsg ? (
                  <p className={tplMsg.type === "ok" ? "text-sm text-green-600" : "text-sm text-destructive"} role={tplMsg.type === "ok" ? "status" : "alert"}>{tplMsg.text}</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => void handleSaveAsTemplate()} disabled={tplSaving || !tplName.trim()}>
                  {tplSaving ? "Salvando..." : "Salvar modelo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <MealPlanPdfOptionsDialog key={scope} open={pdfScope === scope} meals={scopedPlan.meals}
            title="Exportar plano alimentar" description="Escolha as opções que devem aparecer no PDF da versão salva."
            confirmLabel="Baixar PDF" emptyMessage="Nenhuma refeição com opções alternativas."
            onOpenChange={(open) => setPdfScope(open ? scope : null)} onConfirm={exportPdf} />
        </>}
        {!loading && scopedPatient && scopedPlan && <><header className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{scopedPlan.id ? "Editar plano alimentar" : "Novo plano alimentar"}</p><h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{scopedPatient.name}</h1></div><span className="shrink-0 rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground">Paciente #{scopedPatient.id}</span></header><WorkspaceMealPlanEditor key={scope ?? "workspace-meal-plan-empty"} workspaceId={workspaceId ?? ""} scopeKey={scope ?? ""} initialPlan={scopedPlan} onSave={handleSave} saving={saving} onAutosave={handleAutosave} canAutosave={!isNew && !!scopedPlan?.id} energyProfile={scopedEnergy} /></>}
      </div>
    </main>
  );
}
