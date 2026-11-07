import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminRelatorioAntropometrico from "./AdminRelatorioAntropometrico";

const mocks = vi.hoisted(() => ({ fetchPatient: vi.fn(), fetchMeasurements: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  fetchPatient: mocks.fetchPatient,
  fetchMeasurements: mocks.fetchMeasurements,
}));

describe("AdminRelatorioAntropometrico legacy wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchPatient.mockResolvedValue({ id: 41, name: "Ana", gender: "F", birth_date: "1990-02-10" });
    mocks.fetchMeasurements.mockResolvedValue([
      { id: 3, patient_id: 41, assessment_date: "2026-11-06", weight: 70, height: 170 },
      { id: 2, patient_id: 41, assessment_date: "2026-10-06", weight: 72, height: 170 },
      { id: 1, patient_id: 41, assessment_date: "2026-09-06", weight: 74, height: 170 },
    ]);
  });

  it("keeps its patient/history fetch and selection behavior while using shared comparison helpers", async () => {
    render(<MemoryRouter initialEntries={["/admin/pacientes/41/relatorio-antropometrico"]}>
      <Routes><Route path="/admin/pacientes/:id/relatorio-antropometrico" element={<AdminRelatorioAntropometrico />} /></Routes>
    </MemoryRouter>);

    expect(await screen.findByText("Relatório Antropométrico")).toBeInTheDocument();
    expect(mocks.fetchPatient).toHaveBeenCalledOnce();
    expect(mocks.fetchPatient).toHaveBeenCalledWith(41);
    expect(mocks.fetchMeasurements).toHaveBeenCalledOnce();
    expect(mocks.fetchMeasurements).toHaveBeenCalledWith(41);
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Todas" }));
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    expect(screen.getAllByText("IMC").length).toBeGreaterThan(1);
  });
});
