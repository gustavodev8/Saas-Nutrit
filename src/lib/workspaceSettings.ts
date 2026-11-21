import { workspaceSupabase } from "./workspaceSupabase";

export interface WorkspaceInfo {
  id: string;
  name: string;
  created_at: string;
  display_name: string | null;
  crn: string | null;
  specialty: string | null;
  bio: string | null;
  portal_accent: string | null;
  portal_welcome_msg: string | null;
  portal_tabs: string[];
}

export interface WorkspaceProfileInput {
  display_name: string;
  crn: string;
  specialty: string;
  bio: string;
}

export interface WorkspacePortalInput {
  portal_accent: string;
  portal_welcome_msg: string;
  portal_tabs: string[];
}

export const ALL_PORTAL_TABS = [
  { key: "plano",      label: "Plano alimentar" },
  { key: "treinos",    label: "Treinos" },
  { key: "consultas",  label: "Consultas" },
  { key: "documentos", label: "Documentos" },
] as const;

export interface WorkspaceMemberInfo {
  user_id: string;
  email: string;
  role: "owner" | "nutritionist" | "assistant";
  status: "invited" | "active" | "suspended";
  created_at: string;
}

export async function fetchWorkspaceInfo(workspaceId: string): Promise<WorkspaceInfo> {
  const { data, error } = await workspaceSupabase
    .from("workspaces")
    .select("id, name, created_at, display_name, crn, specialty, bio, portal_accent, portal_welcome_msg, portal_tabs")
    .eq("id", workspaceId)
    .single();
  if (error) throw new Error(error.message);
  const raw = data as Record<string, unknown>;
  return {
    ...raw,
    portal_tabs: Array.isArray(raw.portal_tabs)
      ? (raw.portal_tabs as string[])
      : ["plano", "treinos", "consultas", "documentos"],
  } as WorkspaceInfo;
}

export async function updateWorkspaceProfile(
  workspaceId: string,
  input: WorkspaceProfileInput,
): Promise<void> {
  const { error } = await workspaceSupabase.rpc("update_workspace_profile", {
    p_workspace_id: workspaceId,
    p_display_name: input.display_name,
    p_crn: input.crn,
    p_specialty: input.specialty,
    p_bio: input.bio,
  });
  if (error) throw new Error(error.message);
}

export async function updateWorkspacePortal(
  workspaceId: string,
  input: WorkspacePortalInput,
): Promise<void> {
  const { error } = await workspaceSupabase.rpc("update_workspace_portal", {
    p_workspace_id: workspaceId,
    p_portal_accent: input.portal_accent,
    p_portal_welcome: input.portal_welcome_msg,
    p_portal_tabs: input.portal_tabs,
  });
  if (error) throw new Error(error.message);
}

export async function updateWorkspaceName(workspaceId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 120) throw new Error("Nome deve ter entre 1 e 120 caracteres.");
  const { error } = await workspaceSupabase.rpc("update_workspace_name", {
    p_workspace_id: workspaceId,
    p_name: trimmed,
  });
  if (error) throw new Error(error.message);
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberInfo[]> {
  const { data, error } = await workspaceSupabase.rpc("list_workspace_members", {
    p_workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceMemberInfo[];
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  nutritionist: "Nutricionista",
  assistant: "Assistente",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  invited: "Convite pendente",
  suspended: "Suspenso",
};
