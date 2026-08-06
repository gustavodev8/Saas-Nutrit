import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  MessageSquareQuote,
  Plus,
  Scale,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calcBMI, getBmiClass } from "@/lib/patientAnthropometry";
import type { Measurement } from "@/lib/supabase";

interface PatientMeasurementDetailViewProps {
  measurement: Measurement;
  onBack: () => void;
}

const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function SummaryCard({
  label,
  value,
  unit,
  icon: Icon,
  colorClass = "text-primary",
}: {
  label: string;
  value?: number | string | null;
  unit?: string;
  icon: LucideIcon;
  colorClass?: string;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-muted",
            colorClass,
          )}
        >
          <Icon size={20} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black tabular-nums text-foreground">
          {value ?? "?"}
        </span>
        {value != null && unit && (
          <span className="text-sm font-bold text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  right,
  left,
}: {
  label: string;
  right?: number | null;
  left?: number | null;
}) {
  return (
    <div className="grid grid-cols-7 items-center gap-2 border-b border-border/40 py-3 last:border-0">
      <div className="col-span-3 text-right">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {right ?? "?"}
        </span>
        <span className="ml-1 text-[10px] font-medium text-muted-foreground">cm</span>
      </div>
      <div className="col-span-1 text-center">
        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/40">
          {label}
        </span>
      </div>
      <div className="col-span-3 text-left">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {left ?? "?"}
        </span>
        <span className="ml-1 text-[10px] font-medium text-muted-foreground">cm</span>
      </div>
    </div>
  );
}

function MeasureRow({
  label,
  value,
  unit = "cm",
}: {
  label: string;
  value?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold tabular-nums text-foreground">
          {value ?? "?"}
        </span>
        {value != null && unit ? (
          <span className="text-[10px] font-medium text-muted-foreground/60">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export function PatientMeasurementDetailView({
  measurement,
  onBack,
}: PatientMeasurementDetailViewProps) {
  const bmi = calcBMI(measurement.weight, measurement.height);
  const bmiInfo = bmi ? getBmiClass(parseFloat(bmi)) : null;

  return (
    <div className="min-h-screen animate-in fade-in slide-in-from-bottom-4 bg-background pb-20 duration-500">
      <div className="sticky top-0 z-30 mb-8 flex items-center justify-between border-b border-border/60 bg-background/80 px-8 py-4 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex h-11 gap-2 rounded-2xl px-4 font-bold transition-all hover:bg-muted"
          >
            <ArrowLeft size={18} />
            Voltar ao Prontuario
          </Button>
          <div className="mx-2 h-6 w-px bg-border/60" />
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
              Relatorio Antropometrico
              <span className="text-primary opacity-30">/</span>
              <span className="font-medium text-muted-foreground">
                {formatDate(measurement.assessment_date)}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-2xl font-bold"
            onClick={() => window.print()}
          >
            <Plus size={18} />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="space-y-8 px-6">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[40px] bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 lg:col-span-4">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-all duration-700 group-hover:bg-white/20" />
            <div className="relative z-10">
              <p className="mb-1 text-[11px] font-black uppercase tracking-[0.25em] opacity-70">
                Status Metabolico
              </p>
              <h3 className="mb-4 text-6xl font-black tracking-tighter tabular-nums">
                {bmi ?? "?"}
              </h3>
              {bmiInfo && (
                <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest backdrop-blur-md">
                  {bmiInfo.label}
                </div>
              )}
            </div>
            <div className="relative z-10 pt-10">
              <p className="max-w-[200px] text-sm font-medium opacity-80">
                Indice de massa corporal calculado com base no peso e altura atuais.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-8">
            <SummaryCard
              label="Massa Corporal"
              value={measurement.weight}
              unit="kg"
              icon={Scale}
              colorClass="text-blue-500"
            />
            <SummaryCard
              label="Gordura Corporal"
              value={measurement.body_fat}
              unit="%"
              icon={Activity}
              colorClass="text-rose-500"
            />
            <SummaryCard
              label="Massa Magra"
              value={measurement.lean_mass}
              unit="kg"
              icon={User}
              colorClass="text-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8">
            <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-5 w-1.5 rounded-full bg-primary" />
                <h4 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">
                  Tronco
                </h4>
              </div>
              <div className="space-y-1">
                <MeasureRow label="Pescoco" value={measurement.neck} />
                <MeasureRow label="Ombro" value={measurement.shoulder} />
                <MeasureRow label="Peitoral" value={measurement.chest} />
                <MeasureRow label="Cintura" value={measurement.waist} />
                <MeasureRow label="Abdomen" value={measurement.abdomen} />
                <MeasureRow label="Quadril" value={measurement.hip} />
                <div className="mt-4 border-t border-border/40 pt-4">
                  <MeasureRow
                    label="Gordura Visceral"
                    value={measurement.visceral_fat}
                    unit=""
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-border/60 bg-card p-8 shadow-sm lg:col-span-2">
            <div className="mb-8 flex items-center justify-between border-b border-border/40 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1.5 rounded-full bg-amber-500" />
                <h4 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">
                  Simetria Corporal
                </h4>
              </div>
              <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" /> Direito
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" /> Esquerdo
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <ComparisonRow
                label="Braco Relax."
                right={measurement.arm_relax_r}
                left={measurement.arm_relax_l}
              />
              <ComparisonRow
                label="Braco Contr."
                right={measurement.arm_contract_r}
                left={measurement.arm_contract_l}
              />
              <ComparisonRow
                label="Antebraco"
                right={measurement.forearm_r}
                left={measurement.forearm_l}
              />
              <ComparisonRow
                label="Punho"
                right={measurement.wrist_r}
                left={measurement.wrist_l}
              />
              <div className="h-4" />
              <ComparisonRow
                label="Coxa Prox."
                right={measurement.thigh_prox_r}
                left={measurement.thigh_prox_l}
              />
              <ComparisonRow
                label="Coxa Med."
                right={measurement.thigh_r}
                left={measurement.thigh_l}
              />
              <ComparisonRow
                label="Panturrilha"
                right={measurement.calf_r}
                left={measurement.calf_l}
              />
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-6 py-4">
              <Scale size={16} className="text-muted-foreground/40" />
              <p className="text-center text-[11px] font-bold uppercase italic tracking-tighter text-muted-foreground/60">
                Diferencas entre os lados podem indicar desequilibrios musculares ou dominancia motora.
              </p>
            </div>
          </div>
        </div>

        {measurement.notes && (
          <div className="group relative overflow-hidden rounded-[32px] border border-border/60 bg-muted/20 p-8">
            <div className="absolute right-0 top-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.07]">
              <ClipboardList size={120} />
            </div>
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <MessageSquareQuote size={20} />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                  Parecer Tecnico Nutricional
                </h4>
              </div>
              <p className="text-lg font-medium italic leading-relaxed text-foreground/80">
                "{measurement.notes}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
