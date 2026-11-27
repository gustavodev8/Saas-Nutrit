import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspacePrescriptionTab } from "./WorkspacePrescriptionTab";
import type { ReadyFormula, SavedPrescription, Substrate } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  fetchSubstrates: vi.fn(),
  fetchFormulas: vi.fn(),
  fetchPrescriptions: vi.fn(),
}));

vi.mock("@/lib/workspacePrescriptions", () => ({
  fetchWorkspaceSubstrates: mocks.fetchSubstrates,
  fetchWorkspaceReadyFormulas: mocks.fetchFormulas,
  fetchWorkspacePrescriptions: mocks.fetchPrescriptions,
  saveWorkspacePrescription: vi.fn(),
  deleteWorkspacePrescription: vi.fn(),
  workspacePrescriptionsErrorMessage: (err: unknown) => (err instanceof Error ? err.message : "erro"),
}));
vi.mock("@/lib/prescriptionPrint", () => ({ printPrescriptionDocument: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const substrate: Substrate = { id: 1, name: "Magnésio Glicinato", category: "Mineral", unit: "mg", ideal_dose: 400 };
const formula: ReadyFormula = {
  id: 7,
  name: "Protocolo Sono Profundo",
  objective: "Sono",
  pharmaceutical_form: "Cápsulas",
  posology: "1 cápsula à noite",
  items: [{ substrate_id: 1, substrate_name: "Magnésio Glicinato", applied_dose: 200, unit: "mg" }],
};
const saved: SavedPrescription = { id: 3, created_at: "2026-11-01T12:00:00Z", blocks: [] };

describe("WorkspacePrescriptionTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchSubstrates.mockResolvedValue([substrate]);
    mocks.fetchFormulas.mockResolvedValue([formula]);
    mocks.fetchPrescriptions.mockResolvedValue([saved]);
  });

  it("renders the builder scoped by workspace and patient", async () => {
    render(<WorkspacePrescriptionTab workspaceId="workspace-a" patientId={41} patientName="Ana" />);

    expect(await screen.findByText("Receituário vazio")).toBeInTheDocument();
    expect(screen.getByText("Fórmulas Prontas")).toBeInTheDocument();
    expect(screen.getByText("Substratos Avulsos")).toBeInTheDocument();
    expect(screen.getByText("Protocolo Sono Profundo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Imprimir PDF/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Histórico/ })).toHaveTextContent("(1)");
    expect(mocks.fetchSubstrates).toHaveBeenCalled();
    expect(mocks.fetchFormulas).toHaveBeenCalled();
    expect(mocks.fetchPrescriptions).toHaveBeenCalledWith("workspace-a", 41);
  });
});
