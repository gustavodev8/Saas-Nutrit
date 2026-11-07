import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceMeasurementReport } from "./WorkspaceMeasurementReport";
import { PatientMeasurementDetailView } from "./PatientMeasurementDetailView";
import type { WorkspaceMeasurement } from "@/lib/workspaceMeasurements";

function measurement(overrides: Partial<WorkspaceMeasurement> = {}): WorkspaceMeasurement {
  return {
    id: 3,
    workspace_id: "workspace-a",
    patient_id: 41,
    assessment_date: "2026-11-06",
    weight: 70,
    height: 170,
    waist: 82,
    body_fat: 20,
    arm_contract_r: 36,
    arm_contract_l: 34,
    arm_relax_r: 30,
    sf_triceps: 10,
    sf_protocol: "JP3F",
    sf_suprailiac: 12,
    sf_thigh_sf: 16,
    biestyloid_diameter_mm: 55,
    biepicondylar_femur_diameter_mm: 89,
    four_component_reference: "F",
    notes: "Avaliação selecionada",
    ...overrides,
  };
}

describe("WorkspaceMeasurementReport", () => {
  it("supports historical selection and compares bilateral and derived measurements from scoped history", () => {
    const onBack = vi.fn();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<WorkspaceMeasurementReport
      measurementId={3}
      workspaceId="workspace-a"
      patientId={41}
      patientName="Ana"
      workspaceName="Workspace Piloto"
      gender="F"
      birthDate="1990-02-10"
      measurements={[
        measurement({ id: 3, weight: 70, waist: 82 }),
        measurement({ id: 2, assessment_date: "2026-10-06", weight: 74, waist: 86, arm_contract_r: 35, arm_contract_l: 33, notes: "Histórico anterior" }),
        measurement({ id: 1, assessment_date: "2026-09-06", weight: 76, notes: "Baseline" }),
        measurement({ id: 99, workspace_id: "workspace-b", patient_id: 8, notes: "Outro workspace" }),
      ]}
      onBack={onBack}
    />);

    expect(screen.getByTestId("workspace-measurement-report")).toBeInTheDocument();
    const printHeader = screen.getByTestId("workspace-measurement-print-header");
    expect(printHeader).toHaveTextContent("Ana");
    expect(printHeader).toHaveTextContent("Workspace Piloto");
    expect(printHeader).toHaveClass("print:block");
    const detailView = screen.getByTestId("patient-measurement-detail-view");
    expect(detailView).not.toHaveClass("min-h-screen");
    expect(detailView.querySelector(".sticky")).toHaveClass("print:hidden");
    expect(screen.getByRole("heading", { name: "Comparação histórica das avaliações selecionadas" })).toBeInTheDocument();
    expect(screen.getByText("Braço contraído")).toBeInTheDocument();
    expect(screen.getByText("AMB corrigida — Heymsfield (AMBc)")).toBeInTheDocument();
    expect(screen.getAllByText("Massa gorda").length).toBeGreaterThan(1);
    expect(screen.getByText("Σ dobras do protocolo")).toBeInTheDocument();
    expect(screen.getAllByText("Massa muscular estimada").length).toBeGreaterThan(1);
    expect(screen.queryByText("Outro workspace")).not.toBeInTheDocument();
    expect(screen.getByText("2 de 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    expect(screen.getByText("Inicial + atual")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Imprimir / salvar PDF" }));
    expect(print).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao Prontuario" }));
    expect(onBack).toHaveBeenCalledOnce();
    print.mockRestore();
  });

  it("does not compare or reveal records outside the explicit workspace and patient scope", () => {
    render(<WorkspaceMeasurementReport
      measurementId={99}
      workspaceId="workspace-a"
      patientId={41}
      patientName="Ana"
      workspaceName="Workspace Piloto"
      gender={null}
      birthDate={null}
      measurements={[measurement({ id: 99, workspace_id: "workspace-b", patient_id: 8, notes: "Não mostrar" })]}
      onBack={vi.fn()}
    />);
    expect(screen.getByRole("status")).toHaveTextContent("não está disponível");
    expect(screen.queryByText("Não mostrar")).not.toBeInTheDocument();
  });

  it("preserves the legacy detail layout and print actions by default", () => {
    const item = measurement();
    render(<PatientMeasurementDetailView measurement={item} onBack={vi.fn()} />);
    const detailView = screen.getByTestId("patient-measurement-detail-view");
    expect(detailView).toHaveClass("min-h-screen");
    expect(detailView.querySelector(".sticky")).not.toHaveClass("print:hidden");
  });
});
