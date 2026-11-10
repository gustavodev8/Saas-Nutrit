import { useCallback, useEffect, useState } from "react";
import { Activity, Archive, ClipboardPlus, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { archiveTrainingPlan, createTrainingPlan, createTrainingPlanVersion, fetchFullTrainingPlan, fetchTrainingPlans, publishTrainingPlan, saveTrainingPlan, type TrainingPlan, type TrainingSession } from "@/lib/trainingPlans";

export function PatientTrainingTab({ patientId }: { patientId: number }) {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [selected, setSelected] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (selectedId?: number) => {
    setLoading(true);
    try {
      const next = await fetchTrainingPlans(patientId);
      setPlans(next);
      const id = selectedId ?? selected?.id;
      const active = id ? await fetchFullTrainingPlan(id) : null;
      setSelected(active ?? null);
      setError(null);
    } catch {
      setError("Não foi possível carregar as fichas. Verifique a conexão e as permissões do banco.");
    } finally { setLoading(false); }
  }, [patientId, selected?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const update = (patch: Partial<TrainingPlan>) => setSelected((current) => current ? { ...current, ...patch } : current);
  const updateSession = (index: number, patch: Partial<TrainingSession>) => setSelected((current) => current ? {
    ...current, sessions: (current.sessions ?? []).map((session, i) => i === index ? { ...session, ...patch } : session),
  } : current);

  const create = async () => {
    try {
      const plan = await createTrainingPlan(patientId);
      setSelected(plan);
      await refresh(plan.id);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Não foi possível criar a ficha."); }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try { const saved = await saveTrainingPlan(selected); setSelected(saved); await refresh(saved.id); toast.success("Ficha salva."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Não foi possível salvar a ficha."); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (!selected) return;
    setSaving(true);
    try { const saved = await saveTrainingPlan(selected); await publishTrainingPlan(saved); await refresh(saved.id); toast.success("Ficha publicada no portal."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Não foi possível publicar."); }
    finally { setSaving(false); }
  };

  if (loading && plans.length === 0) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Fichas de treino</h2><p className="text-sm text-muted-foreground">Monte sessões e exercícios e libere a ficha no portal do paciente.</p></div>
      <Button onClick={() => void create()}><Plus className="mr-2 h-4 w-4" />Nova ficha</Button>
    </div>
    {error ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
    {plans.length > 0 ? <div className="flex gap-2 overflow-x-auto pb-1">{plans.map((plan) => <button key={plan.id} onClick={() => void refresh(plan.id)} className={`shrink-0 rounded-full border px-3 py-2 text-sm ${selected?.id === plan.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{plan.title} · v{plan.version} · {plan.status === "draft" ? "Rascunho" : plan.status === "published" ? "Publicada" : "Arquivada"}</button>)}</div> : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground"><Activity className="mx-auto mb-2 h-6 w-6" />Nenhuma ficha de treino cadastrada.</div>}
    {selected ? <section className="space-y-5 rounded-2xl border p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">{selected.title}</h3><p className="text-xs text-muted-foreground">Versão {selected.version} · {selected.status}</p></div><div className="flex flex-wrap gap-2">
        {selected.status === "draft" ? <><Button variant="outline" onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />Salvar rascunho</Button><Button onClick={() => void publish()} disabled={saving}><Send className="mr-2 h-4 w-4" />Publicar</Button></> : null}
        {selected.status === "published" ? <><Button variant="outline" onClick={async () => { setSaving(true); try { const next = await createTrainingPlanVersion(selected); await refresh(next.id); toast.success("Nova versão em rascunho criada."); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Falha ao criar versão."); } finally { setSaving(false); } }} disabled={saving}><ClipboardPlus className="mr-2 h-4 w-4" />Nova versão</Button><Button variant="outline" onClick={async () => { try { await archiveTrainingPlan(selected); await refresh(selected.id); toast.success("Ficha arquivada."); } catch { toast.error("Não foi possível arquivar."); } }}><Archive className="mr-2 h-4 w-4" />Arquivar</Button></> : null}
      </div></div>
      <fieldset disabled={selected.status !== "draft"} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label>Título</Label><Input value={selected.title} onChange={(e) => update({ title: e.target.value })} /></div>
        <div className="space-y-2"><Label>Objetivo</Label><Input value={selected.goal} onChange={(e) => update({ goal: e.target.value })} /></div>
        <div className="space-y-2"><Label>Frequência</Label><Input value={selected.frequency} onChange={(e) => update({ frequency: e.target.value })} placeholder="Ex.: 3 vezes por semana" /></div>
        <div className="space-y-2"><Label>Início</Label><Input type="date" value={selected.valid_from ?? ""} onChange={(e) => update({ valid_from: e.target.value || null })} /></div>
        <div className="space-y-2"><Label>Fim</Label><Input type="date" value={selected.valid_until ?? ""} onChange={(e) => update({ valid_until: e.target.value || null })} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Orientações gerais</Label><Textarea value={selected.general_notes} onChange={(e) => update({ general_notes: e.target.value })} /></div>
      </fieldset>
      <div className="space-y-4">{(selected.sessions ?? []).map((session, si) => <div key={session.id ?? si} className="space-y-4 rounded-xl bg-muted/30 p-4">
        <div className="flex items-center gap-2"><Input disabled={selected.status !== "draft"} value={session.title} onChange={(e) => updateSession(si, { title: e.target.value })} aria-label="Nome da sessão" />{selected.status === "draft" ? <Button size="icon" variant="ghost" aria-label="Remover sessão" onClick={() => update({ sessions: (selected.sessions ?? []).filter((_, i) => i !== si) })}><Trash2 className="h-4 w-4" /></Button> : null}</div>
        <Textarea disabled={selected.status !== "draft"} value={session.notes} onChange={(e) => updateSession(si, { notes: e.target.value })} placeholder="Orientações desta sessão" />
        {session.exercises.map((exercise, ei) => <div key={exercise.id ?? ei} className="grid gap-2 rounded-xl border bg-background p-3 sm:grid-cols-2">
          <Input disabled={selected.status !== "draft"} value={exercise.name} placeholder="Exercício" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, name: e.target.value }; updateSession(si, { exercises: rows }); }} />
          <div className="grid grid-cols-2 gap-2"><Input disabled={selected.status !== "draft"} value={exercise.sets} placeholder="Séries" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, sets: e.target.value }; updateSession(si, { exercises: rows }); }} /><Input disabled={selected.status !== "draft"} value={exercise.repetitions} placeholder="Repetições" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, repetitions: e.target.value }; updateSession(si, { exercises: rows }); }} /></div>
          <Input disabled={selected.status !== "draft"} value={exercise.reference_load} placeholder="Carga de referência" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, reference_load: e.target.value }; updateSession(si, { exercises: rows }); }} /><Input disabled={selected.status !== "draft"} value={exercise.rest} placeholder="Descanso" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, rest: e.target.value }; updateSession(si, { exercises: rows }); }} />
          <Textarea disabled={selected.status !== "draft"} value={exercise.instructions} placeholder="Instruções" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, instructions: e.target.value }; updateSession(si, { exercises: rows }); }} /><div className="space-y-2"><Input disabled={selected.status !== "draft"} value={exercise.demo_url} placeholder="Link de demonstração (opcional)" onChange={(e) => { const rows = [...session.exercises]; rows[ei] = { ...exercise, demo_url: e.target.value }; updateSession(si, { exercises: rows }); }} />{selected.status === "draft" ? <Button size="sm" variant="ghost" onClick={() => updateSession(si, { exercises: session.exercises.filter((_, i) => i !== ei) })}><Trash2 className="mr-1 h-3 w-3" />Remover exercício</Button> : null}</div>
        </div>)}
        {selected.status === "draft" ? <Button variant="outline" size="sm" onClick={() => updateSession(si, { exercises: [...session.exercises, { name: "", sets: "", repetitions: "", reference_load: "", rest: "", instructions: "", demo_url: "", sort_order: session.exercises.length }] })}><Plus className="mr-1 h-4 w-4" />Adicionar exercício</Button> : null}
      </div>)}
      {selected.status === "draft" ? <Button variant="outline" onClick={() => update({ sessions: [...(selected.sessions ?? []), { title: `Treino ${String.fromCharCode(65 + (selected.sessions?.length ?? 0))}`, notes: "", sort_order: selected.sessions?.length ?? 0, exercises: [] }] })}><Plus className="mr-2 h-4 w-4" />Adicionar sessão</Button> : null}
      </div>
    </section> : null}
  </div>;
}
