import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  generatePatientReportPdf,
  type PatientReportPdfProfessional,
} from "@/lib/generatePatientReportPdf";
import {
  appendReportSnippet,
  createBlankPatientReport,
  filterPatientReports,
  formatReportDateLabel,
  getEstimatedReadMinutes,
  getReportEditorMeta,
  getReportSaveStatusPresentation,
  getReportSignature,
  getReportWordCount,
  type ReportHistorySort,
} from "@/lib/patientReportUtils";
import type { PatientReport } from "@/lib/supabase";
import type { WorkspacePatient } from "@/lib/workspacePatients";
import {
  createWorkspaceReport,
  deleteWorkspaceReport,
  duplicateWorkspaceReport,
  fetchWorkspaceReports,
  updateWorkspaceReport,
  workspaceReportsErrorMessage,
} from "@/lib/workspaceReports";

type ReportAction = "visualizar" | "exportar";

interface UseWorkspaceReportEditorParams {
  workspaceId: string;
  patient: WorkspacePatient;
  professional: PatientReportPdfProfessional;
}

export function useWorkspaceReportEditor({
  workspaceId,
  patient,
  professional,
}: UseWorkspaceReportEditorParams) {
  const patientId = patient.id;
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState<ReportHistorySort>("recent");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const lastSavedSignatureRef = useRef("");

  const makeBlankReport = useCallback(
    (text = "") => createBlankPatientReport(patientId, text),
    [patientId],
  );

  const [draft, setDraft] = useState<PatientReport>(() => createBlankPatientReport(patientId));

  const syncDraftFromSaved = useCallback((report: PatientReport) => {
    setDraft(report);
    lastSavedSignatureRef.current = getReportSignature(report);
    setLastSavedAt(report.updated_at ?? report.created_at ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    const blank = makeBlankReport();

    setDraft(blank);
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
    setLoadingReports(true);

    fetchWorkspaceReports(workspaceId, patientId)
      .then((data) => {
        if (!active) return;
        setReports(data);
        if (data.length > 0) syncDraftFromSaved(data[0]);
        else setDraft(blank);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setReports([]);
        toast.error(workspaceReportsErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoadingReports(false);
      });

    return () => {
      active = false;
    };
  }, [makeBlankReport, patientId, syncDraftFromSaved, workspaceId]);

  const meta = useMemo(
    () =>
      getReportEditorMeta({
        draft,
        lastSavedSignature: lastSavedSignatureRef.current,
        saving,
      }),
    [draft, saving],
  );

  const filteredReports = useMemo(
    () => filterPatientReports(reports, historySearch, historySort),
    [reports, historySearch, historySort],
  );

  const reportDateLabel = useMemo(() => formatReportDateLabel(draft.report_date), [draft.report_date]);
  const reportWordCount = useMemo(() => getReportWordCount(draft.report_text), [draft.report_text]);
  const estimatedReadMinutes = useMemo(() => getEstimatedReadMinutes(reportWordCount), [reportWordCount]);
  const saveStatusPresentation = useMemo(
    () => getReportSaveStatusPresentation(meta.saveStatus, lastSavedAt),
    [lastSavedAt, meta.saveStatus],
  );
  const latestReport = reports[0];

  const ensureCanDiscardDraft = useCallback(() => {
    if (draft.id && !meta.isDirty) return true;
    if (!draft.id && !meta.hasDraftChangesBeyondDefault) return true;
    return window.confirm("Existem alterações não salvas neste relatório. Deseja descartá-las?");
  }, [draft.id, meta.hasDraftChangesBeyondDefault, meta.isDirty]);

  const selectReport = useCallback(
    (report: PatientReport) => {
      if (!ensureCanDiscardDraft()) return;
      syncDraftFromSaved(report);
    },
    [ensureCanDiscardDraft, syncDraftFromSaved],
  );

  const createNewReport = useCallback(() => {
    if (!ensureCanDiscardDraft()) return;
    setDraft(makeBlankReport());
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
  }, [ensureCanDiscardDraft, makeBlankReport]);

  const duplicateCurrentReport = useCallback(async () => {
    // Relatório salvo e sem alterações: persiste a cópia via camada de dados.
    if (draft.id && !meta.isDirty) {
      try {
        const copy = await duplicateWorkspaceReport(workspaceId, draft.id);
        const freshList = await fetchWorkspaceReports(workspaceId, patientId);
        setReports(freshList);
        syncDraftFromSaved(copy);
        toast.success("Relatório duplicado.");
      } catch (err: unknown) {
        toast.error(workspaceReportsErrorMessage(err));
      }
      return;
    }
    if (!ensureCanDiscardDraft()) return;
    setDraft({
      ...makeBlankReport(draft.report_text),
      title: `${makeBlankReport().title} (cópia)`,
    });
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
  }, [
    draft.id,
    draft.report_text,
    ensureCanDiscardDraft,
    makeBlankReport,
    meta.isDirty,
    patientId,
    syncDraftFromSaved,
    workspaceId,
  ]);

  const setDraftTitle = useCallback((title: string) => {
    setDraft((prev) => ({ ...prev, title }));
  }, []);

  const setDraftDate = useCallback((report_date: string) => {
    setDraft((prev) => ({ ...prev, report_date }));
  }, []);

  const setDraftText = useCallback((report_text: string) => {
    setDraft((prev) => ({ ...prev, report_text }));
  }, []);

  const appendSnippet = useCallback((text: string) => {
    setDraft((prev) => ({
      ...prev,
      report_text: appendReportSnippet(prev.report_text, text),
    }));
  }, []);

  const ensureReportReady = useCallback(
    (action: ReportAction) => {
      if (!draft.report_text.trim()) {
        toast.error("Preencha o relatório antes de continuar.");
        return false;
      }
      if (!draft.id || meta.isDirty) {
        toast.error(`Salve o relatório antes de ${action}.`);
        return false;
      }
      return true;
    },
    [draft.id, draft.report_text, meta.isDirty],
  );

  const handleSave = useCallback(async () => {
    if (!draft.title.trim()) {
      toast.error("Informe um título para o relatório.");
      return;
    }
    if (!draft.report_text.trim()) {
      toast.error("Escreva o conteúdo do relatório.");
      return;
    }

    setSaving(true);
    try {
      const input = {
        title: draft.title,
        report_date: draft.report_date,
        report_text: draft.report_text,
      };
      const saved = draft.id
        ? await updateWorkspaceReport(workspaceId, draft.id, input)
        : await createWorkspaceReport(workspaceId, patientId, input);

      syncDraftFromSaved(saved);
      setReports(await fetchWorkspaceReports(workspaceId, patientId));
      toast.success("Relatório salvo com sucesso!");
    } catch (err: unknown) {
      toast.error(workspaceReportsErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [draft, patientId, syncDraftFromSaved, workspaceId]);

  const handleDelete = useCallback(async () => {
    if (!draft.id) return;
    if (!window.confirm(`Excluir o relatório "${draft.title}"?`)) return;

    try {
      await deleteWorkspaceReport(workspaceId, draft.id);
      toast.success("Relatório excluído.");
      const freshList = await fetchWorkspaceReports(workspaceId, patientId);
      setReports(freshList);
      if (freshList[0]) {
        syncDraftFromSaved(freshList[0]);
      } else {
        setDraft(makeBlankReport());
        lastSavedSignatureRef.current = "";
        setLastSavedAt(null);
      }
    } catch (err: unknown) {
      toast.error(workspaceReportsErrorMessage(err));
    }
  }, [draft.id, draft.title, makeBlankReport, patientId, syncDraftFromSaved, workspaceId]);

  const handleDownloadPdf = useCallback(async () => {
    if (!ensureReportReady("exportar")) return;
    const doc = await generatePatientReportPdf(patient, draft, professional);
    doc.save(`${draft.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }, [draft, ensureReportReady, patient, professional]);

  const handlePreviewPdf = useCallback(async () => {
    if (!ensureReportReady("visualizar")) return;
    const doc = await generatePatientReportPdf(patient, draft, professional);
    const url = URL.createObjectURL(doc.output("blob"));
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) toast.info("Permita pop-ups para abrir a visualização do PDF.");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [draft, ensureReportReady, patient, professional]);

  return {
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
    saveStatusClass: saveStatusPresentation.className,
    saveStatusLabel: saveStatusPresentation.label,
    saving,
    createNewReport,
    appendSnippet,
    duplicateCurrentReport,
    handleDelete,
    handleDownloadPdf,
    handlePreviewPdf,
    handleSave,
    selectReport,
    setDraftDate,
    setDraftText,
    setDraftTitle,
    setHistorySearch,
    setHistorySort,
  };
}
