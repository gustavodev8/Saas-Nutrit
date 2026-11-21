import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceAnamnesisForm } from "./WorkspaceAnamnesisForm";
import type { WorkspacePatient } from "@/lib/workspacePatients";

const mocks = vi.hoisted(() => ({
  form: vi.fn(),
  fetch: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/components/admin/AnamnesisForm", () => ({
  AnamnesisForm: (props: Record<string, unknown>) => {
    mocks.form(props);
    return <div data-testid="anamnesis-form-adapter">Formulário adaptado</div>;
  },
}));
vi.mock("@/lib/workspaceAnamnesis", () => ({
  fetchWorkspaceAnamnesis: mocks.fetch,
  upsertWorkspaceAnamnesis: mocks.save,
  isWorkspaceAnamnesisEnabled: () => false,
  WORKSPACE_ANAMNESIS_GATE_MESSAGE: "Anamnese bloqueada para validação RLS.",
}));

const patient: WorkspacePatient = {
  id: 41,
  workspace_id: "workspace-a",
  name: "Ana",
  email: null,
  phone: null,
  birth_date: null,
  gender: "F",
  occupation: null,
  city: null,
  created_at: null,
};

describe("WorkspaceAnamnesisForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the workspace release gate closed without querying legacy or workspace data", () => {
    render(<WorkspaceAnamnesisForm workspaceId="workspace-a" patient={patient} />);
    expect(screen.getByRole("status")).toHaveTextContent(/bloqueada/i);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.form).not.toHaveBeenCalled();
  });

  it("fails closed when the patient does not belong to the active workspace", () => {
    render(<WorkspaceAnamnesisForm workspaceId="workspace-b" patient={patient} enabled />);
    expect(screen.getByRole("alert")).toHaveTextContent(/fora do workspace/i);
    expect(mocks.form).not.toHaveBeenCalled();
  });

  it("passes a scoped adapter and scope key to the reused form", async () => {
    mocks.fetch.mockResolvedValue(null);
    mocks.save.mockResolvedValue({ id: 7, workspace_id: "workspace-a", patient_id: 41, structured_data: {} });
    render(<WorkspaceAnamnesisForm workspaceId="workspace-a" patient={patient} enabled />);

    expect(screen.getByTestId("anamnesis-form-adapter")).toBeInTheDocument();
    const props = mocks.form.mock.calls[0][0] as {
      patientId: string;
      scopeKey: string;
      adapter: { fetch: () => Promise<unknown>; save: (value: { patient_id: number; structured_data: object; id?: number }) => Promise<unknown> };
    };
    expect(props.patientId).toBe("41");
    expect(props.scopeKey).toBe("workspace-a:41");
    await props.adapter.fetch();
    await props.adapter.save({ patient_id: 41, structured_data: { goal_primary: "saude_geral" }, id: 7 });
    expect(mocks.fetch).toHaveBeenCalledWith("workspace-a", 41);
    expect(mocks.save).toHaveBeenCalledWith("workspace-a", patient, { goal_primary: "saude_geral" }, 7);
  });
});
