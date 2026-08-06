export type PatientPortalNavigationSettings = {
  home: boolean;
  plan: boolean;
  consultations: boolean;
  documents: boolean;
};

export type PatientPortalHomeCardSettings = {
  nextConsultation: boolean;
  currentPlan: boolean;
  latestAssessment: boolean;
  pendingExams: boolean;
  reports: boolean;
  materials: boolean;
  latestGuidance: boolean;
};

export type PatientPortalPlanSectionSettings = {
  summary: boolean;
  goals: boolean;
  meals: boolean;
  notes: boolean;
  calories: boolean;
  macros: boolean;
};

export type PatientPortalConsultationSectionSettings = {
  upcoming: boolean;
  history: boolean;
  paymentStatus: boolean;
  appointmentType: boolean;
};

export type PatientPortalDocumentSectionSettings = {
  exams: boolean;
  reports: boolean;
  materials: boolean;
  nextSteps: boolean;
  attachments: boolean;
};

export type PatientPortalBrandingSettings = {
  portalTitle: string;
  portalSubtitle: string;
  welcomeMessage: string;
  supportLabel: string;
};

export type PatientPortalSettings = {
  navigation: PatientPortalNavigationSettings;
  home: PatientPortalHomeCardSettings;
  plan: PatientPortalPlanSectionSettings;
  consultations: PatientPortalConsultationSectionSettings;
  documents: PatientPortalDocumentSectionSettings;
  branding: PatientPortalBrandingSettings;
};

export const DEFAULT_PATIENT_PORTAL_SETTINGS: PatientPortalSettings = {
  navigation: {
    home: true,
    plan: true,
    consultations: true,
    documents: true,
  },
  home: {
    nextConsultation: true,
    currentPlan: true,
    latestAssessment: true,
    pendingExams: true,
    reports: true,
    materials: true,
    latestGuidance: true,
  },
  plan: {
    summary: true,
    goals: true,
    meals: true,
    notes: true,
    calories: true,
    macros: true,
  },
  consultations: {
    upcoming: true,
    history: true,
    paymentStatus: true,
    appointmentType: true,
  },
  documents: {
    exams: true,
    reports: true,
    materials: true,
    nextSteps: true,
    attachments: true,
  },
  branding: {
    portalTitle: "Portal do paciente",
    portalSubtitle: "Sua central de acompanhamento nutricional",
    welcomeMessage: "Acompanhe plano, consultas e documentos em um so lugar.",
    supportLabel: "Fale com a clinica",
  },
};

export type PatientPortalFlagKey =
  | `navigation.${keyof PatientPortalNavigationSettings}`
  | `home.${keyof PatientPortalHomeCardSettings}`
  | `plan.${keyof PatientPortalPlanSectionSettings}`
  | `consultations.${keyof PatientPortalConsultationSectionSettings}`
  | `documents.${keyof PatientPortalDocumentSectionSettings}`;

type PatientPortalSectionKey = Exclude<keyof PatientPortalSettings, "branding">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function mergeBooleanSection<T extends Record<string, boolean>>(defaults: T, input: unknown): T {
  if (!isRecord(input)) {
    return { ...defaults };
  }

  const nextEntries = Object.entries(defaults).map(([key, fallback]) => [
    key,
    readBoolean(input[key], fallback),
  ]);

  return Object.fromEntries(nextEntries) as T;
}

function mergeBrandingSection(
  defaults: PatientPortalBrandingSettings,
  input: unknown,
): PatientPortalBrandingSettings {
  if (!isRecord(input)) {
    return { ...defaults };
  }

  return {
    portalTitle: readString(input.portalTitle, defaults.portalTitle),
    portalSubtitle: readString(input.portalSubtitle, defaults.portalSubtitle),
    welcomeMessage: readString(input.welcomeMessage, defaults.welcomeMessage),
    supportLabel: readString(input.supportLabel, defaults.supportLabel),
  };
}

export function mergePatientPortalSettings(
  input: unknown,
  defaults: PatientPortalSettings = DEFAULT_PATIENT_PORTAL_SETTINGS,
): PatientPortalSettings {
  if (!isRecord(input)) {
    return clonePatientPortalSettings(defaults);
  }

  return {
    navigation: mergeBooleanSection(defaults.navigation, input.navigation),
    home: mergeBooleanSection(defaults.home, input.home),
    plan: mergeBooleanSection(defaults.plan, input.plan),
    consultations: mergeBooleanSection(defaults.consultations, input.consultations),
    documents: mergeBooleanSection(defaults.documents, input.documents),
    branding: mergeBrandingSection(defaults.branding, input.branding),
  };
}

export function clonePatientPortalSettings(
  settings: PatientPortalSettings = DEFAULT_PATIENT_PORTAL_SETTINGS,
): PatientPortalSettings {
  return {
    navigation: { ...settings.navigation },
    home: { ...settings.home },
    plan: { ...settings.plan },
    consultations: { ...settings.consultations },
    documents: { ...settings.documents },
    branding: { ...settings.branding },
  };
}

function isSectionKey(value: string): value is PatientPortalSectionKey {
  return value === "navigation" || value === "home" || value === "plan" || value === "consultations" || value === "documents";
}

export function setPatientPortalFlag(
  settings: PatientPortalSettings,
  key: PatientPortalFlagKey,
  value: boolean,
): PatientPortalSettings {
  const [section, field] = key.split(".");

  if (!isSectionKey(section)) {
    return clonePatientPortalSettings(settings);
  }

  return {
    ...clonePatientPortalSettings(settings),
    [section]: {
      ...settings[section],
      [field]: value,
    },
  };
}

export function isPatientPortalRouteVisible(
  settings: PatientPortalSettings,
  route: keyof PatientPortalNavigationSettings,
): boolean {
  return settings.navigation[route];
}

