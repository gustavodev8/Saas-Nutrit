import { supabase } from "@/lib/supabase";

export type WorkspaceScopeResult =
  | { status: "legacy"; workspaceId: null }
  | { status: "workspace"; workspaceId: string }
  | { status: "denied"; reason: "unauthenticated" | "query_error" | "ambiguous" | "membership_not_authorized" | "invalid_workspace" | "session_changed" };

interface MembershipRow {
  workspace_id: unknown;
  role: unknown;
  status: unknown;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveWorkspaceScope(): Promise<WorkspaceScopeResult> {
  try {
    const { data: before, error: beforeError } = await supabase.auth.getSession();
    const userId = before?.session?.user.id;
    if (beforeError || !userId) return { status: "denied", reason: "unauthenticated" };

    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, status")
      .limit(2);

    if (error || !Array.isArray(data)) return { status: "denied", reason: "query_error" };
    if (data.length > 1) return { status: "denied", reason: "ambiguous" };

    const { data: after, error: afterError } = await supabase.auth.getSession();
    if (afterError || after?.session?.user.id !== userId) {
      return { status: "denied", reason: "session_changed" };
    }

    if (data.length === 0) return { status: "legacy", workspaceId: null };

    const membership = data[0] as MembershipRow;
    if (membership.status !== "active"
      || (membership.role !== "owner" && membership.role !== "nutritionist")) {
      return { status: "denied", reason: "membership_not_authorized" };
    }
    if (typeof membership.workspace_id !== "string" || !UUID_PATTERN.test(membership.workspace_id)) {
      return { status: "denied", reason: "invalid_workspace" };
    }

    return { status: "workspace", workspaceId: membership.workspace_id };
  } catch {
    return { status: "denied", reason: "query_error" };
  }
}
