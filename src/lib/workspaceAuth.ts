export type WorkspaceRole = "owner" | "nutritionist" | "assistant";
export type WorkspaceMembershipStatus = "invited" | "active" | "suspended";

export interface WorkspaceMembership {
  workspace_id: string;
  role: WorkspaceRole;
  status: WorkspaceMembershipStatus;
}

export interface ValidWorkspaceMembership {
  workspaceId: string;
  role: "owner" | "nutritionist";
}

export function resolveWorkspaceMembership(
  memberships: WorkspaceMembership[],
): ValidWorkspaceMembership | null {
  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  if (activeMemberships.length !== 1) return null;

  const [membership] = activeMemberships;
  if (membership.role !== "owner" && membership.role !== "nutritionist") return null;
  if (typeof membership.workspace_id !== "string" || !membership.workspace_id.trim()) return null;

  return { workspaceId: membership.workspace_id.trim(), role: membership.role };
}
