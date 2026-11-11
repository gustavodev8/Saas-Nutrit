import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { searchNormalizedRecords } from "@/lib/normalizedSearch";

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

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    return searchNormalizedRecords(items.map((item) => ({
          ...item,
          search_text: [item.category, item.equipment, item.instructions].filter(Boolean).join(" "),
        })), value)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [items, value]);

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
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder="Ex.: agachamento"
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={`${id}-suggestions`}
        className="rounded-xl"
      />
      {open && suggestions.length > 0 ? (
        <div id={`${id}-suggestions`} role="listbox" aria-label="Sugestões de exercícios" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-primary/15 bg-popover/95 p-1.5 shadow-xl shadow-foreground/10 backdrop-blur-sm">
          {suggestions.map((item, index) => {
            return (
              <div key={item.id} role="option" aria-selected={index === activeIndex} className={`flex items-center rounded-xl ${index === activeIndex ? "bg-primary/[0.08]" : ""}`}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { onSelect(item); setOpen(false); }}
                  className="min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
                  {(item.category || item.equipment) ? <span className="block truncate text-xs text-muted-foreground">{[item.category, item.equipment].filter(Boolean).join(" · ")}</span> : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
