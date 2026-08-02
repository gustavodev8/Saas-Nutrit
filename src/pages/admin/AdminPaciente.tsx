import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link, type NavigateFunction } from "react-router-dom";
import {
  ArrowLeft,
  User,
  ClipboardList,
  Activity,
  BookOpen,
  FileText,
  LayoutDashboard,
  Save,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Scale,
  AlertCircle,
  Camera,
  X,
  ImageIcon,
  Eye,
  FlaskConical,
  MapPin,
  MessageSquareQuote,
  Pencil,
  Download,
  Send,
  Copy,
  Clock3,
  Pill,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { ExamProtocolsTab } from "@/components/admin/ExamProtocolsTab";
import { PrescriptionBuilder } from "@/components/admin/PrescriptionBuilder";
import { AnamnesisForm } from "@/components/admin/AnamnesisForm";
import { EmailPatientReportModal } from "@/components/admin/EmailPatientReportModal";
import { AnthropometryWizard, type MeasurementForm } from "@/components/admin/AnthropometryWizard";
import { useConsultation } from "@/contexts/ConsultationContext";
import { StrategyModal } from "@/components/admin/StrategyModal";
import { calcMacros, type StrategyType, type MacroResult } from "@/lib/strategyUtils";
import { type EnergyInput } from "@/lib/energyUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generatePatientReportPdf } from "@/lib/generatePatientReportPdf";
import type { SkinfoldProtocol } from "@/lib/anthropometryUtils";
import {
  fetchPatient,
  upsertPatient,
  fetchMeasurements,
  insertMeasurement,
  updateMeasurement,
  deleteMeasurement,
  fetchMealPlans,
  upsertMealPlan,
  deleteMealPlan,
  fetchPatientPhotos,
  insertPatientPhoto,
  deletePatientPhoto,
  uploadPatientPhoto,
  fetchPatientReports,
  upsertPatientReport,
  deletePatientReport,
  fetchBookings,
  isPendingBookingExpired,
  fetchConsultationRecords,
  fetchExamRequests,
  fetchPrescriptions,
  type Patient,
  type Measurement,
  type MealPlan,
  type PatientPhoto,
  type PatientReport,
  type Booking,
  type ConsultationRecord,
  type PatientExamRequest,
  type SavedPrescription,
} from "@/lib/supabase";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const calcBMI = (weight?: number, height?: number): string | null => {
  if (!weight || !height) return null;
  return (weight / Math.pow(height / 100, 2)).toFixed(1);
};

// â”€â”€â”€ CPF helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatCPF(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r >= 10) r = 0;
  return r === parseInt(d[10]);
}

const bmiClass = (bmi: number) => {
  if (bmi < 18.5)
    return { label: "Abaixo do peso", cls: "bg-blue-100 text-blue-700" };
  if (bmi < 25)
    return { label: "Normal", cls: "bg-green-100 text-green-700" };
  if (bmi < 30)
    return { label: "Sobrepeso", cls: "bg-yellow-100 text-yellow-700" };
  return { label: "Obesidade", cls: "bg-red-100 text-red-700" };
};

const calcAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const todayISO = () => new Date().toISOString().split("T")[0];

const createReportTitle = (date = todayISO()) => `Evolução clínica — ${formatDate(date)}`;

const REPORT_SECTION_SNIPPETS = [
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
];

const REPORT_FULL_TEMPLATE = [
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

const getReportSignature = (report: Pick<PatientReport, "id" | "title" | "report_date" | "report_text">) =>
  JSON.stringify({
    id: report.id ?? null,
    title: report.title,
    report_date: report.report_date,
    report_text: report.report_text,
  });

const formatSavedTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

// â”€â”€â”€ Tab config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TabKey = "central" | "perfil" | "anamnese" | "relatorio" | "antropometria" | "planos" | "protocolos" | "prescricao";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "central",      label: "Central",              icon: <LayoutDashboard size={16} /> },
  { key: "perfil",       label: "Perfil",               icon: <User size={16} /> },
  { key: "anamnese",     label: "Anamnese",              icon: <ClipboardList size={16} /> },
  { key: "relatorio",    label: "Relatório",            icon: <FileText size={16} /> },
  { key: "antropometria",label: "Medidas",               icon: <Activity size={16} /> },
  { key: "planos",       label: "Planos",                icon: <BookOpen size={16} /> },
  { key: "protocolos",   label: "Exames",                icon: <ClipboardList size={16} /> },
  { key: "prescricao",   label: "Prescrição",            icon: <BookOpen size={16} /> },
];

const isTabKey = (value: string | null): value is TabKey =>
  TABS.some((tab) => tab.key === value);

// â”€â”€â”€ Shared Textarea â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}
const Textarea = ({ minRows = 3, className = "", ...props }: TextareaProps) => (
  <textarea
    className={`w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] ${className}`}
    rows={minRows}
    {...props}
  />
);

// â”€â”€â”€ BMI Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BMIBadge = ({ bmi }: { bmi: string }) => {
  const num = parseFloat(bmi);
  const { label, cls } = bmiClass(num);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

// â”€â”€â”€ Page Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : "central";

  // â”€â”€ ConsultationContext â€” ctxSetAnamnesis passado para AnamnesisForm â”€â”€â”€
  const { setAnamnesis: ctxSetAnamnesis } = useConsultation();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  // â”€â”€â”€ FULL PAGE DETAIL VIEW STATE â”€â”€â”€
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPatient(id)
      .then((p) => setPatient(p))
      .catch(() => toast.error("Erro ao carregar paciente"))
      .finally(() => setLoading(false));
  }, [id]);

  const setTab = (tab: TabKey) => {
    setSearchParams({ tab });
  };

  const isComplete =
    patient &&
    !!patient.name &&
    !!patient.email &&
    !!patient.phone &&
    !!patient.city;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Paciente não encontrado.</p>
        <Link to="/admin/pacientes">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  // â”€â”€â”€ RENDER: FULL PAGE REPORT VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (selectedMeasurement) {
    const m = selectedMeasurement;
    const bmi = calcBMI(m.weight, m.height);
    const bmiInfo = bmi ? bmiClass(parseFloat(bmi)) : null;

    const SummaryCard = ({
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
    }) => (
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", colorClass)}>
            <Icon size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-foreground tabular-nums">{value ?? "—"}</span>
          {value != null && unit && <span className="text-sm font-bold text-muted-foreground">{unit}</span>}
        </div>
      </div>
    );

    const ComparisonRow = ({ label, right, left }: { label: string; right?: number | null; left?: number | null }) => (
      <div className="grid grid-cols-7 gap-2 py-3 border-b border-border/40 items-center last:border-0">
        <div className="col-span-3 text-right">
          <span className="text-sm font-bold text-foreground tabular-nums">{right ?? "—"}</span>
          <span className="text-[10px] ml-1 text-muted-foreground font-medium">cm</span>
        </div>
        <div className="col-span-1 text-center">
          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{label}</span>
        </div>
        <div className="col-span-3 text-left">
          <span className="text-sm font-bold text-foreground tabular-nums">{left ?? "—"}</span>
          <span className="text-[10px] ml-1 text-muted-foreground font-medium">cm</span>
        </div>
      </div>
    );

    const MeasureRow = ({ label, value, unit = "cm" }: { label: string, value?: number, unit?: string }) => (
      <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-foreground tabular-nums">{value ?? "—"}</span>
          {value && <span className="text-[10px] font-medium text-muted-foreground/60">{unit}</span>}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-background animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Sticky Report Header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60 px-8 py-4 flex items-center justify-between mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedMeasurement(null)}
              className="h-11 px-4 rounded-2xl hover:bg-muted font-bold flex gap-2 transition-all"
            >
              <ArrowLeft size={18} />
              Voltar ao Prontuário
            </Button>
            <div className="h-6 w-px bg-border/60 mx-2" />
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Relatório Antropométrico
                <span className="text-primary opacity-30">/</span>
                <span className="text-muted-foreground font-medium">{formatDate(m.assessment_date)}</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-11 font-bold gap-2" onClick={() => window.print()}>
              <Plus size={18} />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="px-6 space-y-8">
          {/* Header Dashboard: IMC & Key Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-4 bg-primary rounded-[40px] p-8 text-primary-foreground shadow-2xl shadow-primary/20 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="relative z-10">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] opacity-70 mb-1">Status Metabólico</p>
                <h3 className="text-6xl font-black tracking-tighter tabular-nums mb-4">{bmi ?? "—"}</h3>
                {bmiInfo && (
                  <div className="inline-flex items-center px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-widest">
                    {bmiInfo.label}
                  </div>
                )}
              </div>
              <div className="relative z-10 pt-10">
                <p className="text-sm opacity-80 font-medium max-w-[200px]">Índice de massa corporal calculado com base no peso e altura atuais.</p>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <SummaryCard label="Massa Corporal" value={m.weight} unit="kg" icon={Scale} colorClass="text-blue-500" />
              <SummaryCard label="Gordura Corporal" value={m.body_fat} unit="%" icon={Activity} colorClass="text-rose-500" />
              <SummaryCard label="Massa Magra" value={m.lean_mass} unit="kg" icon={User} colorClass="text-emerald-500" />
            </div>
          </div>

          {/* Detailed Measures Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Trunk Info */}
            <div className="space-y-8">
              <div className="bg-card border border-border/60 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-5 bg-primary rounded-full" />
                  <h4 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">Tronco & Tronco</h4>
                </div>
                <div className="space-y-1">
                  <MeasureRow label="Pescoço" value={m.neck} />
                  <MeasureRow label="Ombro" value={m.shoulder} />
                  <MeasureRow label="Peitoral" value={m.chest} />
                  <MeasureRow label="Cintura" value={m.waist} />
                  <MeasureRow label="Abdômen" value={m.abdomen} />
                  <MeasureRow label="Quadril" value={m.hip} />
                  <div className="pt-4 mt-4 border-t border-border/40">
                    <MeasureRow label="Gordura Visceral" value={m.visceral_fat} unit="" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bilateral Comparison Table */}
            <div className="lg:col-span-2 bg-card border border-border/60 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8 border-b border-border/40 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-amber-500 rounded-full" />
                  <h4 className="text-sm font-black uppercase tracking-[0.15em] text-foreground/80">Simetria Corporal</h4>
                </div>
                <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Direito</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> Esquerdo</span>
                </div>
              </div>

              <div className="space-y-2">
                <ComparisonRow label="Braço Relax." right={m.arm_relax_r} left={m.arm_relax_l} />
                <ComparisonRow label="Braço Contr." right={m.arm_contract_r} left={m.arm_contract_l} />
                <ComparisonRow label="Antebraço" right={m.forearm_r} left={m.forearm_l} />
                <ComparisonRow label="Punho" right={m.wrist_r} left={m.wrist_l} />
                <div className="h-4" />
                <ComparisonRow label="Coxa Prox." right={m.thigh_prox_r} left={m.thigh_prox_l} />
                <ComparisonRow label="Coxa Med." right={m.thigh_r} left={m.thigh_l} />
                <ComparisonRow label="Panturrilha" right={m.calf_r} left={m.calf_l} />
              </div>

              <div className="mt-10 flex items-center justify-center gap-2 py-4 px-6 bg-muted/30 rounded-2xl border border-dashed border-border/60">
                <Scale size={16} className="text-muted-foreground/40" />
                <p className="text-[11px] font-bold text-muted-foreground/60 italic uppercase tracking-tighter text-center">
                  Diferenças entre os lados podem indicar desequilíbrios musculares ou dominância motora.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Opinion / Notes */}
          {m.notes && (
            <div className="bg-muted/20 border border-border/60 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.07]">
                <ClipboardList size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-primary">
                  <MessageSquareQuote size={20} />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Parecer Técnico Nutricional</h4>
                </div>
                <p className="text-lg text-foreground/80 leading-relaxed font-medium italic">
                  "{m.notes}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // â”€â”€â”€ RENDER: MAIN PROFILE VIEW (WITH TABS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="px-4 sm:px-6 py-5 space-y-4">
      {/* Breadcrumbs & Navigation */}
      <div className="rounded-3xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <Link to="/admin/pacientes" className="hover:text-primary transition-colors">Pacientes</Link>
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-foreground/70">{patient.name || "Prontuário"}</span>
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-primary">{TABS.find((tab) => tab.key === activeTab)?.label ?? "Central"}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shadow-sm border border-primary/10 shrink-0">
              {patient.name ? initials(patient.name) : <User size={24} />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {patient.name || "Sem nome"}
                </h1>
                {isComplete ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Cadastro completo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                    Cadastro incompleto
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground font-medium">
                {patient.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="opacity-60" />
                    {patient.city}
                  </span>
                )}
                {patient.birth_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="opacity-60" />
                    {calcAge(patient.birth_date)} anos
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/pacientes">
              <Button variant="outline" size="sm" className="rounded-xl h-9 px-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={15} className="mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="bg-card/80 p-1 rounded-2xl border border-border/60 flex flex-nowrap gap-1 overflow-x-auto shadow-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={cn(
                "flex-none md:flex-1 min-w-[108px] flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200",
                isActive
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <span className={cn(isActive ? "text-primary" : "text-muted-foreground/60")}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Antropometria: full-width dashboard (sem card wrapper) */}
      {activeTab === "antropometria" && (
        <AntropometriaTab
          patientId={id!}
          patient={patient}
          onViewDetail={setSelectedMeasurement}
        />
      )}

      {/* Demais abas: card centralizado com padding */}
      {activeTab !== "antropometria" && (
        <div className="bg-card border border-border shadow-sm rounded-[24px] overflow-hidden">
          <div className="p-6 sm:p-8">
            {activeTab === "central" && (
              <ClinicalCentralTab patient={patient} onNavigateTab={setTab} />
            )}
            {activeTab === "perfil" && (
              <PerfilTab patient={patient} onSaved={setPatient} />
            )}
            {activeTab === "anamnese" && (
              <AnamnesisForm patientId={id!} onSaved={ctxSetAnamnesis} />
            )}
            {activeTab === "relatorio" && (
              <ReportTab patient={patient} onSaved={setPatient} />
            )}
            {activeTab === "planos" && (
              <PlanosTab patientId={id!} patientRouteId={id!} navigate={navigate} patient={patient} />
            )}
            {activeTab === "protocolos" && (
              <ExamProtocolsTab
                patientId={Number(id)}
                gender={(patient?.gender as "M" | "F" | "outro") ?? "M"}
                patient={patient}
              />
            )}
            {activeTab === "prescricao" && (
              <PrescriptionBuilder patientId={Number(id)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 1: Perfil (Cadastro Básico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ClinicalCentralData {
  measurements: Measurement[];
  mealPlans: MealPlan[];
  reports: PatientReport[];
  examRequests: PatientExamRequest[];
  prescriptions: SavedPrescription[];
  bookings: Booking[];
  consultationRecords: ConsultationRecord[];
}

interface ClinicalTimelineEvent {
  id: string;
  dateValue: string;
  sortValue: number;
  timeValue?: string | null;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  toneClass: string;
  actionTab?: TabKey;
  route?: string;
}

interface ClinicalAction {
  id: string;
  title: string;
  description: string;
  tab?: TabKey;
  route?: string;
  icon: LucideIcon;
  priority: number;
}

const emptyClinicalData: ClinicalCentralData = {
  measurements: [],
  mealPlans: [],
  reports: [],
  examRequests: [],
  prescriptions: [],
  bookings: [],
  consultationRecords: [],
};

const dateOnly = (value?: string | null) => {
  if (!value) return null;
  return value.includes("T") ? value.split("T")[0] : value;
};

const dateTimeValue = (date?: string | null, time?: string | null) => {
  if (!date) return 0;
  const normalizedDate = dateOnly(date);
  const iso = time ? `${normalizedDate}T${time}` : `${normalizedDate}T12:00:00`;
  const parsed = new Date(iso).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const instantDateValue = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const digitsOnly = (value?: string | null) => value?.replace(/\D/g, "") ?? "";

const normalizeIdentityText = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const formatClinicalDate = (date?: string | null, time?: string | null) => {
  const normalizedDate = dateOnly(date);
  if (!normalizedDate) return "Sem data";
  const label = new Date(`${normalizedDate}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return time ? `${label} às ${time.slice(0, 5)}` : label;
};

const bookingStatusLabel = (status?: Booking["status"]) => {
  const map: Record<NonNullable<Booking["status"]>, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    completed: "Concluída",
    no_show: "Falta",
    cancelled: "Cancelada",
  };
  return status ? map[status] : "Agendada";
};

const paymentStatusLabel = (status?: Booking["payment_status"]) => {
  const map: Record<NonNullable<Booking["payment_status"]>, string> = {
    pending: "Pagamento pendente",
    paid: "Pagamento aprovado",
    cancelled: "Pagamento cancelado",
    free: "Sem cobrança",
  };
  return status ? map[status] : "Pagamento não informado";
};

const pluralLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

function ClinicalCentralTab({
  patient,
  onNavigateTab,
}: {
  patient: Patient;
  onNavigateTab: (tab: TabKey) => void;
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClinicalCentralData>(emptyClinicalData);

  useEffect(() => {
    if (!patient.id) return;
    let active = true;
    setLoading(true);

    const loadCentral = async () => {
      const [measurements, mealPlans, reports, examRequests, prescriptions, allBookings] = await Promise.all([
        fetchMeasurements(patient.id),
        fetchMealPlans(patient.id),
        fetchPatientReports(patient.id),
        fetchExamRequests(patient.id),
        fetchPrescriptions(patient.id),
        fetchBookings(),
      ]);

      const patientEmail = patient.email?.trim().toLowerCase();
      const patientCpf = digitsOnly(patient.cpf);
      const patientPhone = digitsOnly(patient.phone);
      const patientName = normalizeIdentityText(patient.name);
      const bookings = allBookings.filter((booking) => {
        if (booking.patient_id === patient.id) return true;
        const bookingEmail = booking.client_email?.trim().toLowerCase();
        const bookingCpf = digitsOnly(booking.client_cpf);
        const bookingPhone = digitsOnly(booking.client_phone);
        const bookingName = normalizeIdentityText(booking.client_name);
        const cpfMatches = patientCpf.length === 11 && bookingCpf.length === 11 && patientCpf === bookingCpf;
        const emailMatches = Boolean(patientEmail && bookingEmail === patientEmail);
        const phoneAndNameMatch = Boolean(
          patientPhone &&
          bookingPhone &&
          patientPhone === bookingPhone &&
          patientName &&
          bookingName &&
          patientName === bookingName
        );
        return cpfMatches || emailMatches || phoneAndNameMatch;
      });

      const bookingGroupIds = Array.from(new Set(bookings.map((booking) => booking.booking_group_id).filter(Boolean)));
      const consultationRecords = (
        await Promise.all(bookingGroupIds.map((groupId) => fetchConsultationRecords(groupId)))
      ).flat();

      return { measurements, mealPlans, reports, examRequests, prescriptions, bookings, consultationRecords };
    };

    loadCentral()
      .then((centralData) => {
        if (!active) return;
        setData(centralData);
      })
      .catch(() => toast.error("Erro ao carregar a central clínica."))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patient.id, patient.name, patient.email, patient.phone, patient.cpf]);

  const now = Date.now();
  const today = todayISO();
  const latestMeasurement = data.measurements[0];
  const latestReport = data.reports[0];
  const activePlan = data.mealPlans.find((plan) => {
    const startsOk = !plan.start_date || plan.start_date <= today;
    const endsOk = !plan.end_date || plan.end_date >= today;
    return startsOk && endsOk;
  });
  const latestPlan = data.mealPlans[0];
  const pendingExamRequests = data.examRequests.filter((request) => request.status !== "completed");
  const upcomingBookings = data.bookings
    .filter((booking) => !["completed", "cancelled", "no_show"].includes(booking.status ?? ""))
    .filter((booking) => !isPendingBookingExpired(booking))
    .filter((booking) => dateTimeValue(booking.appointment_date, booking.appointment_time) >= now)
    .sort((a, b) => dateTimeValue(a.appointment_date, a.appointment_time) - dateTimeValue(b.appointment_date, b.appointment_time));
  const nextBooking = upcomingBookings[0];
  const recordSessionKeys = new Set(
    data.consultationRecords
      .filter((record) => record.booking_group_id && record.session_number != null)
      .map((record) => `${record.booking_group_id}-${record.session_number}`)
  );
  const timelineBookings = data.bookings.filter((booking) => {
    const key = `${booking.booking_group_id}-${booking.session_number}`;
    return !(booking.status === "completed" && recordSessionKeys.has(key));
  });

  const pendingActions: ClinicalAction[] = [
    !nextBooking
      ? {
          id: "booking",
          title: "Agendar retorno",
          description: "Nenhuma consulta futura encontrada.",
          route: patient.id ? `/admin/agendamentos?new=return&patientId=${patient.id}` : "/admin/agendamentos",
          icon: CalendarCheck,
          priority: 10,
        }
      : null,
    !latestMeasurement
      ? {
          id: "measurement",
          title: "Registrar primeira avaliação",
          description: "Sem medidas antropométricas registradas.",
          tab: "antropometria" as TabKey,
          icon: Activity,
          priority: 20,
        }
      : null,
    pendingExamRequests.length > 0
      ? {
          id: "exams",
          title: "Lançar resultados de exames",
          description: `${pluralLabel(pendingExamRequests.length, "solicitação pendente", "solicitações pendentes")}.`,
          tab: "protocolos" as TabKey,
          icon: FlaskConical,
          priority: 30,
        }
      : null,
    !activePlan
      ? {
          id: "plan",
          title: "Criar plano alimentar",
          description: "Paciente sem plano ativo.",
          tab: "planos" as TabKey,
          icon: Utensils,
          priority: 40,
        }
      : null,
    !latestReport
      ? {
          id: "report",
          title: "Registrar evolução clínica",
          description: "Sem relatório clínico no histórico.",
          tab: "relatorio" as TabKey,
          icon: FileText,
          priority: 50,
        }
      : null,
  ]
    .filter((item): item is ClinicalAction => item !== null)
    .sort((a, b) => a.priority - b.priority);

  const openClinicalTarget = (target: { tab?: TabKey; route?: string }) => {
    if (target.route) {
      navigate(target.route);
      return;
    }
    if (target.tab) onNavigateTab(target.tab);
  };

  const timeline: ClinicalTimelineEvent[] = [
    ...timelineBookings.map((booking) => ({
      id: `booking-${booking.id ?? booking.booking_group_id}-${booking.session_number}`,
      dateValue: booking.appointment_date,
      sortValue: dateTimeValue(booking.appointment_date, booking.appointment_time),
      timeValue: booking.appointment_time,
      title: booking.session_number > 1 ? `Retorno ${booking.session_number - 1}` : "Consulta inicial",
      description: `${booking.plan_name || "Consulta"} · ${booking.type === "online" ? "Online" : "Presencial"} · ${paymentStatusLabel(booking.payment_status)}`,
      badge: bookingStatusLabel(booking.status),
      icon: CalendarCheck,
      toneClass: booking.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-blue-700 bg-blue-50 border-blue-100",
      route: "/admin/agendamentos",
    })),
    ...data.consultationRecords.map((record) => ({
      id: `record-${record.id ?? record.booking_group_id}-${record.session_number ?? "sem-sessao"}`,
      dateValue: record.created_at ?? today,
      sortValue: instantDateValue(record.created_at ?? today),
      title: record.session_number && record.session_number > 1 ? `Evolução do retorno ${record.session_number - 1}` : "Evolução da consulta",
      description: [
        record.weight != null ? `${record.weight} kg` : null,
        record.next_return_date ? `retorno ${formatClinicalDate(record.next_return_date)}` : null,
        record.next_steps?.trim() ? record.next_steps.trim() : record.notes?.trim() ? record.notes.trim() : null,
      ].filter(Boolean).join(" · ") || "Registro clínico da sessão concluída.",
      badge: "Evolução",
      icon: ClipboardList,
      toneClass: "text-teal-700 bg-teal-50 border-teal-100",
      route: "/admin/agendamentos",
    })),
    ...data.measurements.map((measurement) => ({
      id: `measurement-${measurement.id}`,
      dateValue: measurement.assessment_date,
      sortValue: dateTimeValue(measurement.assessment_date),
      title: "Avaliação antropométrica",
      description: [
        measurement.weight != null ? `${measurement.weight} kg` : null,
        measurement.body_fat != null ? `${measurement.body_fat}% gordura` : null,
        measurement.waist != null ? `cintura ${measurement.waist} cm` : null,
      ].filter(Boolean).join(" · ") || "Medidas registradas no prontuário.",
      badge: "Medidas",
      icon: Activity,
      toneClass: "text-primary bg-primary/10 border-primary/10",
      actionTab: "antropometria" as TabKey,
    })),
    ...data.mealPlans.map((plan) => ({
      id: `plan-${plan.id}`,
      dateValue: plan.start_date ?? plan.created_at ?? today,
      sortValue: plan.start_date ? dateTimeValue(plan.start_date) : instantDateValue(plan.created_at),
      title: plan.title || "Plano alimentar",
      description: [
        plan.daily_calories ? `${plan.daily_calories} kcal/dia` : null,
        plan.strategy_type ? `estratégia: ${plan.strategy_type}` : null,
        plan.end_date ? `até ${formatClinicalDate(plan.end_date)}` : null,
      ].filter(Boolean).join(" · ") || "Plano alimentar criado.",
      badge: "Plano",
      icon: Utensils,
      toneClass: "text-emerald-700 bg-emerald-50 border-emerald-100",
      route: plan.id && patient.id ? `/admin/pacientes/${patient.id}/plano/${plan.id}` : undefined,
      actionTab: "planos" as TabKey,
    })),
    ...data.examRequests.map((request) => ({
      id: `exam-${request.id}`,
      dateValue: request.created_at ?? today,
      sortValue: instantDateValue(request.created_at),
      title: request.status === "completed" ? "Resultados de exames lançados" : "Pedido de exames solicitado",
      description: `${pluralLabel(request.items?.length ?? 0, "exame", "exames")} · ${pluralLabel(request.results?.length ?? 0, "resultado registrado", "resultados registrados")}`,
      badge: request.status === "completed" ? "Concluído" : "Pendente",
      icon: FlaskConical,
      toneClass: request.status === "completed" ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-amber-700 bg-amber-50 border-amber-100",
      actionTab: "protocolos" as TabKey,
    })),
    ...data.reports.map((report) => ({
      id: `report-${report.id}`,
      dateValue: report.report_date,
      sortValue: dateTimeValue(report.report_date),
      title: report.title || "Relatório clínico",
      description: `${report.report_text.trim().length} caracteres · atualizado ${formatClinicalDate(report.updated_at ?? report.created_at ?? report.report_date)}`,
      badge: "Relatório",
      icon: FileText,
      toneClass: "text-slate-700 bg-slate-50 border-slate-100",
      actionTab: "relatorio" as TabKey,
    })),
    ...data.prescriptions.map((prescription) => ({
      id: `prescription-${prescription.id}`,
      dateValue: prescription.created_at,
      sortValue: instantDateValue(prescription.created_at),
      title: "Prescrição magistral",
      description: `${pluralLabel(prescription.blocks.length, "bloco", "blocos")} · ${pluralLabel(prescription.blocks.reduce((acc, block) => acc + block.items.length, 0), "ativo", "ativos")}`,
      badge: "Prescrição",
      icon: Pill,
      toneClass: "text-violet-700 bg-violet-50 border-violet-100",
      actionTab: "prescricao" as TabKey,
    })),
  ].sort((a, b) => b.sortValue - a.sortValue);

  const summaryCards = [
    {
      label: "Próxima consulta",
      value: nextBooking ? formatClinicalDate(nextBooking.appointment_date, nextBooking.appointment_time) : "Não agendada",
      detail: nextBooking ? `${nextBooking.plan_name} · ${bookingStatusLabel(nextBooking.status)}` : "Sem retorno futuro encontrado",
      icon: CalendarCheck,
      tab: "perfil" as TabKey,
    },
    {
      label: activePlan ? "Plano ativo" : "Último plano",
      value: activePlan?.title ?? latestPlan?.title ?? "Sem plano cadastrado",
      detail: activePlan?.daily_calories
        ? `${activePlan.daily_calories} kcal/dia`
        : latestPlan
        ? "Fora do período ativo"
        : "Conduta alimentar não vinculada",
      icon: Utensils,
      route: (activePlan?.id ?? latestPlan?.id) && patient.id
        ? `/admin/pacientes/${patient.id}/plano/${activePlan?.id ?? latestPlan?.id}`
        : undefined,
      tab: "planos" as TabKey,
    },
    {
      label: "Última avaliação",
      value: latestMeasurement ? formatClinicalDate(latestMeasurement.assessment_date) : "Sem medidas",
      detail: latestMeasurement?.weight ? `${latestMeasurement.weight} kg${latestMeasurement.body_fat ? ` · ${latestMeasurement.body_fat}% gordura` : ""}` : "Registre antropometria",
      icon: Activity,
      tab: "antropometria" as TabKey,
    },
    {
      label: "Exames",
      value: pendingExamRequests.length > 0 ? pluralLabel(pendingExamRequests.length, "pendente", "pendentes") : "Sem pendências",
      detail: pluralLabel(data.examRequests.length, "pedido no histórico", "pedidos no histórico"),
      icon: FlaskConical,
      tab: "protocolos" as TabKey,
    },
  ];
  const primaryAction = pendingActions[0];
  const statusLabel = nextBooking ? "Acompanhamento ativo" : "Retorno não agendado";
  const statusDetail = nextBooking
    ? `${formatClinicalDate(nextBooking.appointment_date, nextBooking.appointment_time)} · ${bookingStatusLabel(nextBooking.status)}`
    : "Defina a próxima consulta para manter o acompanhamento em dia.";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando central clínica...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Resumo do acompanhamento</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">{statusLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{statusDetail}</p>
          </div>

          {primaryAction ? (
            <button
              type="button"
              onClick={() => openClinicalTarget(primaryAction)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-amber-900 transition-all hover:-translate-y-0.5 hover:shadow-sm lg:max-w-[360px]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="rounded-xl bg-white/70 p-2 text-amber-700">
                  <primaryAction.icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-amber-700/80">Próxima ação</span>
                  <span className="block truncate text-sm font-black">{primaryAction.title}</span>
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </button>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900 lg:max-w-[320px]">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80">Próxima ação</p>
                <p className="text-sm font-black">Sem pendências agora</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => openClinicalTarget(card)}
              className="rounded-2xl border border-border bg-background px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{card.label}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-black text-foreground">{card.value}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{card.detail}</p>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Conduta sugerida</p>
              <h3 className="mt-1 text-base font-black text-foreground">Ações recomendadas</h3>
            </div>
            {pendingActions.length === 0 ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <AlertCircle size={20} className="text-amber-600" />
            )}
          </div>

          {pendingActions.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              Sem pendências agora.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingActions.slice(0, 5).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => openClinicalTarget(action)}
                    className="w-full rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="rounded-xl bg-amber-50 p-1.5 text-amber-700">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-foreground">{action.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{action.description}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-background p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Linha do tempo</p>
              <h3 className="mt-1 text-base font-black text-foreground">Últimos eventos</h3>
            </div>
            <p className="text-xs text-muted-foreground">{timeline.length} evento{timeline.length === 1 ? "" : "s"}</p>
          </div>

          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Clock3 className="mx-auto mb-3 text-muted-foreground/40" size={28} />
              <p className="text-sm font-semibold text-foreground">Nenhum evento clínico registrado ainda.</p>
              <p className="mt-1 text-xs text-muted-foreground">Crie uma consulta, plano, avaliação ou relatório para iniciar a linha do tempo.</p>
            </div>
          ) : (
            <div className="relative space-y-2 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
              {timeline.slice(0, 8).map((event) => {
                const Icon = event.icon;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => openClinicalTarget(event)}
                    className="relative flex w-full gap-3 rounded-2xl p-1.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", event.toneClass)}>
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-3 py-2.5">
                      <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">{event.title}</span>
                          <span className="mt-0.5 block line-clamp-1 text-xs text-muted-foreground">{event.description}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {event.badge}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {formatClinicalDate(event.dateValue, event.timeValue)}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PerfilTab({
  patient,
  onSaved,
}: {
  patient: Patient;
  onSaved: (p: Patient) => void;
}) {
  const [form, setForm] = useState<Patient>({ ...patient });
  const [saving, setSaving] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Photos Evolution
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ ...patient });
  }, [patient]);

  useEffect(() => {
    if (!patient.id) return;
    fetchPatientPhotos(patient.id)
      .then(setPhotos)
      .finally(() => setLoadingPhotos(false));
  }, [patient.id]);

  const set = (field: keyof Patient, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    // Valida CPF se preenchido
    const rawCpf = (form.cpf ?? "").replace(/\D/g, "");
    if (rawCpf && !validateCPF(rawCpf)) {
      setCpfError("CPF inválido — verifique os dígitos.");
      return;
    }
    setCpfError(null);

    setSaving(true);
    try {
      // Persiste apenas dígitos (sem máscara)
      const payload: Patient = { ...form, cpf: rawCpf || undefined };
      const updated = await upsertPatient(payload);
      if (updated) {
        onSaved(updated);
        toast.success("Perfil salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar perfil.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !patient.id) return;
    e.target.value = "";
    setUploading(true);
    let added = 0;
    for (const file of files) {
      const url = await uploadPatientPhoto(file);
      if (!url) { toast.error(`Falha ao enviar ${file.name}`); continue; }
      const saved = await insertPatientPhoto({ patient_id: patient.id, url });
      if (saved) { setPhotos(prev => [saved, ...prev]); added++; }
    }
    setUploading(false);
    if (added > 0) toast.success(added === 1 ? "Foto adicionada!" : `${added} fotos adicionadas!`);
  };

  const handleDeletePhoto = async (photo: PatientPhoto) => {
    if (!photo.id) return;
    const ok = await deletePatientPhoto(photo.id);
    if (ok) setPhotos(prev => prev.filter(p => p.id !== photo.id));
    else toast.error("Erro ao remover foto.");
  };

  const trackedFields: (keyof Patient)[] = [
    "name",
    "cpf",
    "email",
    "phone",
    "city",
    "birth_date",
    "gender",
    "occupation",
    "notes",
  ];
  const hasChanges = trackedFields.some(
    (field) => String(form[field] ?? "") !== String(patient[field] ?? "")
  );
  const inputClass = "h-9 rounded-xl bg-muted/20 border-border/80 focus-visible:ring-primary/20";
  const fieldClass = "space-y-1.5";
  const labelClass = "text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Perfil clínico</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Dados cadastrais do paciente</h2>
          <p className="text-sm text-muted-foreground">Informações essenciais para identificação, contato e histórico administrativo.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="h-9 rounded-xl px-4 font-bold shadow-sm"
        >
          {saving ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" />}
          {saving ? "Salvando..." : hasChanges ? "Salvar alterações" : "Tudo salvo"}
        </Button>
      </div>

      <div className="space-y-5">
        <section className="space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">Dados pessoais</h3>
            <p className="text-xs text-muted-foreground">Identificação principal usada no prontuário.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className={fieldClass}>
              <Label htmlFor="name" className={labelClass}>Nome completo</Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="cpf" className={labelClass}>CPF</Label>
              <Input
                id="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={formatCPF(form.cpf ?? "")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                  set("cpf", raw);
                  if (cpfError) setCpfError(null);
                }}
                className={cn(inputClass, cpfError && "border-destructive focus-visible:ring-destructive/20")}
              />
              {cpfError && (
                <p className="text-xs text-destructive font-medium">{cpfError}</p>
              )}
            </div>

            <div className={fieldClass}>
              <Label htmlFor="birth_date" className={labelClass}>Data de nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date || ""}
                onChange={(e) => set("birth_date", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="gender" className={labelClass}>Gênero</Label>
              <select
                id="gender"
                value={form.gender || ""}
                onChange={(e) => set("gender", e.target.value)}
                className={cn("w-full px-3 py-2 text-sm focus:outline-none focus:ring-2", inputClass)}
              >
                <option value="">Selecionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">Contato</h3>
            <p className="text-xs text-muted-foreground">Canais para retorno, envio de materiais e confirmações.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className={fieldClass}>
              <Label htmlFor="email" className={labelClass}>Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="phone" className={labelClass}>Telefone</Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="city" className={labelClass}>Cidade</Label>
              <Input
                id="city"
                value={form.city || ""}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className={fieldClass}>
              <Label htmlFor="occupation" className={labelClass}>Ocupação</Label>
              <Input
                id="occupation"
                value={form.occupation || ""}
                onChange={(e) => set("occupation", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.14em] text-primary">Informações adicionais</h3>
            <p className="text-xs text-muted-foreground">Observações gerais visíveis no perfil do prontuário.</p>
          </div>
          <div className={fieldClass}>
            <Label htmlFor="notes" className={labelClass}>Observações gerais</Label>
            <Textarea
              id="notes"
              minRows={3}
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[92px] rounded-xl bg-muted/20 border-border/80 focus-visible:ring-primary/20"
            />
          </div>
        </section>
      </div>

      {/* Photo Management Section */}
      <div className="space-y-4 pt-5 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Camera size={20} className="text-primary" />
            Galeria de Evolução
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-10 gap-2 font-bold"
            disabled={uploading}
            onClick={() => photoInputRef.current?.click()}
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Upload de Fotos
          </Button>
          <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        </div>

        {loadingPhotos ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground"><Loader2 className="animate-spin mr-2" /> Carregando galeria...</div>
        ) : photos.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-border rounded-[24px] flex flex-col items-center justify-center text-muted-foreground/60 gap-3">
            <ImageIcon size={40} className="opacity-20" />
            <p className="text-sm font-medium">Nenhuma foto de evolução anexada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-sm">
                <img src={photo.url} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox(photo.url)} />
                <button onClick={() => handleDeletePhoto(photo)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Overlay */}
      {lightbox && (
        <div className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors"><X size={24} /></button>
          <img src={lightbox} className="max-w-full max-h-[90vh] rounded-3xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 2: Anamnese (Histórico Clínico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Field auxiliar da Anamnese â€” fora do componente para não perder foco
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€





function ReportTab({
  patient,
  onSaved,
}: {
  patient: Patient;
  onSaved: (p: Patient) => void;
}) {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState<"recent" | "oldest">("recent");
  const lastSavedSignatureRef = useRef("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const makeBlankReport = (text = ""): PatientReport => ({
    patient_id: Number(patient.id ?? 0),
    title: createReportTitle(),
    report_date: todayISO(),
    report_text: text,
  });

  const [draft, setDraft] = useState<PatientReport>(() => ({
    ...makeBlankReport(patient.report_text ?? ""),
  }));

  const syncDraftFromSaved = (report: PatientReport) => {
    setDraft(report);
    lastSavedSignatureRef.current = getReportSignature(report);
    setLastSavedAt(report.updated_at ?? report.created_at ?? null);
  };

  useEffect(() => {
    const blank = makeBlankReport(patient.report_text ?? "");
    setDraft(blank);
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
    setLoadingReports(true);
    fetchPatientReports(Number(patient.id)).then((data) => {
      setReports(data);
      if (data.length > 0) {
        syncDraftFromSaved(data[0]);
      } else {
        setDraft(blank);
      }
      setLoadingReports(false);
    });
  }, [patient.id, patient.report_text]);

  const isDirty = getReportSignature(draft) !== lastSavedSignatureRef.current;
  const hasMeaningfulContent = draft.report_text.trim().length > 0;
  const hasDraftChangesBeyondDefault =
    hasMeaningfulContent ||
    draft.title.trim() !== createReportTitle(draft.report_date || todayISO()) ||
    draft.report_date !== todayISO();
  const saveStatus: "saving" | "saved" | "dirty" | "unsaved" =
    saving ? "saving" : draft.id ? (isDirty ? "dirty" : "saved") : "unsaved";

  const ensureCanDiscardDraft = () => {
    if (draft.id && !isDirty) return true;
    if (!draft.id && !hasDraftChangesBeyondDefault) return true;
    return window.confirm("Existem alterações não salvas neste relatório. Deseja descartá-las?");
  };

  const selectReport = (report: PatientReport) => {
    if (!ensureCanDiscardDraft()) return;
    syncDraftFromSaved(report);
  };

  const createNewReport = () => {
    if (!ensureCanDiscardDraft()) return;
    setDraft(makeBlankReport());
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
  };

  const duplicateCurrentReport = () => {
    if (!ensureCanDiscardDraft()) return;
    setDraft({
      ...makeBlankReport(draft.report_text),
      title: `${createReportTitle()} (cópia)`,
    });
    lastSavedSignatureRef.current = "";
    setLastSavedAt(null);
  };

  const appendSnippet = (text: string) => {
    setDraft((prev) => ({
      ...prev,
      report_text: prev.report_text.trim()
        ? `${prev.report_text.replace(/\s+$/, "")}\n\n${text}`
        : text,
    }));
  };

  const ensureReportReady = (action: "visualizar" | "exportar" | "enviar") => {
    if (!draft.report_text.trim()) {
      toast.error("Preencha o relatório antes de continuar.");
      return false;
    }
    if (!draft.id || isDirty) {
      toast.error(`Salve o relatório antes de ${action}.`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error('Informe um título para o relatório.');
      return;
    }
    if (!draft.report_text.trim()) {
      toast.error('Escreva o conteúdo do relatório.');
      return;
    }

    setSaving(true);
    try {
      const saved = await upsertPatientReport({
        ...draft,
        patient_id: Number(patient.id),
      });
      if (!saved) {
        toast.error('Erro ao salvar relatório.');
        return;
      }

      syncDraftFromSaved(saved);
      const freshList = await fetchPatientReports(Number(patient.id));
      setReports(freshList);
      toast.success('Relatório salvo com sucesso!');
      onSaved({ ...patient, report_text: saved.report_text });
    } catch {
      toast.error('Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!draft.id) return;
    const ok = window.confirm(`Excluir o relatório "${draft.title}"?`);
    if (!ok) return;
    const deleted = await deletePatientReport(draft.id);
    if (!deleted) {
      toast.error('Erro ao excluir relatório.');
      return;
    }
    toast.success('Relatório excluído.');
    const freshList = await fetchPatientReports(Number(patient.id));
    setReports(freshList);
    if (freshList[0]) setDraft(freshList[0]);
    else createNewReport();
  };

  const handleDownloadPdf = async () => {
    if (!ensureReportReady("exportar")) return;
    const doc = await generatePatientReportPdf(patient, draft);
    doc.save(`${draft.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handlePreviewPdf = async () => {
    if (!ensureReportReady("visualizar")) return;
    const doc = await generatePatientReportPdf(patient, draft);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) toast.info('Permita pop-ups para abrir a visualização do PDF.');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const reportDateLabel = new Date(`${draft.report_date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const reportWordCount = draft.report_text.trim() ? draft.report_text.trim().split(/\s+/).length : 0;
  const estimatedReadMinutes = Math.max(1, Math.ceil(reportWordCount / 180));
  const latestReport = reports[0];
  const filteredReports = [...reports]
    .filter((report) => {
      const q = historySearch.trim().toLowerCase();
      if (!q) return true;
      return (
        report.title.toLowerCase().includes(q) ||
        report.report_text.toLowerCase().includes(q) ||
        report.report_date.includes(q)
      );
    })
    .sort((a, b) =>
      historySort === "recent"
        ? `${b.report_date}${b.created_at ?? ""}`.localeCompare(`${a.report_date}${a.created_at ?? ""}`)
        : `${a.report_date}${a.created_at ?? ""}`.localeCompare(`${b.report_date}${b.created_at ?? ""}`)
    );
  const savedTimeLabel = formatSavedTime(lastSavedAt);
  const saveStatusLabel =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "saved"
        ? `Salvo${savedTimeLabel ? ` às ${savedTimeLabel}` : ""}`
        : saveStatus === "dirty"
          ? "Alterações não salvas"
          : "Novo documento não salvo";
  const saveStatusClass =
    saveStatus === "saved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : saveStatus === "saving"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

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
                {draft.title || 'Novo relatório'}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Registre evolução, adesão ao plano, intercorrências, conduta e observações clínicas importantes.
                Cada relatório fica salvo como um documento separado por data.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {draft.report_date ? reportDateLabel : 'Sem data definida'}
                </span>
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  {reportWordCount} palavras
                </span>
                <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  Leitura em aprox. {estimatedReadMinutes} min
                </span>
                <span className={cn("rounded-md border px-3 py-1 text-xs font-semibold", saveStatusClass)}>
                  {saveStatus === "saving" ? <Loader2 size={12} className="mr-1 inline animate-spin" /> : <Clock3 size={12} className="mr-1 inline" />}
                  {saveStatusLabel}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto lg:justify-end">
              <div className="flex flex-wrap items-center gap-2">
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
                  onClick={handlePreviewPdf}
                >
                  <Eye size={14} />
                  Visualizar
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
                  className="h-9 rounded-lg gap-2 bg-primary/90 px-4 text-sm font-medium shadow-none hover:bg-primary"
                  onClick={() => {
                    if (!ensureReportReady("enviar")) return;
                    setShowEmail(true);
                  }}
                  disabled={!patient.email}
                  title={patient.email ? 'Enviar relatório por e-mail' : 'Cadastre um e-mail no perfil primeiro'}
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
                <Label htmlFor="report_title" className="text-sm font-semibold text-foreground">
                  Título do relatório
                </Label>
                <Input
                  id="report_title"
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  className="h-10 rounded-lg border-border bg-background"
                  placeholder="Ex.: Evolução clínica — 31/07/2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report_date" className="text-sm font-semibold text-foreground">
                  Data do relatório
                </Label>
                <Input
                  id="report_date"
                  type="date"
                  value={draft.report_date}
                  onChange={(e) => setDraft((prev) => ({ ...prev, report_date: e.target.value }))}
                  className="h-10 rounded-lg border-border bg-background"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="report_text" className="text-sm font-semibold text-foreground">
                  Texto do relatório
                </Label>
                <span className="text-xs text-muted-foreground">
                  {draft.report_text.trim().length > 0 ? `${draft.report_text.trim().length} caracteres` : 'Campo vazio'}
                </span>
              </div>
              <Textarea
                id="report_text"
                minRows={8}
                value={draft.report_text}
                onChange={(e) => setDraft((prev) => ({ ...prev, report_text: e.target.value }))}
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
                  : 'Novo documento ainda não salvo.'}
              </p>
              <Button onClick={handleSave} disabled={saving} className="h-10 rounded-lg px-6 font-semibold">
                {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Documentos</p>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">Relatórios clínicos</h3>
              <p className="text-sm text-muted-foreground">
                {reports.length} registro{reports.length === 1 ? '' : 's'} disponível{reports.length === 1 ? '' : 'eis'}
                {latestReport ? ` · último em ${new Date(`${latestReport.report_date}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}
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
                  onChange={(e) => setHistorySort(e.target.value as "recent" | "oldest")}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg gap-2" onClick={duplicateCurrentReport}>
                  <Copy size={14} />
                  Duplicar atual
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg gap-2" onClick={createNewReport}>
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
              <p className="text-sm font-semibold text-foreground">Nenhum relatório salvo</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Crie o primeiro documento para registrar a evolução do paciente.
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
              <p className="text-sm font-semibold text-foreground">Nenhum relatório encontrado</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Ajuste a busca ou a ordenação para localizar outro documento.
              </p>
            </div>
          ) : (
            filteredReports.map((report, index) => {
              const isActive = draft.id === report.id;
              const labelDate = new Date(`${report.report_date}T12:00:00`).toLocaleDateString('pt-BR');
              const words = report.report_text.trim() ? report.report_text.trim().split(/\s+/).length : 0;
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => selectReport(report)}
                  className={cn(
                    'group w-full rounded-xl border p-4 text-left transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/8 ring-1 ring-primary/15'
                      : 'border-border bg-background hover:border-primary/20 hover:bg-muted/20'
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{report.title}</p>
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
                            <span>Atualizado às {formatSavedTime(report.updated_at)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
                        isActive
                          ? 'border border-primary/20 bg-primary/10 text-primary'
                          : 'border border-border bg-muted/30 text-muted-foreground'
                      )}
                    >
                      {isActive ? 'Aberto' : `#${index + 1}`}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {report.report_text || 'Sem conteúdo'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {showEmail && <EmailPatientReportModal patient={patient} report={draft} onClose={() => setShowEmail(false)} />}
    </div>
  );
}

function AntropometriaTab({ patientId, patient, onViewDetail }: {
  patientId: string;
  patient: Patient;
  onViewDetail: (m: Measurement) => void;
}) {
  const pid = Number(patientId);
  const { setMeasurement: ctxSetMeasurement } = useConsultation();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);

  useEffect(() => {
    fetchMeasurements(pid).then((data) => { setMeasurements(data); setLoading(false); });
  }, [pid]);

  const buildPayload = async (
    form: MeasurementForm,
    protocol: SkinfoldProtocol,
    officialSource: "bio" | "skinfold" | null,
  ): Promise<Record<string, unknown>> => {
    const patientAge = patient.birth_date ? calcAge(patient.birth_date) : 25;
    const genderKey  = patient.gender === "F" ? "F" : "M";

    const payload: Record<string, unknown> = { patient_id: pid, assessment_date: form.assessment_date };

    // Medidas básicas e circunferências
    const numFields = [
      "weight", "height",
      "neck", "shoulder", "chest", "waist", "abdomen", "hip",
      "arm_relax_r", "arm_relax_l", "arm_contract_r", "arm_contract_l",
      "forearm_r", "forearm_l", "wrist_r", "wrist_l",
      "thigh_prox_r", "thigh_prox_l", "thigh_r", "thigh_l",
      "calf_r", "calf_l",
    ];
    numFields.forEach((key) => {
      const val = (form as Record<string, string>)[key];
      if (val) payload[key] = parseFloat(val);
    });
    if (form.notes) payload.notes = form.notes;

    // Gordura visceral (sempre salva se preenchida, vem da bio)
    if (form.visceral_fat) payload.visceral_fat = parseFloat(form.visceral_fat);

    // Dobras cutâneas — salvar todos os campos preenchidos independente do protocolo
    const sfValues = {
      sf_pectoral:    form.sf_pectoral    ? parseFloat(form.sf_pectoral)    : undefined,
      sf_midaxillary: form.sf_midaxillary ? parseFloat(form.sf_midaxillary) : undefined,
      sf_triceps:     form.sf_triceps     ? parseFloat(form.sf_triceps)     : undefined,
      sf_biceps:      form.sf_biceps      ? parseFloat(form.sf_biceps)      : undefined,
      sf_subscapular: form.sf_subscapular ? parseFloat(form.sf_subscapular) : undefined,
      sf_suprailiac:  form.sf_suprailiac  ? parseFloat(form.sf_suprailiac)  : undefined,
      sf_abdominal:   form.sf_abdominal   ? parseFloat(form.sf_abdominal)   : undefined,
      sf_thigh_sf:    form.sf_thigh_sf    ? parseFloat(form.sf_thigh_sf)    : undefined,
      sf_calf_sf:     form.sf_calf_sf     ? parseFloat(form.sf_calf_sf)     : undefined,
    };
    Object.entries(sfValues).forEach(([k, v]) => { if (v != null) payload[k] = v; });

    // Calcular resultado do adipômetro (independe de ser oficial)
    const { calcBodyFat } = await import("@/lib/anthropometryUtils");
    const sfResult = calcBodyFat(protocol, sfValues, patientAge, genderKey);
    if (sfResult) {
      payload.sf_protocol  = protocol;
      payload.body_density = sfResult.density > 0
        ? parseFloat(sfResult.density.toFixed(6)) : 0;
    }

    // Resultado oficial — determina body_fat e lean_mass salvos
    const weight = form.weight ? parseFloat(form.weight) : null;
    if (officialSource === "bio" && form.bio_fat_pct) {
      payload.body_fat = parseFloat(form.bio_fat_pct);
      payload.lean_mass = form.bio_lean_kg
        ? parseFloat(form.bio_lean_kg)
        : weight != null
          ? parseFloat((weight * (1 - parseFloat(form.bio_fat_pct) / 100)).toFixed(2))
          : undefined;
    } else if (officialSource === "skinfold" && sfResult) {
      payload.body_fat  = parseFloat(sfResult.fatPct.toFixed(2));
      payload.lean_mass = weight != null
        ? parseFloat((weight * (1 - sfResult.fatPct / 100)).toFixed(2))
        : undefined;
    } else if (officialSource === null) {
      // Auto-detect: usa adipômetro se disponível, senão bio
      if (sfResult) {
        payload.body_fat  = parseFloat(sfResult.fatPct.toFixed(2));
        payload.lean_mass = weight != null
          ? parseFloat((weight * (1 - sfResult.fatPct / 100)).toFixed(2))
          : undefined;
      } else if (form.bio_fat_pct) {
        payload.body_fat = parseFloat(form.bio_fat_pct);
        payload.lean_mass = form.bio_lean_kg
          ? parseFloat(form.bio_lean_kg)
          : weight != null
            ? parseFloat((weight * (1 - parseFloat(form.bio_fat_pct) / 100)).toFixed(2))
            : undefined;
      }
    }

    return payload;
  };

  const handleSave = async (
    form: MeasurementForm,
    protocol: SkinfoldProtocol,
    officialSource: "bio" | "skinfold" | null,
    editingId?: number,
  ) => {
    setSaving(true);
    try {
      const payload = await buildPayload(form, protocol, officialSource);

      if (editingId) {
        const res = await updateMeasurement(editingId, payload as Measurement);
        if (res) {
          setMeasurements((p) => p.map((m) => m.id === editingId ? res : m));
          ctxSetMeasurement(res);
          toast.success("Avaliação atualizada!");
          setEditingMeasurement(null);
        } else {
          toast.error("Erro ao atualizar avaliação.");
        }
      } else {
        const res = await insertMeasurement(payload as Measurement);
        if (res) {
          setMeasurements((p) => [res, ...p]);
          ctxSetMeasurement(res);
          toast.success("Avaliação registrada!");
        } else {
          toast.error("Erro ao salvar avaliação.");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[handleSave] exceção:", err);
      toast.error(`Erro ao salvar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mid: number) => {
    if (!confirm("Excluir avaliação?")) return;
    if (await deleteMeasurement(mid)) {
      setMeasurements(p => p.filter(m => m.id !== mid));
      toast.success("Removida.");
    }
  };

  const latest    = measurements[0];
  const latestBmi = latest ? calcBMI(latest.weight, latest.height) : null;

  return (
    <div className="space-y-4">

      {/* â”€â”€ Latest metrics strip â”€â”€ */}
      {latest && (
        <div className="flex items-stretch gap-0 border border-border rounded-md overflow-hidden">
          <div className="px-4 py-3.5 bg-muted/50 border-r border-border flex flex-col justify-center shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Última</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {latest.assessment_date ? formatDate(latest.assessment_date) : "—"}
            </p>
          </div>
          {([
            { label: "Peso",      value: latest.weight   != null ? `${latest.weight} kg` : "—", badge: null      },
            { label: "Altura",    value: latest.height   != null ? `${latest.height} cm` : "—", badge: null      },
            { label: "IMC",       value: latestBmi ?? "—",                                       badge: latestBmi },
            { label: "% Gordura", value: latest.body_fat != null ? `${latest.body_fat}%`  : "—", badge: null      },
            { label: "Cintura",   value: latest.waist    != null ? `${latest.waist} cm`   : "—", badge: null      },
          ] as { label: string; value: string; badge: string | null }[]).map((s, i) => (
            <div key={s.label} className={`flex-1 px-4 py-3.5 bg-card flex flex-col justify-center min-w-0${i > 0 ? " border-l border-border" : ""}`}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[15px] font-bold tabular-nums text-foreground">{s.value}</p>
                {s.badge && <BMIBadge bmi={s.badge} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* â”€â”€ Botão Ver Relatório (quando há histórico) â”€â”€ */}
      {measurements.length > 0 && (
        <div className="flex justify-end">
          <Link to={`/admin/pacientes/${patientId}/relatorio-antropometrico`}>
            <Button variant="outline" size="sm" className="h-8 rounded-md text-sm gap-1.5">
              <Eye size={13} /> Ver Relatório
            </Button>
          </Link>
        </div>
      )}

      {/* â”€â”€ Form de avaliação (nova ou edição) â”€â”€ */}
      <AnthropometryWizard
        patient={patient}
        latestMeasurement={measurements[0] ?? null}
        editingMeasurement={editingMeasurement}
        onSave={handleSave}
        onCancelEdit={() => setEditingMeasurement(null)}
        saving={saving}
      />


      {/* â”€â”€ History table â”€â”€ */}
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
      ) : measurements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 border border-border rounded-md bg-card text-muted-foreground">
          <Scale size={26} className="opacity-30" />
          <p className="text-sm">Nenhuma avaliação registrada.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center gap-2">
            <Activity size={15} className="text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Histórico — {measurements.length} avaliação{measurements.length !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  {["Data", "Peso", "Altura", "IMC", "% Gordura", "Protocolo", "Cintura", ""].map((col, i) => (
                    <th key={i} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50${i === 0 ? " text-left" : " text-right"}${i === 7 ? " w-28" : ""}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, idx) => {
                  const bmi = calcBMI(m.weight, m.height);
                  return (
                    <tr key={m.id} className={`border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors${idx === 0 ? " bg-primary/[0.03]" : ""}`}>
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">Recente</span>}
                          {m.assessment_date ? formatDate(m.assessment_date) : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{m.weight ? `${m.weight} kg` : "—"}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{m.height ? `${m.height} cm` : "—"}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {bmi ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold tabular-nums">{bmi}</span>
                            <BMIBadge bmi={bmi} />
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{m.body_fat != null ? `${m.body_fat}%` : "—"}</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{m.sf_protocol ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{m.waist ? `${m.waist} cm` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link to={`/admin/pacientes/${patientId}/relatorio-antropometrico`} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => { setEditingMeasurement(m); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar avaliação"
                          >
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(m.id!)} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {measurements.length} avaliação{measurements.length !== 1 ? "es" : ""} registrada{measurements.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TAB 4: Planos Alimentares
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STRATEGY_LABELS: Record<string, { label: string; cls: string }> = {
  deficit:     { label: "Déficit",     cls: "bg-blue-50 text-blue-700 border-blue-200" },
  maintenance: { label: "Manutenção",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  surplus:     { label: "Superávit",   cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

function PlanosTab({
  patientId,
  patientRouteId,
  navigate,
  patient,
}: {
  patientId: string;
  patientRouteId: string;
  navigate: NavigateFunction;
  patient: Patient;
}) {
  const pid = Number(patientId);
  const [plans, setPlans]   = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [latestMeasurement, setLatestMeasurement] = useState<Measurement | null>(null);

  useEffect(() => {
    Promise.all([
      fetchMealPlans(pid),
      fetchMeasurements(pid).then((ms) => ms[0] ?? null),
    ]).then(([ps, m]) => {
      setPlans(ps);
      setLatestMeasurement(m);
    }).finally(() => setLoading(false));
  }, [pid]);

  // Monta EnergyInput a partir da medição mais recente + dados do paciente
  const energyInput: EnergyInput | undefined = (() => {
    if (!latestMeasurement?.weight || !latestMeasurement?.height) return undefined;
    if (!patient?.birth_date) return undefined;
    const age = calcAge(patient.birth_date);
    return {
      weight: latestMeasurement.weight,
      height: latestMeasurement.height,
      age,
      gender: patient.gender === "F" ? "F" : "M",
    };
  })();

  const handleModalConfirm = async (
    title: string,
    strategy: StrategyType | null,
    macros: MacroResult | null
  ) => {
    setShowModal(false);
    const payload: MealPlan = {
      patient_id: pid,
      title,
      ...(strategy && macros
        ? {
            strategy_type: strategy,
            target_calories: macros.calories,
            target_protein_g: macros.protein_g,
            target_carbs_g: macros.carbs_g,
            target_fat_g: macros.fat_g,
            daily_calories: macros.calories,
          }
        : {}),
    };
    const np = await upsertMealPlan(payload);
    if (np?.id) navigate(`/admin/pacientes/${patientRouteId}/plano/${np.id}`);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      {showModal && (
        <StrategyModal
          energyInput={energyInput}
          onConfirm={handleModalConfirm}
          onClose={() => setShowModal(false)}
        />
      )}

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Planos alimentares</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">Dietas e estratégias do paciente</h2>
            <p className="text-sm text-muted-foreground">
              Crie, revise e acompanhe os planos vinculados ao prontuário.
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl h-10 px-5 font-bold shadow-sm"
          >
            <Plus size={16} className="mr-2" /> Novo plano
          </Button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/[0.03] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">Nenhum plano alimentar criado</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Comece criando uma estratégia personalizada. Você pode usar a última avaliação antropométrica
              {latestMeasurement ? " registrada" : " quando houver medidas registradas"} para estimar metas e macros.
            </p>
            <Button onClick={() => setShowModal(true)} className="mt-5 h-10 rounded-xl px-5 font-bold">
              <Plus size={16} className="mr-2" />
              Criar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {plans.map((p) => {
              const strategyInfo = p.strategy_type ? STRATEGY_LABELS[p.strategy_type] : null;
              return (
                <div
                  key={p.id ?? `${p.patient_id}-${p.title}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen size={21} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-bold text-foreground">{p.title || "Plano sem título"}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {strategyInfo && (
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${strategyInfo.cls}`}>
                            {strategyInfo.label}
                          </span>
                        )}
                        {p.target_calories ? (
                          <span className="text-xs font-medium text-muted-foreground">
                            {p.target_calories} kcal · {p.target_protein_g ?? 0}g PTN · {p.target_carbs_g ?? 0}g CHO · {p.target_fat_g ?? 0}g LIP
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            Criado em {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => p.id && navigate(`/admin/pacientes/${patientRouteId}/plano/${p.id}`)}
                    disabled={!p.id}
                    className="h-9 rounded-xl border-border/60 font-bold transition-all hover:border-primary hover:bg-primary hover:text-white"
                  >
                    Abrir plano
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

