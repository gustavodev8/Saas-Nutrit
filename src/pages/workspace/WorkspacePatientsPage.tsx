import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, FolderOpen, Mail, Pencil, Plus, Save, Search, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import {
  createWorkspacePatient,
  fetchWorkspacePatients,
  filterWorkspacePatients,
  getWorkspacePatientCities,
  paginateWorkspacePatients,
  updateWorkspacePatient,
  type WorkspacePatient,
  type WorkspacePatientGenderFilter,
  type WorkspacePatientInput,
  type WorkspacePatientSort,
} from "@/lib/workspacePatients";

const PAGE_SIZE = 10;
const emptyForm: WorkspacePatientInput = {
  name: "", email: "", phone: "", birth_date: "", gender: "", occupation: "", city: "",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function calcAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const bd = new Date(birthDate.length === 10 ? `${birthDate}T12:00:00` : birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const age = Math.floor((Date.now() - bd.getTime()) / 31557600000);
  return `${age} anos`;
}

function genderLabel(value: WorkspacePatient["gender"]): string {
  if (value === "M") return "Masculino";
  if (value === "F") return "Feminino";
  if (value === "outro") return "Outro";
  return "";
}

export default function WorkspacePatientsPage() {
  const { membership } = useWorkspaceAuth();
  const [patientSnapshot, setPatientSnapshot] = useState<{ workspaceId: string | null; items: WorkspacePatient[] }>({ workspaceId: null, items: [] });
  const [form, setForm] = useState<WorkspacePatientInput>(emptyForm);
  const [formWorkspaceId, setFormWorkspaceId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<WorkspacePatientGenderFilter>("all");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<WorkspacePatientSort>("name");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const patientRequestRef = useRef(0);

  const currentWorkspaceId = membership?.workspaceId ?? null;
  const patientSnapshotMatches = patientSnapshot.workspaceId === currentWorkspaceId;
  const patients = useMemo(() => patientSnapshotMatches ? patientSnapshot.items : [], [patientSnapshot, patientSnapshotMatches]);
  const listLoading = loading || Boolean(currentWorkspaceId && !patientSnapshotMatches);
  const formMatchesWorkspace = formWorkspaceId === currentWorkspaceId;
  const visibleForm = formMatchesWorkspace ? form : emptyForm;
  const visibleEditingId = formMatchesWorkspace ? editingId : null;

  const loadPatients = useCallback(async () => {
    const requestId = ++patientRequestRef.current;
    if (!membership) { setPatientSnapshot({ workspaceId: null, items: [] }); setLoading(false); return; }
    const workspaceId = membership.workspaceId;
    setLoading(true);
    try {
      const items = await fetchWorkspacePatients(workspaceId);
      if (requestId === patientRequestRef.current) { setPatientSnapshot({ workspaceId, items }); setError(""); }
    } catch (loadError) {
      if (requestId === patientRequestRef.current) { setPatientSnapshot({ workspaceId, items: [] }); setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar pacientes."); }
    } finally {
      if (requestId === patientRequestRef.current) setLoading(false);
    }
  }, [membership]);

  useEffect(() => { void loadPatients(); }, [loadPatients]);
  useEffect(() => { setPage(1); }, [search, gender, city, sort]);
  useEffect(() => { setEditingId(null); setForm(emptyForm); setFormWorkspaceId(currentWorkspaceId); setError(""); }, [currentWorkspaceId]);

  const cities = useMemo(() => getWorkspacePatientCities(patients), [patients]);
  const filteredPatients = useMemo(() => filterWorkspacePatients(patients, { query: search, gender, city, sort }), [patients, search, gender, city, sort]);
  const pageData = useMemo(() => paginateWorkspacePatients(filteredPatients, page, PAGE_SIZE), [filteredPatients, page]);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = patients.filter((p) => p.created_at?.slice(0, 7) === thisMonth).length;

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setFormWorkspaceId(currentWorkspaceId); };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!membership || !formMatchesWorkspace) return;
    setSaving(true); setError("");
    try {
      if (editingId == null) await createWorkspacePatient(membership.workspaceId, form);
      else await updateWorkspacePatient(membership.workspaceId, editingId, form);
      resetForm(); setPage(1); await loadPatients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o paciente.");
    } finally {
      setSaving(false);
    }
  };

  const editPatient = (patient: WorkspacePatient) => {
    if (!membership) return;
    setEditingId(patient.id);
    setFormWorkspaceId(membership.workspaceId);
    setForm({ name: patient.name, email: patient.email ?? "", phone: patient.phone ?? "", birth_date: patient.birth_date ?? "", gender: patient.gender ?? "", occupation: patient.occupation ?? "", city: patient.city ?? "" });
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pacientes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {listLoading ? "Carregando…" : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} cadastrado${patients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Indicadores">
          <article className="flex items-center gap-4 rounded-xl border bg-background p-4">
            <div className="rounded-xl bg-[#e6f1eb] p-2.5"><Users size={20} className="text-[#166b50]" /></div>
            <div><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold tabular-nums">{patients.length}</p></div>
          </article>
          <article className="flex items-center gap-4 rounded-xl border bg-background p-4">
            <div className="rounded-xl bg-blue-50 p-2.5"><Mail size={20} className="text-blue-500" /></div>
            <div><p className="text-xs text-muted-foreground">Com e-mail</p><p className="text-2xl font-bold tabular-nums">{patients.filter((p) => Boolean(p.email?.trim())).length}</p></div>
          </article>
          <article className="flex items-center gap-4 rounded-xl border bg-background p-4 sm:col-span-2 lg:col-span-1">
            <div className="rounded-xl bg-amber-50 p-2.5"><Plus size={20} className="text-amber-500" /></div>
            <div><p className="text-xs text-muted-foreground">Novos este mês</p><p className="text-2xl font-bold tabular-nums">{newThisMonth}</p></div>
          </article>
        </section>

        {/* Main grid */}
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Patient list */}
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-3">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 h-9" placeholder="Buscar nome, contato, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={gender} onChange={(e) => setGender(e.target.value as WorkspacePatientGenderFilter)}>
                <option value="all">Todos os sexos</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
                <option value="unspecified">Não informado</option>
              </select>
              {cities.length > 0 && (
                <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Todas as cidades</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as WorkspacePatientSort)}>
                <option value="name">Nome: A a Z</option>
                <option value="recent">Mais recentes</option>
              </select>
            </div>

            {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-background p-3 text-sm text-destructive">{error}</p>}

            {/* List */}
            <div className="rounded-xl border bg-background overflow-hidden">
              {listLoading ? (
                <div className="flex justify-center py-16"><LeafLoader label="Carregando pacientes…" /></div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Users size={22} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium">{patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum paciente encontrado"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{patients.length === 0 ? "Adicione o primeiro paciente pelo formulário ao lado." : "Altere os filtros para ver resultados."}</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y">
                    {pageData.items.map((patient) => {
                      const age = calcAge(patient.birth_date ?? null);
                      const sub = [genderLabel(patient.gender), age, patient.city].filter(Boolean).join(" · ");
                      return (
                        <li key={patient.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                          {/* Avatar */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f1eb] text-[#166b50] text-sm font-semibold select-none">
                            {getInitials(patient.name)}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{patient.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {sub || (patient.email ?? patient.occupation ?? "Sem informações")}
                            </p>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Abrir prontuário" aria-label={`Abrir prontuário de ${patient.name}`}>
                              <Link to={`/workspace/patients/${patient.id}`}><FolderOpen size={15} /></Link>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar cadastro" aria-label={`Editar ${patient.name}`} onClick={() => editPatient(patient)}>
                              <Pencil size={15} />
                            </Button>
                          </div>
                          {/* Always-visible link on mobile */}
                          <Button asChild size="icon" variant="ghost" className={cn("h-8 w-8 group-hover:hidden")} aria-label={`Abrir prontuário de ${patient.name}`}>
                            <Link to={`/workspace/patients/${patient.id}`}><ChevronRight size={15} className="text-muted-foreground" /></Link>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  {pageData.pageCount > 1 && (
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                      <p className="text-sm text-muted-foreground">{pageData.total} paciente{pageData.total !== 1 ? "s" : ""} · Pág. {pageData.page}/{pageData.pageCount}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={pageData.page <= 1} onClick={() => setPage(pageData.page - 1)}><ChevronLeft size={14} />Anterior</Button>
                        <Button variant="outline" size="sm" disabled={pageData.page >= pageData.pageCount} onClick={() => setPage(pageData.page + 1)}>Próxima<ChevronRight size={14} /></Button>
                      </div>
                    </footer>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <form className="rounded-xl border bg-background overflow-hidden" onSubmit={handleSubmit}>
            <div className="border-b px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-sm">{visibleEditingId == null ? "Novo paciente" : "Editar paciente"}</h2>
              {visibleEditingId != null && (
                <Button size="icon" variant="ghost" className="h-7 w-7" type="button" aria-label="Cancelar edição" onClick={resetForm}><X size={14} /></Button>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1.5"><Label htmlFor="patient-name" className="text-xs">Nome *</Label><Input id="patient-name" value={visibleForm.name} onChange={(e) => setForm({ ...visibleForm, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="patient-birth-date" className="text-xs">Nascimento</Label><Input id="patient-birth-date" type="date" value={visibleForm.birth_date} onChange={(e) => setForm({ ...visibleForm, birth_date: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="patient-gender" className="text-xs">Sexo</Label>
                  <select id="patient-gender" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={visibleForm.gender} onChange={(e) => setForm({ ...visibleForm, gender: e.target.value as WorkspacePatientInput["gender"] })}>
                    <option value="">Não informado</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="patient-email" className="text-xs">E-mail</Label><Input id="patient-email" type="email" autoComplete="email" value={visibleForm.email} onChange={(e) => setForm({ ...visibleForm, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="patient-phone" className="text-xs">Telefone</Label><Input id="patient-phone" type="tel" autoComplete="tel" value={visibleForm.phone} onChange={(e) => setForm({ ...visibleForm, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="patient-occupation" className="text-xs">Ocupação</Label><Input id="patient-occupation" value={visibleForm.occupation} onChange={(e) => setForm({ ...visibleForm, occupation: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="patient-city" className="text-xs">Cidade</Label><Input id="patient-city" value={visibleForm.city} onChange={(e) => setForm({ ...visibleForm, city: e.target.value })} /></div>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
              <Button className="w-full bg-[#166b50] hover:bg-[#145e45] text-white" type="submit" disabled={saving || !formMatchesWorkspace}>
                {visibleEditingId == null ? <Plus size={15} /> : <Save size={15} />}
                {saving ? "Salvando…" : visibleEditingId == null ? "Adicionar paciente" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
