import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Clock, Edit2, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchPatientConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_STATUS_META,
  type WorkspaceConsultation,
  type WorkspaceConsultationInput,
  type ConsultationType,
  type ConsultationStatus,
} from "@/lib/workspaceConsultations";
import type { WorkspacePatient } from "@/lib/workspacePatients";

interface Props {
  workspaceId: string;
  patient: WorkspacePatient;
}

const today = () => new Date().toISOString().slice(0, 10);

function emptyForm(): WorkspaceConsultationInput {
  return { consulted_at: today(), type: "retorno", status: "realizada", duration_min: null, notes: "", private_notes: "" };
}

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export function WorkspaceConsultasTab({ workspaceId, patient }: Props) {
  const [items, setItems]           = useState<WorkspaceConsultation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [migPending, setMigPending] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<number | null>(null);
  const [form, setForm]             = useState<WorkspaceConsultationInput>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchPatientConsultations(workspaceId, patient.id)
      .then(setItems)
      .catch((e: Error) => {
        if (e.message === "MIGRATION_PENDING") setMigPending(true);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, patient.id]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(c: WorkspaceConsultation) {
    setEditId(c.id);
    setForm({
      consulted_at:  c.consulted_at,
      type:          c.type,
      status:        c.status,
      duration_min:  c.duration_min,
      notes:         c.notes ?? "",
      private_notes: c.private_notes ?? "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId != null) {
        const updated = await updateConsultation(workspaceId, editId, form);
        setItems((prev) => prev.map((c) => (c.id === editId ? updated : c)));
        toast.success("Consulta atualizada.");
      } else {
        const created = await createConsultation(workspaceId, patient.id, form);
        setItems((prev) => [created, ...prev]);
        toast.success("Consulta registrada.");
      }
      cancelForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta consulta?")) return;
    try {
      await deleteConsultation(workspaceId, id);
      setItems((prev) => prev.filter((c) => c.id !== id));
      toast.success("Consulta removida.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Carregando consultas…</span>
      </div>
    );
  }

  if (migPending) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 space-y-2">
        <p className="font-semibold">Migration pendente</p>
        <p>Execute o SQL <code className="bg-amber-100 px-1 rounded">20261121060000_workspace_consultations_and_recalls.sql</code> no Supabase para habilitar consultas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Consultas</h2>
          <p className="text-xs text-muted-foreground">
            {items.length === 0 ? "Nenhuma consulta registrada" : `${items.length} consulta${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={showForm ? cancelForm : openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#166b50] px-3 py-2 text-xs font-semibold text-white hover:bg-[#145e45] transition-colors"
        >
          <Plus size={13} /> Nova consulta
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#166b50]/30 bg-[#166b50]/5 p-4 space-y-4"
        >
          <p className="text-sm font-semibold text-[#153f34]">
            {editId != null ? "Editar consulta" : "Registrar consulta"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.consulted_at}
                onChange={(e) => setForm((f) => ({ ...f, consulted_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ConsultationType }))}
              >
                {(Object.entries(CONSULTATION_TYPE_LABELS) as [ConsultationType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ConsultationStatus }))}
              >
                {(Object.entries(CONSULTATION_STATUS_META) as [ConsultationStatus, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
              <input
                type="number"
                min={1}
                max={480}
                placeholder="ex: 50"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form.duration_min ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, duration_min: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notas da consulta</label>
            <textarea
              rows={3}
              placeholder="Resumo, orientações, evolução…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Lock size={11} /> Notas privadas <span className="font-normal">(não visível ao paciente)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Observações internas…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              value={form.private_notes}
              onChange={(e) => setForm((f) => ({ ...f, private_notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancelForm} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#166b50] px-4 py-2 text-sm font-semibold text-white hover:bg-[#145e45] transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editId != null ? "Salvar" : "Registrar"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3 text-muted-foreground">
          <CalendarDays size={32} className="opacity-30" />
          <p className="text-sm">Nenhuma consulta registrada</p>
          <button
            type="button"
            onClick={openCreate}
            className="text-xs text-[#166b50] font-semibold hover:underline"
          >
            Registrar primeira consulta
          </button>
        </div>
      )}

      {/* List */}
      {items.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {items.map((c) => {
            const meta      = CONSULTATION_STATUS_META[c.status];
            const typeLabel = CONSULTATION_TYPE_LABELS[c.type];
            const expanded  = expandedId === c.id;

            return (
              <div key={c.id} className="bg-card">
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Date */}
                  <div className="shrink-0 w-20 text-center">
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {new Date(c.consulted_at + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.consulted_at + "T12:00:00").getFullYear()}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", meta.cls)}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{typeLabel}</span>
                      {c.duration_min && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock size={10} /> {c.duration_min} min
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-xs text-muted-foreground truncate">{c.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {(c.notes || c.private_notes) && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : c.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label={expanded ? "Recolher" : "Expandir"}
                      >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded notes */}
                {expanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                    {c.notes && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{c.notes}</p>
                      </div>
                    )}
                    {c.private_notes && (
                      <div className="rounded bg-amber-50 border border-amber-100 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1">
                          <Lock size={9} /> Notas privadas
                        </p>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{c.private_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Última consulta: {fmtDate(items[0].consulted_at)}
        </p>
      )}
    </div>
  );
}
