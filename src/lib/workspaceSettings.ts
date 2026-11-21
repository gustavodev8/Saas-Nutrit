import { workspaceSupabase } from "./workspaceSupabase";

export interface WorkspaceInfo {
  id: string;
  name: string;
  created_at: string;
}

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
    .select("id, name, created_at")
    .eq("id", workspaceId)
    .single();
  if (error) throw new Error(error.message);
  return data as WorkspaceInfo;
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
