import { useCallback, useEffect, useState } from "react";
import { LogOut, Pencil, Plus, Save, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { createWorkspacePatient, fetchWorkspacePatients, updateWorkspacePatient, type WorkspacePatient, type WorkspacePatientInput } from "@/lib/workspacePatients";

const emptyForm: WorkspacePatientInput = { name: "", email: "", phone: "" };

export default function WorkspacePatientsPage() {
  const { membership, userEmail, logout } = useWorkspaceAuth();
  const [patients, setPatients] = useState<WorkspacePatient[]>([]);
  const [form, setForm] = useState<WorkspacePatientInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPatients = useCallback(async () => {
    if (!membership) return;
    setLoading(true);
    try {
      setPatients(await fetchWorkspacePatients(membership.workspaceId));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }, [membership]);

  useEffect(() => { void loadPatients(); }, [loadPatients]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!membership) return;
    setSaving(true);
    setError("");
    try {
      if (editingId == null) await createWorkspacePatient(membership.workspaceId, form);
      else await updateWorkspacePatient(membership.workspaceId, editingId, form);
      resetForm();
      await loadPatients();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar o paciente.");
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();
    return !query || [patient.name, patient.email ?? "", patient.phone ?? ""].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cadastro workspace</p><h1 className="text-3xl font-semibold">Pacientes</h1><p className="text-sm text-muted-foreground">{userEmail} · {membership?.role === "owner" ? "Owner" : "Nutritionist"}</p></div>
          <Button variant="outline" onClick={() => void logout()}><LogOut />Sair</Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Users className="text-primary" /><Input aria-label="Buscar pacientes" placeholder="Buscar por nome, e-mail ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            {loading ? <p className="text-sm text-muted-foreground">Carregando pacientes...</p> : filteredPatients.length === 0 ? <p className="rounded-lg border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">Nenhum paciente encontrado.</p> : <div className="overflow-hidden rounded-lg border bg-background"><div className="divide-y">{filteredPatients.map((patient) => <article className="flex items-center justify-between gap-4 p-4" key={patient.id}><div className="min-w-0"><p className="truncate font-medium">{patient.name}</p><p className="truncate text-sm text-muted-foreground">{patient.email || "Sem e-mail"} · {patient.phone || "Sem telefone"}</p></div><Button aria-label={`Editar ${patient.name}`} size="icon" variant="ghost" onClick={() => { setEditingId(patient.id); setForm({ name: patient.name, email: patient.email ?? "", phone: patient.phone ?? "" }); }}><Pencil /></Button></article>)}</div></div>}
          </div>

          <form className="space-y-4 rounded-lg border bg-background p-5" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between"><h2 className="font-semibold">{editingId == null ? "Novo paciente" : "Editar paciente"}</h2>{editingId != null && <Button aria-label="Cancelar edição" size="icon" type="button" variant="ghost" onClick={resetForm}><X /></Button>}</div>
            <div className="space-y-2"><Label htmlFor="patient-name">Nome</Label><Input id="patient-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="patient-email">E-mail</Label><Input id="patient-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="patient-phone">Telefone</Label><Input id="patient-phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={saving}>{editingId == null ? <Plus /> : <Save />}{saving ? "Salvando..." : editingId == null ? "Adicionar paciente" : "Salvar alterações"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
