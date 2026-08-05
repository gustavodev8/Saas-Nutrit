import type { Patient } from "@/lib/supabase";

export type PatientOnboardingKey =
  | "identity"
  | "contact"
  | "birthDate"
  | "clinicalNotes"
  | "booking"
  | "measurement"
  | "mealPlan"
  | "exams"
  | "report";

export interface PatientOnboardingItem {
  key: PatientOnboardingKey;
  label: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  tab?: "perfil" | "antropometria" | "planos" | "protocolos" | "relatorio";
  route?: string;
}

interface PatientOnboardingInput {
  patient: Patient;
  hasNextBooking: boolean;
  hasMeasurement: boolean;
  hasActivePlan: boolean;
  hasExamRequest: boolean;
  hasReport: boolean;
}

const hasText = (value?: string | null) => Boolean(value?.trim());

export const buildPatientOnboarding = ({
  patient,
  hasNextBooking,
  hasMeasurement,
  hasActivePlan,
  hasExamRequest,
  hasReport,
}: PatientOnboardingInput): PatientOnboardingItem[] => [
  {
    key: "identity",
    label: "Identificacao basica",
    description: "Nome, CPF, cidade e ocupacao ajudam a localizar o paciente sem ambiguidades.",
    completed: hasText(patient.name) && hasText(patient.cpf) && hasText(patient.city) && hasText(patient.occupation),
    actionLabel: "Completar perfil",
    tab: "perfil",
  },
  {
    key: "contact",
    label: "Contato validado",
    description: "E-mail e telefone permitem enviar materiais, planos e lembretes.",
    completed: hasText(patient.email) && hasText(patient.phone),
    actionLabel: "Atualizar contato",
    tab: "perfil",
  },
  {
    key: "birthDate",
    label: "Dados pessoais",
    description: "Data de nascimento e genero melhoram calculos e protocolos.",
    completed: hasText(patient.birth_date) && hasText(patient.gender),
    actionLabel: "Revisar dados",
    tab: "perfil",
  },
  {
    key: "clinicalNotes",
    label: "Observacoes iniciais",
    description: "Registre contexto clinico antes de evoluir condutas.",
    completed: hasText(patient.notes),
    actionLabel: "Abrir perfil",
    tab: "perfil",
  },
  {
    key: "booking",
    label: "Proxima consulta",
    description: "Mantem o acompanhamento com retorno definido.",
    completed: hasNextBooking,
    actionLabel: "Agendar retorno",
    route: patient.id ? `/admin/agendamentos?new=return&patientId=${patient.id}` : "/admin/agendamentos",
  },
  {
    key: "measurement",
    label: "Primeira avaliacao",
    description: "Crie a linha de base antropometrica do paciente.",
    completed: hasMeasurement,
    actionLabel: "Registrar medidas",
    tab: "antropometria",
  },
  {
    key: "mealPlan",
    label: "Plano alimentar ativo",
    description: "Vincule uma conduta alimentar vigente ao prontuario.",
    completed: hasActivePlan,
    actionLabel: "Criar plano",
    tab: "planos",
  },
  {
    key: "exams",
    label: "Exames solicitados",
    description: "Solicite ou registre exames conforme a necessidade clinica.",
    completed: hasExamRequest,
    actionLabel: "Abrir exames",
    tab: "protocolos",
  },
  {
    key: "report",
    label: "Evolucao registrada",
    description: "Documente a evolucao para acompanhar decisoes e proximos passos.",
    completed: hasReport,
    actionLabel: "Criar relatorio",
    tab: "relatorio",
  },
];

export const onboardingProgress = (items: PatientOnboardingItem[]) => {
  const completed = items.filter((item) => item.completed).length;
  return {
    completed,
    total: items.length,
    percent: items.length === 0 ? 0 : Math.round((completed / items.length) * 100),
  };
};

export const nextPendingOnboardingItem = (items: PatientOnboardingItem[]) =>
  items.find((item) => !item.completed) ?? null;
