import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceAccessRequestCategory } from "@/lib/workspaceAccessRequests";

const accessRequestCategories: { value: WorkspaceAccessRequestCategory; label: string }[] = [
  { value: "patient_management", label: "Gestão de pacientes" },
  { value: "meal_planning", label: "Planos alimentares" },
  { value: "appointments", label: "Agenda e atendimentos" },
  { value: "clinical_records", label: "Avaliações e prontuários" },
  { value: "practice_management", label: "Organização do consultório" },
];

export type SaaSAccessRequest = {
  name: string;
  professionalEmail: string;
  whatsapp?: string;
  crn?: string;
  needCategory: WorkspaceAccessRequestCategory;
  consent: boolean;
  website?: string;
};

export type SaaSAccessRequestStatus = {
  kind: "success" | "error" | "info";
  message: string;
};

type SaaSAccessRequestFormProps = {
  onSubmit: (request: SaaSAccessRequest) => void | Promise<void>;
  loading?: boolean;
  status?: SaaSAccessRequestStatus | null;
};

export default function SaaSAccessRequestForm({ onSubmit, loading = false, status }: SaaSAccessRequestFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState<SaaSAccessRequestStatus | null>(null);
  const isLoading = loading || submitting;
  const visibleStatus = status ?? localStatus;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const needCategory = accessRequestCategories.find(({ value }) => value === formData.get("needCategory"))?.value;
    if (!needCategory) {
      setLocalStatus({ kind: "error", message: "Selecione uma categoria para continuar." });
      return;
    }
    const request: SaaSAccessRequest = {
      name: String(formData.get("name") ?? "").trim(),
      professionalEmail: String(formData.get("professionalEmail") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || undefined,
      crn: String(formData.get("crn") ?? "").trim() || undefined,
      needCategory,
      consent: formData.get("consent") === "on",
      website: String(formData.get("website") ?? "").trim(),
    };

    setSubmitting(true);
    setLocalStatus(null);
    try {
      await onSubmit(request);
      setLocalStatus({ kind: "success", message: "Pedido enviado para triagem. Isso não cria uma conta nem um workspace." });
      formElement.reset();
    } catch {
      setLocalStatus({ kind: "error", message: "Não foi possível enviar o pedido agora. Tente novamente mais tarde." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isLoading}>
      <input className="sr-only" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label htmlFor="saas-request-consent" className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
        <input id="saas-request-consent" name="consent" type="checkbox" required className="mt-1 size-4 shrink-0 accent-primary" />
        <span>Autorizo o uso dos dados profissionais informados para analisar meu pedido e entrar em contato sobre este SaaS. Isso não cria uma conta nem autoriza mensagens de marketing.</span>
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="saas-request-name">Nome</Label>
          <Input id="saas-request-name" name="name" autoComplete="name" minLength={2} maxLength={120} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="saas-request-email">E-mail profissional</Label>
          <Input id="saas-request-email" name="professionalEmail" type="email" autoComplete="email" maxLength={254} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="saas-request-whatsapp">WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Input id="saas-request-whatsapp" name="whatsapp" type="tel" autoComplete="tel" maxLength={30} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="saas-request-crn">CRN <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Input id="saas-request-crn" name="crn" autoComplete="off" maxLength={30} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="saas-request-category">Qual área você quer organizar?</Label>
        <select
          id="saas-request-category"
          name="needCategory"
          required
          defaultValue=""
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>Selecione uma opção</option>
          {accessRequestCategories.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <p className="text-sm text-muted-foreground">
        Contato para privacidade: <a className="underline underline-offset-4" href="mailto:gustavu.dev@gmail.com">gustavu.dev@gmail.com</a>
      </p>
      {visibleStatus && (
        <p role={visibleStatus.kind === "error" ? "alert" : "status"} className={visibleStatus.kind === "error" ? "text-sm text-destructive" : "text-sm text-foreground"}>
          {visibleStatus.message}
        </p>
      )}
      <Button className="w-full sm:w-auto" type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        {isLoading ? "Enviando pedido" : "Solicitar acesso"}
      </Button>
    </form>
  );
}
