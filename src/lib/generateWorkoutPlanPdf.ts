import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  WorkspaceTrainingExercise,
  WorkspaceTrainingPlan,
} from "@/lib/workspaceTraining";

type RGB = [number, number, number];

const C = {
  ink: [17, 24, 39] as RGB,
  muted: [100, 116, 139] as RGB,
  line: [229, 231, 235] as RGB,
  lineStrong: [209, 213, 219] as RGB,
  soft: [249, 250, 251] as RGB,
  soft2: [243, 244, 246] as RGB,
  accent: [22, 107, 80] as RGB,
  white: [255, 255, 255] as RGB,
};

const GOAL_PDF_LABELS: Record<string, string> = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  condicionamento: "Condicionamento",
  saude: "Saúde",
  forca: "Força",
  reabilitacao: "Reabilitação",
  outro: "Outro",
};

const STATUS_PDF_LABELS: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

/** Dados do profissional exibidos no cabeçalho/assinatura. Todos opcionais. */
export interface WorkoutPlanPdfProfessional {
  name?: string | null;
  /** Registro profissional (CRN, CREF...). */
  registration?: string | null;
  city?: string | null;
  /** Texto da linha de assinatura (default: nome do profissional). */
  signatureLabel?: string | null;
}

export interface WorkoutPlanPdfOptions {
  professional?: WorkoutPlanPdfProfessional;
  patientName?: string | null;
  workspaceName?: string | null;
}

const FALLBACK_PROFESSIONAL_NAME = "Profissional responsável";

function clean(v: string | null | undefined): string {
  return (v ?? "").replace(/\s+/g, " ").trim();
}

function formatToday(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtNum(v: number | null): string {
  if (v == null) return "-";
  return Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
}

function groupByDay(exercises: WorkspaceTrainingExercise[]): [string, WorkspaceTrainingExercise[]][] {
  const map = new Map<string, WorkspaceTrainingExercise[]>();
  for (const ex of exercises) {
    const arr = map.get(ex.day_label) ?? [];
    arr.push(ex);
    map.set(ex.day_label, arr);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
    .map(([day, list]) => [day, [...list].sort((a, b) => a.position - b.position)]);
}

export function generateWorkoutPlanPdf(
  plan: WorkspaceTrainingPlan,
  exercises: WorkspaceTrainingExercise[],
  options: WorkoutPlanPdfOptions = {},
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageWidth - margin * 2;

  const prof = options.professional ?? {};
  const profName = clean(prof.name) || FALLBACK_PROFESSIONAL_NAME;
  const profReg = clean(prof.registration);
  const profCity = clean(prof.city);
  const signatureLabel = clean(prof.signatureLabel) || profName;

  // Header
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(1.3);
  doc.line(0, 0, pageWidth, 0);

  doc.setTextColor(...C.accent);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FICHA DE TREINO", margin, 10);
  const workspaceName = clean(options.workspaceName);
  if (workspaceName) {
    let wn = workspaceName;
    const maxW = contentW / 2;
    while (wn.length > 1 && doc.getTextWidth(wn) > maxW) wn = wn.slice(0, -1);
    doc.text(wn, pageWidth - margin, 10, { align: "right" });
  }

  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.text(clean(options.patientName) || "Paciente", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(...C.muted);
  doc.text(`Gerado em ${formatToday()}`, margin, 24.5);
  doc.text(plan.name, pageWidth - margin, 24.5, { align: "right" });

  // Summary boxes
  const summary: { label: string; value: string }[] = [
    { label: "Objetivo", value: plan.goal ? (GOAL_PDF_LABELS[plan.goal] ?? plan.goal) : "Não informado" },
    { label: "Frequência", value: plan.frequency_per_week ? `${plan.frequency_per_week}x/semana` : "Não informada" },
    { label: "Duração", value: plan.duration_weeks ? `${plan.duration_weeks} semanas` : "Não informada" },
    { label: "Status", value: STATUS_PDF_LABELS[plan.status] ?? plan.status },
  ];
  const boxW = (contentW - 6) / 4;
  summary.forEach((item, idx) => {
    const x = margin + idx * (boxW + 2);
    const y = 30;
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.lineStrong);
    doc.roundedRect(x, y, boxW, 18, 2.2, 2.2, "FD");
    doc.setFillColor(...C.soft2);
    doc.rect(x, y, boxW, 2, "F");
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text(item.label.toUpperCase(), x + 4, y + 6);
    doc.setTextColor(...C.ink);
    doc.setFontSize(10);
    doc.text(item.value, x + 4, y + 13);
  });

  let y = 54;

  const planNotes = clean(plan.notes);
  if (planNotes) {
    const lines = doc.splitTextToSize(planNotes, contentW - 10) as string[];
    const h = 10 + lines.length * 3.7;
    doc.setFillColor(...C.soft);
    doc.setDrawColor(...C.line);
    doc.roundedRect(margin, y, contentW, h, 2.2, 2.2, "FD");
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Orientações gerais", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    doc.setTextColor(...C.ink);
    doc.text(lines, margin + 4, y + 9);
    y += h + 4;
  }

  const days = groupByDay(exercises);
  if (days.length === 0) {
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Nenhum exercício cadastrado neste plano.", margin, y + 4);
    y += 10;
  }

  const lastY = () => (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  for (const [day, list] of days) {
    if (y + 30 > pageHeight - 16) {
      doc.addPage();
      y = 14;
    }
    doc.setFillColor(...C.soft);
    doc.setDrawColor(...C.lineStrong);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentW, 8, "FD");
    doc.setFillColor(...C.accent);
    doc.rect(margin, y, 2.5, 8, "F");
    doc.setTextColor(...C.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`Treino ${day}`, margin + 5, y + 5.5);
    y += 9;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, bottom: 18 },
      theme: "grid",
      head: [["#", "Exercício", "Séries", "Reps", "Carga (kg)", "Descanso (s)", "Observações"]],
      body: list.map((ex, i) => [
        String(i + 1),
        ex.exercise_name || "-",
        fmtNum(ex.sets),
        ex.reps?.trim() || "-",
        fmtNum(ex.load_kg),
        fmtNum(ex.rest_seconds),
        ex.notes?.trim() || "",
      ]),
      styles: {
        font: "helvetica",
        fontSize: 8.4,
        textColor: C.ink,
        lineColor: C.line,
        lineWidth: 0.15,
        cellPadding: 2.1,
        valign: "middle",
      },
      headStyles: { fillColor: C.soft2, textColor: C.muted, fontStyle: "bold", fontSize: 6.8 },
      alternateRowStyles: { fillColor: [253, 253, 253] },
      columnStyles: {
        0: { cellWidth: 7, halign: "center" },
        1: { cellWidth: "auto", fontStyle: "bold" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 42 },
      },
    });
    y = lastY() + 6;
  }

  // Signature
  if (y + 30 > pageHeight - 16) {
    doc.addPage();
    y = 14;
  }
  y += 12;
  const sigW = 80;
  const sigX = pageWidth - margin - sigW;
  doc.setDrawColor(...C.ink);
  doc.setLineWidth(0.3);
  doc.line(sigX, y, sigX + sigW, y);
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(signatureLabel, sigX + sigW / 2, y + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(...C.muted);
  const sub = [profReg, profCity].filter(Boolean).join(" · ");
  if (sub) doc.text(sub, sigX + sigW / 2, y + 9.5, { align: "center" });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 8;
    doc.setDrawColor(...C.lineStrong);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
    doc.setTextColor(...C.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.text("Documento clínico confidencial", margin, footerY);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  return doc;
}

/** Nome de arquivo seguro para o PDF. */
export function workoutPlanPdfFileName(plan: WorkspaceTrainingPlan, patientName?: string | null): string {
  const base = [clean(patientName), plan.name].filter(Boolean).join(" - ") || "treino";
  const safe = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `treino_${safe || "plano"}.pdf`;
}
