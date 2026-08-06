import type { PatientReport } from "@/lib/supabase";

export type ReportHistorySort = "recent" | "oldest";
export type ReportSaveStatus = "saving" | "saved" | "dirty" | "unsaved";

export const todayISO = () => new Date().toISOString().split("T")[0];

export const formatReportDate = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatIsoDate = (iso?: string | null) => {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return `${day}/${month}/${year}`;
};

export const formatBirthDate = (iso?: string | null) => formatIsoDate(iso);

export const ageYears = (birthDate?: string | null) => {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  return years;
};

export const formatReportDateLabel = (value?: string | null) =>
  value ? formatReportDate(value) : "Sem data definida";

export const createReportTitle = (date = todayISO()) =>
  `Evolução clínica — ${formatReportDate(date)}`;

export const REPORT_SECTION_SNIPPETS = [
  {
    key: "overview",
    label: "Evolução",
    text: "Evolução clínica:\n- \n\nAdesão ao plano:\n- \n",
  },
  {
    key: "symptoms",
    label: "Sinais e sintomas",
    text: "Sinais e sintomas:\n- \n",
  },
  {
    key: "conduct",
    label: "Conduta",
    text: "Conduta nutricional:\n- \n",
  },
  {
    key: "next",
    label: "Próximos passos",
    text: "Próximos passos:\n- \n",
  },
] as const;

export const REPORT_FULL_TEMPLATE = [
  "Evolução clínica:",
  "- ",
  "",
  "Adesão ao plano:",
  "- ",
  "",
  "Sinais e sintomas:",
  "- ",
  "",
  "Conduta nutricional:",
  "- ",
  "",
  "Próximos passos:",
  "- ",
].join("\n");

export const getReportSignature = (
  report: Pick<PatientReport, "id" | "title" | "report_date" | "report_text">,
) =>
  JSON.stringify({
    id: report.id ?? null,
    title: report.title,
    report_date: report.report_date,
    report_text: report.report_text,
  });

export const formatSavedTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

export const createBlankPatientReport = (
  patientId: number,
  text = "",
): PatientReport => ({
  patient_id: patientId,
  title: createReportTitle(),
  report_date: todayISO(),
  report_text: text,
});

export const appendReportSnippet = (currentText: string, snippet: string) =>
  currentText.trim() ? `${currentText.replace(/\s+$/, "")}\n\n${snippet}` : snippet;

export const getReportWordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

export const getEstimatedReadMinutes = (wordCount: number) =>
  Math.max(1, Math.ceil(wordCount / 180));

export const filterPatientReports = (
  reports: PatientReport[],
  query: string,
  sort: ReportHistorySort,
) => {
  const normalizedQuery = query.trim().toLowerCase();

  return [...reports]
    .filter((report) => {
      if (!normalizedQuery) return true;
      return (
        report.title.toLowerCase().includes(normalizedQuery) ||
        report.report_text.toLowerCase().includes(normalizedQuery) ||
        report.report_date.includes(normalizedQuery)
      );
    })
    .sort((a, b) => {
      const left = `${a.report_date}${a.created_at ?? ""}`;
      const right = `${b.report_date}${b.created_at ?? ""}`;
      return sort === "recent"
        ? right.localeCompare(left)
        : left.localeCompare(right);
    });
};

export const getReportEditorMeta = ({
  draft,
  lastSavedSignature,
  saving,
  today = todayISO(),
}: {
  draft: Pick<PatientReport, "id" | "title" | "report_date" | "report_text">;
  lastSavedSignature: string;
  saving: boolean;
  today?: string;
}) => {
  const isDirty = getReportSignature(draft) !== lastSavedSignature;
  const hasMeaningfulContent = draft.report_text.trim().length > 0;
  const hasDraftChangesBeyondDefault =
    hasMeaningfulContent ||
    draft.title.trim() !== createReportTitle(draft.report_date || today) ||
    draft.report_date !== today;

  const saveStatus: ReportSaveStatus = saving
    ? "saving"
    : draft.id
      ? isDirty
        ? "dirty"
        : "saved"
      : "unsaved";

  return {
    isDirty,
    hasMeaningfulContent,
    hasDraftChangesBeyondDefault,
    saveStatus,
  };
};

export const getReportSaveStatusPresentation = (
  saveStatus: ReportSaveStatus,
  lastSavedAt?: string | null,
) => {
  const savedTimeLabel = formatSavedTime(lastSavedAt);
  const label =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "saved"
        ? `Salvo${savedTimeLabel ? ` às ${savedTimeLabel}` : ""}`
        : saveStatus === "dirty"
          ? "Alterações não salvas"
          : "Novo documento não salvo";
  const className =
    saveStatus === "saved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : saveStatus === "saving"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return {
    label,
    className,
  };
};
