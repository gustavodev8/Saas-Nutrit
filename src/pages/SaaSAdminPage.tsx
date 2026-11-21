import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarPlus, RefreshCw, Send } from "lucide-react";
import { workspaceSupabase } from "@/lib/workspaceSupabase";

const ADMIN_EMAIL = "gustavu.dev@gmail.com";

type WorkspaceRow = {
  workspace_id: string;
  workspace_name: string;
  owner_email: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  next_payment_date: string | null;
  mp_preapproval_id: string | null;
  created_at: string;
};

type AuthState = "loading" | "unauthorized" | "authorized";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  trialing:         { label: "Trial",           cls: "bg-[#ddf0e8] text-[#166b50]" },
  active:           { label: "Ativo",            cls: "bg-[#dce9f8] text-[#1a5fa1]" },
  past_due:         { label: "Pagamento atraso", cls: "bg-[#fce8df] text-[#b45d41]" },
  canceled:         { label: "Cancelado",        cls: "bg-[#f3e5e5] text-[#9a3535]" },
  suspended:        { label: "Suspenso",         cls: "bg-[#f3e5e5] text-[#9a3535]" },
  sem_assinatura:   { label: "Sem assinatura",   cls: "bg-[#f1efeb] text-[#5f5e5a]" },
  none:             { label: "Sem assinatura",   cls: "bg-[#f1efeb] text-[#5f5e5a]" },
};

function trialDaysLeft(trial_ends_at: string | null): string {
  if (!trial_ends_at) return "—";
  const diff = new Date(trial_ends_at).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expirado";
  if (days === 0) return "Hoje";
  return `${days}d`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function SaaSAdminPage() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);

  useEffect(() => {
    workspaceSupabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === ADMIN_EMAIL) {
        setAuthState("authorized");
      } else {
        setAuthState("unauthorized");
      }
    });
  }, []);

  async function fetchWorkspaces() {
    setLoadingRows(true);
    setEmailResult(null);
    const { data, error } = await workspaceSupabase.rpc("list_all_workspaces_admin");
    if (!error && data) setRows(data as WorkspaceRow[]);
    setLoadingRows(false);
  }

  useEffect(() => {
    if (authState === "authorized") void fetchWorkspaces();
  }, [authState]);

  async function extendTrial(workspaceId: string, days = 7) {
    setExtendingId(workspaceId);
    setEmailResult(null);
    const { error } = await workspaceSupabase.rpc("extend_workspace_trial", {
      p_workspace_id: workspaceId,
      p_days: days,
    });
    if (error) {
      setEmailResult(`Erro ao estender trial: ${error.message}`);
    } else {
      setEmailResult(`Trial do workspace estendido por ${days} dias.`);
      void fetchWorkspaces();
    }
    setExtendingId(null);
  }

  async function sendTrialReminders() {
    setSendingEmails(true);
    setEmailResult(null);
    try {
      const { data: { session } } = await workspaceSupabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/send-workspace-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "trial-expiring-batch" }),
      });
      const json = await res.json() as { sent?: number; error?: string };
      setEmailResult(res.ok ? `${json.sent ?? 0} email(s) enviados.` : `Erro: ${json.error}`);
    } catch {
      setEmailResult("Erro ao enviar emails.");
    }
    setSendingEmails(false);
  }

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f3]">
        <div className="text-sm text-[#5c6e66]">Verificando acesso…</div>
      </div>
    );
  }

  if (authState === "unauthorized") {
    return <Navigate to="/workspace/login" replace />;
  }

  const trialing = rows.filter((r) => r.status === "trialing").length;
  const active   = rows.filter((r) => r.status === "active").length;
  const total    = rows.length;

  return (
    <div className="min-h-screen bg-[#f5f7f3]">
      <header className="border-b border-[#dce5de] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace"
              className="inline-flex items-center gap-1.5 text-sm text-[#5c6e66] hover:text-[#153f34]"
            >
              <ArrowLeft size={15} aria-hidden="true" /> Workspace
            </Link>
            <span className="text-[#c8d8d0]">/</span>
            <span className="text-sm font-semibold text-[#153f34]">SaaS Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void sendTrialReminders()}
              disabled={sendingEmails}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#cddbd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef] disabled:opacity-50"
            >
              <Send size={13} aria-hidden="true" />
              {sendingEmails ? "Enviando…" : "Lembretes de trial"}
            </button>
            <button
              onClick={() => void fetchWorkspaces()}
              disabled={loadingRows}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#153f34] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1f5546] disabled:opacity-50"
            >
              <RefreshCw size={13} className={loadingRows ? "animate-spin" : ""} aria-hidden="true" />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4 sm:max-w-sm">
          {[
            { label: "Total workspaces", n: total },
            { label: "Em trial",         n: trialing },
            { label: "Ativos",           n: active },
          ].map(({ label, n }) => (
            <div key={label} className="rounded-xl border border-[#e1e9e3] bg-white p-4 text-center">
              <p className="text-2xl font-semibold text-[#153f34]">{n}</p>
              <p className="mt-0.5 text-xs text-[#5c6e66]">{label}</p>
            </div>
          ))}
        </div>

        {emailResult && (
          <div className="mb-4 rounded-lg border border-[#c8ddd2] bg-[#edf4ef] px-4 py-3 text-sm text-[#1a4a37]">
            {emailResult}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e1e9e3] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e1e9e3] bg-[#f7faf8]">
                  {["Workspace", "Owner", "Status", "Trial / Próx. cobrança", "Criado em", "MP ID", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#5c6e66]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ed]">
                {loadingRows && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#8aA09a]">
                      Carregando…
                    </td>
                  </tr>
                )}
                {!loadingRows && rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#8aA09a]">
                      Nenhum workspace encontrado.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const statusInfo = STATUS_LABELS[row.status] ?? { label: row.status, cls: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={row.workspace_id} className="hover:bg-[#f7faf8]">
                      <td className="px-4 py-3 font-medium text-[#1a2f26]">{row.workspace_name}</td>
                      <td className="px-4 py-3 text-[#4a5e57]">{row.owner_email}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#4a5e57]">
                        {row.status === "trialing"
                          ? <span className={trialDaysLeft(row.trial_ends_at) === "Expirado" ? "text-[#b45d41]" : ""}>
                              {trialDaysLeft(row.trial_ends_at)} restantes · vence {formatDate(row.trial_ends_at)}
                            </span>
                          : row.next_payment_date
                            ? formatDate(row.next_payment_date)
                            : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-[#4a5e57]">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#7a918a]">
                        {row.mp_preapproval_id
                          ? row.mp_preapproval_id.slice(0, 12) + "…"
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3">
                        {(row.status === "trialing" || row.status === "sem_assinatura" || row.status === "none") && (
                          <button
                            onClick={() => void extendTrial(row.workspace_id)}
                            disabled={extendingId === row.workspace_id}
                            className="inline-flex items-center gap-1 rounded-md border border-[#cddbd3] bg-white px-2.5 py-1 text-xs font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef] disabled:opacity-50"
                          >
                            <CalendarPlus size={12} aria-hidden="true" />
                            {extendingId === row.workspace_id ? "…" : "+7d"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
