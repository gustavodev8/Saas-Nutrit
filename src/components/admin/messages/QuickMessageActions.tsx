import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useContent } from "@/contexts/ContentContext";
import type { Booking } from "@/lib/supabase";
import {
  listOperationalMessageTemplates,
  renderOperationalMessage,
  type OperationalMessageTemplateKey,
} from "@/lib/operationalMessageTemplates";

interface QuickMessageActionsProps {
  booking: Booking;
  compact?: boolean;
}

const suggestedTemplateByStatus: Partial<
  Record<NonNullable<Booking["status"]>, OperationalMessageTemplateKey>
> = {
  pending: "confirmacao",
  confirmed: "lembrete_consulta",
  completed: "pos_consulta",
  no_show: "sem_retorno",
};

export function QuickMessageActions({
  booking,
  compact = false,
}: QuickMessageActionsProps) {
  const { content, whatsappUrl } = useContent();
  const templates = listOperationalMessageTemplates();
  const defaultTemplate =
    suggestedTemplateByStatus[booking.status ?? "confirmed"] ?? "confirmacao";
  const [templateKey, setTemplateKey] =
    useState<OperationalMessageTemplateKey>(defaultTemplate);
  const [copied, setCopied] = useState(false);

  const message = useMemo(
    () =>
      renderOperationalMessage(templateKey, {
        patientName: booking.client_name,
        professionalName:
          content.identity.doctorName || content.identity.brandName || undefined,
        booking,
      }),
    [booking, content.identity.brandName, content.identity.doctorName, templateKey],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Mensagem copiada.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Nao foi possivel copiar a mensagem.");
    }
  };

  const openWhatsApp = () => {
    const popup = window.open(
      whatsappUrl(message),
      "_blank",
      "noopener,noreferrer",
    );
    if (!popup) toast.error("Nao foi possivel abrir o WhatsApp.");
  };

  return (
    <div className={compact ? "space-y-2.5" : "space-y-3"}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Mensagem rapida
        </p>
        <span className="text-[11px] text-muted-foreground">
          {templates.find((template) => template.key === templateKey)?.title}
        </span>
      </div>

      <select
        value={templateKey}
        onChange={(event) =>
          setTemplateKey(event.target.value as OperationalMessageTemplateKey)
        }
        className={
          compact
            ? "w-full h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none"
            : "w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        }
      >
        {templates.map((template) => (
          <option key={template.key} value={template.key}>
            {template.title}
          </option>
        ))}
      </select>

      <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/80">
          {message}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={
            compact
              ? "h-9 flex-1 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              : "h-8 flex-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
          }
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiada" : "Copiar"}
        </button>

        <button
          type="button"
          onClick={openWhatsApp}
          className={
            compact
              ? "h-9 flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              : "h-8 flex-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          }
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </button>
      </div>
    </div>
  );
}
