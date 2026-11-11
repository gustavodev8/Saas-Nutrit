import { normalizeSearchText } from "@/lib/normalizedSearch";

interface SearchAliasesFieldProps {
  value: readonly string[] | null | undefined;
  onChange: (aliases: string[]) => void;
  label?: string;
  className?: string;
}

export function SearchAliasesField({
  value,
  onChange,
  label = "Sinônimos para busca",
  className = "",
}: SearchAliasesFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <textarea
        value={(value ?? []).join("\n")}
        onChange={(event) => {
          const seen = new Set<string>();
          const aliases = event.target.value
            .split(/[\n,;]+/)
            .map((alias) => alias.trim())
            .filter((alias) => {
              const key = normalizeSearchText(alias);
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          onChange(aliases);
        }}
        rows={2}
        placeholder="Um termo por linha ou separados por vírgula"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <p className="text-[11px] text-muted-foreground">Use apenas termos que ajudem a localizar este item.</p>
    </div>
  );
}
