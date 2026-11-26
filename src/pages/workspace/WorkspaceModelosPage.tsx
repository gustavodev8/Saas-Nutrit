import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BookOpen, Search, Sparkles, SlidersHorizontal, User, X } from "lucide-react";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { fetchWorkspaceTemplates, type WorkspaceDietTemplate } from "@/lib/workspaceTemplates";

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

const STRATEGY_COLORS: Record<string, string> = {
  emagrecimento: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  ganho_peso: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200",
  hipertrofia: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200",
  low_carb: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200",
  vegetariano: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200",
  alta_proteina: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  mediterranea: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200",
  maintenance: "bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground",
};

type View = "meus" | "sistema";

function kcalBadge(kcal?: number) {
  if (!kcal) return null;
  return (
    <span className="text-xs text-muted-foreground font-medium">
      {Math.round(kcal)} kcal
    </span>
  );
}

function MacroBar({ protein, carbs, fat }: { protein?: number; carbs?: number; fat?: number }) {
  const total = (protein ?? 0) + (carbs ?? 0) + (fat ?? 0);
  if (!total) return null;
  const pPct = Math.round(((protein ?? 0) / total) * 100);
  const cPct = Math.round(((carbs ?? 0) / total) * 100);
  const fPct = 100 - pPct - cPct;
  return (
    <div className="flex gap-1 mt-2">
      <div title={`Proteína ${pPct}%`} className="h-1.5 rounded-full bg-blue-400" style={{ width: `${pPct}%` }} />
      <div title={`Carboidratos ${cPct}%`} className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${cPct}%` }} />
      <div title={`Gordura ${fPct}%`} className="h-1.5 rounded-full bg-orange-400" style={{ width: `${fPct}%` }} />
    </div>
  );
}

export function WorkspaceModelosPage() {
  const { membership } = useWorkspaceAuth();
  const workspaceId = membership?.workspaceId ?? null;
  const [templates, setTemplates] = useState<WorkspaceDietTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState("");
  const [strategy, setStrategy] = useState("all");
  // null = ainda não decidido (escolhe automaticamente após carregar)
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    fetchWorkspaceTemplates()
      .then((data) => { if (active) setTemplates(data); })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retryKey]);

  // Separa modelos próprios do workspace ativo dos modelos globais (do sistema).
  // Qualquer modelo de outro workspace (não deveria ocorrer via RLS) é ocultado.
  const ownTemplates = useMemo(
    () => templates.filter((t) => t.workspace_id != null && t.workspace_id === workspaceId),
    [templates, workspaceId],
  );
  const systemTemplates = useMemo(
    () => templates.filter((t) => t.workspace_id == null),
    [templates],
  );

  // Escolhe a aba inicial assim que os dados chegam: "Meus" se houver algum, senão "Do sistema".
  const effectiveView: View = view ?? (ownTemplates.length > 0 ? "meus" : "sistema");
  const baseList = effectiveView === "meus" ? ownTemplates : systemTemplates;

  const strategies = useMemo(() => {
    const set = new Set(baseList.map((t) => t.strategy).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [baseList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return baseList.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        Math.round(t.total_kcal ?? 0).toString().includes(q);
      const matchStrategy = strategy === "all" || t.strategy === strategy;
      return matchSearch && matchStrategy;
    });
  }, [baseList, search, strategy]);

  const hasFilter = search !== "" || strategy !== "all";

  function clearFilters() {
    setSearch("");
    setStrategy("all");
  }

  function switchView(next: View) {
    setView(next);
    clearFilters();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 border-b border-border pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">Modelos de Dieta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Protocolos base reutilizáveis — seus modelos e a biblioteca do sistema
          </p>
        </div>
      </div>

      {/* Abas: Meus modelos / Do sistema */}
      <div className="mb-4 inline-flex rounded-md border border-border bg-muted/30 p-0.5">
        <button
          type="button"
          onClick={() => switchView("meus")}
          aria-pressed={effectiveView === "meus"}
          className={cn(
            "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
            effectiveView === "meus"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <User size={14} aria-hidden="true" /> Meus modelos ({ownTemplates.length})
        </button>
        <button
          type="button"
          onClick={() => switchView("sistema")}
          aria-pressed={effectiveView === "sistema"}
          className={cn(
            "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors",
            effectiveView === "sistema"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles size={14} aria-hidden="true" /> Do sistema ({systemTemplates.length})
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar modelos"
            className="pl-9"
            placeholder="Buscar por nome, estratégia ou kcal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-muted-foreground" />
          <select
            aria-label="Filtrar por estratégia"
            className="min-h-10 max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option value="all">Todas as estratégias</option>
            {strategies.map((s) => (
              <option key={s} value={s}>
                {STRATEGY_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X size={14} /> Limpar
          </Button>
        )}
      </div>

      {/* Count */}
      {!loading && !loadError && (
        <p className="mb-4 text-xs font-medium text-muted-foreground">
          {filtered.length} modelo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <LeafLoader label="Carregando modelos…" />
        </div>
      )}

      {loadError && !loading && (
        <div role="alert" className="flex min-h-72 flex-col items-start justify-center gap-4 border-y border-border py-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive"><AlertCircle size={21} aria-hidden="true" /></span>
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar os modelos</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Verifique sua conexão e tente novamente.</p>
          </div>
          <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>Tentar novamente</Button>
        </div>
      )}

      {/* Empty — Meus modelos sem nenhum criado (guia de criação) */}
      {!loading && !loadError && effectiveView === "meus" && ownTemplates.length === 0 && (
        <div className="flex min-h-72 flex-col items-start justify-center gap-4 border-y border-border py-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><User size={21} aria-hidden="true" /></span>
          <div className="max-w-xl min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Você ainda não tem modelos próprios</h2>
            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              Monte um plano alimentar para um paciente e use o botão <strong>“Salvar como modelo”</strong> dentro do plano.
              Ele passa a aparecer aqui e você pode reutilizá-lo, renomeá-lo ou excluí-lo quando quiser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/workspace/patients">Ir para pacientes</Link>
            </Button>
            {systemTemplates.length > 0 && (
              <Button variant="ghost" onClick={() => switchView("sistema")}>
                Ver modelos do sistema
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Empty — filtro sem resultados ou aba do sistema vazia */}
      {!loading && !loadError && filtered.length === 0 && !(effectiveView === "meus" && ownTemplates.length === 0) && (
        <div className="flex min-h-72 flex-col items-start justify-center gap-4 border-y border-border py-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><BookOpen size={21} aria-hidden="true" /></span>
          <div className="max-w-lg min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{hasFilter ? "Nenhum modelo para estes filtros" : "Nenhum modelo disponível"}</h2>
            <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
              {hasFilter ? "Tente outro nome ou estratégia para encontrar um protocolo." : "Os modelos de dieta aparecerão aqui quando estiverem disponíveis."}
            </p>
          </div>
          {hasFilter && (
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !loadError && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/workspace/modelos/${t.id}`}
              className="group flex min-h-36 flex-col rounded-md border border-border bg-card p-4 transition-[border-color,background-color] duration-150 hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
                    <BookOpen size={14} className="text-primary" />
                  </div>
                  <span className="line-clamp-2 break-words text-sm font-semibold leading-tight text-foreground group-hover:text-primary">
                    {t.name}
                  </span>
                </div>
                <ArrowRight size={15} className="shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
              </div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {t.strategy && (
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium",
                      STRATEGY_COLORS[t.strategy] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {STRATEGY_LABELS[t.strategy] ?? t.strategy}
                  </span>
                )}
                {kcalBadge(t.total_kcal)}
              </div>

              {(t.protein_g || t.carbs_g || t.fat_g) && (
                <div className="mt-auto flex gap-3 pt-2 text-xs text-muted-foreground">
                  <span>P {Math.round(t.protein_g ?? 0)}g</span>
                  <span>C {Math.round(t.carbs_g ?? 0)}g</span>
                  <span>G {Math.round(t.fat_g ?? 0)}g</span>
                </div>
              )}
              <MacroBar protein={t.protein_g} carbs={t.carbs_g} fat={t.fat_g} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
