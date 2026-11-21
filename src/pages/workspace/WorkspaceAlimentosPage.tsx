import { useEffect, useState, useCallback, useRef } from "react";
import { Apple, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
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
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{food.name}</p>
        <p className="text-xs text-muted-foreground">{food.category}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold w-16 text-right">
          {Math.round(food.kcal_per_100g)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
        </span>
        <div className="hidden sm:flex items-center gap-1">
          <MacroBadge label="P" value={food.protein_per_100g} color="bg-blue-50 text-blue-700" />
          <MacroBadge label="C" value={food.carbs_per_100g} color="bg-yellow-50 text-yellow-700" />
          <MacroBadge label="G" value={food.fat_per_100g} color="bg-orange-50 text-orange-700" />
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [categories, setCategories] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchWorkspaceFoodCategories().then((cats) => setCategories(cats));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchWorkspaceFoods(debouncedSearch, category, page);
    setFoods(result.foods);
    setTotal(result.total);
    setLoading(false);
  }, [debouncedSearch, category, page]);

  useEffect(() => { void load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter = debouncedSearch !== "" || category !== "Todos";

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategory("Todos");
    setPage(0);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Banco de Alimentos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total > 0 ? `${total.toLocaleString("pt-BR")} alimentos — valores por 100g` : "Catálogo nutricional — valores por 100g"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar alimento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
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
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b">
          <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alimento</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-16 text-right">Kcal</span>
          <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-wide">Macros / 100g</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <LeafLoader label="Carregando alimentos…" />
          </div>
        )}

        {!loading && foods.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Apple size={32} className="opacity-30" />
            <p className="text-sm">Nenhum alimento encontrado</p>
            {hasFilter && (
              <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
            )}
          </div>
        )}

        {!loading && foods.length > 0 && (
          <div>
            {foods.map((food) => <FoodRow key={food.id} food={food} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
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
