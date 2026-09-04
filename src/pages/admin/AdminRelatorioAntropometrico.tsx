import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Activity, FileDown, CalendarDays, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchPatient,
  fetchMeasurements,
  type Patient,
  type Measurement,
} from "@/lib/supabase";
import {
  PROTOCOLS,
  SKINFOLD_LABELS,
  classifyBodyFat,
  calcArmAnthropometry,
  classifyAmbc,
  type SkinfoldKey,
} from "@/lib/anthropometryUtils";
import { calculateFourComponentAnthropometry } from "@/lib/fourComponentAnthropometry";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcBMI = (m: Measurement): number | null => {
  if (!m.weight || !m.height) return null;
  return parseFloat((m.weight / Math.pow(m.height / 100, 2)).toFixed(1));
};

const calcAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const mo = today.getMonth() - birth.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const calcAgeAt = (birthDate: string, assessmentDate: string): number => {
  const birth = new Date(`${birthDate}T12:00:00`);
  const assessment = new Date(`${assessmentDate}T12:00:00`);
  let age = assessment.getFullYear() - birth.getFullYear();
  const monthDelta = assessment.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && assessment.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatDate = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatDateShort = (dateStr?: string) =>
  dateStr
    ? new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "—";

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const bmiLabel = (bmi: number) => {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25)   return "Normal";
  if (bmi < 30)   return "Sobrepeso";
  return "Obesidade";
};

// ─── renderDelta ──────────────────────────────────────────────────────────────

const deltaThreshold = (decimals: number) => Math.pow(10, -decimals) / 2;

function renderDelta(
  current?: number | null,
  previous?: number | null,
  decimals = 1
): React.ReactNode {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < deltaThreshold(decimals)) return null;
  const abs = Math.abs(diff).toFixed(decimals);
  const sign = diff > 0 ? "+" : "−";

  return (
    <span
      className="ml-1.5 text-[11px] font-bold text-slate-600 tabular-nums print:text-[8px] print:text-gray-700"
      title="Variação em relação à avaliação anterior. A leitura clínica depende do objetivo do paciente."
    >
      ({sign}
      {abs})
    </span>
  );
}

const formatDeltaText = (
  current?: number | null,
  previous?: number | null,
  decimals = 1
) => {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < deltaThreshold(decimals)) return null;
  const sign = diff > 0 ? "+" : "−";
  return `${sign}${Math.abs(diff).toFixed(decimals)}`;
};

// ─── Table sub-components ─────────────────────────────────────────────────────

function SectionRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr className="border-y border-border/60 bg-muted/40">
      <td
        colSpan={colSpan}
        className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 print:px-3 print:py-1 print:text-[7px]"
      >
        {label}
      </td>
    </tr>
  );
}

interface MetricRowProps {
  label: string;
  values: (number | null | undefined)[];
  unit?: string;
  decimals?: number;
  showDelta?: boolean;
  suffix?: (val: number, idx: number) => React.ReactNode;
}

function MetricRow({ label, values, unit = "", decimals = 1, showDelta = true, suffix }: MetricRowProps) {
  if (values.every((v) => v == null)) return null;
  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors print:hover:bg-transparent">
      <td className="px-4 py-2.5 text-sm text-muted-foreground print:text-[9px] print:py-1.5 print:px-3">
        {label}
      </td>
      {values.map((val, i) => {
        const prev = i > 0 ? values[i - 1] : undefined;
        return (
          <td
            key={i}
            className="px-4 py-2.5 text-sm text-right tabular-nums print:text-[9px] print:py-1.5 print:px-3"
          >
            {val != null ? (
              <>
                <span className="font-semibold text-foreground">{val.toFixed(decimals)}</span>
                {unit && (
                  <span className="text-xs text-muted-foreground ml-0.5 print:text-[8px]">
                    {" "}{unit}
                  </span>
                )}
                {showDelta && i > 0 && renderDelta(val, prev as number, decimals)}
                {suffix?.(val, i)}
              </>
            ) : (
              <span className="text-muted-foreground/30">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function MetricPairRow({
  label,
  massValues,
  percentageValues,
}: {
  label: string;
  massValues: (number | null | undefined)[];
  percentageValues: (number | null | undefined)[];
}) {
  if ([...massValues, ...percentageValues].every((value) => value == null)) return null;

  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors print:hover:bg-transparent">
      <td className="px-4 py-2.5 text-sm text-muted-foreground print:text-[9px] print:py-1.5 print:px-3">
        {label}
      </td>
      {massValues.map((mass, index) => {
        const percentage = percentageValues[index];
        const previousMass = index > 0 ? massValues[index - 1] : undefined;
        const previousPercentage = index > 0 ? percentageValues[index - 1] : undefined;
        return (
          <td
            key={index}
            className="px-4 py-2.5 text-right tabular-nums print:text-[9px] print:py-1.5 print:px-3"
          >
            <div>
              {mass != null ? (
                <>
                  <span className="font-semibold text-foreground">{mass.toFixed(1)} kg</span>
                  {renderDelta(mass, previousMass, 1)}
                </>
              ) : (
                <span className="text-muted-foreground/30">—</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground print:text-[8px]">
              {percentage != null ? (
                <>
                  {percentage.toFixed(1)}% do peso
                  {renderDelta(percentage, previousPercentage, 1)}
                </>
              ) : (
                <span className="text-muted-foreground/30">—</span>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

function BilateralRow({
  label,
  rights,
  lefts,
  unit = "cm",
}: {
  label: string;
  rights: (number | null | undefined)[];
  lefts: (number | null | undefined)[];
  unit?: string;
}) {
  if ([...rights, ...lefts].every((v) => v == null)) return null;
  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors print:hover:bg-transparent">
      <td className="px-4 py-2.5 text-sm text-muted-foreground print:text-[9px] print:py-1.5 print:px-3">
        {label}
      </td>
      {rights.map((r, i) => {
        const l = lefts[i];
        const prevR = i > 0 ? rights[i - 1] : undefined;
        const prevL = i > 0 ? lefts[i - 1] : undefined;
        const deltaR = i > 0 ? formatDeltaText(r, prevR, 1) : null;
        const deltaL = i > 0 ? formatDeltaText(l, prevL, 1) : null;
        return (
          <td
            key={i}
            className="px-4 py-2.5 text-sm text-right tabular-nums print:text-[9px] print:py-1.5 print:px-3"
          >
            {r != null || l != null ? (
              <>
                <span className="font-semibold text-foreground">
                  {r != null ? r.toFixed(1) : "—"}
                </span>
                <span className="text-muted-foreground/40 mx-1 text-xs">·</span>
                <span className="font-semibold text-foreground">
                  {l != null ? l.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-muted-foreground ml-0.5 print:text-[8px]"> {unit}</span>
                {(deltaR || deltaL) && (
                  <span className="mt-1 block text-[10px] font-semibold text-muted-foreground/80 print:text-[7px]">
                    Δ D {deltaR ?? "—"} · E {deltaL ?? "—"}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground/30">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function StringRow({ label, values }: { label: string; values: (string | null)[] }) {
  if (values.every((v) => v == null)) return null;
  return (
    <tr className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors print:hover:bg-transparent">
      <td className="px-4 py-2.5 text-sm text-muted-foreground print:text-[9px] print:py-1.5 print:px-3">
        {label}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className="px-4 py-2.5 text-sm text-right print:text-[9px] print:py-1.5 print:px-3"
        >
          {v != null ? (
            <span className="font-medium text-foreground">{v}</span>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )}
        </td>
      ))}
    </tr>
  );
}

interface SummaryItem {
  label: string;
  current?: number | null;
  previous?: number | null;
  unit?: string;
  decimals?: number;
  helper?: string;
}

function EvolutionSummary({
  items,
  startDate,
  endDate,
}: {
  items: SummaryItem[];
  startDate?: string;
  endDate?: string;
}) {
  const visibleItems = items.filter((item) => item.current != null || item.previous != null);
  if (visibleItems.length === 0) return null;

  return (
    <section className="rounded border border-border bg-card p-5 print:p-3">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 print:mb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary print:text-[7px]">
            Resumo evolutivo
          </p>
          <h2 className="mt-1 text-base font-bold text-foreground print:text-[11px]">
            Comparativo clínico das avaliações selecionadas
          </h2>
        </div>
        <p className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground print:text-[8px]">
          {formatDateShort(startDate)} → {formatDateShort(endDate)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 print:grid-cols-3 print:gap-2">
        {visibleItems.map((item) => {
          const decimals = item.decimals ?? 1;
          const delta = formatDeltaText(item.current, item.previous, decimals);
          return (
            <article
              key={item.label}
              className="rounded-lg border border-border/70 bg-background px-4 py-3 print:px-2 print:py-1.5"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 print:text-[7px]">
                {item.label}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5 print:mt-1">
                {item.current != null ? (
                  <>
                    <span className="text-xl font-black tabular-nums text-foreground print:text-[12px]">
                      {item.current.toFixed(decimals)}
                    </span>
                    {item.unit && (
                      <span className="text-xs font-semibold text-muted-foreground print:text-[7px]">
                        {item.unit}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xl font-black text-muted-foreground/30 print:text-[12px]">
                    —
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground print:mt-1 print:text-[7px]">
                {delta ? (
                  <span className="font-bold text-slate-600">Δ {delta}</span>
                ) : (
                  <span>sem variação exibida</span>
                )}
                {item.helper && (
                  <span className="block text-muted-foreground/70">{item.helper}</span>
                )}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DeltaGuide({ colsCount }: { colsCount: number }) {
  if (colsCount <= 1) return null;

  return (
    <div className="rounded border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground print:px-3 print:py-2 print:text-[8px]">
      <span className="font-semibold text-foreground">Como ler as variações:</span>{" "}
      valores entre parênteses comparam cada coluna com a avaliação anterior. O delta é neutro:
      aumento ou redução não significa melhora automática. Em medidas bilaterais, D e E são
      calculados separadamente.
    </div>
  );
}

// ─── Date Selector ────────────────────────────────────────────────────────────

const PRINT_MAX = 5;

function DateSelector({
  measurements,
  selectedIds,
  onToggle,
  onSelectLatestTwo,
  onSelectLatestThree,
  onSelectLatestFive,
  onSelectBaselineAndLatest,
  onSelectAll,
  onClear,
}: {
  measurements: Measurement[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSelectLatestTwo: () => void;
  onSelectLatestThree: () => void;
  onSelectLatestFive: () => void;
  onSelectBaselineAndLatest: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="print:hidden rounded border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-muted-foreground" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Avaliações exibidas
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
            {selectedIds.length} de {measurements.length}
          </span>
          {selectedIds.length > PRINT_MAX && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
              PDF recomendado até {PRINT_MAX} colunas
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSelectLatestTwo}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Últimas 2
            </button>
            <button
              type="button"
              onClick={onSelectLatestThree}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Últimas 3
            </button>
            <button
              type="button"
              onClick={onSelectLatestFive}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Últimas {PRINT_MAX}
            </button>
            <button
              type="button"
              onClick={onSelectBaselineAndLatest}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Inicial + atual
            </button>
            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              Todas
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {/* newest first for the UI list */}
            {measurements.map((m) => {
              const mid = m.id!;
              const checked = selectedIds.includes(mid);
              return (
                <button
                  key={mid}
                  type="button"
                  onClick={() => onToggle(mid)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all",
                    checked
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {checked ? <CheckSquare size={12} /> : <Square size={12} />}
                  {formatDateShort(m.assessment_date)}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_SF_KEYS: SkinfoldKey[] = [
  "sf_pectoral", "sf_midaxillary", "sf_triceps", "sf_biceps",
  "sf_subscapular", "sf_suprailiac", "sf_abdominal", "sf_thigh_sf", "sf_calf_sf",
];

const getSkinfoldValue = (measurement: Measurement, key: SkinfoldKey): number | null =>
  measurement[key] ?? null;

const getFourComponentEstimate = (measurement: Measurement) => {
  if (
    measurement.weight == null ||
    measurement.height == null ||
    measurement.body_fat == null ||
    measurement.biestyloid_diameter_mm == null ||
    measurement.biepicondylar_femur_diameter_mm == null ||
    !measurement.four_component_reference
  ) return null;

  return calculateFourComponentAnthropometry({
    weightKg: measurement.weight,
    heightCm: measurement.height,
    bodyFatPct: measurement.body_fat,
    biestyloidDiameterMm: measurement.biestyloid_diameter_mm,
    biepicondylarFemurDiameterMm: measurement.biepicondylar_femur_diameter_mm,
    reference: measurement.four_component_reference,
  }).result;
};

export default function AdminRelatorioAntropometrico() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading]           = useState(true);
  const [patient, setPatient]           = useState<Patient | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedIds, setSelectedIds]   = useState<number[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchPatient(Number(id)), fetchMeasurements(Number(id))])
      .then(([p, ms]) => {
        setPatient(p);
        setMeasurements(ms);
        const requestedMeasurementId = Number(searchParams.get("measurement"));
        const requestedMeasurement = ms.find((m) => m.id === requestedMeasurementId);
        const defaults = requestedMeasurement
          ? [requestedMeasurement.id!]
          : ms.slice(0, 2).map((m) => m.id!).filter(Boolean);
        setSelectedIds(defaults);
      })
      .catch(() => toast.error("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  // ── Selection handlers ──────────────────────────────────────────────────────
  const toggleId = (mid: number) =>
    setSelectedIds((prev) => {
      if (prev.includes(mid)) return prev.filter((x) => x !== mid);
      return [...prev, mid];
    });

  const selectAll = () => {
    setSelectedIds(measurements.map((m) => m.id!).filter(Boolean));
  };

  const selectLatestTwo = () =>
    setSelectedIds(measurements.slice(0, 2).map((m) => m.id!).filter(Boolean));

  const selectLatestThree = () =>
    setSelectedIds(measurements.slice(0, 3).map((m) => m.id!).filter(Boolean));

  const selectLatestFive = () =>
    setSelectedIds(measurements.slice(0, PRINT_MAX).map((m) => m.id!).filter(Boolean));

  const selectBaselineAndLatest = () => {
    const latest = measurements[0]?.id;
    const baseline = measurements[measurements.length - 1]?.id;
    setSelectedIds(
      latest != null && baseline != null
        ? Array.from(new Set([latest, baseline]))
        : measurements.slice(0, 1).map((m) => m.id!).filter(Boolean),
    );
  };

  const clearAll = () => setSelectedIds([]);

  // ── Derive columns: filter + sort oldest → newest ──────────────────────────
  const cols = useMemo(() => {
    return measurements
      .filter((m) => m.id != null && selectedIds.includes(m.id))
      .sort((a, b) =>
        (a.assessment_date ?? "").localeCompare(b.assessment_date ?? "")
      );
  }, [measurements, selectedIds]);

  // ── Early returns ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Carregando relatório...</p>
      </div>
    );
  }

  if (!patient || measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center p-6">
        <Activity className="w-10 h-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {!patient ? "Paciente não encontrado" : "Nenhuma avaliação registrada"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {!patient
              ? "Verifique se o ID está correto."
              : "Registre uma avaliação antropométrica primeiro."}
          </p>
        </div>
        <Link to={`/admin/pacientes/${id}?tab=antropometria`}>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border text-sm font-medium hover:bg-muted transition-colors">
            <ArrowLeft size={14} /> Voltar ao prontuário
          </button>
        </Link>
      </div>
    );
  }

  const gender: "M" | "F" | null =
    patient.gender === "F" || patient.gender === "M" ? patient.gender : null;
  const age = patient.birth_date ? calcAge(patient.birth_date) : 30;
  const N = cols.length;
  const colSpan = N + 1;

  // ── Pre-compute derived values per selected column ──────────────────────────
  const derived = cols.map((m) => ({
    bmi: calcBMI(m),
    fatMass:
      m.weight != null && m.body_fat != null
        ? parseFloat((m.weight * (m.body_fat / 100)).toFixed(1))
        : null,
    arm:
      gender && m.arm_relax_r != null && m.sf_triceps != null
        ? calcArmAnthropometry(m.arm_relax_r, m.sf_triceps, gender)
        : null,
    fourComponent: getFourComponentEstimate(m),
  }));

  const sfSums = cols.map((m) => {
    if (!m.sf_protocol) return null;
    const info = PROTOCOLS.find((p) => p.id === m.sf_protocol);
    if (!info) return null;
    if (info.skinfolds.some((k) => getSkinfoldValue(m, k) == null)) return null;
    const sum = info.skinfolds.reduce((acc, k) => acc + (getSkinfoldValue(m, k) ?? 0), 0);
    return sum > 0 ? sum : null;
  });

  const hasArmData = derived.some((d) => d.arm != null);
  const hasTronco  = cols.some((m) => [m.neck, m.shoulder, m.chest, m.waist, m.abdomen, m.hip].some((v) => v != null));
  const hasSup     = cols.some((m) => [m.arm_relax_r, m.arm_relax_l, m.arm_contract_r, m.arm_contract_l, m.forearm_r, m.forearm_l, m.wrist_r, m.wrist_l].some((v) => v != null));
  const hasInf     = cols.some((m) => [m.thigh_prox_r, m.thigh_prox_l, m.thigh_r, m.thigh_l, m.calf_r, m.calf_l].some((v) => v != null));
  const hasDobras  = cols.some((m) => ALL_SF_KEYS.some((k) => getSkinfoldValue(m, k) != null));
  const hasFourComponent = derived.some((d) => d.fourComponent != null);

  const mostRecent = cols[cols.length - 1];
  const oldest = cols[0];
  const summaryItems: SummaryItem[] = [
    {
      label: "Peso",
      current: mostRecent?.weight ?? null,
      previous: oldest?.weight ?? null,
      unit: "kg",
      decimals: 1,
    },
    {
      label: "Gordura",
      current: mostRecent?.body_fat ?? null,
      previous: oldest?.body_fat ?? null,
      unit: "%",
      decimals: 1,
    },
    {
      label: "Massa magra",
      current: mostRecent?.lean_mass ?? null,
      previous: oldest?.lean_mass ?? null,
      unit: "kg",
      decimals: 1,
    },
    {
      label: "Muscular estimada",
      current: derived[derived.length - 1]?.fourComponent?.estimatedMuscleMassKg ?? null,
      previous: derived[0]?.fourComponent?.estimatedMuscleMassKg ?? null,
      unit: "kg",
      decimals: 1,
      helper: "estimativa antropométrica",
    },
    {
      label: "Cintura",
      current: mostRecent?.waist ?? null,
      previous: oldest?.waist ?? null,
      unit: "cm",
      decimals: 1,
    },
    {
      label: "IMC",
      current: derived[derived.length - 1]?.bmi ?? null,
      previous: derived[0]?.bmi ?? null,
      unit: "kg/m²",
      decimals: 1,
    },
    {
      label: "Visceral",
      current: mostRecent?.visceral_fat ?? null,
      previous: oldest?.visceral_fat ?? null,
      decimals: 0,
      helper: "escala do aparelho",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 space-y-5 print:min-h-0 print:p-0 print:space-y-3">

      {/* ── Print-only header ─────────────────────────────────────────────── */}
      <div className="hidden print:block pb-3 mb-3 border-b-2 border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
              Relatório Clínico — Comparativo
            </p>
            <h1 className="text-sm font-bold text-gray-900">Avaliação Antropométrica</h1>
            <p className="text-[9px] text-gray-600 mt-0.5">{patient.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-800">Dr. Fillipe David</p>
            <p className="text-[8px] text-gray-500">Nutricionista Clínico e Esportivo</p>
            <p className="text-[8px] text-gray-400 mt-0.5">
              Emitido em{" "}
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Screen header ─────────────────────────────────────────────────── */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/pacientes/${id}?tab=antropometria`}
            className="w-8 h-8 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Relatório Antropométrico</h1>
            <p className="text-sm text-muted-foreground">{patient.name}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 active:scale-[0.98] transition-all"
        >
          <FileDown size={15} />
          Exportar PDF
        </button>
      </div>

      {/* ── Patient card ──────────────────────────────────────────────────── */}
      <div className="rounded border border-border bg-card px-5 py-4 flex items-center gap-4 print:px-3 print:py-2 print:gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0 print:w-7 print:h-7 print:text-[10px]">
          {initials(patient.name || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground print:text-sm">{patient.name}</p>
          <div className="flex gap-4 mt-0.5 flex-wrap">
            {patient.birth_date && (
              <span className="text-sm text-muted-foreground print:text-[9px]">
                {age} anos
              </span>
            )}
            {patient.gender && (
              <span className="text-sm text-muted-foreground print:text-[9px]">
                {patient.gender === "F" ? "Feminino" : "Masculino"}
              </span>
            )}
          </div>
        </div>
        {/* Print: show which dates are being compared */}
        <p className="hidden print:block text-[8px] text-gray-500 text-right shrink-0 max-w-[160px]">
          {cols.map((m) => formatDateShort(m.assessment_date)).join(" · ")}
        </p>
        {/* Screen: total count */}
        <p className="text-xs text-muted-foreground shrink-0 print:hidden">
          {measurements.length} avaliação{measurements.length !== 1 ? "ões" : ""}
        </p>
      </div>

      {/* ── Date selector ─────────────────────────────────────────────────── */}
      <DateSelector
        measurements={measurements}
        selectedIds={selectedIds}
        onToggle={toggleId}
        onSelectLatestTwo={selectLatestTwo}
        onSelectLatestThree={selectLatestThree}
        onSelectLatestFive={selectLatestFive}
        onSelectBaselineAndLatest={selectBaselineAndLatest}
        onSelectAll={selectAll}
        onClear={clearAll}
      />

      {cols.length > 0 && (
        <>
          <EvolutionSummary
            items={summaryItems}
            startDate={oldest?.assessment_date}
            endDate={mostRecent?.assessment_date}
          />
          <DeltaGuide colsCount={cols.length} />
        </>
      )}

      {/* ── Empty state when nothing is selected ──────────────────────────── */}
      {cols.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-2 border border-border rounded bg-card text-muted-foreground print:hidden">
          <CalendarDays size={28} className="opacity-30" />
          <p className="text-sm">Selecione ao menos uma avaliação para exibir o relatório.</p>
        </div>
      )}

      {/* ── Comparison table ──────────────────────────────────────────────── */}
      {cols.length > 0 && (
        <div className="rounded border border-border overflow-hidden print:break-inside-avoid">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">

              {/* Table header */}
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-muted-foreground w-52 print:text-[8px] print:py-2 print:px-3 print:w-40">
                    Métrica
                  </th>
                  {cols.map((m, i) => (
                    <th
                      key={m.id ?? i}
                      className={cn(
                        "px-4 py-3 text-right text-xs font-black uppercase tracking-widest min-w-[148px] print:text-[8px] print:py-2 print:px-3 print:min-w-0",
                        i === cols.length - 1
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      <div>{formatDate(m.assessment_date)}</div>
                      {cols.length > 1 && (
                        <div className="text-[9px] font-medium normal-case mt-0.5 opacity-60 print:hidden">
                          {i === 0
                            ? "Mais antiga"
                            : i === cols.length - 1
                            ? "Mais recente"
                            : `Avaliação ${i + 1}`}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* ── Medidas Gerais ──────────────────────────────────── */}
                <SectionRow label="Medidas Gerais" colSpan={colSpan} />

                <MetricRow
                  label="Peso"
                  values={cols.map((m) => m.weight ?? null)}
                  unit="kg"
                />
                <MetricRow
                  label="Altura"
                  values={cols.map((m) => m.height ?? null)}
                  unit="cm"
                  decimals={0}
                  showDelta={false}
                />
                <MetricRow
                  label="IMC"
                  values={derived.map((d) => d.bmi)}
                  unit="kg/m²"
                  suffix={(val) => (
                    <span className="ml-1.5 text-[10px] text-muted-foreground print:hidden">
                      ({bmiLabel(val)})
                    </span>
                  )}
                />

                {/* ── Composição Corporal ─────────────────────────────── */}
                <SectionRow label="Composição Corporal" colSpan={colSpan} />

                <MetricRow
                  label="Gordura Corporal"
                  values={cols.map((m) => m.body_fat ?? null)}
                  unit="%"
                  suffix={(val) => {
                    if (!gender) return null;
                    const cl = classifyBodyFat(val, gender);
                    return (
                      <span className={cn("ml-1.5 text-[10px] font-semibold print:hidden", cl.color)}>
                        ({cl.label})
                      </span>
                    );
                  }}
                />
                <MetricRow
                  label="Massa Gorda"
                  values={derived.map((d) => d.fatMass)}
                  unit="kg"
                />
                <MetricRow
                  label="Massa Magra"
                  values={cols.map((m) => m.lean_mass ?? null)}
                  unit="kg"
                />
                <MetricRow
                  label="Gordura Visceral"
                  values={cols.map((m) => m.visceral_fat ?? null)}
                  decimals={0}
                />

                {hasFourComponent && (
                  <>
                    <SectionRow label="Fracionamento Antropométrico — 4 Componentes (estimativa)" colSpan={colSpan} />
                    <MetricPairRow
                      label="Massa gorda estimada"
                      massValues={derived.map((d) => d.fourComponent?.fatMassKg ?? null)}
                      percentageValues={derived.map((d) => d.fourComponent?.fatMassPct ?? null)}
                    />
                    <MetricPairRow
                      label="Massa óssea estimada"
                      massValues={derived.map((d) => d.fourComponent?.boneMassKg ?? null)}
                      percentageValues={derived.map((d) => d.fourComponent?.boneMassPct ?? null)}
                    />
                    <MetricPairRow
                      label="Massa residual estimada"
                      massValues={derived.map((d) => d.fourComponent?.residualMassKg ?? null)}
                      percentageValues={derived.map((d) => d.fourComponent?.residualMassPct ?? null)}
                    />
                    <MetricPairRow
                      label="Massa muscular estimada"
                      massValues={derived.map((d) => d.fourComponent?.estimatedMuscleMassKg ?? null)}
                      percentageValues={derived.map((d) => d.fourComponent?.estimatedMuscleMassPct ?? null)}
                    />
                    <StringRow label="Referência do protocolo" values={cols.map((m) => m.four_component_reference ?? null)} />
                    <StringRow
                      label="Diâmetros aferidos"
                      values={cols.map((m) =>
                        m.biestyloid_diameter_mm != null && m.biepicondylar_femur_diameter_mm != null
                          ? `Biestiloide ${m.biestyloid_diameter_mm} mm · Fêmur ${m.biepicondylar_femur_diameter_mm} mm`
                          : null,
                      )}
                    />
                  </>
                )}

                {/* ── Índices do Braço (AMB / AGB) ─────────────────────── */}
                {hasArmData && (
                  <>
                    <SectionRow label="Índices do Braço — AMB / AGB" colSpan={colSpan} />
                    <MetricRow
                      label="Circ. Muscular do Braço (CMB)"
                      values={derived.map((d) => d.arm?.cmb ?? null)}
                      unit="cm"
                    />
                    <MetricRow
                      label="Área do Braço (AB)"
                      values={derived.map((d) => d.arm?.ab ?? null)}
                      unit="cm²"
                    />
                    <MetricRow
                      label="Área Muscular do Braço (AMB)"
                      values={derived.map((d) => d.arm?.amb ?? null)}
                      unit="cm²"
                    />
                    <MetricRow
                      label="AMB Corrigida — Heymsfield (AMBc)"
                      values={derived.map((d) => d.arm?.ambc ?? null)}
                      unit="cm²"
                    />
                    <MetricRow
                      label="Área Gordurosa do Braço (AGB)"
                      values={derived.map((d) => d.arm?.agb ?? null)}
                      unit="cm²"
                    />
                    <StringRow
                      label="Adequação AMBc (Frisancho, 1990)"
                      values={derived.map((d) => {
                        if (!d.arm) return null;
                        const colIndex = derived.indexOf(d);
                        if (!gender || !patient.birth_date || !cols[colIndex]?.assessment_date) {
                          return null;
                        }
                        const assessmentAge = calcAgeAt(
                          patient.birth_date,
                          cols[colIndex].assessment_date,
                        );
                        const cl = classifyAmbc(d.arm.ambc, gender, assessmentAge);
                        return `${cl.pct}% — ${cl.label}`;
                      })}
                    />
                  </>
                )}

                {/* ── Circunferências — Tronco ──────────────────────────── */}
                {hasTronco && (
                  <>
                    <SectionRow label="Circunferências — Tronco" colSpan={colSpan} />
                    <MetricRow label="Pescoço"  values={cols.map((m) => m.neck     ?? null)} unit="cm" />
                    <MetricRow label="Ombro"    values={cols.map((m) => m.shoulder ?? null)} unit="cm" />
                    <MetricRow label="Peitoral" values={cols.map((m) => m.chest    ?? null)} unit="cm" />
                    <MetricRow label="Cintura"  values={cols.map((m) => m.waist    ?? null)} unit="cm" />
                    <MetricRow label="Abdômen"  values={cols.map((m) => m.abdomen  ?? null)} unit="cm" />
                    <MetricRow label="Quadril"  values={cols.map((m) => m.hip      ?? null)} unit="cm" />
                  </>
                )}

                {/* ── Circunferências — Membros Superiores ─────────────── */}
                {hasSup && (
                  <>
                    <SectionRow label="Circunferências — Membros Superiores (D · E)" colSpan={colSpan} />
                    <BilateralRow
                      label="Braço Relaxado"
                      rights={cols.map((m) => m.arm_relax_r    ?? null)}
                      lefts={cols.map((m)  => m.arm_relax_l    ?? null)}
                    />
                    <BilateralRow
                      label="Braço Contraído"
                      rights={cols.map((m) => m.arm_contract_r ?? null)}
                      lefts={cols.map((m)  => m.arm_contract_l ?? null)}
                    />
                    <BilateralRow
                      label="Antebraço"
                      rights={cols.map((m) => m.forearm_r      ?? null)}
                      lefts={cols.map((m)  => m.forearm_l      ?? null)}
                    />
                    <BilateralRow
                      label="Punho"
                      rights={cols.map((m) => m.wrist_r        ?? null)}
                      lefts={cols.map((m)  => m.wrist_l        ?? null)}
                    />
                  </>
                )}

                {/* ── Circunferências — Membros Inferiores ─────────────── */}
                {hasInf && (
                  <>
                    <SectionRow label="Circunferências — Membros Inferiores (D · E)" colSpan={colSpan} />
                    <BilateralRow
                      label="Coxa Proximal"
                      rights={cols.map((m) => m.thigh_prox_r ?? null)}
                      lefts={cols.map((m)  => m.thigh_prox_l ?? null)}
                    />
                    <BilateralRow
                      label="Coxa Medial"
                      rights={cols.map((m) => m.thigh_r      ?? null)}
                      lefts={cols.map((m)  => m.thigh_l      ?? null)}
                    />
                    <BilateralRow
                      label="Panturrilha"
                      rights={cols.map((m) => m.calf_r       ?? null)}
                      lefts={cols.map((m)  => m.calf_l       ?? null)}
                    />
                  </>
                )}

                {/* ── Dobras Cutâneas ───────────────────────────────────── */}
                {hasDobras && (
                  <>
                    <SectionRow label="Dobras Cutâneas" colSpan={colSpan} />
                    {ALL_SF_KEYS.map((key) => (
                      <MetricRow
                        key={key}
                        label={SKINFOLD_LABELS[key]}
                        values={cols.map((m) => getSkinfoldValue(m, key))}
                        unit="mm"
                        decimals={1}
                      />
                    ))}
                    <MetricRow
                      label="Σ Dobras do protocolo"
                      values={sfSums}
                      unit="mm"
                      decimals={1}
                    />
                    <MetricRow
                      label="Densidade Corporal"
                      values={cols.map((m) => m.body_density ?? null)}
                      unit="g/mL"
                      decimals={4}
                    />
                    <StringRow
                      label="Protocolo"
                      values={cols.map((m) => {
                        if (!m.sf_protocol) return null;
                        return PROTOCOLS.find((p) => p.id === m.sf_protocol)?.label ?? m.sf_protocol;
                      })}
                    />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasFourComponent && (
        <div className="rounded border border-primary/20 bg-primary/5 px-5 py-4 text-xs leading-relaxed text-muted-foreground print:px-3 print:py-2 print:text-[8px]">
          <span className="font-semibold text-foreground">Nota metodológica:</span> fracionamento antropométrico estimado por von Döbeln mod. Rocha (1975) para massa óssea e Würch (1974) para massa residual. Os valores não são diagnóstico, resultado de bioimpedância ou densitometria.
        </div>
      )}

      {/* ── Notes (most recent selected) ─────────────────────────────────── */}
      {mostRecent?.notes && (
        <div className="rounded border border-border bg-card px-5 py-4 print:px-3 print:py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1.5 print:text-[7px]">
            Observações — {formatDate(mostRecent.assessment_date)}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed print:text-[9px]">
            {mostRecent.notes}
          </p>
        </div>
      )}
    </div>
  );
}
