import { describe, expect, it } from "vitest";
import { resolveWorkspaceMembership } from "./workspaceAuth";

describe("resolveWorkspaceMembership", () => {
  it("accepts exactly one active owner or nutritionist", () => {
    expect(resolveWorkspaceMembership([{ workspace_id: "a", role: "owner", status: "active" }])).toEqual({ workspaceId: "a", role: "owner" });
    expect(resolveWorkspaceMembership([{ workspace_id: "b", role: "nutritionist", status: "active" }])).toEqual({ workspaceId: "b", role: "nutritionist" });
  });

  it("rejects missing, suspended, assistant, and ambiguous memberships", () => {
    expect(resolveWorkspaceMembership([])).toBeNull();
    expect(resolveWorkspaceMembership([{ workspace_id: "a", role: "owner", status: "suspended" }])).toBeNull();
    expect(resolveWorkspaceMembership([{ workspace_id: "a", role: "assistant", status: "active" }])).toBeNull();
    expect(resolveWorkspaceMembership([
      { workspace_id: "a", role: "owner", status: "active" },
      { workspace_id: "b", role: "nutritionist", status: "active" },
    ])).toBeNull();
  });

  it("rejects an active owner membership without a usable workspace id", () => {
    expect(resolveWorkspaceMembership([{ workspace_id: "", role: "owner", status: "active" }])).toBeNull();
    expect(resolveWorkspaceMembership([{ workspace_id: "   ", role: "nutritionist", status: "active" }])).toBeNull();
  });

  it("requires exactly one active membership even when the other role is assistant", () => {
    expect(resolveWorkspaceMembership([
      { workspace_id: "a", role: "owner", status: "active" },
      { workspace_id: "b", role: "assistant", status: "active" },
    ])).toBeNull();
  });
});
