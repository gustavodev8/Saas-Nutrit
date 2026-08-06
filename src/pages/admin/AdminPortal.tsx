import { useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import {
  Eye,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Settings2,
  Soup,
  UserSquare2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePatientPortalSettings } from "@/contexts/usePatientPortalSettings";
import {
  clonePatientPortalSettings,
  setPatientPortalFlag,
  type PatientPortalFlagKey,
  type PatientPortalSettings,
} from "@/lib/patientPortalSettings";

type ToggleConfig = {
  key: PatientPortalFlagKey;
  label: string;
  description: string;
};

const navigationToggles: ToggleConfig[] = [
  { key: "navigation.home", label: "Inicio", description: "Mantem a central principal do paciente visivel." },
  { key: "navigation.plan", label: "Plano", description: "Mostra a aba com plano alimentar e refeicoes." },
  { key: "navigation.consultations", label: "Consultas", description: "Mostra a agenda e o historico de atendimentos." },
  { key: "navigation.documents", label: "Documentos", description: "Mostra exames, relatorios e materiais anexados." },
];

const homeToggles: ToggleConfig[] = [
  { key: "home.nextConsultation", label: "Proxima consulta", description: "Card com o proximo atendimento pendente ou confirmado." },
  { key: "home.currentPlan", label: "Plano atual", description: "Card com o plano alimentar mais recente liberado." },
  { key: "home.latestAssessment", label: "Ultima avaliacao", description: "Resumo da avaliacao corporal mais recente." },
  { key: "home.pendingExams", label: "Exames pendentes", description: "Contador de solicitacoes de exame abertas." },
  { key: "home.reports", label: "Relatorios", description: "Contador de relatorios clinicos disponiveis." },
  { key: "home.materials", label: "Materiais", description: "Contador de registros com anexos ou orientacoes." },
  { key: "home.latestGuidance", label: "Ultimas orientacoes", description: "Bloco com proximos passos e materiais recentes." },
];

const planToggles: ToggleConfig[] = [
  { key: "plan.summary", label: "Resumo do plano", description: "Cabecalho do plano com titulo e observacoes principais." },
  { key: "plan.goals", label: "Metas", description: "Card de calorias e macronutrientes." },
  { key: "plan.meals", label: "Refeicoes", description: "Lista completa de refeicoes e alimentos do plano." },
  { key: "plan.notes", label: "Observacoes", description: "Exibe notas do plano e de cada refeicao." },
  { key: "plan.calories", label: "Calorias", description: "Exibe o valor calorico diario quando existir." },
  { key: "plan.macros", label: "Macronutrientes", description: "Exibe proteina, carboidrato e gordura nas metas." },
];

const consultationToggles: ToggleConfig[] = [
  { key: "consultations.upcoming", label: "Proximas consultas", description: "Mostra a coluna de atendimentos futuros." },
  { key: "consultations.history", label: "Historico", description: "Mostra a coluna com consultas anteriores." },
  { key: "consultations.paymentStatus", label: "Status de pagamento", description: "Exibe a situacao financeira em cada consulta." },
  { key: "consultations.appointmentType", label: "Tipo de atendimento", description: "Exibe se a consulta foi online ou presencial." },
];

const documentToggles: ToggleConfig[] = [
  { key: "documents.exams", label: "Exames", description: "Mostra a secao de solicitacoes de exames." },
  { key: "documents.reports", label: "Relatorios", description: "Mostra os relatorios clinicos liberados." },
  { key: "documents.materials", label: "Materiais e orientacoes", description: "Mostra os registros complementares da consulta." },
  { key: "documents.nextSteps", label: "Proximos passos", description: "Exibe o texto de orientacoes dentro dos materiais." },
  { key: "documents.attachments", label: "Anexos", description: "Exibe os links de arquivos compartilhados." },
];

function countEnabledFlags(section: Record<string, boolean>) {
  return Object.values(section).filter(Boolean).length;
}

function PanelSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">{children}</div>
    </section>
  );
}

function ToggleRow({
  checked,
  label,
  description,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function getFlagValue(settings: PatientPortalSettings, key: PatientPortalFlagKey) {
  const [section, field] = key.split(".") as [keyof PatientPortalSettings, string];
  const value = settings[section];

  if (typeof value !== "object" || value === null || Array.isArray(value) || !(field in value)) {
    return false;
  }

  return Boolean((value as Record<string, unknown>)[field]);
}

function SaveStatusMessage({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "saved") {
    return <span className="text-sm font-medium text-primary">Configuracoes salvas.</span>;
  }

  if (status === "error") {
    return <span className="text-sm font-medium text-destructive">Erro ao salvar. Revise a conexao e tente novamente.</span>;
  }

  if (status === "saving") {
    return <span className="text-sm text-muted-foreground">Salvando configuracoes do portal...</span>;
  }

  return <span className="text-sm text-muted-foreground">As alteracoes afetam apenas o portal do paciente.</span>;
}

export default function AdminPortal() {
  const { settings, loading, saveStatus, replaceSettings, resetSettings } = usePatientPortalSettings();
  const [form, setForm] = useState(() => clonePatientPortalSettings(settings));

  useEffect(() => {
    setForm(clonePatientPortalSettings(settings));
  }, [settings]);

  const summary = useMemo(
    () => ({
      routes: countEnabledFlags(form.navigation),
      homeCards: countEnabledFlags(form.home),
      planBlocks: countEnabledFlags(form.plan),
      consultationBlocks: countEnabledFlags(form.consultations),
      documentBlocks: countEnabledFlags(form.documents),
    }),
    [form],
  );

  const handleFlagChange = (key: PatientPortalFlagKey, value: boolean) => {
    setForm((current) => setPatientPortalFlag(current, key, value));
  };

  const handleBrandingChange = (
    field: keyof PatientPortalSettings["branding"],
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      branding: {
        ...current.branding,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    await replaceSettings(form);
  };

  const handleReset = async () => {
    const defaults = clonePatientPortalSettings();
    setForm(defaults);
    await resetSettings();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-border/80 bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Experiencia do paciente
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Portal configuravel pelo admin
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Defina o que o paciente ve, quais blocos ficam ativos e como a area aparece
              para quem acessa o portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl bg-background/70">
              <a href="/portal" target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                Abrir portal
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleReset()}
              disabled={saveStatus === "saving"}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Restaurar padrao
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void handleSave()}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar configuracoes
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Modulos", value: `${summary.routes}/4`, hint: "abas visiveis" },
          { label: "Home", value: `${summary.homeCards}/7`, hint: "cards ativos" },
          { label: "Plano", value: `${summary.planBlocks}/6`, hint: "blocos visiveis" },
          { label: "Consultas", value: `${summary.consultationBlocks}/4`, hint: "campos ligados" },
          { label: "Documentos", value: `${summary.documentBlocks}/5`, hint: "blocos ativos" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </section>

      <PanelSection
        icon={MessageSquareText}
        eyebrow="Branding"
        title="Textos principais"
        description="Ajuste o titulo e a mensagem exibida no login e na central do paciente."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="portal-title">Titulo do portal</Label>
            <Input
              id="portal-title"
              value={form.branding.portalTitle}
              onChange={(event) => handleBrandingChange("portalTitle", event.target.value)}
              placeholder="Portal do paciente"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portal-subtitle">Subtitulo</Label>
            <Input
              id="portal-subtitle"
              value={form.branding.portalSubtitle}
              onChange={(event) => handleBrandingChange("portalSubtitle", event.target.value)}
              placeholder="Sua central de acompanhamento nutricional"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-2">
            <Label htmlFor="portal-welcome">Mensagem de boas-vindas</Label>
            <Textarea
              id="portal-welcome"
              value={form.branding.welcomeMessage}
              onChange={(event) => handleBrandingChange("welcomeMessage", event.target.value)}
              placeholder="Acompanhe plano, consultas e documentos em um so lugar."
              className="min-h-[108px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portal-support">Texto de suporte</Label>
            <Input
              id="portal-support"
              value={form.branding.supportLabel}
              onChange={(event) => handleBrandingChange("supportLabel", event.target.value)}
              placeholder="Fale com a clinica"
            />
          </div>
        </div>
      </PanelSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <PanelSection
          icon={UserSquare2}
          eyebrow="Navegacao"
          title="Abas visiveis"
          description="Controle quais modulos ficam disponiveis na navegacao inferior do portal."
        >
          {navigationToggles.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              checked={getFlagValue(form, toggle.key)}
              label={toggle.label}
              description={toggle.description}
              onCheckedChange={(value) => handleFlagChange(toggle.key, value)}
            />
          ))}
        </PanelSection>

        <PanelSection
          icon={Settings2}
          eyebrow="Central"
          title="Cards da home"
          description="Defina os atalhos e contadores que aparecem logo na entrada do paciente."
        >
          {homeToggles.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              checked={getFlagValue(form, toggle.key)}
              label={toggle.label}
              description={toggle.description}
              onCheckedChange={(value) => handleFlagChange(toggle.key, value)}
            />
          ))}
        </PanelSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <PanelSection
          icon={Soup}
          eyebrow="Plano"
          title="Conteudo do plano"
          description="Mostre ou esconda metas, observacoes e a lista de refeicoes."
        >
          {planToggles.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              checked={getFlagValue(form, toggle.key)}
              label={toggle.label}
              description={toggle.description}
              onCheckedChange={(value) => handleFlagChange(toggle.key, value)}
            />
          ))}
        </PanelSection>

        <PanelSection
          icon={Settings2}
          eyebrow="Consultas"
          title="Agenda e historico"
          description="Defina o quanto da rotina de atendimento fica visivel no portal."
        >
          {consultationToggles.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              checked={getFlagValue(form, toggle.key)}
              label={toggle.label}
              description={toggle.description}
              onCheckedChange={(value) => handleFlagChange(toggle.key, value)}
            />
          ))}
        </PanelSection>

        <PanelSection
          icon={FileText}
          eyebrow="Documentos"
          title="Exames e materiais"
          description="Controle exames, relatorios, orientacoes e anexos liberados ao paciente."
        >
          {documentToggles.map((toggle) => (
            <ToggleRow
              key={toggle.key}
              checked={getFlagValue(form, toggle.key)}
              label={toggle.label}
              description={toggle.description}
              onCheckedChange={(value) => handleFlagChange(toggle.key, value)}
            />
          ))}
        </PanelSection>
      </div>

      <div className="sticky bottom-[72px] z-10 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur sm:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SaveStatusMessage status={saveStatus} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleReset()}
              disabled={saveStatus === "saving"}
            >
              Restaurar padrao
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void handleSave()}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
