import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2, Search, Sparkles, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fetchWorkspaceTemplates, type WorkspaceDietTemplate } from "@/lib/workspaceTemplates";

type View = "meus" | "sistema";

const STRATEGY_LABELS: Record<string, string> = {
  low_carb: "Low Carb",
  mediterranea: "Mediterrânea",
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  ganho_peso: "Ganho de peso",
  vegetariano: "Vegetariano",
  alta_proteina: "Alta proteína",
  maintenance: "Manutenção",
};

/**
 * Seletor de modelo de dieta para criar um plano pré-preenchido para o paciente.
 * Lista modelos próprios do workspace e os globais do sistema; ao escolher,
 * abre o editor em /plan/novo?templateId=<id> (mecanismo já existente).
 */
export function WorkspaceUseTemplateDialog({
  open,
  onOpenChange,
  workspaceId,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  patientId: number;
}) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkspaceDietTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(false);
    fetchWorkspaceTemplates()
      .then((data) => { if (active) setTemplates(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  // Reinicia busca/aba ao reabrir.
  useEffect(() => {
    if (!open) { setSearch(""); setView(null); }
  }, [open]);

  const own = useMemo(
    () => templates.filter((t) => t.workspace_id != null && t.workspace_id === workspaceId),
    [templates, workspaceId],
  );
  const system = useMemo(() => templates.filter((t) => t.workspace_id == null), [templates]);

  const effectiveView: View = view ?? (own.length > 0 ? "meus" : "sistema");
  const base = effectiveView === "meus" ? own : system;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      (t.strategy ?? "").toLowerCase().includes(q) ||
      Math.round(t.total_kcal ?? 0).toString().includes(q),
    );
  }, [base, search]);

  function choose(id: number) {
    onOpenChange(false);
    navigate(`/workspace/patients/${patientId}/plan/novo?templateId=${id}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(92vw,42rem)] flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle>Criar plano a partir de um modelo</DialogTitle>
          <DialogDescription>
            Escolha um modelo seu ou da biblioteca do sistema. O editor abre pré-preenchido com as refeições.
          </DialogDescription>
        </DialogHeader>

        {/* Abas Meus / Do sistema */}
        <div className="inline-flex w-fit rounded-md border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setView("meus")}
            aria-pressed={effectiveView === "meus"}
            className={cn(
              "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
              effectiveView === "meus" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User size={14} aria-hidden="true" /> Meus ({own.length})
          </button>
          <button
            type="button"
            onClick={() => setView("sistema")}
            aria-pressed={effectiveView === "sistema"}
            className={cn(
              "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
              effectiveView === "sistema" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles size={14} aria-hidden="true" /> Do sistema ({system.length})
          </button>
        </div>

        {/* Busca */}
        <div className="relative mt-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Buscar modelos"
            className="pl-9"
            placeholder="Buscar por nome, estratégia ou kcal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Lista */}
        <div className="mt-2 flex-1 overflow-y-auto">
          {loading && (
            <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />Carregando modelos…
            </p>
          )}
          {error && !loading && (
            <p role="alert" className="py-8 text-sm text-destructive">
              Não foi possível carregar os modelos. Feche e tente novamente.
            </p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">
              {effectiveView === "meus" && own.length === 0
                ? "Você ainda não tem modelos próprios. Em um plano salvo, use “Salvar como modelo” para reaproveitá-lo aqui."
                : "Nenhum modelo encontrado para esta busca."}
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <ul className="divide-y rounded-md border border-border">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => choose(t.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <BookOpen size={15} className="shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{t.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {t.strategy ? `${STRATEGY_LABELS[t.strategy] ?? t.strategy} · ` : ""}
                          {t.total_kcal ? `${Math.round(t.total_kcal)} kcal` : "sem meta calórica"}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-primary">Usar →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
