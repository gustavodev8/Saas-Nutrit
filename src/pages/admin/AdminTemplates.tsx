import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutList,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteDietTemplate,
  fetchDietTemplates,
  type DietTemplate,
} from "@/lib/supabase";

const ITEMS_PER_PAGE = 12;

const STRATEGY_LABELS: Record<string, string> = {
  low_carb: "Low Carb",
  mediterranea: "Mediterrânea",
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  ganho_peso: "Ganho de peso",
  manutencao: "Manutenção",
  vegetariano: "Vegetariano",
  vegano: "Vegano",
};

const STRATEGY_COLORS: Record<string, string> = {
  low_carb: "bg-blue-100 text-blue-700 border-blue-200",
  mediterranea: "bg-teal-100 text-teal-700 border-teal-200",
  hipertrofia: "bg-emerald-100 text-emerald-700 border-emerald-200",
  emagrecimento: "bg-amber-100 text-amber-700 border-amber-200",
  ganho_peso: "bg-rose-100 text-rose-700 border-rose-200",
  manutencao: "bg-slate-100 text-slate-600 border-slate-200",
  vegetariano: "bg-lime-100 text-lime-700 border-lime-200",
  vegano: "bg-green-100 text-green-700 border-green-200",
};

type SortKey = "name_asc" | "name_desc" | "kcal_asc" | "kcal_desc" | "recent";
type KcalFilterKey = "all" | "under_1800" | "1800_2400" | "2400_3000" | "over_3000";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "Mais recentes" },
  { id: "name_asc", label: "Nome A–Z" },
  { id: "name_desc", label: "Nome Z–A" },
  { id: "kcal_asc", label: "Menor kcal" },
  { id: "kcal_desc", label: "Maior kcal" },
];

const KCAL_FILTER_OPTIONS: { id: KcalFilterKey; label: string }[] = [
  { id: "all", label: "Todas as calorias" },
  { id: "under_1800", label: "Até 1800 kcal" },
  { id: "1800_2400", label: "1800–2400 kcal" },
  { id: "2400_3000", label: "2400–3000 kcal" },
  { id: "over_3000", label: "Acima de 3000 kcal" },
];

function normalizeText(value: string | undefined | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatStrategy(strategy?: string) {
  if (!strategy) return "";
  return STRATEGY_LABELS[strategy] ?? strategy;
}

function matchesKcalFilter(kcal: number, filter: KcalFilterKey) {
  if (filter === "all") return true;
  if (filter === "under_1800") return kcal <= 1800;
  if (filter === "1800_2400") return kcal >= 1800 && kcal <= 2400;
  if (filter === "2400_3000") return kcal >= 2400 && kcal <= 3000;
  return kcal > 3000;
}

function StrategyBadge({ strategy }: { strategy?: string }) {
  if (!strategy) return null;
  const label = STRATEGY_LABELS[strategy] ?? strategy;
  const colors = STRATEGY_COLORS[strategy] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
        colors,
      )}
    >
      {label}
    </span>
  );
}

function PageButton({
  active,
  children,
  onClick,
  disabled = false,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 min-w-9 rounded-md border px-3 text-sm transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-muted/70",
        disabled && "cursor-not-allowed opacity-40 hover:bg-background",
      )}
    >
      {children}
    </button>
  );
}

function buildVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, 4, totalPages];
  if (page >= totalPages - 2) return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, page - 1, page, page + 1, totalPages];
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: DietTemplate;
  onDelete: (id: number) => void;
}) {
  const navigate = useNavigate();
  const mealCount = template.meals?.length ?? 0;
  const foodCount = template.meals?.reduce((sum, meal) => sum + (meal.foods?.length ?? 0), 0) ?? 0;

  return (
    <div className="group rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
          <Utensils size={16} className="text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <StrategyBadge strategy={template.strategy} />
            <span className="truncate text-sm font-semibold text-foreground">{template.name}</span>
          </div>

          {template.description && (
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            {template.total_kcal ? (
              <span className="font-bold tabular-nums text-foreground">{template.total_kcal} kcal</span>
            ) : null}
            {template.protein_g ? <span>PTN {template.protein_g}g</span> : null}
            {template.carbs_g ? <span>CHO {template.carbs_g}g</span> : null}
            {template.fat_g ? <span>LIP {template.fat_g}g</span> : null}
            <span className="ml-auto">{mealCount} refeições · {foodCount} alimentos</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => navigate(`/admin/modelos/${template.id}`)}
            title="Editar modelo"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(template.id)}
            title="Excluir modelo"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<DietTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [kcalFilter, setKcalFilter] = useState<KcalFilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setTemplates(await fetchDietTemplates());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const strategyOptions = useMemo(() => {
    const uniqueStrategies = Array.from(
      new Set(templates.map((template) => template.strategy).filter(Boolean) as string[]),
    );

    return [
      { value: "all", label: "Todas as estratégias" },
      ...uniqueStrategies.map((strategy) => ({
        value: strategy,
        label: formatStrategy(strategy),
      })),
    ];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const query = normalizeText(search);
    const list = templates.filter((template) => {
      const totalKcal = Number(template.total_kcal ?? 0);
      if (strategyFilter !== "all" && template.strategy !== strategyFilter) return false;
      if (!matchesKcalFilter(totalKcal, kcalFilter)) return false;

      if (!query) return true;

      const haystack = [
        template.name,
        template.description,
        template.strategy,
        formatStrategy(template.strategy),
        template.total_kcal ? `${template.total_kcal} kcal` : "",
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      return haystack.includes(query);
    });

    const sorted = [...list];
    if (sort === "recent") {
      sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    } else if (sort === "name_asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "name_desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === "kcal_asc") {
      sorted.sort((a, b) => Number(a.total_kcal ?? 0) - Number(b.total_kcal ?? 0));
    } else if (sort === "kcal_desc") {
      sorted.sort((a, b) => Number(b.total_kcal ?? 0) - Number(a.total_kcal ?? 0));
    }

    return sorted;
  }, [templates, search, strategyFilter, kcalFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE));
  const paginatedTemplates = filteredTemplates.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const visiblePages = buildVisiblePages(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, strategyFilter, kcalFilter, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const activeFilters =
    (search.trim() ? 1 : 0) +
    (strategyFilter !== "all" ? 1 : 0) +
    (kcalFilter !== "all" ? 1 : 0) +
    (sort !== "recent" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setStrategyFilter("all");
    setKcalFilter("all");
    setSort("recent");
  };

  const handleDelete = async (id: number) => {
    const template = templates.find((item) => item.id === id);
    if (!confirm(`Excluir o modelo "${template?.name}"? Esta ação não pode ser desfeita.`)) return;
    const ok = await deleteDietTemplate(id);
    if (ok) {
      setTemplates((prev) => prev.filter((item) => item.id !== id));
      toast.success("Modelo excluído.");
    } else {
      toast.error("Erro ao excluir o modelo.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <LayoutList size={20} className="text-primary" />
            Modelos de Dieta
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Protocolos base reutilizáveis — independentes de paciente
          </p>
        </div>

        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/admin/modelos/novo">
            <Plus size={15} />
            Novo Modelo
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, descrição, estratégia ou kcal..."
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:items-center">
              <select
                value={strategyFilter}
                onChange={(event) => setStrategyFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {strategyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={kcalFilter}
                onChange={(event) => setKcalFilter(event.target.value as KcalFilterKey)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {KCAL_FILTER_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    Ordenar: {option.label}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={clearFilters}
                disabled={activeFilters === 0}
              >
                <X size={14} />
                Limpar
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} />
              <span>
                {filteredTemplates.length} modelo{filteredTemplates.length === 1 ? "" : "s"} encontrado{filteredTemplates.length === 1 ? "" : "s"}
              </span>
              {activeFilters > 0 ? (
                <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">
                  {activeFilters} filtro{activeFilters === 1 ? "" : "s"} ativo{activeFilters === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            <span>
              Página {page} de {totalPages} · mostrando até {ITEMS_PER_PAGE} por vez
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Carregando modelos…</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
            <LayoutList size={28} className="opacity-30" />
          </div>
          <div className="text-center">
            <p className="font-medium">Nenhum modelo cadastrado</p>
            <p className="mt-0.5 text-sm opacity-70">
              Crie protocolos base que podem ser importados em qualquer plano alimentar
            </p>
          </div>
          <Button asChild variant="outline" className="gap-1.5">
            <Link to="/admin/modelos/novo">
              <Plus size={14} />
              Criar primeiro modelo
            </Link>
          </Button>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-base font-semibold text-foreground">Nenhum modelo corresponde aos filtros.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente outro termo de busca, estratégia ou faixa calórica.
          </p>
          <Button type="button" variant="outline" className="mt-4 gap-2" onClick={clearFilters}>
            <X size={14} />
            Limpar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {paginatedTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onDelete={handleDelete} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredTemplates.length)}–
                {Math.min(page * ITEMS_PER_PAGE, filteredTemplates.length)} de {filteredTemplates.length}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <PageButton onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                  Anterior
                </PageButton>

                {visiblePages.map((pageNumber, index) => {
                  const previous = visiblePages[index - 1];
                  const hasGap = previous && pageNumber - previous > 1;
                  return (
                    <div key={pageNumber} className="flex items-center gap-2">
                      {hasGap ? <span className="px-1 text-sm text-muted-foreground">…</span> : null}
                      <PageButton active={pageNumber === page} onClick={() => setPage(pageNumber)}>
                        {pageNumber}
                      </PageButton>
                    </div>
                  );
                })}

                <PageButton onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                  Próxima
                </PageButton>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
