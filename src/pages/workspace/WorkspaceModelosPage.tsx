import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2, Search, SlidersHorizontal, Utensils, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  emagrecimento: "bg-blue-100 text-blue-700",
  ganho_peso: "bg-orange-100 text-orange-700",
  hipertrofia: "bg-purple-100 text-purple-700",
  low_carb: "bg-yellow-100 text-yellow-700",
  vegetariano: "bg-green-100 text-green-700",
  alta_proteina: "bg-red-100 text-red-700",
  mediterranea: "bg-teal-100 text-teal-700",
  maintenance: "bg-gray-100 text-gray-600",
};

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
  const [templates, setTemplates] = useState<WorkspaceDietTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [strategy, setStrategy] = useState("all");

  useEffect(() => {
    fetchWorkspaceTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const strategies = useMemo(() => {
    const set = new Set(templates.map((t) => t.strategy).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return templates.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        Math.round(t.total_kcal ?? 0).toString().includes(q);
      const matchStrategy = strategy === "all" || t.strategy === strategy;
      return matchSearch && matchStrategy;
    });
  }, [templates, search, strategy]);

  const hasFilter = search !== "" || strategy !== "all";

  function clearFilters() {
    setSearch("");
    setStrategy("all");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Modelos de Dieta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Protocolos base reutilizáveis — independentes de paciente
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, estratégia ou kcal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
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
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} modelo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={20} className="animate-spin" />
          Carregando modelos…
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Utensils size={32} className="opacity-30" />
          <p className="text-sm">Nenhum modelo encontrado</p>
          {hasFilter && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/workspace/modelos/${t.id}`}
              className="group border rounded-xl p-4 bg-card hover:border-[#166b50]/60 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-[#166b50]/10 p-1.5 shrink-0">
                    <BookOpen size={14} className="text-[#166b50]" />
                  </div>
                  <span className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-[#166b50] transition-colors">
                    {t.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {t.strategy && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      STRATEGY_COLORS[t.strategy] ?? "bg-gray-100 text-gray-600"
                    )}
                  >
                    {STRATEGY_LABELS[t.strategy] ?? t.strategy}
                  </span>
                )}
                {kcalBadge(t.total_kcal)}
              </div>

              {(t.protein_g || t.carbs_g || t.fat_g) && (
                <div className="text-xs text-muted-foreground flex gap-3">
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
