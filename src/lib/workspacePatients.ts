import { workspaceSupabase } from "@/lib/workspaceSupabase";

const PATIENT_COLUMNS = "id, workspace_id, name, email, phone, birth_date, gender, occupation, city, created_at";

export type WorkspacePatientGender = "M" | "F" | "outro";
export type WorkspacePatientGenderFilter = WorkspacePatientGender | "all" | "unspecified";
export type WorkspacePatientSort = "name" | "recent";

export interface WorkspacePatient {
  id: number;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: WorkspacePatientGender | null;
  occupation: string | null;
  city: string | null;
  created_at: string | null;
}

export interface WorkspacePatientInput {
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: WorkspacePatientGender | "";
  occupation: string;
  city: string;
}

export interface WorkspacePatientFilters {
  query: string;
  gender: WorkspacePatientGenderFilter;
  city: string;
  sort: WorkspacePatientSort;
}

export interface WorkspacePatientPage {
  items: WorkspacePatient[];
  page: number;
  pageCount: number;
  total: number;
}

type NormalizedPatientInput = Omit<WorkspacePatient, "id" | "workspace_id" | "created_at">;

function normalizePatientInput(input: WorkspacePatientInput): NormalizedPatientInput {
  return {
    name: input.name.trim(),
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    birth_date: input.birth_date || null,
    gender: input.gender || null,
    occupation: input.occupation.trim() || null,
    city: input.city.trim() || null,
  };
}

export function getWorkspacePatientCities(patients: WorkspacePatient[]): string[] {
  const labels = patients
    .map((patient) => patient.city?.trim())
    .filter((city): city is string => Boolean(city))
    .sort((a, b) => {
      const baseOrder = a.localeCompare(b, "pt-BR", { sensitivity: "base" });
      if (baseOrder) return baseOrder;
      const casingOrder = Number(a === a.toLocaleLowerCase("pt-BR")) - Number(b === b.toLocaleLowerCase("pt-BR"));
      return casingOrder
        || a.localeCompare(b, "pt-BR", { sensitivity: "variant" })
        || (a < b ? -1 : a > b ? 1 : 0);
    });
  const citiesByKey = new Map<string, string>();

  for (const label of labels) {
    const key = label.normalize("NFKC").toLocaleLowerCase("pt-BR");
    if (!citiesByKey.has(key)) citiesByKey.set(key, label);
  }

  return [...citiesByKey.values()];
}

export function filterWorkspacePatients(
  patients: WorkspacePatient[],
  filters: WorkspacePatientFilters,
): WorkspacePatient[] {
  const query = filters.query.trim().toLocaleLowerCase("pt-BR");
  const city = filters.city.trim().toLocaleLowerCase("pt-BR");

  return patients
    .filter((patient) => {
      const searchable = [patient.name, patient.email ?? "", patient.phone ?? "", patient.city ?? "", patient.occupation ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      if (query && !searchable.includes(query)) return false;
      if (filters.gender === "unspecified" && patient.gender) return false;
      if (filters.gender !== "all" && filters.gender !== "unspecified" && patient.gender !== filters.gender) return false;
      if (city && patient.city?.trim().toLocaleLowerCase("pt-BR") !== city) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "recent") {
        return (b.created_at ?? "").localeCompare(a.created_at ?? "") || b.id - a.id;
      }
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) || a.id - b.id;
    });
}

export function paginateWorkspacePatients(
  patients: WorkspacePatient[],
  requestedPage: number,
  pageSize: number,
): WorkspacePatientPage {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(patients.length / safePageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage)), pageCount);
  const start = (page - 1) * safePageSize;

  return { items: patients.slice(start, start + safePageSize), page, pageCount, total: patients.length };
}

export async function fetchWorkspacePatients(workspaceId: string): Promise<WorkspacePatient[]> {
  const { data, error } = await workspaceSupabase
    .from("patients")
    .select(PATIENT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspacePatient[];
}

export async function createWorkspacePatient(
  workspaceId: string,
  input: WorkspacePatientInput,
): Promise<WorkspacePatient> {
  const normalized = normalizePatientInput(input);
  if (!normalized.name) throw new Error("Informe o nome do paciente.");

  const { data, error } = await workspaceSupabase
    .from("patients")
    .insert({ workspace_id: workspaceId, ...normalized })
    .select(PATIENT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as WorkspacePatient;
}

export async function updateWorkspacePatient(
  workspaceId: string,
  patientId: number,
  input: WorkspacePatientInput,
): Promise<WorkspacePatient> {
  const normalized = normalizePatientInput(input);
  if (!normalized.name) throw new Error("Informe o nome do paciente.");

  const { data, error } = await workspaceSupabase
    .from("patients")
    .update(normalized)
    .eq("workspace_id", workspaceId)
    .eq("id", patientId)
    .select(PATIENT_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as WorkspacePatient;
}
