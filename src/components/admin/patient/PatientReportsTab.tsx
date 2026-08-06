import type { ComponentPropsWithoutRef } from "react";
import {
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquareQuote,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";

import { EmailPatientReportModal } from "@/components/admin/EmailPatientReportModal";
import { usePatientReportEditor } from "@/components/admin/patient/report/usePatientReportEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatReportDate,
  formatSavedTime,
  REPORT_FULL_TEMPLATE,
  REPORT_SECTION_SNIPPETS,
} from "@/lib/patientReportUtils";
import type { Patient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface PatientReportsTabProps {
  patient: Patient;
  onSaved: (patient: Patient) => void;
}

interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {
  minRows?: number;
}

const Textarea = ({ minRows = 3, className = "", ...props }: TextareaProps) => (
  <textarea
    className={`w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] ${className}`}
    rows={minRows}
    {...props}
  />
);

export function PatientReportsTab({
  patient,
  onSaved,
}: PatientReportsTabProps) {
  const {
    draft,
    estimatedReadMinutes,
    filteredReports,
    historySearch,
    historySort,
    latestReport,
    loadingReports,
    reportDateLabel,
    reportWordCount,
    reports,
    saveStatusClass,
    saveStatusLabel,
    saving,
    showEmail,
    createNewReport,
    appendSnippet,
    closeEmailModal,
    duplicateCurrentReport,
    handleDelete,
    handleDownloadPdf,
    handlePreviewPdf,
    handleSave,
    openEmailModal,
    selectReport,
    setDraftDate,
    setDraftText,
    setDraftTitle,
    setHistorySearch,
    setHistorySort,
  } = usePatientReportEditor({
    patient,
    onSaved,
  });

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-muted/10 p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                <MessageSquareQuote size={12} />
                Relatório clínico
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {draft.title || "Novo relatório"}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Documento clínico para evolução, conduta e próximos passos do
                paciente.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {reportDateLabel}
                </span>
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {reportWordCount} palavras
                </span>
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  Leitura em aprox. {estimatedReadMinutes} min
                </span>
                <span
                  className={cn(
                    "rounded-md border px-3 py-1 text-xs font-semibold",
                    saveStatusClass,
                  )}
                >
                  {saving ? (
                    <Loader2 size={12} className="mr-1 inline animate-spin" />
                  ) : (
                    <Clock3 size={12} className="mr-1 inline" />
                  )}
                  {saveStatusLabel}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  className="h-9 rounded-lg gap-2 bg-primary/90 px-4 text-sm font-medium shadow-none hover:bg-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg gap-2 border-border/70 bg-background px-3 text-sm font-medium shadow-none hover:bg-muted/40"
                  onClick={handlePreviewPdf}
                >
                  <Eye size={14} />
                  Visualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg gap-2 border-border/70 bg-background px-3 text-sm font-medium shadow-none hover:bg-muted/40"
                  onClick={duplicateCurrentReport}
                >
                  <Copy size={14} />
                  Duplicar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg gap-2 border-border/70 bg-background px-3 text-sm font-medium shadow-none hover:bg-muted/40"
                  onClick={handleDownloadPdf}
                >
                  <Download size={14} />
                  PDF
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-lg gap-2 bg-primary/10 px-4 text-sm font-medium text-primary shadow-none hover:bg-primary/15"
                  onClick={openEmailModal}
                  disabled={!patient.email}
                  title={
                    patient.email
                      ? "Enviar relatório por e-mail"
                      : "Cadastre um e-mail no perfil primeiro"
                  }
                >
                  <Send size={14} />
                  Enviar
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-lg gap-2 px-3 text-sm font-medium text-destructive hover:bg-destructive/8 hover:text-destructive"
                onClick={handleDelete}
                disabled={!draft.id}
              >
                <Trash2 size={14} />
                Excluir
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-2">
                <Label
                  htmlFor="report_title"
                  className="text-sm font-semibold text-foreground"
                >
                  Título do relatório
                </Label>
                <Input
                  id="report_title"
                  value={draft.title}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="h-10 rounded-lg border-border bg-background"
                  placeholder="Ex.: Evolução clínica — 31/07/2026"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="report_date"
                  className="text-sm font-semibold text-foreground"
                >
                  Data do relatório
                </Label>
                <Input
                  id="report_date"
                  type="date"
                  value={draft.report_date}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="h-10 rounded-lg border-border bg-background"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="report_text"
                  className="text-sm font-semibold text-foreground"
                >
                  Texto do relatório
                </Label>
                <span className="text-xs text-muted-foreground">
                  {draft.report_text.trim().length > 0
                    ? `${draft.report_text.trim().length} caracteres`
                    : "Campo vazio"}
                </span>
              </div>
              <Textarea
                id="report_text"
                minRows={8}
                value={draft.report_text}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Ex.: Paciente evoluiu bem, com boa adesão ao plano, redução de compulsão noturna e melhora do padrão intestinal..."
                className="min-h-[220px] rounded-xl border-border bg-background text-[15px] leading-7 shadow-inner"
              />
              <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Estrutura guiada
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-md text-xs"
                    onClick={() => appendSnippet(REPORT_FULL_TEMPLATE)}
                  >
                    Inserir estrutura completa
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {REPORT_SECTION_SNIPPETS.map((snippet) => (
                    <Button
                      key={snippet.key}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-md border border-border bg-background text-xs hover:bg-muted"
                      onClick={() => appendSnippet(snippet.text)}
                    >
                      {snippet.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border/60 bg-background/95 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {draft.id
                  ? `Documento aberto: ${draft.title} · ${reportDateLabel}`
                  : "Novo documento ainda não salvo."}
              </p>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-10 rounded-lg px-6 font-semibold"
              >
                {saving ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Salvar relatório
              </Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Documentos
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Relatórios clínicos
              </h3>
              <p className="text-sm text-muted-foreground">
                {reports.length} registro{reports.length === 1 ? "" : "s"}{" "}
                disponível{reports.length === 1 ? "" : "eis"}
                {latestReport
                  ? ` · último em ${formatReportDate(latestReport.report_date)}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="h-9 rounded-lg"
                  placeholder="Buscar por título, conteúdo ou data..."
                />
                <select
                  value={historySort}
                  onChange={(e) =>
                    setHistorySort(e.target.value as "recent" | "oldest")
                  }
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg gap-2"
                  onClick={duplicateCurrentReport}
                >
                  <Copy size={14} />
                  Duplicar atual
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg gap-2"
                  onClick={createNewReport}
                >
                  <Plus size={14} />
                  Novo em branco
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {loadingReports ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando relatórios...
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <FileText className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                Nenhum relatório salvo
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Comece pelo modelo completo ou use a estrutura padrão para
                registrar a primeira evolução.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-lg gap-2"
                  onClick={createNewReport}
                >
                  <Plus size={13} />
                  Criar primeiro relatório
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg"
                  onClick={() => appendSnippet(REPORT_FULL_TEMPLATE)}
                >
                  Inserir estrutura padrão
                </Button>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <p className="text-sm font-semibold text-foreground">
                Nenhum relatório encontrado
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Ajuste a busca ou a ordenação para localizar outro documento.
              </p>
            </div>
          ) : (
            filteredReports.map((report, index) => {
              const isActive = draft.id === report.id;
              const labelDate = formatReportDate(report.report_date);
              const words = report.report_text.trim()
                ? report.report_text.trim().split(/\s+/).length
                : 0;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => selectReport(report)}
                  className={cn(
                    "group w-full rounded-xl border p-4 text-left transition-colors",
                    isActive
                      ? "border-primary/30 bg-primary/8 ring-1 ring-primary/15"
                      : "border-border bg-background hover:border-primary/20 hover:bg-muted/20",
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">
                          {report.title}
                        </p>
                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {labelDate}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>{words} palavras</span>
                        <span>·</span>
                        <span>{report.report_text.trim().length} caracteres</span>
                        {report.updated_at ? (
                          <>
                            <span>·</span>
                            <span>
                              Atualizado às {formatSavedTime(report.updated_at)}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
                        isActive
                          ? "border border-primary/20 bg-primary/10 text-primary"
                          : "border border-border bg-muted/30 text-muted-foreground",
                      )}
                    >
                      {isActive ? "Aberto" : `#${index + 1}`}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {report.report_text || "Sem conteúdo"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {showEmail && (
        <EmailPatientReportModal
          patient={patient}
          report={draft}
          onClose={closeEmailModal}
        />
      )}
    </div>
  );
}
