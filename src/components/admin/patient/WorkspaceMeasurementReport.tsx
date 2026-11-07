import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckSquare, FileDown, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientMeasurementDetailView } from "@/components/admin/patient/PatientMeasurementDetailView";
import { SKINFOLD_LABELS, type SkinfoldKey } from "@/lib/anthropometryUtils";
import {
  ANTHROPOMETRY_COMPARISON_PRINT_MAX,
  calculateAnthropometryReportValues,
  getAnthropometryComparisonIds,
  getReportBmiLabel,
  getReportSkinfoldValue,
  selectAnthropometryComparisonMeasurements,
} from "@/lib/anthropometricComparison";
import type { WorkspaceMeasurement } from "@/lib/workspaceMeasurements";

interface WorkspaceMeasurementReportProps {
  measurementId: number;
  measurements: WorkspaceMeasurement[];
  workspaceId: string;
  patientId: number;
  patientName: string;
  workspaceName: string;
  gender: "M" | "F" | null;
  birthDate: string | null;
  onBack: () => void;
}

const skinfoldKeys: SkinfoldKey[] = [
  "sf_pectoral", "sf_midaxillary", "sf_triceps", "sf_biceps", "sf_subscapular",
  "sf_suprailiac", "sf_abdominal", "sf_thigh_sf", "sf_calf_sf",
];

function formatDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function SectionRow({ label, columns }: { label: string; columns: number }) {
  return <tr className="border-y bg-muted/40"><th colSpan={columns + 1} className="px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">{label}</th></tr>;
}

function MetricRow({
  label,
  values,
  unit = "",
  decimals = 1,
  suffixes,
}: {
  label: string;
  values: (number | null | undefined)[];
  unit?: string;
  decimals?: number;
  suffixes?: (string | null)[];
}) {
  if (values.every((value) => value == null)) return null;
  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{label}</th>
      {values.map((value, index) => {
        const previous = index ? values[index - 1] : null;
        const delta = value != null && previous != null ? value - previous : null;
        const showDelta = delta != null && Math.abs(delta) >= Math.pow(10, -decimals) / 2;
        return <td key={index} className="px-3 py-2 text-right tabular-nums">
          {value == null ? "—" : <>{value.toFixed(decimals)}{unit ? ` ${unit}` : ""}{suffixes?.[index] && <span className="ml-1 text-xs text-muted-foreground print:hidden">({suffixes[index]})</span>}{showDelta && <span className="ml-1 text-xs text-muted-foreground print:hidden">({delta! > 0 ? "+" : "−"}{Math.abs(delta!).toFixed(decimals)})</span>}</>}
        </td>;
      })}
    </tr>
  );
}

function StringRow({ label, values }: { label: string; values: (string | null)[] }) {
  if (values.every((value) => value == null)) return null;
  return <tr className="border-b last:border-0"><th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{label}</th>{values.map((value, index) => <td key={index} className="px-3 py-2 text-right">{value ?? "—"}</td>)}</tr>;
}

function BilateralRow({
  label,
  rightValues,
  leftValues,
}: {
  label: string;
  rightValues: (number | null | undefined)[];
  leftValues: (number | null | undefined)[];
}) {
  if ([...rightValues, ...leftValues].every((value) => value == null)) return null;
  return <tr className="border-b last:border-0"><th scope="row" className="px-3 py-2 text-left font-medium text-muted-foreground">{label}</th>{rightValues.map((right, index) => <td key={index} className="px-3 py-2 text-right tabular-nums">{right == null ? "—" : right.toFixed(1)} <span className="text-muted-foreground">·</span> {leftValues[index] == null ? "—" : leftValues[index]!.toFixed(1)} <span className="text-xs text-muted-foreground">D · E cm</span></td>)}</tr>;
}

export function WorkspaceMeasurementReport({
  measurementId,
  measurements,
  workspaceId,
  patientId,
  patientName,
  workspaceName,
  gender,
  birthDate,
  onBack,
}: WorkspaceMeasurementReportProps) {
  const scopedMeasurements = measurements.filter(
    (item) => item.workspace_id === workspaceId && item.patient_id === patientId,
  );
  const selected = scopedMeasurements.find((item) => item.id === measurementId);
  const [selectedIds, setSelectedIds] = useState(() => getAnthropometryComparisonIds(scopedMeasurements, "latest-two"));
  const columns = selectAnthropometryComparisonMeasurements(scopedMeasurements, selectedIds);
  const derived = columns.map((measurement) => calculateAnthropometryReportValues(measurement, gender, birthDate));
  const count = columns.length;
  const allSelected = selectedIds.length === scopedMeasurements.length && count === scopedMeasurements.length;

  if (!selected) {
    return <div className="space-y-4"><Button variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />Voltar ao histórico</Button><p role="status" className="text-sm text-muted-foreground">Esta avaliação não está disponível no histórico deste paciente.</p></div>;
  }

  const toggleId = (id: number) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const selectPreset = (preset: "latest-two" | "latest-three" | "latest-five" | "baseline-latest" | "all") => setSelectedIds(getAnthropometryComparisonIds(scopedMeasurements, preset));
  const selectedNotes = columns[columns.length - 1]?.notes;

  return (
    <div className="space-y-5 print:space-y-3" data-testid="workspace-measurement-report">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />Voltar ao histórico</Button>
        <Button variant="outline" onClick={() => window.print()}><FileDown aria-hidden="true" />Imprimir / salvar PDF</Button>
      </div>
      <header data-testid="workspace-measurement-print-header" className="hidden border-b-2 border-gray-800 pb-3 print:mb-3 print:block">
        <p className="text-xs font-semibold uppercase text-muted-foreground print:text-[8px]">Relatório antropométrico</p>
        <h1 className="mt-1 text-xl font-bold print:text-base">{patientName}</h1>
        <p className="mt-1 text-sm text-muted-foreground print:text-[9px]">{workspaceName}</p>
        <p className="mt-1 text-xs text-muted-foreground print:text-[8px]">{columns.map((item) => formatDate(item.assessment_date)).join(" · ")}</p>
      </header>
      <PatientMeasurementDetailView measurement={selected} onBack={onBack} workspacePrintMode />

      <section className="overflow-hidden rounded-md border bg-card print:hidden" aria-label="Selecionar avaliações para comparação">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm font-semibold"><CalendarDays aria-hidden="true" size={16} />Avaliações exibidas <span className="text-muted-foreground">{count} de {scopedMeasurements.length}</span>{selectedIds.length > ANTHROPOMETRY_COMPARISON_PRINT_MAX && <span className="text-xs text-amber-700">Impressão recomendada até {ANTHROPOMETRY_COMPARISON_PRINT_MAX} colunas</span>}</div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => selectPreset("latest-two")}>Últimas 2</Button>
            <Button size="sm" variant="outline" onClick={() => selectPreset("latest-three")}>Últimas 3</Button>
            <Button size="sm" variant="outline" onClick={() => selectPreset("latest-five")}>Últimas {ANTHROPOMETRY_COMPARISON_PRINT_MAX}</Button>
            <Button size="sm" variant="outline" onClick={() => selectPreset("baseline-latest")}>Inicial + atual</Button>
            <Button size="sm" variant="outline" onClick={() => selectPreset("all")}>Todas</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Limpar seleção</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {scopedMeasurements.map((item) => <button key={item.id} type="button" aria-pressed={selectedIds.includes(item.id)} onClick={() => toggleId(item.id)} className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${selectedIds.includes(item.id) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {selectedIds.includes(item.id) ? <CheckSquare size={13} aria-hidden="true" /> : <Square size={13} aria-hidden="true" />}{formatDate(item.assessment_date)}
            </button>)}
          </div>
        </div>
      </section>

      {columns.length === 0 ? <p role="status" className="rounded-md border p-6 text-center text-sm text-muted-foreground print:hidden">Selecione ao menos uma avaliação para exibir o comparativo.</p> : (
        <div className="space-y-4">
          <h2 className="font-semibold">Comparação histórica das avaliações selecionadas</h2>
          <header className="hidden border-b pb-3 print:block"><h2 className="font-bold">Comparativo antropométrico</h2><p className="text-xs">{columns.map((item) => formatDate(item.assessment_date)).join(" · ")}</p></header>
          <div className="overflow-x-auto rounded-md border print:break-inside-avoid">
            <table className="w-full min-w-[650px] text-sm">
              <thead><tr className="border-b bg-muted"><th className="px-3 py-3 text-left">Métrica</th>{columns.map((item) => <th key={item.id} className="min-w-28 px-3 py-3 text-right">{formatDate(item.assessment_date)}</th>)}</tr></thead>
              <tbody>
                <SectionRow label="Medidas gerais" columns={count} />
                <MetricRow label="Peso" values={columns.map((m) => m.weight)} unit="kg" />
                <MetricRow label="Altura" values={columns.map((m) => m.height)} unit="cm" decimals={0} />
                <MetricRow label="IMC" values={derived.map((d) => d.bmi)} unit="kg/m²" suffixes={derived.map((d) => d.bmi == null ? null : getReportBmiLabel(d.bmi))} />
                <SectionRow label="Composição corporal" columns={count} />
                <MetricRow label="Gordura corporal" values={columns.map((m) => m.body_fat)} unit="%" suffixes={derived.map((d) => d.bodyFatClassification?.label ?? null)} />
                <MetricRow label="Massa gorda" values={derived.map((d) => d.fatMass)} unit="kg" />
                <MetricRow label="Massa magra" values={columns.map((m) => m.lean_mass)} unit="kg" />
                <MetricRow label="Gordura visceral" values={columns.map((m) => m.visceral_fat)} decimals={0} />
                {derived.some((d) => d.fourComponent) && <>
                  <SectionRow label="Fracionamento antropométrico — quatro componentes (estimativa)" columns={count} />
                  <MetricRow label="Massa gorda estimada" values={derived.map((d) => d.fourComponent?.fatMassKg)} unit="kg" />
                  <MetricRow label="Massa gorda estimada (% peso)" values={derived.map((d) => d.fourComponent?.fatMassPct)} unit="%" />
                  <MetricRow label="Massa óssea estimada" values={derived.map((d) => d.fourComponent?.boneMassKg)} unit="kg" />
                  <MetricRow label="Massa óssea estimada (% peso)" values={derived.map((d) => d.fourComponent?.boneMassPct)} unit="%" />
                  <MetricRow label="Massa residual estimada" values={derived.map((d) => d.fourComponent?.residualMassKg)} unit="kg" />
                  <MetricRow label="Massa residual estimada (% peso)" values={derived.map((d) => d.fourComponent?.residualMassPct)} unit="%" />
                  <MetricRow label="Massa muscular estimada" values={derived.map((d) => d.fourComponent?.estimatedMuscleMassKg)} unit="kg" />
                  <MetricRow label="Massa muscular estimada (% peso)" values={derived.map((d) => d.fourComponent?.estimatedMuscleMassPct)} unit="%" />
                  <StringRow label="Referência do protocolo" values={columns.map((m) => m.four_component_reference ?? null)} />
                  <StringRow label="Diâmetros aferidos" values={columns.map((m) => m.biestyloid_diameter_mm != null && m.biepicondylar_femur_diameter_mm != null ? `Biestiloide ${m.biestyloid_diameter_mm} mm · Fêmur ${m.biepicondylar_femur_diameter_mm} mm` : null)} />
                </>}
                {derived.some((d) => d.arm) && <>
                  <SectionRow label="Índices do braço — AMB / AGB" columns={count} />
                  <MetricRow label="Circunferência muscular do braço (CMB)" values={derived.map((d) => d.arm?.cmb)} unit="cm" />
                  <MetricRow label="Área do braço (AB)" values={derived.map((d) => d.arm?.ab)} unit="cm²" />
                  <MetricRow label="Área muscular do braço (AMB)" values={derived.map((d) => d.arm?.amb)} unit="cm²" />
                  <MetricRow label="AMB corrigida — Heymsfield (AMBc)" values={derived.map((d) => d.arm?.ambc)} unit="cm²" />
                  <MetricRow label="Área gordurosa do braço (AGB)" values={derived.map((d) => d.arm?.agb)} unit="cm²" />
                  <StringRow label="Adequação AMBc (Frisancho, 1990)" values={derived.map((d) => d.ambcAdequacy ? `${d.ambcAdequacy.pct}% — ${d.ambcAdequacy.label}` : null)} />
                </>}
                <SectionRow label="Circunferências — tronco" columns={count} />
                <MetricRow label="Pescoço" values={columns.map((m) => m.neck)} unit="cm" />
                <MetricRow label="Ombro" values={columns.map((m) => m.shoulder)} unit="cm" />
                <MetricRow label="Peitoral" values={columns.map((m) => m.chest)} unit="cm" />
                <MetricRow label="Cintura" values={columns.map((m) => m.waist)} unit="cm" />
                <MetricRow label="Abdômen" values={columns.map((m) => m.abdomen)} unit="cm" />
                <MetricRow label="Quadril" values={columns.map((m) => m.hip)} unit="cm" />
                <SectionRow label="Circunferências — membros superiores (D · E)" columns={count} />
                <BilateralRow label="Braço relaxado" rightValues={columns.map((m) => m.arm_relax_r)} leftValues={columns.map((m) => m.arm_relax_l)} />
                <BilateralRow label="Braço contraído" rightValues={columns.map((m) => m.arm_contract_r)} leftValues={columns.map((m) => m.arm_contract_l)} />
                <BilateralRow label="Antebraço" rightValues={columns.map((m) => m.forearm_r)} leftValues={columns.map((m) => m.forearm_l)} />
                <BilateralRow label="Punho" rightValues={columns.map((m) => m.wrist_r)} leftValues={columns.map((m) => m.wrist_l)} />
                <SectionRow label="Circunferências — membros inferiores (D · E)" columns={count} />
                <BilateralRow label="Coxa proximal" rightValues={columns.map((m) => m.thigh_prox_r)} leftValues={columns.map((m) => m.thigh_prox_l)} />
                <BilateralRow label="Coxa medial" rightValues={columns.map((m) => m.thigh_r)} leftValues={columns.map((m) => m.thigh_l)} />
                <BilateralRow label="Panturrilha" rightValues={columns.map((m) => m.calf_r)} leftValues={columns.map((m) => m.calf_l)} />
                {columns.some((m) => skinfoldKeys.some((key) => getReportSkinfoldValue(m, key) != null)) && <>
                  <SectionRow label="Dobras cutâneas" columns={count} />
                  {skinfoldKeys.map((key) => <MetricRow key={key} label={SKINFOLD_LABELS[key]} values={columns.map((m) => getReportSkinfoldValue(m, key))} unit="mm" />)}
                  <MetricRow label="Σ dobras do protocolo" values={derived.map((d) => d.skinfoldSum)} unit="mm" />
                  <MetricRow label="Densidade corporal" values={columns.map((m) => m.body_density)} unit="g/mL" decimals={4} />
                  <StringRow label="Protocolo" values={columns.map((m) => m.sf_protocol ?? null)} />
                </>}
              </tbody>
            </table>
          </div>
          {derived.some((d) => d.fourComponent) && <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground print:text-[8px]">Fracionamento antropométrico estimado; não representa diagnóstico, bioimpedância ou densitometria.</p>}
          {selectedNotes && <section className="rounded-md border p-4 print:break-inside-avoid"><h3 className="text-xs font-semibold uppercase text-muted-foreground">Observações · {formatDate(columns[columns.length - 1]?.assessment_date ?? selected.assessment_date)}</h3><p className="mt-2 text-sm">{selectedNotes}</p></section>}
        </div>
      )}
      <p className="hidden print:block text-right text-xs text-muted-foreground">{allSelected ? "Todas as avaliações" : `${columns.length} avaliação(ões) selecionada(s)`}</p>
    </div>
  );
}
