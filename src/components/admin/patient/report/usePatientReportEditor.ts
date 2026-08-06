import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { generatePatientReportPdf } from "@/lib/generatePatientReportPdf";
import {
  createBlankPatientReport,
  appendReportSnippet,
  filterPatientReports,
  formatReportDateLabel,
  getEstimatedReadMinutes,
  getReportEditorMeta,
  getReportSaveStatusPresentation,
  getReportWordCount,
  getReportSignature,
  type ReportHistorySort,
} from "@/lib/patientReportUtils";
import {
  deletePatientReport,
  fetchPatientReports,
  type Patient,
  type PatientReport,
  upsertPatientReport,
} from "@/lib/supabase";

type ReportAction = "visualizar" | "exportar" | "enviar";

interface UsePatientReportEditorParams {
  patient: Patient;
  onSaved: (patient: Patient) => void;
}

export function usePatientReportEditor({
  patient,
  onSaved,
}: UsePatientReportEditorParams) {
  const patientId = Number(patient.id ?? 0);
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState<ReportHistorySort>("recent");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const lastSavedSignatureRef = useRef("");

  const makeBlankReport = useCallback(
    (text = "") => createBlankPatientReport(patientId, text),
    [patientId],
  );

  const [draft, setDraft] = useState<PatientReport>(() =>
    createBlankPatientReport(patientId, patient.report_text ?? ""),
  );

  const syncDraftFromSaved = useCallback((report: PatientReport) => {
    setDraft(report);
    lastSavedSignatureRef.current = getReportSignature(report);
    setLastSavedAt(report.updated_at ?? report.created_at ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    const blank = makeBlankReport(patient.report_text ?? "");

    setDraft(blank);
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
    setLoadingReports(true);

    fetchPatientReports(patientId)
      .then((data) => {
        if (!active) return;
        setReports(data);
        if (data.length > 0) {
          syncDraftFromSaved(data[0]);
        } else {
          setDraft(blank);
        }
      })
      .finally(() => {
        if (active) setLoadingReports(false);
      });

    return () => {
      active = false;
    };
  }, [makeBlankReport, patient.report_text, patientId, syncDraftFromSaved]);

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

  const reportDateLabel = useMemo(
    () => formatReportDateLabel(draft.report_date),
    [draft.report_date],
  );
  const reportWordCount = useMemo(
    () => getReportWordCount(draft.report_text),
    [draft.report_text],
  );
  const estimatedReadMinutes = useMemo(
    () => getEstimatedReadMinutes(reportWordCount),
    [reportWordCount],
  );
  const saveStatusPresentation = useMemo(
    () => getReportSaveStatusPresentation(meta.saveStatus, lastSavedAt),
    [lastSavedAt, meta.saveStatus],
  );
  const latestReport = reports[0];

  const ensureCanDiscardDraft = useCallback(() => {
    if (draft.id && !meta.isDirty) return true;
    if (!draft.id && !meta.hasDraftChangesBeyondDefault) return true;
    return window.confirm(
      "Existem alterações não salvas neste relatório. Deseja descartá-las?",
    );
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

  const duplicateCurrentReport = useCallback(() => {
    if (!ensureCanDiscardDraft()) return;
    setDraft({
      ...makeBlankReport(draft.report_text),
      title: `${makeBlankReport().title} (cópia)`,
    });
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
  }, [draft.report_text, ensureCanDiscardDraft, makeBlankReport]);

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
      const saved = await upsertPatientReport({
        ...draft,
        patient_id: patientId,
      });
      if (!saved) {
        toast.error("Erro ao salvar relatório.");
        return;
      }

      syncDraftFromSaved(saved);
      const freshList = await fetchPatientReports(patientId);
      setReports(freshList);
      toast.success("Relatório salvo com sucesso!");
      onSaved({ ...patient, report_text: saved.report_text });
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }, [draft, onSaved, patient, patientId, syncDraftFromSaved]);

  const handleDelete = useCallback(async () => {
    if (!draft.id) return;
    const ok = window.confirm(`Excluir o relatório "${draft.title}"?`);
    if (!ok) return;

    const deleted = await deletePatientReport(draft.id);
    if (!deleted) {
      toast.error("Erro ao excluir relatório.");
      return;
    }

    toast.success("Relatório excluído.");
    const freshList = await fetchPatientReports(patientId);
    setReports(freshList);

    if (freshList[0]) {
      syncDraftFromSaved(freshList[0]);
    } else {
      setDraft(makeBlankReport());
      lastSavedSignatureRef.current = "";
      setLastSavedAt(null);
    }
  }, [draft.id, draft.title, makeBlankReport, patientId, syncDraftFromSaved]);

  const handleDownloadPdf = useCallback(async () => {
    if (!ensureReportReady("exportar")) return;
    const doc = await generatePatientReportPdf(patient, draft);
    doc.save(`${draft.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }, [draft, ensureReportReady, patient]);

  const handlePreviewPdf = useCallback(async () => {
    if (!ensureReportReady("visualizar")) return;
    const doc = await generatePatientReportPdf(patient, draft);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) toast.info("Permita pop-ups para abrir a visualização do PDF.");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [draft, ensureReportReady, patient]);

  const openEmailModal = useCallback(() => {
    if (!ensureReportReady("enviar")) return;
    setShowEmail(true);
  }, [ensureReportReady]);

  const closeEmailModal = useCallback(() => {
    setShowEmail(false);
  }, []);

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
  };
}
