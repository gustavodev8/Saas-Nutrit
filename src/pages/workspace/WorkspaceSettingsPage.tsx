import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Check, CreditCard, Loader2, Mail, Settings, Shield, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import {
  fetchWorkspaceInfo,
  fetchWorkspaceMembers,
  ROLE_LABELS,
  STATUS_LABELS,
  updateWorkspaceName,
  type WorkspaceInfo,
  type WorkspaceMemberInfo,
} from "@/lib/workspaceSettings";
import {
  initiateWorkspaceSubscription,
  isSubscriptionAccessible,
  trialDaysLeft,
  type WorkspaceSubscription,
} from "@/lib/workspaceSubscription";
import { cn } from "@/lib/utils";

type TabKey = "clinica" | "equipe" | "plano";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "clinica", label: "Clínica",  icon: <Building2   size={15} aria-hidden="true" /> },
  { key: "equipe",  label: "Equipe",   icon: <Users       size={15} aria-hidden="true" /> },
  { key: "plano",   label: "Plano",    icon: <CreditCard  size={15} aria-hidden="true" /> },
];

function tabClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
    active
      ? "border-[#166b50] text-[#166b50]"
      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
  );
}

function roleBadge(role: string) {
  const label = ROLE_LABELS[role] ?? role;
  const isOwner = role === "owner";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
      isOwner
        ? "bg-[#166b50]/10 text-[#166b50]"
        : "bg-muted text-muted-foreground",
    )}>
      {isOwner && <Shield size={10} />}
      {label}
    </span>
  );
}

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  if (status === "active") {
    return <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check size={10} />{label}</span>;
  }
  if (status === "invited") {
    return <span className="text-xs text-amber-600">{label}</span>;
  }
  return <span className="text-xs text-destructive">{label}</span>;
}

// ── Clínica tab ────────────────────────────────────────────────────────────────

function ClinicaTab({ workspaceId, isOwner }: { workspaceId: string; isOwner: boolean }) {
  const [info, setInfo] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWorkspaceInfo(workspaceId)
      .then((data) => { if (active) { setInfo(data); setName(data.name); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateWorkspaceName(workspaceId, name);
      setInfo((prev) => prev ? { ...prev, name: name.trim() } : prev);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="workspace-name" className="font-medium">Nome da clínica</Label>
        <p className="text-xs text-muted-foreground">Aparece nos PDFs de planos alimentares gerados pelo workspace.</p>
        <Input
          id="workspace-name"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          maxLength={120}
          placeholder="Nome da clínica ou consultório"
          disabled={!isOwner || saving}
          className="max-w-sm"
        />
        {!isOwner && (
          <p className="text-xs text-muted-foreground">Apenas o owner do workspace pode alterar o nome.</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isOwner && (
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="sm"
            className="bg-[#166b50] hover:bg-[#145e45] text-white"
            disabled={saving || name.trim() === (info?.name ?? "") || !name.trim()}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : "Salvar"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo</span>
          )}
        </div>
      )}

      {info && (
        <p className="text-xs text-muted-foreground">
          Workspace criado em{" "}
          {new Date(info.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      )}
    </form>
  );
}

// ── Equipe tab ─────────────────────────────────────────────────────────────────

function EquipeTab({ workspaceId, currentUserEmail }: { workspaceId: string; currentUserEmail: string | null }) {
  const [members, setMembers] = useState<WorkspaceMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rpcMissing, setRpcMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setRpcMissing(false);
    try {
      const data = await fetchWorkspaceMembers(workspaceId);
      setMembers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("list_workspace_members") || msg.includes("42883")) {
        setRpcMissing(true);
      } else {
        setError(msg || "Não foi possível carregar a equipe.");
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Carregando equipe...</div>;
  }

  if (rpcMissing) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">Migration pendente</p>
          <p className="mt-1 text-xs text-amber-700">
            Para listar membros com e-mail, aplique o SQL de settings no Supabase SQL Editor.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Enquanto isso, você está conectado como <strong>{currentUserEmail ?? "—"}</strong>.
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive py-4">{error}</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Membros ativos ({members.length})</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Membros com acesso ao workspace. Para convidar novos membros, entre em contato com o suporte da plataforma.
        </p>
      </div>

      <div className="divide-y rounded-lg border bg-background">
        {members.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum membro encontrado.</p>
        )}
        {members.map((member) => {
          const isSelf = member.email.toLowerCase() === (currentUserEmail ?? "").toLowerCase();
          return (
            <div key={member.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground uppercase">
                {member.email[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{member.email}</span>
                  {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {roleBadge(member.role)}
                  {statusBadge(member.status)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                desde {new Date(member.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-4 py-4 flex items-start gap-3">
        <Mail size={16} className="text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Convidar novo membro</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Convites são gerenciados pela plataforma no piloto fechado. Entre em contato para adicionar um novo nutricionista ou assistente ao workspace.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Plano tab ──────────────────────────────────────────────────────────────────

function PlanoTab({ subscription, isOwner }: { subscription: WorkspaceSubscription | null; isOwner: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true); setError("");
    try {
      const initPoint = await initiateWorkspaceSubscription(window.location.href);
      window.location.href = initPoint;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a assinatura.");
      setLoading(false);
    }
  };

  if (!subscription) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">Migration pendente</p>
          <p className="mt-1 text-xs text-amber-700">Aplique a migration de subscriptions no Supabase para ver o plano aqui.</p>
        </div>
      </div>
    );
  }

  const isTrialing = subscription.status === "trialing";
  const isActive = subscription.status === "active";
  const daysLeft = isTrialing ? trialDaysLeft(subscription.trial_ends_at) : null;
  const accessible = isSubscriptionAccessible(subscription.status);

  const statusLabel: Record<string, string> = {
    trialing: "Período gratuito",
    active: "Ativo",
    past_due: "Pagamento pendente",
    canceled: "Cancelado",
    suspended: "Suspenso",
  };

  const statusColor: Record<string, string> = {
    trialing: "bg-blue-50 text-blue-700 border-blue-200",
    active: "bg-green-50 text-[#166b50] border-green-200",
    past_due: "bg-amber-50 text-amber-700 border-amber-200",
    canceled: "bg-muted text-muted-foreground border-border",
    suspended: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-lg border bg-background p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Plano atual</p>
            <p className="mt-1 text-xl font-semibold">Nutrit Starter</p>
            <p className="text-sm text-muted-foreground">R$79,90 / mês</p>
          </div>
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusColor[subscription.status] ?? statusColor["canceled"])}>
            {statusLabel[subscription.status] ?? subscription.status}
          </span>
        </div>

        {isTrialing && daysLeft !== null && (
          <div className={cn(
            "rounded-md px-3 py-2 text-sm",
            daysLeft > 7 ? "bg-blue-50 text-blue-700" : daysLeft > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
          )}>
            {daysLeft > 0
              ? <><strong>{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</strong> restantes no período gratuito.</>
              : "Período gratuito encerrado."}
          </div>
        )}

        {isActive && subscription.next_payment_date && (
          <p className="text-sm text-muted-foreground">
            Próxima cobrança:{" "}
            <strong>{new Date(subscription.next_payment_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </p>
        )}

        <ul className="space-y-1 text-sm text-muted-foreground">
          {["Pacientes ilimitados", "Planos alimentares e modelos", "Avaliações antropométricas", "Banco de alimentos completo"].map((f) => (
            <li key={f} className="flex items-center gap-2"><Check size={13} className="text-[#166b50] shrink-0" />{f}</li>
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isOwner && !isActive && (
        <Button
          className="bg-[#166b50] hover:bg-[#145e45] text-white"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? <><Loader2 size={15} className="animate-spin" />Aguarde…</> : <><ArrowRight size={15} />{accessible ? "Assinar agora" : "Reativar assinatura"}</>}
        </Button>
      )}

      {isActive && (
        <p className="text-xs text-muted-foreground">
          Para cancelar ou alterar o método de pagamento, acesse o{" "}
          <a href="https://www.mercadopago.com.br/subscriptions" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            painel do Mercado Pago
          </a>.
        </p>
      )}

      {!isOwner && (
        <p className="text-xs text-muted-foreground">Apenas o owner do workspace pode gerenciar a assinatura.</p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function WorkspaceSettingsPage() {
  const { membership, userEmail, subscription } = useWorkspaceAuth();
  const workspaceId = membership?.workspaceId ?? null;
  const isOwner = membership?.role === "owner";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    searchParams.get("subscribed") === "1" ? "plano" : "clinica"
  );

  if (!workspaceId) {
    return (
      <main className="px-4 py-6 sm:px-8">
        <p className="text-sm text-muted-foreground">Sem workspace ativo.</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Settings size={13} aria-hidden="true" />Configurações
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie as informações e a equipe do seu workspace.</p>
        </header>

        <div className="border-b">
          <nav className="flex gap-1 -mb-px" aria-label="Seções">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={tabClass(activeTab === tab.key)}
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? "page" : undefined}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-2">
          {activeTab === "clinica" && <ClinicaTab workspaceId={workspaceId} isOwner={isOwner} />}
          {activeTab === "equipe"  && <EquipeTab  workspaceId={workspaceId} currentUserEmail={userEmail} />}
          {activeTab === "plano"   && <PlanoTab   subscription={subscription} isOwner={isOwner} />}
        </div>
      </div>
    </main>
  );
}
