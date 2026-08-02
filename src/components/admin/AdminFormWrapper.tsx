import { type ReactNode } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContent } from "@/contexts/ContentContext";

interface Props {
  title: string;
  description?: string;
  onSave: () => void;
  children: ReactNode;
}

const AdminFormWrapper = ({ title, description, onSave, children }: Props) => {
  const { saveStatus } = useContent();
  const isSaving = saveStatus === "saving";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Edição de conteúdo
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6 lg:p-7">
        {children}
      </div>

      <div className="sticky bottom-[72px] z-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <StatusMessage status={saveStatus} />
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="min-w-[160px] bg-primary px-8 hover:bg-primary/90"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </span>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </div>
    </div>
  );
};

function StatusMessage({ status }: { status: string }) {
  if (status === "saved") {
    return (
      <span className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle className="h-4 w-4" />
        Salvo com sucesso.
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertCircle className="h-4 w-4" />
        Erro ao salvar. Verifique sua conexão.
      </span>
    );
  }

  return (
    <span className="text-sm text-muted-foreground">
      Revise as alterações e salve quando estiver pronto.
    </span>
  );
}

export default AdminFormWrapper;
