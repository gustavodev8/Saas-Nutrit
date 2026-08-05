export interface PreConsultationNotes {
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

export const PRE_CONSULTATION_FIELDS = [
  "birthDate",
  "sex",
  "goal",
  "allergies",
  "restrictions",
  "healthConditions",
  "medications",
  "hadNutritionist",
  "howFound",
  "rotina",
  "sintomas",
  "suplementacao",
  "examesPrevios",
  "historicoNutri",
  "observacoes",
  "city",
] as const satisfies ReadonlyArray<keyof PreConsultationNotes>;

type PreConsultationField = (typeof PRE_CONSULTATION_FIELDS)[number];
type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const parseNotesRecord = (notes?: string | null): UnknownRecord => {
  if (!notes?.trim()) return {};

  try {
    const parsed = JSON.parse(notes) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const normalizePreConsultation = (
  input?: Partial<Record<PreConsultationField, unknown>> | null,
): PreConsultationNotes => {
  if (!input) return {};

  const normalized: PreConsultationNotes = {};

  for (const field of PRE_CONSULTATION_FIELDS) {
    const value = normalizeString(input[field]);
    if (value) normalized[field] = value;
  }

  return normalized;
};

export const parsePreConsultationNotes = (notes?: string | null): PreConsultationNotes => {
  const parsed = parseNotesRecord(notes);

  return normalizePreConsultation({
    ...parsed,
    observacoes:
      normalizeString(parsed.observacoes) ?? normalizeString(parsed.obs),
    city: normalizeString(parsed.city) ?? normalizeString(parsed._city),
  });
};

export const buildPreConsultationNotesRecord = (
  input?: Partial<Record<PreConsultationField, unknown>> | null,
  baseNotes?: string | UnknownRecord | null,
): UnknownRecord => {
  const baseRecord =
    typeof baseNotes === "string"
      ? parseNotesRecord(baseNotes)
      : isRecord(baseNotes)
        ? { ...baseNotes }
        : {};

  const nextRecord: UnknownRecord = { ...baseRecord };
  const mergedStructured = parsePreConsultationNotes(JSON.stringify(baseRecord));

  for (const field of PRE_CONSULTATION_FIELDS) {
    delete nextRecord[field];
  }

  delete nextRecord._city;
  delete nextRecord.obs;

  if (input) {
    for (const field of PRE_CONSULTATION_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(input, field)) continue;

      const value = normalizeString(input[field]);
      if (value) mergedStructured[field] = value;
      else delete mergedStructured[field];
    }
  }

  return {
    ...nextRecord,
    ...mergedStructured,
  };
};

export const stringifyPreConsultationNotes = (
  input?: Partial<Record<PreConsultationField, unknown>> | null,
  baseNotes?: string | UnknownRecord | null,
): string | null => {
  const nextRecord = buildPreConsultationNotesRecord(input, baseNotes);
  return Object.keys(nextRecord).length > 0 ? JSON.stringify(nextRecord) : null;
};
