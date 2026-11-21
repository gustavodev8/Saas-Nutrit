export interface AnthropometryReportPrintEnvironment {
  documentRef: Pick<Document, "title">;
  windowRef: Pick<Window, "addEventListener" | "removeEventListener" | "setTimeout" | "clearTimeout" | "print">;
}

const fallbackPatient = "paciente";
const fallbackDate = "data-nao-informada";

function normalizeFilePart(value: string | null | undefined, fallback: string): string {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

export function buildAnthropometryReportFilename(
  patientName: string | null | undefined,
  assessmentDates: Array<string | null | undefined>,
): string {
  const dates = [...new Set(assessmentDates.map(normalizeIsoDate).filter((date): date is string => date !== null))]
    .sort((a, b) => a.localeCompare(b));
  const patientPart = normalizeFilePart(patientName, fallbackPatient);
  const datePart = dates.length === 0
    ? fallbackDate
    : dates.length === 1
      ? dates[0]
      : `${dates[0]}_a_${dates[dates.length - 1]}`;

  return `relatorio-antropometrico-${patientPart}-${datePart}.pdf`;
}

export function printWithSuggestedPdfName(
  filename: string,
  { documentRef, windowRef }: AnthropometryReportPrintEnvironment,
): void {
  const originalTitle = documentRef.title;
  const suggestedTitle = filename.replace(/\.pdf$/i, "");
  let restored = false;
  let printTimer: ReturnType<Window["setTimeout"]> | undefined;
  let fallbackTimer: ReturnType<Window["setTimeout"]> | undefined;

  const restoreTitle = () => {
    if (restored) return;

    restored = true;
    documentRef.title = originalTitle;
    windowRef.removeEventListener("afterprint", restoreTitle);
    if (printTimer !== undefined) windowRef.clearTimeout(printTimer);
    if (fallbackTimer !== undefined) windowRef.clearTimeout(fallbackTimer);
  };

  documentRef.title = suggestedTitle;
  windowRef.addEventListener("afterprint", restoreTitle, { once: true });

  printTimer = windowRef.setTimeout(() => {
    printTimer = undefined;
    try {
      windowRef.print();
    } catch (error) {
      restoreTitle();
      throw error;
    }

    if (!restored) fallbackTimer = windowRef.setTimeout(restoreTitle, 5_000);
  }, 0);
}
