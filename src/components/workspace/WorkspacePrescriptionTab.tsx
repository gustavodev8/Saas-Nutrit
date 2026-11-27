import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, Printer, Save, Loader2, Search, FlaskConical,
  ChevronDown, FileText, Beaker, History, ChevronRight, Pencil, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { matchesNormalizedSearch } from "@/lib/normalizedSearch";
import type { ReadyFormula, SavedPrescription, Substrate } from "@/lib/supabase";
import {
  deleteWorkspacePrescription,
  fetchWorkspacePrescriptions,
  fetchWorkspaceReadyFormulas,
  fetchWorkspaceSubstrates,
  saveWorkspacePrescription,
  workspacePrescriptionsErrorMessage,
} from "@/lib/workspacePrescriptions";
import {
  printPrescriptionDocument,
  type PrescriptionPrintBlock,
  type PrescriptionProfessional,
} from "@/lib/prescriptionPrint";

// ─── Local types ──────────────────────────────────────────────────────────────

interface BlockItem {
  substrateId?: number;
  name: string;
  dose: number;
  unit: string;
}

interface PrescriptionBlock {
  localId: string;
  label: string;
  pharmaceuticalForm: string;
  posology: string;
  items: BlockItem[];
}

interface CustomItemInput {
  name: string;
  dose: string;
  unit: string;
}

interface WorkspacePrescriptionTabProps {
  workspaceId: string;
  patientId: number;
  patientName?: string | null;
  /** Nome do profissional/workspace para o PDF (fallback: "Nutricionista"). */
  professionalName?: string | null;
}

const PHARMA_FORMS = ["Cápsulas", "Sachê", "Solução oral", "Comprimidos", "Creme", "Gel"];
const UNITS = ["mg", "mcg", "g", "UI", "ml", "gotas", "UFC"];
const EMPTY_CUSTOM: CustomItemInput = { name: "", dose: "", unit: "mg" };

function toPrintBlocks(blocks: PrescriptionBlock[]): PrescriptionPrintBlock[] {
  return blocks.map((b) => ({
    label: b.label,
    pharmaceuticalForm: b.pharmaceuticalForm,
    posology: b.posology,
    items: b.items.map((i) => ({ name: i.name, dose: i.dose, unit: i.unit })),
  }));
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WorkspacePrescriptionTab({
  workspaceId,
  patientId,
  patientName,
  professionalName,
}: WorkspacePrescriptionTabProps) {
  const displayName = patientName?.trim() || "Paciente";
  const professional = useMemo<PrescriptionProfessional>(
    () => ({ name: professionalName ?? null }),
    [professionalName],
  );

  const [substrates, setSubstrates] = useState<Substrate[]>([]);
  const [formulas, setFormulas] = useState<ReadyFormula[]>([]);
  const [history, setHistory] = useState<SavedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"builder" | "history">("builder");
  const [leftTab, setLeftTab] = useState<"formulas" | "substrates">("formulas");
  const [objective, setObjective] = useState("Todos");
  const [subSearch, setSubSearch] = useState("");
  const [blocks, setBlocks] = useState<PrescriptionBlock[]>([]);
  const [objOpen, setObjOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | undefined>(undefined);
  const [customItemInputs, setCustomItemInputs] = useState<Record<string, CustomItemInput>>({});
  const objRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchWorkspacePrescriptions(workspaceId, patientId));
    } catch (err) {
      toast.error(workspacePrescriptionsErrorMessage(err));
    }
  }, [workspaceId, patientId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWorkspaceSubstrates(),
      fetchWorkspaceReadyFormulas(),
      fetchWorkspacePrescriptions(workspaceId, patientId),
    ])
      .then(([subs, fmls, hist]) => {
        if (cancelled) return;
        setSubstrates(subs);
        setFormulas(fmls);
        setHistory(hist);
      })
      .catch((err: unknown) => {
        if (!cancelled) toast.error(workspacePrescriptionsErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workspaceId, patientId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (objRef.current && !objRef.current.contains(e.target as Node)) setObjOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nextLabel = () => `Fórmula ${blocks.length + 1}`;

  const newBlock = (): PrescriptionBlock => ({
    localId: crypto.randomUUID(),
    label: nextLabel(),
    pharmaceuticalForm: "Cápsulas",
    posology: "",
    items: [],
  });

  // Add entire ready formula as a new block
  const addFormula = (formula: ReadyFormula) => {
    const items: BlockItem[] = (formula.items ?? []).map((fi) => ({
      substrateId: fi.substrate_id ?? undefined,
      name: fi.name ?? fi.substrate_name ?? fi.substrate?.name ?? "",
      dose: fi.applied_dose,
      unit: fi.unit,
    }));
    const block: PrescriptionBlock = {
      localId: crypto.randomUUID(),
      label: nextLabel(),
      pharmaceuticalForm: formula.pharmaceutical_form,
      posology: formula.posology ?? "",
      items,
    };
    setBlocks((prev) => [...prev, block]);
    toast.success(`"${formula.name}" adicionada ao receituário.`);
  };

  // Add a single substrate to an existing block (or create a new one)
  const addSubstrate = (sub: Substrate, blockLocalId?: string) => {
    const item: BlockItem = {
      substrateId: sub.id,
      name: sub.name,
      dose: sub.ideal_dose ?? sub.min_dose ?? 0,
      unit: sub.unit,
    };
    if (blockLocalId) {
      setBlocks((prev) => prev.map((b) =>
        b.localId === blockLocalId ? { ...b, items: [...b.items, item] } : b,
      ));
    } else {
      const block = newBlock();
      block.items = [item];
      setBlocks((prev) => [...prev, block]);
    }
  };

  const removeBlock = (localId: string) =>
    setBlocks((prev) => prev.filter((b) => b.localId !== localId));

  const removeItem = (blockId: string, idx: number) =>
    setBlocks((prev) => prev.map((b) =>
      b.localId === blockId ? { ...b, items: b.items.filter((_, i) => i !== idx) } : b,
    ));

  const patchBlock = (localId: string, patch: Partial<PrescriptionBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.localId === localId ? { ...b, ...patch } : b)));

  const patchItem = (blockId: string, idx: number, patch: Partial<BlockItem>) =>
    setBlocks((prev) => prev.map((b) =>
      b.localId === blockId
        ? { ...b, items: b.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)) }
        : b,
    ));

  const patchCustomInput = (blockId: string, patch: Partial<CustomItemInput>) =>
    setCustomItemInputs((prev) => ({ ...prev, [blockId]: { ...(prev[blockId] ?? EMPTY_CUSTOM), ...patch } }));

  const handleAddEmptyBlock = () => setBlocks((prev) => [...prev, newBlock()]);

  const handleCancelEdit = () => {
    setEditingPrescriptionId(undefined);
    setBlocks([]);
    toast.info("Edição cancelada.");
  };

  const handleEditPrescription = (p: SavedPrescription) => {
    setEditingPrescriptionId(p.id);
    setBlocks(p.blocks.map((b) => ({
      localId: crypto.randomUUID(),
      label: b.label,
      pharmaceuticalForm: b.pharmaceutical_form,
      posology: b.posology ?? "",
      items: b.items.map((i) => ({
        substrateId: i.substrate_id ?? undefined,
        name: i.name,
        dose: i.dose,
        unit: i.unit,
      })),
    })));
    setView("builder");
    toast.info(`Editando Prescrição #${p.id}.`);
  };

  const handleAddCustomItem = (blockLocalId: string) => {
    const input = customItemInputs[blockLocalId];
    if (!input?.name?.trim()) { toast.error("Digite o nome do ativo."); return; }
    const newItem: BlockItem = {
      name: input.name.trim(),
      dose: parseFloat(input.dose) || 0,
      unit: input.unit || "mg",
    };
    setBlocks((prev) => prev.map((b) =>
      b.localId === blockLocalId ? { ...b, items: [...b.items, newItem] } : b,
    ));
    setCustomItemInputs((prev) => ({ ...prev, [blockLocalId]: { ...EMPTY_CUSTOM } }));
  };

  const handleSave = async () => {
    const filled = blocks.filter((b) => b.items.length > 0);
    if (filled.length === 0) { toast.error("Adicione pelo menos um ativo ao receituário."); return; }
    setSaving(true);
    try {
      await saveWorkspacePrescription(
        workspaceId,
        patientId,
        filled.map((b) => ({
          label: b.label,
          pharmaceuticalForm: b.pharmaceuticalForm,
          posology: b.posology,
          items: b.items.map((it) => ({
            substrateId: it.substrateId,
            name: it.name,
            dose: it.dose,
            unit: it.unit,
          })),
        })),
        editingPrescriptionId,
      );
      toast.success(editingPrescriptionId ? "Prescrição atualizada com sucesso." : "Prescrição salva com sucesso.");
      setBlocks([]);
      setEditingPrescriptionId(undefined);
      await loadHistory();
      setView("history");
    } catch (err) {
      toast.error(workspacePrescriptionsErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrescription = async (id: number) => {
    if (!window.confirm("Excluir esta prescrição?")) return;
    try {
      await deleteWorkspacePrescription(workspaceId, id);
      toast.success("Prescrição excluída.");
      setHistory((prev) => prev.filter((p) => p.id !== id));
      if (editingPrescriptionId === id) {
        setEditingPrescriptionId(undefined);
        setBlocks([]);
      }
    } catch (err) {
      toast.error(workspacePrescriptionsErrorMessage(err));
    }
  };

  const print = async (toPrint: PrescriptionPrintBlock[]) => {
    const ok = await printPrescriptionDocument(toPrint, displayName, professional);
    if (!ok) toast.error("Permita popups para gerar o receituário.");
  };

  const printSaved = (p: SavedPrescription) =>
    print(p.blocks.map((b) => ({
      label: b.label,
      pharmaceuticalForm: b.pharmaceutical_form,
      posology: b.posology ?? "",
      items: b.items.map((i) => ({ name: i.name, dose: i.dose, unit: i.unit })),
    })));

  const handlePrint = async () => {
    const filled = blocks.filter((b) => b.items.length > 0);
    if (filled.length === 0) { toast.error("Adicione pelo menos um ativo para imprimir."); return; }
    await print(toPrintBlocks(filled));
  };

  // Filtered data
  const objectives = ["Todos", ...Array.from(new Set(formulas.map((f) => f.objective)))];
  const visibleFormulas = objective === "Todos" ? formulas : formulas.filter((f) => f.objective === objective);
  const visibleSubs = subSearch.length > 0
    ? substrates.filter((s) => matchesNormalizedSearch({ name: s.name, search_text: s.category }, subSearch))
    : substrates;
  const groupedSubs = visibleSubs.reduce<Record<string, Substrate[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
  const totalItems = blocks.reduce((n, b) => n + b.items.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-primary" size={22} />
      </div>
    );
  }

  // ── History view ────────────────────────────────────────────────────────────
  if (view === "history") {
    const fmtDate = (iso: string) =>
      new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Histórico de Prescrições</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{displayName} · {history.length} prescrição(ões)</p>
          </div>
          <Button size="sm" onClick={() => setView("builder")} className="gap-1.5">
            <Plus size={13} /> Nova Prescrição
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-2 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground">
            <History size={28} className="opacity-20" />
            <p className="text-sm">Nenhuma prescrição salva ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((p) => (
              <div key={p.id} className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <div
                  className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  <FileText size={14} className="text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Prescrição #{p.id}
                      <span className="text-muted-foreground font-normal text-xs ml-2">· {fmtDate(p.created_at)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.blocks.length} bloco(s) · {p.blocks.reduce((n, b) => n + b.items.length, 0)} ativo(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleEditPrescription(p); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border/50 hover:border-primary/30"
                      title="Editar esta prescrição"
                    >
                      <Pencil size={11} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void printSaved(p); }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border/50 hover:border-primary/30"
                    >
                      <Printer size={11} /> PDF
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir prescrição #${p.id}`}
                      onClick={(e) => { e.stopPropagation(); void handleDeletePrescription(p.id); }}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className={cn("text-muted-foreground transition-transform", expandedId === p.id && "rotate-90")} />
                  </div>
                </div>
                {expandedId === p.id && (
                  <div className="p-4 space-y-3">
                    {p.blocks.map((b) => (
                      <div key={b.id} className="rounded-lg border border-border/50 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/30">
                          <span className="text-xs font-bold text-foreground">{b.label}</span>
                          <span className="text-[10px] text-muted-foreground">{b.pharmaceutical_form}{b.posology ? ` · ${b.posology}` : ""}</span>
                        </div>
                        <div className="divide-y divide-border/20">
                          {b.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-1.5">
                              <span className="text-xs text-foreground">{item.name}</span>
                              <span className="text-xs font-semibold text-primary tabular-nums">{item.dose} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Builder view ────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-0 h-[calc(100vh-220px)] min-h-[500px] rounded-xl border border-border/60 overflow-hidden">

      {/* LEFT PANEL — Catalog (biblioteca global, somente leitura) */}
      <div className="w-[56%] xl:w-[58%] shrink-0 flex flex-col border-r border-border/60 bg-muted/10">

        <div className="flex border-b border-border/60 shrink-0">
          {(["formulas", "substrates"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setLeftTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2",
                leftTab === tab
                  ? "border-primary text-primary bg-background"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "formulas" ? "Fórmulas Prontas" : "Substratos Avulsos"}
            </button>
          ))}
        </div>

        {leftTab === "formulas" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-border/40 shrink-0">
              <div className="relative" ref={objRef}>
                <button
                  type="button"
                  onClick={() => setObjOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-lg bg-background hover:bg-muted/40 transition-colors"
                >
                  <span className={objective === "Todos" ? "text-muted-foreground" : "text-foreground font-medium"}>
                    {objective === "Todos" ? "Todos os objetivos" : objective}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {objOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                    {objectives.map((obj) => (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => { setObjective(obj); setObjOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm transition-colors",
                          objective === obj ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60",
                        )}
                      >
                        {obj === "Todos" ? "Todos os objetivos" : obj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {visibleFormulas.map((formula) => (
                <div key={formula.id} className="bg-background border border-border/60 rounded-lg p-3 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{formula.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {formula.objective}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formula.pharmaceutical_form}</span>
                      </div>
                      {formula.items && formula.items.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                          {formula.items.slice(0, 4).map((fi) =>
                            `${fi.substrate_name ?? fi.substrate?.name} ${fi.applied_dose}${fi.unit}`,
                          ).join(" · ")}
                          {formula.items.length > 4 && ` · +${formula.items.length - 4}`}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Adicionar ${formula.name}`}
                      onClick={() => addFormula(formula)}
                      className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {visibleFormulas.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma fórmula para este objetivo.</p>
              )}
            </div>
          </div>
        )}

        {leftTab === "substrates" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-3 border-b border-border/40 shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Buscar substrato..."
                  className="pl-7 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Object.entries(groupedSubs).map(([cat, subs]) => (
                <div key={cat}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FlaskConical size={10} className="text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{cat}</p>
                  </div>
                  <div className="space-y-1">
                    {subs.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 bg-background hover:border-primary/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{sub.name}</p>
                          {sub.ideal_dose && (
                            <p className="text-[10px] text-muted-foreground">
                              Dose ideal: {sub.ideal_dose} {sub.unit}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {blocks.map((b) => (
                            <button
                              key={b.localId}
                              type="button"
                              title={`Adicionar a ${b.label}`}
                              onClick={() => addSubstrate(sub, b.localId)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                            >
                              {b.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            title="Criar novo bloco"
                            onClick={() => addSubstrate(sub)}
                            className="w-6 h-6 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedSubs).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum substrato encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Receituário */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">

        <div className="flex flex-col gap-3 px-4 py-3 border-b border-border/60 shrink-0 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={15} className="text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">Receituário</p>
              <p className="truncate text-[10px] text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setView("history")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/50 hover:border-border"
            >
              <History size={12} />
              Histórico {history.length > 0 && <span className="ml-0.5 tabular-nums">({history.length})</span>}
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handlePrint()}
                disabled={totalItems === 0}
                className="h-7 gap-1.5 border-border/60 bg-background text-xs"
              >
                <Printer size={12} />
                Imprimir PDF
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSave()}
                disabled={saving || totalItems === 0}
                className="h-7 gap-1.5 text-xs"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? "Salvando…" : "Salvar"}
              </Button>
              {/* TODO: envio do receituário por e-mail (fora do escopo desta fase). */}
            </div>
          </div>
        </div>

        {editingPrescriptionId && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <span>Editando Prescrição <strong>#{editingPrescriptionId}</strong> (as alterações serão salvas ao clicar em Salvar)</span>
            <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-6 text-[10px] text-amber-800 hover:text-amber-900 gap-1 hover:bg-amber-500/10">
              <X size={10} /> Cancelar
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-12">
              <Beaker size={32} className="opacity-20" />
              <div className="text-center">
                <p className="text-sm font-medium">Receituário vazio</p>
                <p className="text-xs mt-0.5">Adicione uma fórmula ou substrato pelo painel esquerdo.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddEmptyBlock} className="text-xs gap-1.5 mt-2">
                <Plus size={13} />
                Criar Fórmula em Branco
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {blocks.map((block) => {
                  const custom = customItemInputs[block.localId] ?? EMPTY_CUSTOM;
                  return (
                    <div key={block.localId} className="rounded-xl border border-border/70 overflow-hidden">
                      <div className="space-y-2 bg-muted/30 px-3 py-3 border-b border-border/40">
                        <div className="flex items-start justify-between gap-3">
                          <Input
                            value={block.label}
                            aria-label="Nome da fórmula"
                            onChange={(e) => patchBlock(block.localId, { label: e.target.value })}
                            className="h-8 max-w-[180px] flex-1 border-transparent bg-transparent px-1.5 text-sm font-semibold hover:border-border focus:border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeBlock(block.localId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Remover fórmula"
                            aria-label="Remover fórmula"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                          <select
                            value={block.pharmaceuticalForm}
                            aria-label="Forma farmacêutica"
                            onChange={(e) => patchBlock(block.localId, { pharmaceuticalForm: e.target.value })}
                            className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs text-foreground"
                          >
                            {PHARMA_FORMS.map((f) => <option key={f}>{f}</option>)}
                          </select>
                          <Input
                            value={block.posology}
                            onChange={(e) => patchBlock(block.localId, { posology: e.target.value })}
                            placeholder="Posologia (ex: 1x ao dia)"
                            className="h-8 border-border/60 bg-background px-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-border/30">
                        {block.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/10 transition-colors group">
                            <span className="flex-1 text-xs font-medium text-foreground">{item.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Input
                                type="number"
                                step="any"
                                value={item.dose}
                                aria-label={`Dose de ${item.name}`}
                                onChange={(e) => patchItem(block.localId, idx, { dose: parseFloat(e.target.value) || 0 })}
                                className="h-6 w-20 text-xs text-right tabular-nums border-border/50"
                              />
                              <span className="text-[11px] text-muted-foreground w-8">{item.unit}</span>
                              <button
                                type="button"
                                aria-label={`Remover ${item.name}`}
                                onClick={() => removeItem(block.localId, idx)}
                                className="text-muted-foreground/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {block.items.length === 0 && (
                          <p className="text-xs text-muted-foreground italic px-3 py-2">
                            Nenhum ativo neste bloco.
                          </p>
                        )}

                        {/* Item avulso (texto livre) */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/10 border-t border-border/20">
                          <Input
                            placeholder="Adicionar ativo avulso..."
                            value={custom.name}
                            onChange={(e) => patchCustomInput(block.localId, { name: e.target.value })}
                            className="h-7 text-xs flex-1 bg-background"
                          />
                          <Input
                            type="number"
                            placeholder="Qtd"
                            value={custom.dose}
                            onChange={(e) => patchCustomInput(block.localId, { dose: e.target.value })}
                            className="h-7 w-14 text-xs text-right bg-background"
                          />
                          <select
                            value={custom.unit}
                            aria-label="Unidade"
                            onChange={(e) => patchCustomInput(block.localId, { unit: e.target.value })}
                            className="h-7 text-[11px] border border-border/60 rounded bg-background px-1 text-foreground"
                          >
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button
                            type="button"
                            aria-label="Adicionar ativo avulso"
                            onClick={() => handleAddCustomItem(block.localId)}
                            className="h-7 w-7 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold rounded transition-colors flex items-center justify-center shrink-0"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddEmptyBlock}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border/85 hover:border-primary/50 hover:bg-primary/5 rounded-xl text-xs font-semibold text-primary transition-all mt-4 cursor-pointer"
              >
                <Plus size={13} />
                Criar Nova Fórmula (Bloco em Branco)
              </button>
            </>
          )}
        </div>

        {blocks.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 bg-muted/10 shrink-0">
            <p className="text-[11px] text-muted-foreground">
              {blocks.length} bloco(s) · {totalItems} ativo(s)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
