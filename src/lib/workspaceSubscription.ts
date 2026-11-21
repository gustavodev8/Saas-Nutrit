import { workspaceSupabase } from "./workspaceSupabase";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "suspended";

export interface WorkspaceSubscription {
  workspace_id: string;
  plan: string;
  status: SubscriptionStatus;
  trial_ends_at: string;
  mp_preapproval_id: string | null;
  next_payment_date: string | null;
  created_at: string;
}

export function isSubscriptionAccessible(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active";
}

export function trialDaysLeft(trial_ends_at: string): number {
  const diff = new Date(trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export async function fetchWorkspaceSubscription(workspaceId: string): Promise<WorkspaceSubscription | null> {
  const { data, error } = await workspaceSupabase
    .from("workspace_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as WorkspaceSubscription | null;
}

export async function createWorkspaceSelfSignup(workspaceName: string): Promise<string> {
  const { data, error } = await workspaceSupabase.rpc("create_workspace_self_signup", {
    p_workspace_name: workspaceName,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
