import { useCallback, useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  PenLine,
  Send,
  ShoppingBag,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useContent } from "@/contexts/ContentContext";

function escHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function toHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">${
      escHtml(paragraph)
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
    }</p>`)
    .join("");
}

type Source = "ebooks" | "bookings" | "patients" | "leads";
type Period = 0 | 30 | 90 | 365;
type AudiencePreview = {
  ebooks: number;
  bookings: number;
  patients: number;
  leads: number;
  manual: number;
  totalRecipients: number;
};

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 0, label: "Todo o periodo" },
  { value: 30, label: "Ultimos 30 dias" },
  { value: 90, label: "Ultimos 90 dias" },
  { value: 365, label: "Ultimo ano" },
];

const SOURCE_OPTIONS: { key: Source; label: string; desc: string; icon: ElementType }[] = [
  { key: "ebooks", label: "Compradores de e-books", desc: "Clientes com compras aprovadas", icon: ShoppingBag },
  { key: "bookings", label: "Consultas agendadas", desc: "Pacientes com consultas nao canceladas", icon: CalendarCheck },
  { key: "patients", label: "Pacientes cadastrados", desc: "Cadastros do prontuario clinico", icon: UserRound },
  { key: "leads", label: "Leads captados", desc: "Cadastros via popup do site", icon: UserPlus },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-md border px-3.5 text-xs font-medium transition-all duration-150",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

const AdminDisparo = () => {
  const { content } = useContent();
  const products = content.produtosDigitais?.items ?? [];

  const [sources, setSources] = useState<Source[]>(["ebooks", "bookings", "patients", "leads"]);
  const [period, setPeriod] = useState<Period>(0);
  const [productName, setProductName] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [audiencePreview, setAudiencePreview] = useState<AudiencePreview | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const toggleSource = (source: Source) => {
    setSources((current) => current.includes(source)
      ? current.filter((item) => item !== source)
      : [...current, source]);
    setConfirmed(false);
  };

  const parseManualEmails = useCallback(
    () => manualInput
      .split(/[\n,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes("@")),
    [manualInput],
  );

  const recalcCount = useCallback(async () => {
    setCountLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<AudiencePreview>("broadcast-audience-preview", {
        body: {
          filters: {
            sources,
            periodDays: period > 0 ? period : null,
            productName: productName || null,
            manualEmails: parseManualEmails(),
          },
        },
      });

      if (error) throw error;

      setAudiencePreview(data ?? null);
      setRecipientCount(data?.totalRecipients ?? 0);
    } catch {
      setAudiencePreview(null);
      setRecipientCount(0);
    } finally {
      setCountLoading(false);
    }
  }, [parseManualEmails, period, productName, sources]);

  useEffect(() => {
    void recalcCount();
  }, [recalcCount]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke<{ sent: number; failed: number; total: number }>("send-broadcast", {
        body: {
          subject: subject.trim(),
          html: toHtml(message),
          previewText: subject.trim(),
          filters: {
            sources,
            periodDays: period > 0 ? period : null,
            productName: productName || null,
            manualEmails: parseManualEmails(),
          },
        },
      });

      if (error) throw error;
      if (!data) throw new Error("Falha ao enviar disparo.");

      setResult(data);
      setStatus("success");
      setConfirmed(false);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  };

  const canSend = Boolean(subject.trim() && message.trim() && sources.length > 0 && status !== "loading");

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Disparo de E-mails</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Crie e envie campanhas segmentadas para sua base de contatos.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn(
            "flex w-full items-center gap-3 bg-muted/30 px-6 py-4 text-left transition-colors hover:bg-muted/50",
            filtersOpen && "border-b border-border",
          )}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Audiencia</p>
            <p className="text-xs text-muted-foreground">Defina quem vai receber este e-mail</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
              {countLoading
                ? <Loader2 className="h-3 w-3 animate-spin text-primary" />
                : <Users className="h-3 w-3 text-primary" />}
              <span className="text-xs font-semibold tabular-nums text-primary">
                {countLoading ? "..." : (recipientCount ?? 0)} destinatarios
              </span>
            </div>
            {filtersOpen
              ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </div>
        </button>

        {filtersOpen && (
          <div className="space-y-6 px-6 py-5">
            <div>
              <SectionLabel>Origem dos contatos</SectionLabel>
              <div className="space-y-2">
                {SOURCE_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
                  const active = sources.includes(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleSource(key)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                        active
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background hover:border-border/80 hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active ? "bg-primary/15" : "bg-muted",
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                          {label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                          active ? "border-primary bg-primary" : "border-border bg-background",
                        )}
                      >
                        {active && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Periodo de cadastro</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <Chip
                    key={value}
                    active={period === value}
                    onClick={() => {
                      setPeriod(value);
                      setConfirmed(false);
                    }}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {sources.includes("ebooks") && products.length > 0 && (
              <div>
                <SectionLabel>Filtrar por produto</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={!productName}
                    onClick={() => {
                      setProductName("");
                      setConfirmed(false);
                    }}
                  >
                    Todos os produtos
                  </Chip>
                  {products.map((product, index) => (
                    <Chip
                      key={index}
                      active={productName === product.name}
                      onClick={() => {
                        setProductName(product.name);
                        setConfirmed(false);
                      }}
                    >
                      {product.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowManual((open) => !open)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <PenLine className="h-3.5 w-3.5" />
                Adicionar e-mails manualmente
                {showManual ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showManual && (
                <div className="mt-3 space-y-1.5">
                  <Textarea
                    value={manualInput}
                    onChange={(event) => {
                      setManualInput(event.target.value);
                      setConfirmed(false);
                    }}
                    placeholder={"cliente1@email.com\ncliente2@email.com"}
                    className="min-h-[80px] resize-none rounded-xl font-mono text-xs"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe por virgula, ponto e virgula ou nova linha. Eles entram junto com os filtros acima.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            2
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Mensagem</p>
            <p className="text-xs text-muted-foreground">Escreva o conteudo do e-mail</p>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Assunto
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="subject"
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setStatus("idle");
                }}
                placeholder="Ex: Novidade exclusiva para voce!"
                className="rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Corpo do e-mail
              </Label>
              <button
                type="button"
                onClick={() => setPreview((current) => !current)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {preview ? "Editar" : "Pre-visualizar"}
              </button>
            </div>

            {preview ? (
              <div
                className="min-h-[200px] rounded-xl border border-border bg-white p-5 text-sm shadow-inner"
                dangerouslySetInnerHTML={{
                  __html: toHtml(message) || '<p style="margin:0;color:#9ca3af;font-style:italic;">Nenhum conteudo ainda.</p>',
                }}
              />
            ) : (
              <Textarea
                id="message"
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setStatus("idle");
                }}
                placeholder={"Ola!\n\nEscreva sua mensagem aqui...\n\nUse **negrito** ou *italico* para formatar."}
                className="min-h-[200px] resize-none rounded-xl font-mono text-sm"
                rows={10}
              />
            )}
            <p className="text-xs text-muted-foreground">Suporte a **negrito** e *italico*.</p>
          </div>
        </div>
      </div>

      {status !== "success" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Revisar e enviar</p>
              <p className="text-xs text-muted-foreground">Confirme antes de disparar</p>
            </div>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/40">
              <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">Destinatarios</span>
                <span className="font-semibold tabular-nums text-foreground">{recipientCount ?? "-"}</span>
              </div>
              {audiencePreview && (
                <div className="px-4 py-2.5 text-xs text-muted-foreground">
                  E-books {audiencePreview.ebooks} | Consultas {audiencePreview.bookings} | Pacientes {audiencePreview.patients} | Leads {audiencePreview.leads}
                  {audiencePreview.manual > 0 ? ` | Manuais ${audiencePreview.manual}` : ""}
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">Origens</span>
                <span className="font-medium text-foreground">
                  {sources.length === 0
                    ? "-"
                    : SOURCE_OPTIONS.filter((option) => sources.includes(option.key)).map((option) => option.label).join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">Periodo</span>
                <span className="font-medium text-foreground">{PERIOD_OPTIONS.find((option) => option.value === period)?.label}</span>
              </div>
              {productName && (
                <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <span className="text-muted-foreground">Produto</span>
                  <span className="font-medium text-foreground">{productName}</span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">Assunto</span>
                <span className="max-w-[200px] truncate font-medium text-foreground">{subject || "-"}</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/30">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
              />
              <span className="text-sm leading-snug text-muted-foreground">
                Confirmo que revisei o conteudo e autorizo o envio para{" "}
                <strong className="text-foreground">{recipientCount ?? "-"} destinatarios</strong>.
              </span>
            </label>

            {sources.length === 0 && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Selecione ao menos uma origem de contatos.
              </p>
            )}

            <Button
              onClick={handleSend}
              disabled={!canSend || !confirmed || (recipientCount ?? 0) === 0}
              className="w-full gap-2"
              size="lg"
            >
              {status === "loading"
                ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                : <><Send className="h-4 w-4" />Disparar para {recipientCount ?? "-"} contatos</>}
            </Button>
          </div>
        </div>
      )}

      {status === "success" && result && (
        <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Campanha enviada com sucesso</p>
              <p className="text-xs text-green-700">
                <strong>{result.sent}</strong> e-mails entregues
                {result.failed > 0 && <> | <strong>{result.failed}</strong> com falha</>}
                {" "}de <strong>{result.total}</strong> destinatarios.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatus("idle");
              setResult(null);
              setSubject("");
              setMessage("");
              setConfirmed(false);
            }}
            className="text-xs text-green-700 underline underline-offset-2 transition-colors hover:text-green-900"
          >
            Criar novo disparo
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Erro no disparo</p>
            <p className="mt-0.5 text-xs text-destructive/80">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisparo;
