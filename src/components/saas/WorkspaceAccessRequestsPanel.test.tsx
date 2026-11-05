import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceAccessRequestsPanel from "./WorkspaceAccessRequestsPanel";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@/lib/workspaceSupabase", () => ({
  workspaceSupabase: { functions: { invoke } },
}));

const pendingRequest = {
  id: "00000000-0000-4000-8000-000000000501",
  applicant_name: "Ana Nutricionista",
  professional_email: "ana@example.test",
  phone: null,
  crn: null,
  need_category: "meal_planning",
  status: "pending",
  created_at: "2026-11-05T10:00:00Z",
  reviewed_at: null,
};

describe("WorkspaceAccessRequestsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invoke.mockResolvedValue({ data: { ok: true, requests: [pendingRequest] }, error: null });
  });

  it("approves a request and only prepares the existing invitation flow after approval", async () => {
    let currentRequest = pendingRequest;
    invoke.mockImplementation(async (_functionName: string, { body }: { body: { action: string; status?: string } }) => {
      if (body.action === "review") currentRequest = { ...currentRequest, status: body.status };
      return { data: { ok: true, requests: [currentRequest] }, error: null };
    });
    const onPrepareInvite = vi.fn();
    render(<WorkspaceAccessRequestsPanel onPrepareInvite={onPrepareInvite} />);
    await screen.findByText("Ana Nutricionista");
    expect(screen.getByText("Planos alimentares")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));

    await waitFor(() => expect(invoke).toHaveBeenCalledWith("workspace-access-request-admin", {
      body: { action: "review", requestId: pendingRequest.id, status: "approved" },
    }));
    expect(onPrepareInvite).not.toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Preparar convite" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Preparar convite" }));
    expect(onPrepareInvite).toHaveBeenCalledWith({ ...pendingRequest, status: "approved" });
  });

  it("does not show invitation preparation for pending or rejected requests", async () => {
    invoke.mockResolvedValue({
      data: { ok: true, requests: [{ ...pendingRequest, status: "rejected" }] },
      error: null,
    });
    render(<WorkspaceAccessRequestsPanel onPrepareInvite={vi.fn()} />);
    await screen.findByText("Ana Nutricionista");
    expect(screen.queryByRole("button", { name: "Preparar convite" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprovar" })).not.toBeInTheDocument();
  });
});
