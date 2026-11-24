import { useId, type ReactNode } from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceAuthLayoutProps {
  title: string;
  eyebrow: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
}

export function WorkspaceAuthLayout({ title, eyebrow, description, children, footer, centered = false }: WorkspaceAuthLayoutProps) {
  const titleId = useId();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#edf2ef] px-4 py-8 text-foreground dark:bg-[#182620] sm:px-6 sm:py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center gap-3 px-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf size={21} aria-hidden="true" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-base font-semibold text-foreground">Nutrit</p>
            <p className="text-xs text-muted-foreground dark:text-zinc-300">Área clínica</p>
          </div>
        </div>
        <section aria-labelledby={titleId} className="rounded-md border border-border/80 border-t-2 border-t-primary bg-background px-5 py-7 shadow-sm dark:border-white/15 dark:border-t-primary dark:bg-[#20332b] sm:px-8 sm:py-8">
          <header className={cn("mb-7", centered && "text-center")}>
            <p className="mb-2 text-xs font-semibold text-primary">{eyebrow}</p>
            <h1 id={titleId} className="text-2xl font-semibold leading-tight">{title}</h1>
            {description && <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-zinc-300">{description}</p>}
          </header>
          {children}
        </section>
        {footer && <div className="mt-5 px-1 text-center text-sm text-muted-foreground dark:text-zinc-300">{footer}</div>}
      </div>
    </main>
  );
}
