import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalizeSearchText } from "@/lib/normalizedSearch";

export interface ExerciseCatalogSuggestion {
  id: number;
  name: string;
  search_aliases?: string[];
  category?: string | null;
  equipment?: string | null;
  instructions?: string | null;
  demo_url?: string | null;
}

interface Props {
  id: string;
  value: string;
  items: ExerciseCatalogSuggestion[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (item: ExerciseCatalogSuggestion) => void;
}

export function ExerciseAutocomplete({
  id,
  value,
  items,
  disabled = false,
  onChange,
  onSelect,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const indexedItems = useMemo(() => items.map((item) => ({
    item,
    normalizedName: normalizeSearchText(item.name),
    normalizedSearch: normalizeSearchText([
      item.name,
      ...(item.search_aliases ?? []),
      item.category,
      item.equipment,
      item.instructions,
    ].filter(Boolean).join(" ")),
  })).sort((a, b) => a.item.name.localeCompare(b.item.name)), [items]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(value);
    if (!normalizedQuery) return [];
    const tokens = normalizedQuery.split(" ");
    return indexedItems
      .filter(({ normalizedSearch }) => tokens.every((token) => normalizedSearch.includes(token)))
      .sort((a, b) => Number(b.normalizedName.startsWith(normalizedQuery)) - Number(a.normalizedName.startsWith(normalizedQuery)))
      .slice(0, 8)
      .map(({ item }) => item);
  }, [indexedItems, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length > 0) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onSelect(suggestions[activeIndex]);
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder="Buscar no catálogo de exercícios"
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={open && Boolean(value.trim())}
        aria-controls={`${id}-suggestions`}
        className="h-10 rounded-md border-border/70 pl-9 shadow-none focus-visible:ring-primary/20"
      />
      {open && suggestions.length > 0 ? (
        <div id={`${id}-suggestions`} role="listbox" aria-label="Sugestões de exercícios" className="mt-1 max-h-56 w-full scroll-mb-24 overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-popover p-1 shadow-sm">
          {suggestions.map((item, index) => {
            return (
              <div key={item.id} role="option" aria-selected={index === activeIndex} className={`flex items-center rounded-md ${index === activeIndex ? "bg-primary/10" : ""}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { onSelect(item); setOpen(false); }}
                  className="min-h-11 min-w-0 flex-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
                  {(item.category || item.equipment) ? <span className="block truncate text-xs text-muted-foreground">{[item.category, item.equipment].filter(Boolean).join(" · ")}</span> : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {open && value.trim() && suggestions.length === 0 ? (
        <div id={`${id}-suggestions`} role="status" aria-live="polite" className="mt-1 w-full rounded-lg border border-border/70 bg-popover px-3 py-2.5 text-sm text-muted-foreground shadow-sm">
          Nenhum exercício encontrado. Você pode inserir manualmente.
        </div>
      ) : null}
    </div>
  );
}
