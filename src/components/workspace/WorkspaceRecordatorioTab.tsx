import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2, Utensils } from "lucide-react";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { toast } from "sonner";
import {
  fetchPatientRecalls,
  createRecall,
  updateRecall,
  deleteRecall,
  emptyMeal,
  sumMacro,
  DEFAULT_MEAL_LABELS,
  type WorkspaceDietaryRecall,
  type RecallMeal,
} from "@/lib/workspaceRecordatorio";
import type { WorkspacePatient } from "@/lib/workspacePatients";

interface Props {
  workspaceId: string;
  patient: WorkspacePatient;
}

const today = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function MacroChip({ label, value, unit, color }: { label: string; value: number | null; unit?: string; color: string }) {
  if (value == null) return null;
  return (
    <span className={`inline-flex items-baseline gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      <span className="font-bold">{label}</span>
      <span>{value.toFixed(0)}{unit ?? "g"}</span>
    </span>
  );
}

function RecallCard({
  recall,
  onEdit,
  onDelete,
}: {
  recall: WorkspaceDietaryRecall;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasMeals = recall.meals.some((m) => m.description || m.kcal != null);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="shrink-0">
          <p className="text-xs font-semibold text-foreground">
            {new Date(recall.recall_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(recall.recall_date + "T12:00:00").getFullYear()}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          {recall.total_kcal != null && (
            <span className="text-sm font-bold text-foreground">{Math.round(recall.total_kcal)} kcal</span>
          )}
          <div className="flex flex-wrap gap-1 mt-0.5">
            <MacroChip label="P " value={recall.total_protein_g} color="bg-blue-50 text-blue-700" />
            <MacroChip label="C " value={recall.total_carbs_g}   color="bg-yellow-50 text-yellow-700" />
            <MacroChip label="G " value={recall.total_fat_g}     color="bg-orange-50 text-orange-700" />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasMeals && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar recordatório"
            title="Editar recordatório"
            className="p-1.5 rounded text-muted-foreground hover:text-[#166b50] hover:bg-[#166b50]/10 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Excluir recordatório"
            title="Excluir recordatório"
            className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {recall.meals.filter((m) => m.description || m.kcal != null).map((m, i) => (
            <div key={i} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{m.label}</span>
                {m.description && <p className="text-sm text-foreground leading-tight">{m.description}</p>}
              </div>
              <div className="shrink-0 text-right">
                {m.kcal != null && <p className="text-xs font-semibold">{Math.round(m.kcal)} kcal</p>}
                <div className="flex gap-1 mt-0.5">
                  <MacroChip label="P" value={m.protein_g} color="bg-blue-50 text-blue-700" />
                  <MacroChip label="C" value={m.carbs_g}   color="bg-yellow-50 text-yellow-700" />
                  <MacroChip label="G" value={m.fat_g}     color="bg-orange-50 text-orange-700" />
                </div>
              </div>
            </div>
          ))}
          {recall.notes && (
            <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2 mt-2">{recall.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function MealRow({
  meal,
  onChange,
}: {
  meal: RecallMeal;
  onChange: (m: RecallMeal) => void;
}) {
  const num = (v: string) => (v === "" ? null : Number(v));
  const str = (v: number | null) => (v == null ? "" : String(v));

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{meal.label}</p>
      <input
        type="text"
        placeholder="O que comeu? ex: 2 ovos mexidos + torrada integral"
        className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
        value={meal.description}
        onChange={(e) => onChange({ ...meal, description: e.target.value })}
      />
      <div className="grid grid-cols-4 gap-2">
        {[
          { key: "kcal",      label: "kcal",   color: "text-foreground" },
          { key: "protein_g", label: "P (g)",  color: "text-blue-600" },
          { key: "carbs_g",   label: "C (g)",  color: "text-yellow-600" },
          { key: "fat_g",     label: "G (g)",  color: "text-orange-600" },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <label className={`text-[10px] font-medium ${color}`}>{label}</label>
            <input
              type="number"
              min={0}
              step={0.1}
              placeholder="—"
              className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-sm"
              value={str(meal[key as keyof RecallMeal] as number | null)}
              onChange={(e) => onChange({ ...meal, [key]: num(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceRecordatorioTab({ workspaceId, patient }: Props) {
  const [items, setItems]           = useState<WorkspaceDietaryRecall[]>([]);
  const [loading, setLoading]       = useState(true);
  const [migPending, setMigPending] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [formDate, setFormDate]     = useState(today());
  const [formMeals, setFormMeals]   = useState<RecallMeal[]>(() => DEFAULT_MEAL_LABELS.map(emptyMeal));
  const [formNotes, setFormNotes]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const isEditing = editingId !== null;

  useEffect(() => {
    fetchPatientRecalls(workspaceId, patient.id)
      .then(setItems)
      .catch((e: Error) => {
        if (e.message === "MIGRATION_PENDING") setMigPending(true);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, patient.id]);

  function openForm() {
    setEditingId(null);
    setFormDate(today());
    setFormMeals(DEFAULT_MEAL_LABELS.map(emptyMeal));
    setFormNotes("");
    setShowForm(true);
  }

  function openEdit(recall: WorkspaceDietaryRecall) {
    setEditingId(recall.id);
    setFormDate(recall.recall_date);
    // Mantém refeições salvas com rótulo personalizado: updateRecall substitui o array inteiro.
    const extras = recall.meals.filter((m) => !DEFAULT_MEAL_LABELS.includes(m.label));
    setFormMeals([
      ...DEFAULT_MEAL_LABELS.map((label) => recall.meals.find((m) => m.label === label) ?? emptyMeal(label)),
      ...extras,
    ]);
    setFormNotes(recall.notes ?? "");
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const filled = formMeals.filter((m) => m.description.trim() || m.kcal != null);
    if (filled.length === 0) {
      toast.error("Preencha ao menos uma refeição.");
      return;
    }
    setSaving(true);
    try {
      const input = { recall_date: formDate, meals: formMeals, notes: formNotes };
      if (editingId !== null) {
        const updated = await updateRecall(workspaceId, editingId, input);
        setItems((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        toast.success("Recordatório atualizado.");
      } else {
        const created = await createRecall(workspaceId, patient.id, input);
        setItems((prev) => [created, ...prev]);
        toast.success("Recordatório registrado.");
      }
      closeForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover este recordatório?")) return;
    await deleteRecall(workspaceId, id).catch(() => null);
    setItems((prev) => prev.filter((r) => r.id !== id));
    toast.success("Removido.");
  }

  const totalKcal = sumMacro(formMeals, "kcal");
  const totalP    = sumMacro(formMeals, "protein_g");
  const totalC    = sumMacro(formMeals, "carbs_g");
  const totalG    = sumMacro(formMeals, "fat_g");

  if (loading) {
    return (
      <div className="flex justify-center py-16"><LeafLoader label="Carregando recordatório…" /></div>
    );
  }

  if (migPending) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 space-y-2">
        <p className="font-semibold">Migration pendente</p>
        <p>Execute o SQL <code className="bg-amber-100 px-1 rounded">20261121060000_workspace_consultations_and_recalls.sql</code> no Supabase para habilitar o recordatório.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Recordatório Alimentar 24h</h2>
          <p className="text-xs text-muted-foreground">
            {items.length === 0 ? "Nenhum recordatório registrado" : `${items.length} registro${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          onClick={showForm ? closeForm : openForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#166b50] px-3 py-2 text-xs font-semibold text-white hover:bg-[#145e45] transition-colors"
        >
          <Plus size={13} /> Registrar R24h
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#166b50]/30 bg-[#166b50]/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#153f34]">{isEditing ? "Editar recordatório" : "Novo recordatório"}</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mr-2">Data</label>
              <input
                type="date"
                required
                className="rounded border border-border bg-background px-2 py-1 text-sm"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {formMeals.map((meal, i) => (
              <MealRow
                key={i}
                meal={meal}
                onChange={(updated) =>
                  setFormMeals((prev) => prev.map((m, j) => (j === i ? updated : m)))
                }
              />
            ))}
          </div>

          {/* Totals */}
          {(totalKcal != null || totalP != null) && (
            <div className="flex flex-wrap gap-2 items-center rounded-lg bg-background border border-border px-4 py-2">
              <span className="text-xs font-semibold text-muted-foreground mr-2">Total:</span>
              {totalKcal != null && <span className="text-sm font-bold">{Math.round(totalKcal)} kcal</span>}
              <MacroChip label="P " value={totalP} color="bg-blue-50 text-blue-700" />
              <MacroChip label="C " value={totalC} color="bg-yellow-50 text-yellow-700" />
              <MacroChip label="G " value={totalG} color="bg-orange-50 text-orange-700" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            <textarea
              rows={2}
              placeholder="Notas adicionais…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={closeForm} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#166b50] px-4 py-2 text-sm font-semibold text-white hover:bg-[#145e45] transition-colors disabled:opacity-60">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {isEditing ? "Salvar alterações" : "Registrar"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3 text-muted-foreground">
          <Utensils size={32} className="opacity-30" />
          <p className="text-sm">Nenhum recordatório registrado</p>
          <button type="button" onClick={openForm} className="text-xs text-[#166b50] font-semibold hover:underline">
            Registrar primeiro recordatório
          </button>
        </div>
      )}

      {/* List */}
      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((r) => (
            <RecallCard key={r.id} recall={r} onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Último registro: {fmtDate(items[0].recall_date)}
        </p>
      )}
    </div>
  );
}
