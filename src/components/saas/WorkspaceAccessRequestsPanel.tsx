import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workspaceSupabase } from "@/lib/workspaceSupabase";
import type { WorkspaceAccessRequestCategory } from "@/lib/workspaceAccessRequests";

export type WorkspaceAccessStatus = "pending" | "approved" | "rejected";

export interface WorkspaceAccessRequestRecord {
  id: string;
  applicant_name: string;
  professional_email: string;
  phone: string | null;
  crn: string | null;
  need_category: WorkspaceAccessRequestCategory;
  status: WorkspaceAccessStatus;
  created_at: string;
  reviewed_at: string | null;
}

interface WorkspaceAccessRequestsPanelProps {
  onPrepareInvite: (request: WorkspaceAccessRequestRecord) => void;
}

const statusLabel: Record<WorkspaceAccessStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
};

const categoryLabels: Record<WorkspaceAccessRequestCategory, string> = {
  patient_management: "Gestão de pacientes",
  meal_planning: "Planos alimentares",
  appointments: "Agenda e atendimentos",
  clinical_records: "Avaliações e prontuários",
  practice_management: "Organização do consultório",
};

function isAccessRequestCategory(value: unknown): value is WorkspaceAccessRequestCategory {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(categoryLabels, value);
}

function isRequestRecord(value: unknown): value is WorkspaceAccessRequestRecord {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Record<string, unknown>;
  return typeof request.id === "string"
    && typeof request.applicant_name === "string"
    && typeof request.professional_email === "string"
    && (request.phone === null || typeof request.phone === "string")
    && (request.crn === null || typeof request.crn === "string")
    && isAccessRequestCategory(request.need_category)
    && (request.status === "pending" || request.status === "approved" || request.status === "rejected")
    && typeof request.created_at === "string"
    && (request.reviewed_at === null || typeof request.reviewed_at === "string");
}

export default function WorkspaceAccessRequestsPanel({ onPrepareInvite }: WorkspaceAccessRequestsPanelProps) {
  const [requests, setRequests] = useState<WorkspaceAccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: invokeError } = await workspaceSupabase.functions.invoke("workspace-access-request-admin", {
        body: { action: "list" },
      });
      if (invokeError || data?.ok !== true || !Array.isArray(data.requests)
        || !data.requests.every(isRequestRecord)) {
        throw new Error("request_list_failed");
      }
      setRequests(data.requests);
    } catch {
      setError(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const reviewRequest = async (request: WorkspaceAccessRequestRecord, status: "approved" | "rejected") => {
    if (busyId) return;
    setBusyId(request.id);
    setError(false);
    try {
      const { data, error: invokeError } = await workspaceSupabase.functions.invoke("workspace-access-request-admin", {
        body: { action: "review", requestId: request.id, status },
      });
      if (invokeError || data?.ok !== true) throw new Error("request_review_failed");
      await loadRequests();
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section aria-labelledby="access-requests-heading" className="border-b pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="access-requests-heading" className="text-lg font-semibold">Pedidos de acesso</h2>
          <p className="mt-1 text-sm text-muted-foreground">Triagem manual; o convite só é enviado após aprovação e ação explícita.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadRequests()} disabled={loading}>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          Atualizar
        </Button>
      </header>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">Não foi possível carregar ou atualizar os pedidos. Verifique a autorização e tente novamente.</p>}
      {loading ? (
        <p role="status" className="mt-5 text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : requests.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
      ) : (
        <ul className="mt-5 divide-y">
          {requests.map((request) => (
            <li key={request.id} className="grid gap-4 py-5 first:pt-0 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{request.applicant_name}</h3>
                  <Badge variant={request.status === "pending" ? "secondary" : "outline"}>{statusLabel[request.status]}</Badge>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Mail size={14} aria-hidden="true" />{request.professional_email}</span>
                  {request.phone && <span>{request.phone}</span>}
                  {request.crn && <span>{request.crn}</span>}
                </p>
                <p className="mt-3 max-w-3xl text-sm leading-6">{categoryLabels[request.need_category]}</p>
                <p className="mt-2 text-xs text-muted-foreground">Recebido em {new Date(request.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {request.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => void reviewRequest(request, "approved")} disabled={busyId !== null}>
                      {busyId === request.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                      Aprovar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void reviewRequest(request, "rejected")} disabled={busyId !== null}>
                      <X aria-hidden="true" />Recusar
                    </Button>
                  </>
                )}
                {request.status === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => onPrepareInvite(request)}>
                    Preparar convite
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
