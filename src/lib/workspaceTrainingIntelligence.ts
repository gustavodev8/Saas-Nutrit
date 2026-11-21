import type { TrainingGoal, WorkspaceTrainingExercise, WorkspaceTrainingPlan } from "@/lib/workspaceTraining";
import type { WorkspacePatient } from "@/lib/workspacePatients";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TrainingWarning {
  level: "info" | "warning" | "danger";
  message: string;
}

export interface TrainingIntelligenceResult {
  suggestedGoal: TrainingGoal | null;
  suggestedGoalReason: string;
  warnings: TrainingWarning[];
  caloricLoadLabel: string;
  caloricLoadKcalPerWeek: number;
  staleExercises: number[];
}

export interface TrainingTemplateExercise {
  day_label: string;
  exercise_name: string;
  sets: string;
  reps: string;
  load_kg: string;
  rest_seconds: string;
  notes: string;
}

export interface TrainingTemplate {
  goal: TrainingGoal;
  label: string;
  description: string;
  exercises: TrainingTemplateExercise[];
}

// ── Goal labels ──────────────────────────────────────────────────────────────

export const GOAL_LABELS: Record<TrainingGoal, string> = {
  hipertrofia:    "Hipertrofia",
  emagrecimento:  "Emagrecimento",
  condicionamento:"Condicionamento",
  saude:          "Saúde",
  forca:          "Força",
  reabilitacao:   "Reabilitação",
  outro:          "Outro",
};

export const GOAL_COLORS: Record<TrainingGoal, string> = {
  hipertrofia:    "bg-purple-50 text-purple-700 border-purple-200",
  emagrecimento:  "bg-orange-50 text-orange-700 border-orange-200",
  condicionamento:"bg-blue-50 text-blue-700 border-blue-200",
  saude:          "bg-green-50 text-green-700 border-green-200",
  forca:          "bg-red-50 text-red-700 border-red-200",
  reabilitacao:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  outro:          "bg-gray-50 text-gray-600 border-gray-200",
};

// ── Templates ────────────────────────────────────────────────────────────────

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
  {
    goal: "hipertrofia",
    label: "Hipertrofia — Push/Pull/Legs",
    description: "Treino de 3 dias focado em ganho de massa muscular",
    exercises: [
      { day_label: "A (Push)", exercise_name: "Supino reto com barra",    sets: "4", reps: "8-12", load_kg: "", rest_seconds: "90", notes: "" },
      { day_label: "A (Push)", exercise_name: "Desenvolvimento com halteres", sets: "3", reps: "10-12", load_kg: "", rest_seconds: "75", notes: "" },
      { day_label: "A (Push)", exercise_name: "Tríceps na polia",          sets: "3", reps: "12-15", load_kg: "", rest_seconds: "60", notes: "" },
      { day_label: "B (Pull)", exercise_name: "Puxada frontal",            sets: "4", reps: "8-12", load_kg: "", rest_seconds: "90", notes: "" },
      { day_label: "B (Pull)", exercise_name: "Remada curvada com barra",  sets: "3", reps: "10-12", load_kg: "", rest_seconds: "75", notes: "" },
      { day_label: "B (Pull)", exercise_name: "Rosca direta com barra",    sets: "3", reps: "10-12", load_kg: "", rest_seconds: "60", notes: "" },
      { day_label: "C (Legs)", exercise_name: "Agachamento livre",         sets: "4", reps: "8-10",  load_kg: "", rest_seconds: "120", notes: "" },
      { day_label: "C (Legs)", exercise_name: "Leg press 45°",             sets: "3", reps: "12-15", load_kg: "", rest_seconds: "90", notes: "" },
      { day_label: "C (Legs)", exercise_name: "Panturrilha em pé",         sets: "4", reps: "15-20", load_kg: "", rest_seconds: "60", notes: "" },
    ],
  },
  {
    goal: "emagrecimento",
    label: "Emagrecimento — Circuito HIIT",
    description: "Treino de alta intensidade para queima calórica",
    exercises: [
      { day_label: "A", exercise_name: "Esteira / corrida",           sets: "1", reps: "20 min", load_kg: "", rest_seconds: "0",  notes: "Manter frequência cardíaca em 70-80% da FCmax" },
      { day_label: "A", exercise_name: "Agachamento com salto",       sets: "4", reps: "15",     load_kg: "", rest_seconds: "30", notes: "" },
      { day_label: "A", exercise_name: "Burpee",                      sets: "4", reps: "10",     load_kg: "", rest_seconds: "30", notes: "" },
      { day_label: "B", exercise_name: "Mountain climber",            sets: "4", reps: "30 s",   load_kg: "", rest_seconds: "20", notes: "" },
      { day_label: "B", exercise_name: "Pular corda",                 sets: "5", reps: "2 min",  load_kg: "", rest_seconds: "30", notes: "" },
      { day_label: "B", exercise_name: "Abdominal prancha",           sets: "4", reps: "45 s",   load_kg: "", rest_seconds: "20", notes: "" },
      { day_label: "C", exercise_name: "Ciclismo / bike ergométrica", sets: "1", reps: "30 min", load_kg: "", rest_seconds: "0",  notes: "Cadência moderada-alta" },
      { day_label: "C", exercise_name: "Leg press 45° (leve)",        sets: "3", reps: "20",     load_kg: "", rest_seconds: "45", notes: "Carga leve, foco em volume" },
    ],
  },
  {
    goal: "condicionamento",
    label: "Condicionamento Físico — Funcional",
    description: "Treino funcional para melhorar resistência e mobilidade",
    exercises: [
      { day_label: "A", exercise_name: "Corrida leve",                sets: "1", reps: "30 min", load_kg: "", rest_seconds: "0",  notes: "Pace confortável, respiração controlada" },
      { day_label: "A", exercise_name: "Flexão de braço",             sets: "3", reps: "15-20",  load_kg: "", rest_seconds: "45", notes: "" },
      { day_label: "A", exercise_name: "Agachamento livre",           sets: "3", reps: "15",     load_kg: "", rest_seconds: "45", notes: "" },
      { day_label: "B", exercise_name: "Circuito funcional",          sets: "3", reps: "5 ex × 1 min", load_kg: "", rest_seconds: "60", notes: "Polichinelo, agachamento, flexão, burpee, abdominais" },
      { day_label: "B", exercise_name: "Mobilidade articular",        sets: "1", reps: "15 min", load_kg: "", rest_seconds: "0",  notes: "Quadril, ombros, tornozelos" },
      { day_label: "C", exercise_name: "Natação / hidroginástica",    sets: "1", reps: "40 min", load_kg: "", rest_seconds: "0",  notes: "" },
      { day_label: "C", exercise_name: "Alongamento global",          sets: "1", reps: "15 min", load_kg: "", rest_seconds: "0",  notes: "Manter cada posição por 30 s" },
    ],
  },
  {
    goal: "forca",
    label: "Força — Programa Linear",
    description: "Programa de força com movimentos básicos e progressão de carga",
    exercises: [
      { day_label: "A", exercise_name: "Agachamento livre",           sets: "5", reps: "5",   load_kg: "", rest_seconds: "180", notes: "Progressão linear: +2,5 kg/semana" },
      { day_label: "A", exercise_name: "Supino reto",                 sets: "5", reps: "5",   load_kg: "", rest_seconds: "180", notes: "Progressão linear: +2,5 kg/semana" },
      { day_label: "A", exercise_name: "Remada curvada",              sets: "5", reps: "5",   load_kg: "", rest_seconds: "180", notes: "" },
      { day_label: "B", exercise_name: "Agachamento livre",           sets: "5", reps: "5",   load_kg: "", rest_seconds: "180", notes: "Mesma carga do dia A" },
      { day_label: "B", exercise_name: "Overhead press",              sets: "5", reps: "5",   load_kg: "", rest_seconds: "180", notes: "Progressão linear" },
      { day_label: "B", exercise_name: "Deadlift",                    sets: "1", reps: "5",   load_kg: "", rest_seconds: "240", notes: "1 série pesada — progressão +5 kg/semana" },
    ],
  },
  {
    goal: "saude",
    label: "Saúde & Bem-estar",
    description: "Treino de baixo impacto para manutenção da saúde",
    exercises: [
      { day_label: "A", exercise_name: "Caminhada",                   sets: "1", reps: "40 min", load_kg: "", rest_seconds: "0",  notes: "Passo moderado, ao ar livre se possível" },
      { day_label: "A", exercise_name: "Alongamento global",          sets: "1", reps: "15 min", load_kg: "", rest_seconds: "0",  notes: "" },
      { day_label: "B", exercise_name: "Yoga / pilates",              sets: "1", reps: "50 min", load_kg: "", rest_seconds: "0",  notes: "Foco em respiração e mobilidade" },
      { day_label: "C", exercise_name: "Hidroginástica",              sets: "1", reps: "45 min", load_kg: "", rest_seconds: "0",  notes: "" },
      { day_label: "C", exercise_name: "Exercícios de equilíbrio",    sets: "3", reps: "30 s",   load_kg: "", rest_seconds: "30", notes: "Apoio unipodal, olhos fechados" },
    ],
  },
  {
    goal: "reabilitacao",
    label: "Reabilitação",
    description: "Exercícios terapêuticos de baixo impacto",
    exercises: [
      { day_label: "A", exercise_name: "Caminhada leve",              sets: "1", reps: "20 min", load_kg: "", rest_seconds: "0",  notes: "Sem dor — interromper se houver desconforto" },
      { day_label: "A", exercise_name: "Mobilização articular suave", sets: "2", reps: "10",     load_kg: "", rest_seconds: "60", notes: "Movimentos lentos e controlados" },
      { day_label: "A", exercise_name: "Fortalecimento isométrico",   sets: "3", reps: "10 s",   load_kg: "", rest_seconds: "30", notes: "Sem carga, apenas resistência do próprio corpo" },
      { day_label: "B", exercise_name: "Hidroterapia / piscina",      sets: "1", reps: "30 min", load_kg: "", rest_seconds: "0",  notes: "Exercícios indicados pelo fisioterapeuta" },
      { day_label: "B", exercise_name: "Alongamento específico",      sets: "2", reps: "30 s",   load_kg: "", rest_seconds: "30", notes: "Regiões de acordo com o quadro clínico" },
    ],
  },
];

// ── Contraindication keywords ─────────────────────────────────────────────────

const CONTRAINDICATION_MAP: Array<{
  keywords: string[];
  warning: TrainingWarning;
  blockedGoals?: TrainingGoal[];
}> = [
  {
    keywords: ["hipertensão", "pressão alta", "hypertension"],
    warning: { level: "warning", message: "Hipertensão detectada na anamnese. Evite treinos de alta intensidade sem liberação médica. Monitore a PA antes e após cada sessão." },
    blockedGoals: ["forca", "condicionamento"],
  },
  {
    keywords: ["diabetes", "diabético", "glicemia"],
    warning: { level: "warning", message: "Diabetes detectada. Monitore a glicemia pré e pós-treino. Ajuste carboidratos no plano alimentar conforme resposta glicêmica." },
  },
  {
    keywords: ["osteoporose", "osteopenia"],
    warning: { level: "warning", message: "Osteoporose/osteopenia: prefira exercícios com impacto moderado (caminhada, musculação leve). Evite flexão do tronco e torções bruscas." },
    blockedGoals: ["forca"],
  },
  {
    keywords: ["cardiopatia", "arritmia", "insuficiência cardíaca", "infarto", "bypass"],
    warning: { level: "danger", message: "Condição cardíaca identificada. Exija liberação cardiológica antes de iniciar qualquer programa de exercícios." },
    blockedGoals: ["hipertrofia", "forca", "condicionamento", "emagrecimento"],
  },
  {
    keywords: ["hérnia de disco", "hérnia lombar", "lombalgia crônica"],
    warning: { level: "warning", message: "Hérnia/lombalgia: evite flexão anterior com carga e agachamentos profundos. Priorize fortalecimento do core e exercícios supervisionados." },
    blockedGoals: ["forca"],
  },
  {
    keywords: ["gestante", "gravidez", "grávida"],
    warning: { level: "warning", message: "Gestante: adapte a intensidade ao trimestre. Evite exercícios em decúbito dorsal após o 2º trimestre e movimentos de alto impacto." },
    blockedGoals: ["forca", "emagrecimento"],
  },
  {
    keywords: ["asma", "bronquite", "dpoc"],
    warning: { level: "info", message: "Condição respiratória: inicie com baixa intensidade e aumente progressivamente. Tenha broncodilatador disponível durante o treino." },
    blockedGoals: ["condicionamento"],
  },
  {
    keywords: ["sedentarismo", "sedentário", "nunca praticou"],
    warning: { level: "info", message: "Paciente sedentário: comece com volume e intensidade baixos. Aumente 10% por semana no máximo." },
  },
];

// ── Caloric load estimator ────────────────────────────────────────────────────

function estimateCaloricLoad(
  frequencyPerWeek: number | null,
  goal: TrainingGoal | null,
): number {
  if (!frequencyPerWeek) return 0;
  const kcalPerSession: Record<TrainingGoal, number> = {
    hipertrofia:    350,
    emagrecimento:  480,
    condicionamento:420,
    saude:          250,
    forca:          320,
    reabilitacao:   150,
    outro:          300,
  };
  const perSession = goal ? kcalPerSession[goal] : 300;
  return frequencyPerWeek * perSession;
}

// ── Goal suggestion ───────────────────────────────────────────────────────────

function suggestGoalFromAnamnesis(
  goals: string,
  physicalActivity: string,
): { goal: TrainingGoal | null; reason: string } {
  const text = `${goals} ${physicalActivity}`.toLowerCase();

  if (/perd[ae]r? peso|emagrec|gord[ua]r[ae]|deficit|queim/.test(text))
    return { goal: "emagrecimento", reason: "Objetivo alimentar de perda de peso detectado na anamnese." };
  if (/ganho de mass|hipertrofia|musculaçao|definição/.test(text))
    return { goal: "hipertrofia", reason: "Objetivo de hipertrofia detectado na anamnese." };
  if (/força|powerlifting|levantamento/.test(text))
    return { goal: "forca", reason: "Objetivo de força detectado na anamnese." };
  if (/condicionamento|resistência|aeróbico|cardio/.test(text))
    return { goal: "condicionamento", reason: "Objetivo de condicionamento detectado na anamnese." };
  if (/saúde|bem.?estar|qualidade de vida|prevenção/.test(text))
    return { goal: "saude", reason: "Objetivo de saúde/bem-estar detectado na anamnese." };
  if (/reabilit|fisioterapi|lesão|cirurgia/.test(text))
    return { goal: "reabilitacao", reason: "Histórico de lesão/reabilitação detectado na anamnese." };

  return { goal: null, reason: "" };
}

// ── Stale exercise detection ──────────────────────────────────────────────────

const STALE_DAYS = 28;

function findStaleExercises(exercises: WorkspaceTrainingExercise[]): number[] {
  const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;
  return exercises
    .filter((ex) => ex.load_kg !== null && new Date(ex.updated_at).getTime() < cutoff)
    .map((ex) => ex.id);
}

// ── Main analysis ─────────────────────────────────────────────────────────────

export function analyzeTrainingProfile(
  patient: WorkspacePatient,
  plan: WorkspaceTrainingPlan | null,
  exercises: WorkspaceTrainingExercise[],
  anamnesis?: {
    medical_history?: string | null;
    goals?: string | null;
    physical_activity?: string | null;
  } | null,
): TrainingIntelligenceResult {
  const warnings: TrainingWarning[] = [];

  // Age-based warnings
  const birthDate = patient.birth_date;
  if (birthDate) {
    const age = Math.floor((Date.now() - new Date(`${birthDate}T12:00:00`).getTime()) / (365.25 * 24 * 3600 * 1000));
    if (age >= 60 && plan?.goal && ["forca", "condicionamento"].includes(plan.goal)) {
      warnings.push({ level: "info", message: `Paciente com ${age} anos. Adapte a intensidade e dê atenção especial ao aquecimento e à recuperação.` });
    }
    if (age < 18) {
      warnings.push({ level: "warning", message: "Paciente menor de idade: evite cargas máximas e exercícios que comprometam o crescimento ósseo." });
    }
  }

  // Anamnesis-based contraindications
  const medHistory = (anamnesis?.medical_history ?? "").toLowerCase();
  for (const { keywords, warning, blockedGoals } of CONTRAINDICATION_MAP) {
    const matched = keywords.some((kw) => medHistory.includes(kw));
    if (matched) {
      if (!blockedGoals || !plan?.goal || blockedGoals.includes(plan.goal)) {
        warnings.push(warning);
      }
    }
  }

  // Goal suggestion
  const { goal: suggestedGoal, reason: suggestedGoalReason } = suggestGoalFromAnamnesis(
    anamnesis?.goals ?? "",
    anamnesis?.physical_activity ?? "",
  );

  // Caloric load
  const freq = plan?.frequency_per_week ?? null;
  const goal = plan?.goal ?? null;
  const caloricLoadKcalPerWeek = estimateCaloricLoad(freq, goal);
  const caloricLoadLabel =
    caloricLoadKcalPerWeek === 0 ? "—" :
    caloricLoadKcalPerWeek < 300 ? "Baixo" :
    caloricLoadKcalPerWeek < 700 ? "Moderado" :
    caloricLoadKcalPerWeek < 1200 ? "Alto" : "Muito alto";

  // Stale exercises
  const staleExercises = findStaleExercises(exercises);

  return {
    suggestedGoal,
    suggestedGoalReason,
    warnings,
    caloricLoadLabel,
    caloricLoadKcalPerWeek,
    staleExercises,
  };
}
