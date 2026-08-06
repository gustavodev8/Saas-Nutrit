import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  ClipboardList,
  Activity,
  BookOpen,
  FileText,
  LayoutDashboard,
  Loader2,
  Calendar,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { ExamProtocolsTab } from "@/components/admin/ExamProtocolsTab";
import { PrescriptionBuilder } from "@/components/admin/PrescriptionBuilder";
import { AnamnesisForm } from "@/components/admin/AnamnesisForm";
import {
  ClinicalCentralTab,
} from "@/components/admin/patient/ClinicalCentralTab";
import { PatientAnthropometryTab } from "@/components/admin/patient/PatientAnthropometryTab";
import { PatientMeasurementDetailView } from "@/components/admin/patient/PatientMeasurementDetailView";
import { PatientMealPlansTab } from "@/components/admin/patient/PatientMealPlansTab";
import { PatientProfileTab } from "@/components/admin/patient/PatientProfileTab";
import { PatientReportsTab } from "@/components/admin/patient/PatientReportsTab";
import type { PatientAdminTabKey } from "@/components/admin/patient/patientAdminTypes";
import { useConsultation } from "@/contexts/ConsultationContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchPatient,
  fetchMeasurements,
  type Patient,
  type Measurement,
} from "@/lib/supabase";

// --- Helpers -------------------------------------------------------------------

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const calcAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// --- Tab config ---------------------------------------------------------------

type TabKey = PatientAdminTabKey;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "central",      label: "Central",              icon: <LayoutDashboard size={16} /> },
  { key: "perfil",       label: "Perfil",               icon: <User size={16} /> },
  { key: "anamnese",     label: "Anamnese",              icon: <ClipboardList size={16} /> },
  { key: "relatorio",    label: "Relat?rio",            icon: <FileText size={16} /> },
  { key: "antropometria",label: "Medidas",               icon: <Activity size={16} /> },
  { key: "planos",       label: "Planos",                icon: <BookOpen size={16} /> },
  { key: "protocolos",   label: "Exames",                icon: <ClipboardList size={16} /> },
  { key: "prescricao",   label: "Prescri??o",            icon: <BookOpen size={16} /> },
];

const isTabKey = (value: string | null): value is TabKey =>
  TABS.some((tab) => tab.key === value);

// --- Page Component --------------------------------------------------------------

export default function AdminPaciente() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey = isTabKey(rawTab) ? rawTab : "central";

  // -- ConsultationContext — ctxSetAnamnesis passado para AnamnesisForm ---
  const { setAnamnesis: ctxSetAnamnesis } = useConsultation();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  // --- FULL PAGE DETAIL VIEW STATE ---
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
        <p className="text-muted-foreground">Paciente n?o encontrado.</p>
        <Link to="/admin/pacientes">
          <Button variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  // --- RENDER: FULL PAGE REPORT VIEW -----------------------------------------------
  if (selectedMeasurement) {
    return (
      <PatientMeasurementDetailView
        measurement={selectedMeasurement}
        onBack={() => setSelectedMeasurement(null)}
      />
    );
  }

  // --- RENDER: MAIN PROFILE VIEW (WITH TABS) --------------------------------------
  return (
    <div className="px-4 sm:px-6 py-5 space-y-4">
      {/* Breadcrumbs & Navigation */}
      <div className="rounded-3xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm sm:px-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <Link to="/admin/pacientes" className="hover:text-primary transition-colors">Pacientes</Link>
          <ChevronRight size={12} className="opacity-50" />
          <span className="text-foreground/70">{patient.name || "Prontu?rio"}</span>
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
        <PatientAnthropometryTab
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
              <PatientProfileTab patient={patient} onSaved={setPatient} />
            )}
            {activeTab === "anamnese" && (
              <AnamnesisForm patientId={id!} onSaved={ctxSetAnamnesis} />
            )}
            {activeTab === "relatorio" && (
              <PatientReportsTab patient={patient} onSaved={setPatient} />
            )}
            {activeTab === "planos" && (
              <PatientMealPlansTab patientId={id!} patientRouteId={id!} patient={patient} />
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

