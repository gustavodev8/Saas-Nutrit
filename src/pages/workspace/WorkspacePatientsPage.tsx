import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, LogOut, Mail, MapPin, Pencil, Plus, Save, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  name: "",
  email: "",
  phone: "",
  birth_date: "",
  gender: "",
  occupation: "",
  city: "",
};

function formatDate(value: string | null): string {
  if (!value) return "Não informado";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function genderLabel(value: WorkspacePatient["gender"]): string {
  if (value === "M") return "Masculino";
  if (value === "F") return "Feminino";
  if (value === "outro") return "Outro";
  return "Não informado";
}

export default function WorkspacePatientsPage() {
  const { membership, userEmail, logout } = useWorkspaceAuth();
  const [patients, setPatients] = useState<WorkspacePatient[]>([]);
  const [form, setForm] = useState<WorkspacePatientInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<WorkspacePatientGenderFilter>("all");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<WorkspacePatientSort>("name");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPatients = useCallback(async () => {
    if (!membership) {
      setPatients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setPatients([]);
    try {
      setPatients(await fetchWorkspacePatients(membership.workspaceId));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }, [membership]);

  useEffect(() => { void loadPatients(); }, [loadPatients]);
  useEffect(() => { setPage(1); }, [search, gender, city, sort]);

  const cities = useMemo(() => getWorkspacePatientCities(patients), [patients]);
  const filteredPatients = useMemo(
    () => filterWorkspacePatients(patients, { query: search, gender, city, sort }),
    [patients, search, gender, city, sort],
  );
  const pageData = useMemo(
    () => paginateWorkspacePatients(filteredPatients, page, PAGE_SIZE),
    [filteredPatients, page],
  );
  const thisMonth = new Date().toISOString().slice(0, 7);
  const patientsWithEmail = patients.filter((patient) => Boolean(patient.email?.trim())).length;
  const newThisMonth = patients.filter((patient) => patient.created_at?.slice(0, 7) === thisMonth).length;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!membership) return;
    setSaving(true);
    setError("");
    try {
      if (editingId == null) await createWorkspacePatient(membership.workspaceId, form);
      else await updateWorkspacePatient(membership.workspaceId, editingId, form);
      resetForm();
      setPage(1);
      await loadPatients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o paciente.");
    } finally {
      setSaving(false);
    }
  };

  const editPatient = (patient: WorkspacePatient) => {
    setEditingId(patient.id);
    setForm({
      name: patient.name,
      email: patient.email ?? "",
      phone: patient.phone ?? "",
      birth_date: patient.birth_date ?? "",
      gender: patient.gender ?? "",
      occupation: patient.occupation ?? "",
      city: patient.city ?? "",
    });
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cadastro workspace</p>
            <h1 className="text-2xl font-semibold">Pacientes</h1>
            <p className="text-sm text-muted-foreground">{userEmail} · {membership?.role === "owner" ? "Owner" : "Nutricionista"}</p>
          </div>
          <Button variant="outline" onClick={() => void logout()}><LogOut aria-hidden="true" />Sair</Button>
        </header>

        <section aria-label="Indicadores dos pacientes deste workspace" className="grid gap-3 sm:grid-cols-3">
          <article className="flex items-center gap-3 rounded-md border bg-background p-4">
            <Users className="text-primary" aria-hidden="true" />
            <div><p className="text-sm text-muted-foreground">Pacientes no workspace</p><p className="text-xl font-semibold tabular-nums">{patients.length}</p></div>
          </article>
          <article className="flex items-center gap-3 rounded-md border bg-background p-4">
            <Mail className="text-primary" aria-hidden="true" />
            <div><p className="text-sm text-muted-foreground">Com e-mail</p><p className="text-xl font-semibold tabular-nums">{patientsWithEmail}</p></div>
          </article>
          <article className="flex items-center gap-3 rounded-md border bg-background p-4">
            <MapPin className="text-primary" aria-hidden="true" />
            <div><p className="text-sm text-muted-foreground">Novos neste mês</p><p className="text-xl font-semibold tabular-nums">{newThisMonth}</p></div>
          </article>
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 rounded-md border bg-background p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_190px_160px]">
              <Input aria-label="Buscar pacientes" placeholder="Buscar nome, contato, cidade ou ocupação" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select aria-label="Filtrar por sexo" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={gender} onChange={(event) => setGender(event.target.value as WorkspacePatientGenderFilter)}>
                <option value="all">Todos os sexos</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
                <option value="unspecified">Não informado</option>
              </select>
              <select aria-label="Filtrar por cidade" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">Todas as cidades</option>
                {cities.map((cityOption) => <option key={cityOption} value={cityOption}>{cityOption}</option>)}
              </select>
              <select aria-label="Ordenar pacientes" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value as WorkspacePatientSort)}>
                <option value="name">Nome: A a Z</option>
                <option value="recent">Mais recentes</option>
              </select>
            </div>

            {error && <p role="alert" className="rounded-md border border-destructive/30 bg-background p-3 text-sm text-destructive">{error}</p>}
            <div className="overflow-hidden rounded-md border bg-background">
              {loading ? (
                <p className="p-6 text-sm text-muted-foreground">Carregando pacientes...</p>
              ) : filteredPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-medium">{patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum paciente encontrado"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{patients.length === 0 ? "Cadastre o primeiro paciente deste workspace." : "Altere a busca ou os filtros para ver resultados."}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                        <tr><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Contato</th><th className="px-4 py-3">Sexo</th><th className="px-4 py-3">Cidade</th><th className="px-4 py-3">Cadastro</th><th className="px-4 py-3"><span className="sr-only">Ações</span></th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {pageData.items.map((patient) => (
                          <tr key={patient.id}>
                            <td className="px-4 py-3"><p className="font-medium">{patient.name}</p><p className="text-xs text-muted-foreground">{patient.occupation || "Ocupação não informada"}</p></td>
                            <td className="px-4 py-3"><p>{patient.email || "Sem e-mail"}</p><p className="text-xs text-muted-foreground">{patient.phone || "Sem telefone"}</p></td>
                            <td className="px-4 py-3">{genderLabel(patient.gender)}</td>
                            <td className="px-4 py-3">{patient.city || "Não informada"}</td>
                            <td className="px-4 py-3">{formatDate(patient.created_at)}</td>
                            <td className="px-4 py-3 text-right"><Button aria-label={`Editar ${patient.name}`} size="icon" variant="ghost" onClick={() => editPatient(patient)}><Pencil aria-hidden="true" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">{pageData.total} {pageData.total === 1 ? "paciente" : "pacientes"} · Página {pageData.page} de {pageData.pageCount}</p>
                    <div className="flex items-center gap-2">
                      <Button aria-label="Página anterior" variant="outline" size="sm" disabled={pageData.page <= 1} onClick={() => setPage(pageData.page - 1)}><ChevronLeft aria-hidden="true" />Anterior</Button>
                      <Button aria-label="Próxima página" variant="outline" size="sm" disabled={pageData.page >= pageData.pageCount} onClick={() => setPage(pageData.page + 1)}>Próxima<ChevronRight aria-hidden="true" /></Button>
                    </div>
                  </footer>
                </>
              )}
            </div>
          </div>

          <form className="space-y-4 rounded-md border bg-background p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{editingId == null ? "Novo paciente" : "Editar paciente"}</h2>
              {editingId != null && <Button aria-label="Cancelar edição" size="icon" type="button" variant="ghost" onClick={resetForm}><X aria-hidden="true" /></Button>}
            </div>
            <div className="space-y-2"><Label htmlFor="patient-name">Nome</Label><Input id="patient-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="patient-birth-date">Nascimento</Label><Input id="patient-birth-date" type="date" value={form.birth_date} onChange={(event) => setForm({ ...form, birth_date: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="patient-gender">Sexo</Label><select id="patient-gender" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as WorkspacePatientInput["gender"] })}><option value="">Não informado</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="outro">Outro</option></select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="patient-email">E-mail</Label><Input id="patient-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="patient-phone">Telefone</Label><Input id="patient-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="patient-occupation">Ocupação</Label><Input id="patient-occupation" value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="patient-city">Cidade</Label><Input id="patient-city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></div>
            <Button className="w-full" type="submit" disabled={saving}>{editingId == null ? <Plus aria-hidden="true" /> : <Save aria-hidden="true" />}{saving ? "Salvando..." : editingId == null ? "Adicionar paciente" : "Salvar alterações"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
