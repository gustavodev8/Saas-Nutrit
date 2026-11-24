import { useEffect, useState, useRef } from "react";
import { AlertCircle, Apple, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { LeafLoader } from "@/components/workspace/LeafLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchWorkspaceFoods, fetchWorkspaceFoodCategories, type WorkspaceFood } from "@/lib/workspaceFoods";

const PAGE_SIZE = 50;

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${color}`}>
      <span className="font-medium">{label}</span>
      <span>{value.toFixed(1)}g</span>
    </span>
  );
}

function FoodRow({ food }: { food: WorkspaceFood }) {
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-150 last:border-0 hover:bg-muted/30 sm:px-5">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground" title={food.name}>{food.name}</p>
        <p className="truncate text-xs text-muted-foreground">{food.category}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold w-16 text-right">
          {Math.round(food.kcal_per_100g)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
        </span>
        <div className="hidden w-56 items-center gap-1 sm:flex">
          <MacroBadge label="P" value={food.protein_per_100g} color="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200" />
          <MacroBadge label="C" value={food.carbs_per_100g} color="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-200" />
          <MacroBadge label="G" value={food.fat_per_100g} color="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceAlimentosPage() {
  const [foods, setFoods] = useState<WorkspaceFood[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [foodError, setFoodError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [categories, setCategories] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    setCategoryError(false);
    fetchWorkspaceFoodCategories()
      .then((cats) => { if (active) setCategories(cats); })
      .catch(() => { if (active) setCategoryError(true); });
    return () => { active = false; };
  }, [retryKey]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFoodError(false);
    fetchWorkspaceFoods(debouncedSearch, category, page)
      .then((result) => {
        if (!active) return;
        setFoods(result.foods);
        setTotal(result.total);
      })
      .catch(() => {
        if (!active) return;
        setFoodError(true);
        setFoods([]);
        setTotal(0);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, category, page, retryKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter = debouncedSearch !== "" || category !== "Todos";

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategory("Todos");
    setPage(0);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold text-foreground">Banco de Alimentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {!foodError && total > 0 ? `${total.toLocaleString("pt-BR")} alimentos — valores por 100g` : "Catálogo nutricional — valores por 100g"}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar alimentos"
            className="pl-9"
            placeholder="Buscar alimento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-muted-foreground" />
          <select
            aria-label="Filtrar por categoria"
            className="min-h-10 max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(0); }}
          >
            <option value="Todos">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X size={14} /> Limpar
          </Button>
        )}
      </div>

      {/* Table header */}
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 sm:px-5">
          <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alimento</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-16 text-right">Kcal</span>
          <span className="hidden w-56 text-xs font-medium text-muted-foreground uppercase tracking-wide sm:block">Macros / 100g</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <LeafLoader label="Carregando alimentos…" />
          </div>
        )}

        {!loading && (foodError || categoryError) && (
          <div role="alert" className="flex min-h-72 flex-col items-start justify-center gap-4 px-4 py-10 sm:px-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive"><AlertCircle size={21} aria-hidden="true" /></span>
            <div className="max-w-lg">
              <h2 className="text-lg font-semibold text-foreground">Não foi possível carregar os alimentos</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            </div>
            <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>Tentar novamente</Button>
          </div>
        )}

        {!loading && !foodError && !categoryError && foods.length === 0 && (
          <div className="flex min-h-72 flex-col items-start justify-center gap-4 px-4 py-10 sm:px-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary"><Apple size={21} aria-hidden="true" /></span>
            <div className="max-w-lg min-w-0">
              <h2 className="text-lg font-semibold text-foreground">{hasFilter ? "Nenhum alimento para estes filtros" : "Nenhum alimento disponível"}</h2>
              <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                {hasFilter ? "Tente outro termo ou categoria para consultar os valores nutricionais." : "Os alimentos cadastrados aparecerão aqui quando estiverem disponíveis."}
              </p>
            </div>
            {hasFilter && (
              <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>
            )}
          </div>
        )}

        {!loading && !foodError && !categoryError && foods.length > 0 && (
          <div>
            {foods.map((food) => <FoodRow key={food.id} food={food} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !foodError && !categoryError && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Página anterior"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Próxima página"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
