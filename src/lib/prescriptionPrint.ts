/**
 * Gerador do receituário magistral (HTML para impressão/PDF), pareado com o do admin
 * (src/components/admin/PrescriptionBuilder.tsx). Sem o parâmetro `professional`, mantém
 * os valores fixos do admin (Dr. Fillipe David / CRN-5 / Alagoinhas / assinatura.png).
 * Quando informado (ex.: workspace), nada do Dr. Fillipe é reaproveitado: a assinatura
 * só aparece se `signatureUrl` for passada. Segue o padrão de generateExamRequestPdf.
 */

export interface PrescriptionPrintItem {
  name: string;
  dose: number;
  unit: string;
}

export interface PrescriptionPrintBlock {
  label: string;
  pharmaceuticalForm: string;
  posology: string;
  items: PrescriptionPrintItem[];
}

export interface PrescriptionProfessional {
  name?: string | null;
  crn?: string | null;
  city?: string | null;
  signatureUrl?: string | null;
}

const DEFAULT_NAME = "Dr. Fillipe David";
const DEFAULT_ROLE = "Nutricionista Clínico e Esportivo";
const DEFAULT_CRN = "CRN-5";
const DEFAULT_CITY = "Alagoinhas / BA";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadImageDataUrl(src: string): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Falha ao carregar imagem: ${src}`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Falha ao ler imagem: ${src}`));
    reader.readAsDataURL(blob);
  });
}

export interface ResolvedProfessional {
  name: string;
  subtitle: string;
  /** Linha sob a assinatura (já escapada). */
  role: string;
  signatureSrc: string | null;
}

export function resolvePrescriptionProfessional(
  professional?: PrescriptionProfessional,
): ResolvedProfessional {
  if (professional == null) {
    return {
      name: DEFAULT_NAME,
      subtitle: `${DEFAULT_ROLE} &nbsp;·&nbsp; ${DEFAULT_CRN} &nbsp;·&nbsp; ${DEFAULT_CITY}`,
      role: `Nutricionista · ${DEFAULT_CRN}`,
      signatureSrc: "/assinatura.png",
    };
  }
  const name = professional.name?.trim() || "Nutricionista";
  const parts = ["Nutricionista", professional.crn?.trim(), professional.city?.trim()]
    .filter((p): p is string => Boolean(p))
    .map(escapeHtml);
  return {
    name,
    subtitle: parts.join(" &nbsp;·&nbsp; "),
    role: ["Nutricionista", professional.crn?.trim()]
      .filter((p): p is string => Boolean(p))
      .map(escapeHtml)
      .join(" · "),
    signatureSrc: professional.signatureUrl ?? null,
  };
}

export function buildPrescriptionHtml(
  blocks: PrescriptionPrintBlock[],
  patientName: string,
  professional: ResolvedProfessional,
  signatureDataUrl: string,
  today: string,
): string {
  const safePatient = escapeHtml(patientName);
  const safeProfessional = escapeHtml(professional.name);
  const blockRows = blocks
    .filter((b) => b.items.length > 0)
    .map((block) => `
      <div class="formula-block">
        <div class="formula-header">
          <span class="formula-label">${escapeHtml(block.label)}</span>
          <span class="formula-form">${escapeHtml(block.pharmaceuticalForm)}</span>
        </div>
        <div class="formula-items">
          ${block.items.map((item) => `
            <div class="item-row">
              <span class="item-name">${escapeHtml(item.name)}</span>
              <span class="item-dose">${item.dose} ${escapeHtml(item.unit)}</span>
            </div>
          `).join("")}
        </div>
        ${block.posology ? `<div class="posology"><strong>Posologia:</strong> ${escapeHtml(block.posology)}</div>` : ""}
      </div>
    `).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Receituário Magistral — ${safePatient}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #111; background: #fff; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 22mm 24mm; display: flex; flex-direction: column; }
  .header { border-bottom: 2px solid #2c6e4e; padding-bottom: 10px; margin-bottom: 16px; display: flex; align-items: flex-end; justify-content: space-between; }
  .clinic-name { font-size: 18pt; font-weight: bold; color: #2c6e4e; }
  .clinic-sub { font-size: 9pt; color: #555; margin-top: 2px; }
  .header-right { text-align: right; font-size: 8.5pt; color: #555; line-height: 1.5; }
  .doc-title { text-align: center; font-size: 13pt; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; color: #2c6e4e; border: 1px solid #c8e6d6; padding: 6px; border-radius: 4px; }
  .patient-box { display: flex; justify-content: space-between; border: 1px solid #ddd; border-radius: 4px; padding: 8px 12px; margin-bottom: 18px; background: #f9fafb; font-size: 10.5pt; }
  .patient-box .label { color: #666; font-size: 8.5pt; display: block; }
  .patient-box .value { font-weight: bold; color: #111; }
  .formulas { flex: 1; }
  .formula-block { margin-bottom: 18px; border: 1px solid #e0ede8; border-radius: 6px; overflow: hidden; }
  .formula-header { display: flex; align-items: center; justify-content: space-between; background: #eef7f2; padding: 6px 12px; border-bottom: 1px solid #c8e6d6; }
  .formula-label { font-size: 10pt; font-weight: bold; color: #2c6e4e; text-transform: uppercase; letter-spacing: 0.5px; }
  .formula-form { font-size: 8.5pt; color: #555; font-style: italic; }
  .formula-items { padding: 6px 12px; }
  .item-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #e5e7eb; font-size: 10.5pt; }
  .item-row:last-child { border-bottom: none; }
  .item-name { flex: 1; }
  .item-dose { font-weight: bold; color: #2c6e4e; white-space: nowrap; margin-left: 16px; }
  .posology { padding: 5px 12px 7px; background: #f5fbf7; font-size: 9.5pt; color: #444; border-top: 1px solid #e0ede8; }
  .footer { margin-top: auto; border-top: 1px solid #ddd; padding-top: 18px; display: flex; justify-content: center; align-items: flex-end; }
  .signature-block { width: 78mm; text-align: center; }
  .signature-image-wrap { display: flex; justify-content: center; align-items: flex-end; height: 24mm; margin-bottom: 2px; }
  .signature-image { max-width: 54mm; max-height: 22mm; object-fit: contain; display: block; }
  .signature-line { border-top: 1px solid #333; margin: 0 auto 5px; width: 100%; }
  .signature-name { font-size: 10pt; font-weight: bold; }
  .signature-sub { font-size: 8.5pt; color: #555; }
  @media print { body { padding: 0; } .page { padding: 14mm 18mm 18mm; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="clinic-name">${safeProfessional}</div>
      <div class="clinic-sub">${professional.subtitle}</div>
    </div>
    <div class="header-right">Emitido em: ${today}</div>
  </div>
  <div class="doc-title">Receituário Magistral</div>
  <div class="patient-box">
    <div><span class="label">Paciente</span><span class="value">${safePatient}</span></div>
    <div style="text-align:right"><span class="label">Data</span><span class="value">${today}</span></div>
  </div>
  <div class="formulas">${blockRows}</div>
  <div class="footer">
    <div class="signature-block">
      ${signatureDataUrl ? `<div class="signature-image-wrap"><img class="signature-image" src="${signatureDataUrl}" alt="Assinatura"></div>` : ""}
      <div class="signature-line"></div>
      <div class="signature-name">${safeProfessional}</div>
      <div class="signature-sub">${professional.role}</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

/**
 * Abre a janela de impressão do receituário. Retorna false se o popup foi bloqueado.
 */
export async function printPrescriptionDocument(
  blocks: PrescriptionPrintBlock[],
  patientName: string,
  professional?: PrescriptionProfessional,
): Promise<boolean> {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const resolved = resolvePrescriptionProfessional(professional);

  let signatureDataUrl = "";
  if (resolved.signatureSrc) {
    try {
      signatureDataUrl = await loadImageDataUrl(resolved.signatureSrc);
    } catch (error) {
      console.warn("[prescriptionPrint] Assinatura não carregou:", error);
    }
  }

  const html = buildPrescriptionHtml(blocks, patientName, resolved, signatureDataUrl, today);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
