import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/workspace/WorkspaceBookingSettingsTab", () => ({
  WorkspaceBookingSettingsTab: () => null,
}));
vi.mock("@/contexts/WorkspaceAuthContext", () => ({ useWorkspaceAuth: () => ({}) }));
vi.mock("@/lib/workspaceSettings", () => ({
  ALL_PORTAL_TABS: [],
  fetchWorkspaceInfo: vi.fn(),
  fetchWorkspaceMembers: vi.fn(),
  ROLE_LABELS: {},
  STATUS_LABELS: {},
  updateWorkspaceName: vi.fn(),
  updateWorkspaceProfile: vi.fn(),
  updateWorkspacePortal: vi.fn(),
}));
vi.mock("@/lib/workspaceSubscription", () => ({
  initiateWorkspaceSubscription: vi.fn(),
  isSubscriptionAccessible: vi.fn(),
  trialDaysLeft: vi.fn(),
}));

import { getInitialWorkspaceSettingsTab } from "./WorkspaceSettingsPage";

describe("getInitialWorkspaceSettingsTab", () => {
  it("prioritizes a valid tab query parameter over subscription feedback", () => {
    expect(getInitialWorkspaceSettingsTab(new URLSearchParams("tab=portal&subscribed=1"))).toBe("portal");
  });

  it("falls back to the plan tab after a successful subscription", () => {
    expect(getInitialWorkspaceSettingsTab(new URLSearchParams("tab=unknown&subscribed=1"))).toBe("plano");
  });

  it("falls back to profile without a valid tab or subscription feedback", () => {
    expect(getInitialWorkspaceSettingsTab(new URLSearchParams("tab=unknown"))).toBe("perfil");
  });
});
