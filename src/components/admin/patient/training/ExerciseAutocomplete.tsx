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

export interface ExercisePrescriptionSuggestion {
  id: number;
  name: string;
  search_aliases?: string[];
  sets: string;
  repetitions: string;
  reference_load: string;
  rest: string;
  instructions: string;
  demo_url: string;
}

interface Props {
  id: string;
  value: string;
  items: ExerciseCatalogSuggestion[];
  prescriptions?: ExercisePrescriptionSuggestion[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (item: ExerciseCatalogSuggestion) => void;
  onSelectPrescription?: (preset: ExercisePrescriptionSuggestion) => void;
}

export function ExerciseAutocomplete({
  id,
  value,
  items,
  prescriptions = [],
  disabled = false,
  onChange,
  onSelect,
  onSelectPrescription,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const indexedItems = useMemo(() => items.map((item) => ({
    kind: "catalog" as const,
    item,
    normalizedName: normalizeSearchText(item.name),
    normalizedSearch: normalizeSearchText([
      item.name,
      ...(item.search_aliases ?? []),
      item.category,
      item.equipment,
      item.instructions,
    ].filter(Boolean).join(" ")),
  })), [items]);

  const indexedPrescriptions = useMemo(() => prescriptions.map((item) => ({
    kind: "prescription" as const,
    item,
    normalizedName: normalizeSearchText(item.name),
    normalizedSearch: normalizeSearchText([
      item.name,
      ...(item.search_aliases ?? []),
      item.sets,
      item.repetitions,
      item.reference_load,
      item.rest,
      item.instructions,
    ].filter(Boolean).join(" ")),
  })), [prescriptions]);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(value);
    if (!normalizedQuery) return indexedPrescriptions.slice(0, 4);
    const tokens = normalizedQuery.split(" ");
    return [...indexedPrescriptions, ...indexedItems]
      .filter(({ normalizedSearch }) => tokens.every((token) => normalizedSearch.includes(token)))
      .sort((a, b) => Number(b.normalizedName.startsWith(normalizedQuery)) - Number(a.normalizedName.startsWith(normalizedQuery))
        || Number(a.kind !== "prescription") - Number(b.kind !== "prescription")
        || a.item.name.localeCompare(b.item.name))
      .slice(0, 8);
  }, [indexedItems, indexedPrescriptions, value]);
  const activeSuggestion = suggestions[activeIndex];
  const activeSuggestionId = activeSuggestion ? `${id}-option-${activeSuggestion.kind}-${activeSuggestion.item.id}` : undefined;

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
      const suggestion = suggestions[activeIndex] ?? suggestions[0];
      if (suggestion) {
        selectSuggestion(suggestion);
        setActiveIndex(0);
        setOpen(true);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const selectSuggestion = (suggestion: (typeof suggestions)[number]) => {
    if (suggestion.kind === "prescription") onSelectPrescription?.(suggestion.item);
    else onSelect(suggestion.item);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          role="combobox"
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
          aria-expanded={open && (suggestions.length > 0 || Boolean(value.trim()))}
          aria-controls={`${id}-suggestions`}
          aria-activedescendant={open ? activeSuggestionId : undefined}
          className="h-10 rounded-md border-border/70 pl-9 shadow-none focus-visible:ring-primary/20"
        />
      </div>
      {open && suggestions.length > 0 ? (
        <div id={`${id}-suggestions`} role="listbox" aria-label={value.trim() ? "Sugestões de exercícios" : "Prescrições salvas"} className="mt-1 max-h-56 w-full scroll-mb-24 overflow-y-auto overscroll-contain rounded-lg border border-border/70 bg-popover p-1 shadow-sm">
          {suggestions.map((suggestion, index) => {
            const isPrescription = suggestion.kind === "prescription";
            return (
              <div key={`${suggestion.kind}-${suggestion.item.id}`} id={`${id}-option-${suggestion.kind}-${suggestion.item.id}`} role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onMouseMove={() => setActiveIndex(index)} onClick={() => { selectSuggestion(suggestion); setActiveIndex(0); setOpen(true); }} className={`min-h-11 cursor-pointer rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/60 ${index === activeIndex ? "bg-primary/10" : ""}`}>
                <span className="block truncate text-sm font-medium text-foreground">{suggestion.item.name}</span>
                {isPrescription ? <span className="block truncate text-xs text-muted-foreground">Prescrição salva · {[suggestion.item.sets && `${suggestion.item.sets} séries`, suggestion.item.repetitions && `${suggestion.item.repetitions} rep.`, suggestion.item.reference_load, suggestion.item.rest].filter(Boolean).join(" · ") || "Sem parâmetros"}</span>
                  : (suggestion.item.category || suggestion.item.equipment) ? <span className="block truncate text-xs text-muted-foreground">{[suggestion.item.category, suggestion.item.equipment].filter(Boolean).join(" · ")}</span> : null}
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
