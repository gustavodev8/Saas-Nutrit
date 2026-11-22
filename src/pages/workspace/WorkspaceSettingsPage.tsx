import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Building2, CalendarDays, Check, CreditCard, Loader2, Mail, Palette, Settings, Shield, User, Users } from "lucide-react";
import { WorkspaceBookingSettingsTab } from "@/components/workspace/WorkspaceBookingSettingsTab";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import {
  ALL_PORTAL_TABS,
  fetchWorkspaceInfo,
  fetchWorkspaceMembers,
  ROLE_LABELS,
  STATUS_LABELS,
  updateWorkspaceName,
  updateWorkspaceProfile,
  updateWorkspacePortal,
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

type TabKey = "perfil" | "portal" | "clinica" | "equipe" | "plano" | "agendamentos";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "perfil",       label: "Perfil",        icon: <User         size={15} aria-hidden="true" /> },
  { key: "portal",       label: "Portal",        icon: <Palette      size={15} aria-hidden="true" /> },
  { key: "clinica",      label: "Clínica",       icon: <Building2    size={15} aria-hidden="true" /> },
  { key: "equipe",       label: "Equipe",        icon: <Users        size={15} aria-hidden="true" /> },
  { key: "agendamentos", label: "Agendamentos",  icon: <CalendarDays size={15} aria-hidden="true" /> },
  { key: "plano",        label: "Plano",         icon: <CreditCard   size={15} aria-hidden="true" /> },
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

// ── Perfil tab ─────────────────────────────────────────────────────────────────

function PerfilTab({ workspaceId, isOwner }: { workspaceId: string; isOwner: boolean }) {
  const [info, setInfo] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ display_name: "", crn: "", specialty: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    fetchWorkspaceInfo(workspaceId)
      .then((data) => {
        if (!active) return;
        setInfo(data);
        setForm({
          display_name: data.display_name ?? "",
          crn:          data.crn ?? "",
          specialty:    data.specialty ?? "",
          bio:          data.bio ?? "",
        });
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Erro ao carregar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateWorkspaceProfile(workspaceId, form);
      setInfo((prev) => prev ? { ...prev, ...form } : prev);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Carregando...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Nome de exibição</Label>
        <p className="text-xs text-muted-foreground">Como seu nome aparece para os pacientes no portal.</p>
        <Input id="display-name" value={form.display_name} onChange={(e) => set("display_name", e.target.value)}
          placeholder="Ex: Dr. João Silva" maxLength={80} disabled={!isOwner} className="max-w-sm" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="crn">CRN</Label>
          <Input id="crn" value={form.crn} onChange={(e) => set("crn", e.target.value)}
            placeholder="Ex: CRN-5 12345" maxLength={20} disabled={!isOwner} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialty">Especialidade</Label>
          <Input id="specialty" value={form.specialty} onChange={(e) => set("specialty", e.target.value)}
            placeholder="Ex: Nutrição esportiva" maxLength={80} disabled={!isOwner} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio curta</Label>
        <p className="text-xs text-muted-foreground">Aparece na tela inicial do portal do paciente. Máx. 500 caracteres.</p>
        <textarea id="bio" rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)}
          placeholder="Nutricionista clínico e esportivo com foco em..."
          maxLength={500} disabled={!isOwner}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none disabled:opacity-50" />
        <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isOwner && (
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white" disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : "Salvar perfil"}
          </Button>
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo</span>}
        </div>
      )}
      {!isOwner && <p className="text-xs text-muted-foreground">Apenas o owner pode editar o perfil.</p>}
      {info && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Prévia no portal</p>
          <p className="text-sm font-semibold">{form.display_name || info.name}</p>
          {form.crn && <p className="text-xs text-muted-foreground">{form.crn}</p>}
          {form.specialty && <p className="text-xs text-[#166b50]">{form.specialty}</p>}
          {form.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.bio}</p>}
        </div>
      )}
    </form>
  );
}

// ── Portal tab ─────────────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: "Verde (padrão)", color: "#166b50" },
  { label: "Azul",           color: "#1d4ed8" },
  { label: "Roxo",           color: "#7c3aed" },
  { label: "Rosa",           color: "#be185d" },
  { label: "Laranja",        color: "#c2410c" },
  { label: "Cinza",          color: "#374151" },
];

function PortalTab({ workspaceId, isOwner }: { workspaceId: string; isOwner: boolean }) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    portal_accent: "#166b50",
    portal_welcome_msg: "",
    portal_tabs: ["plano", "treinos", "consultas", "documentos"],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    fetchWorkspaceInfo(workspaceId)
      .then((data) => {
        if (!active) return;
        setForm({
          portal_accent:      data.portal_accent ?? "#166b50",
          portal_welcome_msg: data.portal_welcome_msg ?? "",
          portal_tabs:        data.portal_tabs.length ? data.portal_tabs : ["plano","treinos","consultas","documentos"],
        });
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "Erro ao carregar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  const toggleTab = (key: string) => {
    setForm((f) => ({
      ...f,
      portal_tabs: f.portal_tabs.includes(key)
        ? f.portal_tabs.filter((t) => t !== key)
        : [...f.portal_tabs, key],
    }));
    setSaved(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateWorkspacePortal(workspaceId, form);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" />Carregando...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {/* Cor de destaque */}
      <div className="space-y-2">
        <Label>Cor de destaque do portal</Label>
        <p className="text-xs text-muted-foreground">Cor principal usada nos botões e destaques do portal do paciente.</p>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.color}
              type="button"
              title={p.label}
              disabled={!isOwner}
              onClick={() => { setForm((f) => ({ ...f, portal_accent: p.color })); setSaved(false); }}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                form.portal_accent === p.color ? "border-foreground scale-110" : "border-transparent hover:scale-105",
              )}
              style={{ backgroundColor: p.color }}
            />
          ))}
          <div className="flex items-center gap-2 ml-1">
            <input
              type="color"
              value={form.portal_accent}
              disabled={!isOwner}
              onChange={(e) => { setForm((f) => ({ ...f, portal_accent: e.target.value })); setSaved(false); }}
              className="h-8 w-8 cursor-pointer rounded border border-input bg-transparent disabled:opacity-50"
              title="Cor personalizada"
            />
            <span className="text-xs text-muted-foreground font-mono">{form.portal_accent}</span>
          </div>
        </div>
        {/* Preview chip */}
        <div className="flex items-center gap-2 mt-1">
          <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: form.portal_accent }}>
            Prévia do botão
          </span>
        </div>
      </div>

      {/* Mensagem de boas-vindas */}
      <div className="space-y-1.5">
        <Label htmlFor="welcome-msg">Mensagem de boas-vindas</Label>
        <p className="text-xs text-muted-foreground">Exibida na tela inicial do portal. Deixe em branco para usar o padrão.</p>
        <textarea
          id="welcome-msg"
          rows={2}
          value={form.portal_welcome_msg}
          onChange={(e) => { setForm((f) => ({ ...f, portal_welcome_msg: e.target.value })); setSaved(false); }}
          disabled={!isOwner}
          placeholder="Olá! Aqui você encontra seus planos e acompanhamentos. 🌿"
          maxLength={300}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground text-right">{form.portal_welcome_msg.length}/300</p>
      </div>

      {/* Abas visíveis */}
      <div className="space-y-2">
        <Label>Abas visíveis no portal</Label>
        <p className="text-xs text-muted-foreground">Escolha quais seções o paciente pode ver. Pelo menos uma deve ficar ativa.</p>
        <div className="space-y-2">
          {ALL_PORTAL_TABS.map((tab) => {
            const active = form.portal_tabs.includes(tab.key);
            const isLast = form.portal_tabs.length === 1 && active;
            return (
              <label key={tab.key} className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors", active ? "border-[#166b50]/40 bg-[#166b50]/5" : "hover:bg-muted/50", (!isOwner || isLast) && "opacity-60 cursor-not-allowed")}>
                <input
                  type="checkbox"
                  checked={active}
                  disabled={!isOwner || isLast}
                  onChange={() => toggleTab(tab.key)}
                  className="accent-[#166b50]"
                />
                <span className="text-sm font-medium">{tab.label}</span>
                {isLast && <span className="ml-auto text-xs text-muted-foreground">mínimo 1</span>}
              </label>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {isOwner && (
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" className="bg-[#166b50] hover:bg-[#145e45] text-white" disabled={saving}>
            {saving ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : "Salvar portal"}
          </Button>
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check size={14} />Salvo</span>}
        </div>
      )}
      {!isOwner && <p className="text-xs text-muted-foreground">Apenas o owner pode editar as configurações do portal.</p>}
    </form>
  );
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
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");

  const { refreshMembership } = useWorkspaceAuth();

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

  const handleCancel = async () => {
    setCanceling(true); setError(""); setConfirmCancel(false);
    try {
      const { data: { session } } = await (await import("@/lib/workspaceSupabase")).workspaceSupabase.auth.getSession();
      const supabaseUrl = (import.meta.env as Record<string, string>).VITE_SUPABASE_URL ?? "";
      const res = await fetch(`${supabaseUrl}/functions/v1/cancel-workspace-subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ""}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Não foi possível cancelar a assinatura.");
      } else {
        await refreshMembership();
      }
    } catch {
      setError("Erro ao cancelar a assinatura.");
    } finally {
      setCanceling(false);
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

      {isOwner && isActive && !confirmCancel && (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
        >
          Cancelar assinatura
        </button>
      )}

      {isOwner && isActive && confirmCancel && (
        <div className="rounded-md border border-destructive/30 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Confirmar cancelamento</p>
          <p className="text-xs text-muted-foreground">
            Ao cancelar, seu acesso continua até o fim do período já pago. Após isso, o workspace será bloqueado.
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void handleCancel()}
              disabled={canceling}
            >
              {canceling ? <><Loader2 size={13} className="animate-spin" />Cancelando…</> : "Sim, cancelar"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setConfirmCancel(false)}
            >
              Manter assinatura
            </button>
          </div>
        </div>
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
    searchParams.get("subscribed") === "1" ? "plano" : "perfil"
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

        <div className="border-b overflow-x-auto">
          <nav className="flex gap-1 -mb-px min-w-max" aria-label="Seções">
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
          {activeTab === "perfil"       && <PerfilTab  workspaceId={workspaceId} isOwner={isOwner} />}
          {activeTab === "portal"       && <PortalTab  workspaceId={workspaceId} isOwner={isOwner} />}
          {activeTab === "clinica"      && <ClinicaTab workspaceId={workspaceId} isOwner={isOwner} />}
          {activeTab === "equipe"       && <EquipeTab  workspaceId={workspaceId} currentUserEmail={userEmail} />}
          {activeTab === "agendamentos" && <WorkspaceBookingSettingsTab workspaceId={workspaceId} />}
          {activeTab === "plano"        && <PlanoTab   subscription={subscription} isOwner={isOwner} />}
        </div>
      </div>
    </main>
  );
}
