import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowLeft, BookOpen, CalendarDays, ClipboardList, Dumbbell,
  FileDown, LayoutDashboard, Mail, MapPin, Pencil, Phone, Save, User, UserRound,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PatientAnthropometryTab } from "@/components/admin/patient/PatientAnthropometryTab";
import { WorkspaceAnamnesisForm } from "@/components/workspace/WorkspaceAnamnesisForm";
import { WorkspaceTrainingTab } from "@/components/workspace/WorkspaceTrainingTab";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import {
  fetchWorkspacePatient,
  updateWorkspacePatient,
  type WorkspacePatient,
  type WorkspacePatientInput,
} from "@/lib/workspacePatients";
import {
  fetchWorkspaceMealPlans,
  isWorkspaceMealPlansEnabled,
  type WorkspaceMealPlan,
} from "@/lib/workspaceMealPlans";
import { cn } from "@/lib/utils";

// --- Types -------------------------------------------------------------------

type TabKey = "central" | "perfil" | "anamnese" | "medidas" | "planos" | "treinos";

interface TabDef {
  key: TabKey;
  label: string;
  icon: ReactNode;
}

// --- Constants ---------------------------------------------------------------

const TABS: TabDef[] = [
  { key: "central",   label: "Central",   icon: <LayoutDashboard size={15} aria-hidden="true" /> },
  { key: "perfil",    label: "Perfil",    icon: <User             size={15} aria-hidden="true" /> },
  { key: "anamnese",  label: "Anamnese",  icon: <ClipboardList    size={15} aria-hidden="true" /> },
  { key: "medidas",   label: "Medidas",   icon: <Activity         size={15} aria-hidden="true" /> },
  { key: "planos",    label: "Planos",    icon: <BookOpen         size={15} aria-hidden="true" /> },
  { key: "treinos",   label: "Treinos",   icon: <Dumbbell         size={15} aria-hidden="true" /> },
];

const DEFAULT_TAB: TabKey = "central";

const emptyForm: WorkspacePatientInput = {
  name: "", email: "", phone: "", birth_date: "", gender: "", occupation: "", city: "",
};

// --- Helpers -----------------------------------------------------------------

function toInput(patient: WorkspacePatient): WorkspacePatientInput {
  return {
    name: patient.name,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    birth_date: patient.birth_date ?? "",
    gender: patient.gender ?? "",
    occupation: patient.occupation ?? "",
    city: patient.city ?? "",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Não informado";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "Não informado" : date.toLocaleDateString("pt-BR");
}

function calcAge(birth: string | null): number | null {
  if (!birth) return null;
  const today = new Date();
  const d = new Date(`${birth}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// --- Component ---------------------------------------------------------------

export default function WorkspacePatientDetailPage() {
  const { authReady, membershipReady, isAuthenticated, authUserId, membership } = useWorkspaceAuth();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceId = membership?.workspaceId ?? null;
  const workspaceReady = authReady && membershipReady && isAuthenticated && Boolean(authUserId && workspaceId);
  const accessResolving = !authReady || !membershipReady;
  const patientId = useMemo(() => {
    if (!id || !/^\d+$/.test(id)) return null;
    const parsed = Number(id);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }, [id]);

  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : DEFAULT_TAB;
  const templateId = searchParams.get("templateId");

  const setTab = (key: TabKey) => {
    setSearchParams((prev) => { prev.set("tab", key); return prev; }, { replace: true });
  };

  const [snapshot, setSnapshot] = useState<{ scope: string | null; patient: WorkspacePatient | null }>({ scope: null, patient: null });
  const [form, setForm] = useState<WorkspacePatientInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [workspaceNameSnapshot, setWorkspaceNameSnapshot] = useState<{ workspaceId: string | null; name: string | null }>({ workspaceId: null, name: null });
  const [mealPlanSnapshot, setMealPlanSnapshot] = useState<{
    scope: string | null;
    status: "loading" | "loaded" | "error";
    plans: WorkspaceMealPlan[];
    error: string;
  }>({ scope: null, status: "loading", plans: [], error: "" });

  const requestRef = useRef(0);
  const saveRequestRef = useRef(0);
  const scopeRef = useRef<string | null>(null);
  const scope = workspaceReady && authUserId && workspaceId && patientId
    ? `${authUserId}:${workspaceId}:${patientId}`
    : null;
  scopeRef.current = scope;
  const patient = snapshot.scope === scope ? snapshot.patient : null;
  const patientWorkspaceId = patient?.workspace_id ?? null;
  const workspaceName = workspaceNameSnapshot.workspaceId === workspaceId ? workspaceNameSnapshot.name : null;
  const mealPlansEnabled = isWorkspaceMealPlansEnabled();
  const visibleMealPlanSnapshot = mealPlanSnapshot.scope === scope ? mealPlanSnapshot : null;

  const loadPatient = useCallback(async () => {
    const requestId = ++requestRef.current;
    saveRequestRef.current += 1;
    setSnapshot({ scope, patient: null });
    setForm(emptyForm);
    setSaving(false);
    setError("");
    if (!authReady || !membershipReady) { setLoading(true); return; }
    if (!isAuthenticated || !authUserId || !workspaceId || patientId == null || !scope) {
      setLoading(false);
      setError("Paciente inválido ou acesso workspace indisponível.");
      return;
    }
    setLoading(true);
    try {
      const loaded = await fetchWorkspacePatient(workspaceId, patientId);
      if (requestId === requestRef.current) { setSnapshot({ scope, patient: loaded }); setForm(toInput(loaded)); }
    } catch {
      if (requestId === requestRef.current) setError("Paciente não encontrado neste workspace.");
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [authReady, authUserId, isAuthenticated, membershipReady, patientId, scope, workspaceId]);

  useEffect(() => { void loadPatient(); }, [loadPatient]);

  useEffect(() => {
    if (!mealPlansEnabled) { setMealPlanSnapshot({ scope: null, status: "loaded", plans: [], error: "" }); return; }
    if (!workspaceReady || !authUserId || !workspaceId || patientId == null || !scope || patientWorkspaceId !== workspaceId) {
      setMealPlanSnapshot({ scope: null, status: "loading", plans: [], error: "" }); return;
    }
    let active = true;
    setMealPlanSnapshot({ scope, status: "loading", plans: [], error: "" });
    void fetchWorkspaceMealPlans(workspaceId, patientId)
      .then((plans) => { if (active) setMealPlanSnapshot({ scope, status: "loaded", plans, error: "" }); })
      .catch(() => { if (active) setMealPlanSnapshot({ scope, status: "error", plans: [], error: "Não foi possível carregar os planos alimentares." }); });
    return () => { active = false; };
  }, [authUserId, mealPlansEnabled, patientId, patientWorkspaceId, scope, workspaceId, workspaceReady]);

  useEffect(() => {
    let active = true;
    if (!workspaceReady || !workspaceId) { setWorkspaceNameSnapshot({ workspaceId: null, name: null }); return () => { active = false; }; }
    setWorkspaceNameSnapshot({ workspaceId, name: null });
    void workspaceSupabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle()
      .then(({ data }) => { if (active) setWorkspaceNameSnapshot({ workspaceId, name: data?.name ?? null }); })
      .catch(() => { if (active) setWorkspaceNameSnapshot({ workspaceId, name: null }); });
    return () => { active = false; };
  }, [authUserId, workspaceId, workspaceReady]);

  const updateField = (field: keyof WorkspacePatientInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patient || !workspaceId || patient.workspace_id !== workspaceId) return;
    const saveRequestId = ++saveRequestRef.current;
    const saveScope = scope;
    setSaving(true);
    setError("");
    try {
      const updated = await updateWorkspacePatient(workspaceId, patient.id, form);
      if (saveRequestId !== saveRequestRef.current || scopeRef.current !== saveScope) return;
      setSnapshot({ scope, patient: updated });
      setForm(toInput(updated));
    } catch (saveError) {
      if (saveRequestId !== saveRequestRef.current || scopeRef.current !== saveScope) return;
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o paciente.");
    } finally {
      if (saveRequestId === saveRequestRef.current && scopeRef.current === saveScope) setSaving(false);
    }
  };

  const age = patient ? calcAge(patient.birth_date) : null;

  return (
    <main className="px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-0">

        {/* Loading / Error states */}
        {(accessResolving || loading) && (
          <p role="status" aria-live="polite" className="rounded-md border bg-background p-6 text-sm text-muted-foreground">
            {accessResolving ? "Validando acesso ao workspace..." : "Carregando prontuário..."}
          </p>
        )}
        {!accessResolving && !loading && error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-background p-4 text-sm text-destructive">{error}</p>
        )}

        {!accessResolving && !loading && patient && (
          <>
            {/* Patient header */}
            <header className="border-b pb-4">
              <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Link to="/workspace/patients" className="hover:text-foreground">Pacientes</Link>
                <span>›</span>
                <span className="text-foreground">{patient.name}</span>
                <span>›</span>
                <span className="capitalize">{activeTab}</span>
              </nav>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#166b50]/10 text-[#166b50] font-semibold text-lg select-none">
                  {initials(patient.name)}
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight truncate">{patient.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {patient.city && <span>{patient.city}</span>}
                    {patient.city && age !== null && <span> · </span>}
                    {age !== null && <span>{age} anos</span>}
                    {!patient.city && age === null && <span>Sem dados de localização/idade</span>}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/workspace/patients">
                      <ArrowLeft size={14} aria-hidden="true" />Voltar
                    </Link>
                  </Button>
                </div>
              </div>
            </header>

            {/* Tab bar */}
            <div className="border-b">
              <div className="flex overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTab(tab.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                      activeTab === tab.key
                        ? "border-[#166b50] text-[#166b50]"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
                    )}
                    aria-selected={activeTab === tab.key}
                    role="tab"
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="pt-6">

              {/* ── Central ── */}
              {activeTab === "central" && (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <article className="rounded-md border bg-background p-4">
                      <Mail className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="mt-1 truncate text-sm font-medium">{patient.email || "Não informado"}</p>
                    </article>
                    <article className="rounded-md border bg-background p-4">
                      <Phone className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="mt-1 text-sm font-medium">{patient.phone || "Não informado"}</p>
                    </article>
                    <article className="rounded-md border bg-background p-4">
                      <CalendarDays className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Nascimento</p>
                      <p className="mt-1 text-sm font-medium">{formatDate(patient.birth_date)}</p>
                    </article>
                    <article className="rounded-md border bg-background p-4">
                      <MapPin className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Cidade</p>
                      <p className="mt-1 text-sm font-medium">{patient.city || "Não informada"}</p>
                    </article>
                    <article className="rounded-md border bg-background p-4">
                      <UserRound className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Ocupação</p>
                      <p className="mt-1 text-sm font-medium">{patient.occupation || "Não informada"}</p>
                    </article>
                    <article className="rounded-md border bg-background p-4">
                      <UserRound className="mb-3 text-[#166b50]" size={18} aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">Sexo</p>
                      <p className="mt-1 text-sm font-medium">
                        {patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : patient.gender === "outro" ? "Outro" : "Não informado"}
                      </p>
                    </article>
                  </div>

                  <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Acesso rápido</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {TABS.filter((t) => t.key !== "central").map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setTab(tab.key)}
                          className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          {tab.icon}{tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Perfil ── */}
              {activeTab === "perfil" && (
                <form className="max-w-2xl space-y-4 rounded-md border bg-background p-5" onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 border-b pb-4">
                    <Pencil size={18} className="text-[#166b50]" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold">Dados cadastrais</h2>
                      <p className="text-sm text-muted-foreground">Informações do paciente neste workspace.</p>
                    </div>
                  </div>
                  {error && <p role="alert" className="rounded-md border border-destructive/30 bg-background p-3 text-sm text-destructive">{error}</p>}
                  <div className="space-y-2">
                    <Label htmlFor="ws-detail-name">Nome</Label>
                    <Input id="ws-detail-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-birth">Nascimento</Label>
                      <Input id="ws-detail-birth" type="date" value={form.birth_date} onChange={(e) => updateField("birth_date", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-gender">Sexo</Label>
                      <select id="ws-detail-gender" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.gender} onChange={(e) => updateField("gender", e.target.value)}>
                        <option value="">Não informado</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-email">E-mail</Label>
                      <Input id="ws-detail-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-phone">Telefone</Label>
                      <Input id="ws-detail-phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-occupation">Ocupação</Label>
                      <Input id="ws-detail-occupation" value={form.occupation} onChange={(e) => updateField("occupation", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ws-detail-city">Cidade</Label>
                      <Input id="ws-detail-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving}>
                    <Save size={16} aria-hidden="true" />{saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </form>
              )}

              {/* ── Anamnese ── */}
              {activeTab === "anamnese" && (
                <WorkspaceAnamnesisForm
                  key={`${workspaceId}:${patient.id}:anamnesis`}
                  workspaceId={workspaceId ?? ""}
                  patient={patient}
                />
              )}

              {/* ── Medidas ── */}
              {activeTab === "medidas" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Link
                      to={`/workspace/patients/${patient.id}/relatorio-antropometrico`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <FileDown size={13} aria-hidden="true" /> Relatório PDF
                    </Link>
                  </div>
                  <PatientAnthropometryTab
                    key={`${workspaceId}:${patient.id}`}
                    patientId={String(patient.id)}
                    patient={{ ...patient }}
                    workspaceId={workspaceId ?? undefined}
                    workspaceName={workspaceName ?? undefined}
                    workspacePatient={patient}
                  />
                </div>
              )}

              {/* ── Planos ── */}
              {activeTab === "planos" && (
                <div className="max-w-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">Planos alimentares</h2>
                      <p className="text-sm text-muted-foreground">Dietas e estratégias deste paciente.</p>
                    </div>
                    <Button asChild size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white">
                      <Link to={`/workspace/patients/${patient.id}/plan/novo${templateId ? `?templateId=${templateId}` : ""}`}>
                        <BookOpen size={14} aria-hidden="true" />{templateId ? "Criar plano do modelo" : "Novo plano"}
                      </Link>
                    </Button>
                  </div>
                  {templateId && (
                    <div className="rounded-md border border-[#166b50]/30 bg-[#166b50]/5 px-4 py-3 flex items-center gap-3">
                      <BookOpen size={16} className="text-[#166b50] shrink-0" />
                      <p className="text-sm text-[#166b50]">Modelo selecionado — clique em <strong>Criar plano do modelo</strong> para pré-preencher o editor com as refeições do template.</p>
                    </div>
                  )}
                  {!mealPlansEnabled ? (
                    <p role="status" className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      Módulo de planos alimentares não está ativo neste ambiente.
                    </p>
                  ) : !visibleMealPlanSnapshot || visibleMealPlanSnapshot.status === "loading" ? (
                    <p role="status" className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                      Carregando planos alimentares...
                    </p>
                  ) : visibleMealPlanSnapshot.status === "error" ? (
                    <p role="alert" className="rounded-md border border-destructive/30 bg-background p-4 text-sm text-destructive">
                      {visibleMealPlanSnapshot.error}
                    </p>
                  ) : visibleMealPlanSnapshot.plans.length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center">
                      <BookOpen className="mx-auto mb-3 text-muted-foreground" size={28} aria-hidden="true" />
                      <p className="text-sm font-medium">Nenhum plano alimentar criado</p>
                      <p className="mt-1 text-sm text-muted-foreground">Monte a primeira estratégia alimentar do paciente.</p>
                      <Button asChild size="sm" className="mt-4">
                        <Link to={`/workspace/patients/${patient.id}/plan/novo`}>Criar primeiro plano</Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {visibleMealPlanSnapshot.plans.map((plan) => (
                        <li key={plan.id} className="p-4">
                          <Link
                            className="block text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            to={`/workspace/patients/${patient.id}/plan/${plan.id}`}
                          >
                            {plan.title || "Plano alimentar"}
                          </Link>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(plan.start_date || plan.created_at || null)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── Treinos ── */}
              {activeTab === "treinos" && (
                <WorkspaceTrainingTab
                  key={`${workspaceId}:${patient.id}:training`}
                  workspaceId={workspaceId ?? ""}
                  patient={patient}
                />
              )}

            </div>
          </>
        )}
      </div>
    </main>
  );
}
