export interface BookingClinicalNotes {
  birthDate?: string;
  sex?: string;
  goal?: string;
  allergies?: string;
  restrictions?: string;
  healthConditions?: string;
  medications?: string;
  hadNutritionist?: string;
  howFound?: string;
  rotina?: string;
  sintomas?: string;
  suplementacao?: string;
  examesPrevios?: string;
  historicoNutri?: string;
  observacoes?: string;
  city?: string;
}

export const GOAL_LABELS: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  ganho_massa: "Ganho de massa",
  saude_geral: "Saúde geral",
  condicao_especifica: "Condição específica",
  gestante: "Gestação / pós-parto",
  outro: "Outro",
};

export const RESTRICT_LABELS: Record<string, string> = {
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  sem_gluten: "Sem glúten",
  sem_lactose: "Sem lactose",
  outra: "Outra restrição",
};

export const FOUND_LABELS: Record<string, string> = {
  instagram: "Instagram",
  indicacao: "Indicação",
  google: "Google",
  outro: "Outro",
};
