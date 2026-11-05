import { workspaceSupabase } from "@/lib/workspaceSupabase";

export type WorkspaceAccessRequestCategory =
  | "patient_management"
  | "meal_planning"
  | "appointments"
  | "clinical_records"
  | "practice_management";

export interface WorkspaceAccessRequestInput {
  applicantName: string;
  professionalEmail: string;
  phone?: string;
  crn?: string;
  needCategory: WorkspaceAccessRequestCategory;
  consent: boolean;
  website?: string;
}

export async function submitWorkspaceAccessRequest(input: WorkspaceAccessRequestInput): Promise<void> {
  const { data, error } = await workspaceSupabase.functions.invoke("workspace-access-request", {
    body: input,
  });
  if (error || data?.ok !== true) throw new Error("request_failed");
}
