import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { ExerciseAutocomplete, type ExerciseCatalogSuggestion, type ExercisePrescriptionSuggestion } from "./ExerciseAutocomplete";

const exercises: ExerciseCatalogSuggestion[] = [
  { id: 1, name: "Elevação pélvica", search_aliases: ["ponte de glúteo"] },
  { id: 2, name: "Supino reto", search_aliases: ["bench press"] },
];

const prescriptions: ExercisePrescriptionSuggestion[] = [
  { id: 21, name: "Agachamento livre · 3×12", search_aliases: ["agachamento"], sets: "3", repetitions: "12", reference_load: "20 kg", rest: "90 s", instructions: "Progressão de carga", demo_url: "" },
  { id: 22, name: "Supino reto · 4×10", search_aliases: ["bench press"], sets: "4", repetitions: "10", reference_load: "30 kg", rest: "60 s", instructions: "Pausa no final", demo_url: "" },
  { id: 23, name: "Favorito três", sets: "3", repetitions: "8", reference_load: "", rest: "", instructions: "", demo_url: "" },
  { id: 24, name: "Favorito quatro", sets: "2", repetitions: "12", reference_load: "", rest: "", instructions: "", demo_url: "" },
  { id: 25, name: "Favorito cinco", sets: "4", repetitions: "10", reference_load: "", rest: "", instructions: "", demo_url: "" },
  { id: 26, name: "Favorito oculto seis", search_aliases: ["favorito fora do top quatro"], sets: "5", repetitions: "6", reference_load: "50 kg", rest: "120 s", instructions: "Nota da receita salva", demo_url: "" },
];

function ControlledAutocomplete({ onSelect, onSelectPrescription, withPrescriptions = false }: {
  onSelect: (item: ExerciseCatalogSuggestion) => void;
  onSelectPrescription?: (preset: ExercisePrescriptionSuggestion) => void;
  withPrescriptions?: boolean;
}) {
  const [value, setValue] = useState("");
  return <ExerciseAutocomplete id="exercise" value={value} items={exercises} prescriptions={withPrescriptions ? prescriptions : []} onChange={setValue} onSelect={(item) => { onSelect(item); setValue(""); }} onSelectPrescription={(preset) => { onSelectPrescription?.(preset); setValue(""); }} />;
}

describe("ExerciseAutocomplete", () => {
  it("finds accented catalog names with an unaccented query and selects by click", () => {
    const onSelect = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "elevacao pelvica" } });
    fireEvent.click(screen.getByRole("option", { name: /Elevação pélvica/i }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(exercises[0]));
  });

  it("supports normalized alias search and keyboard selection", () => {
    const onSelect = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "PONTE de gluteo" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(exercises[0]));
  });

  it("searches saved prescriptions and catalog together, including aliases and settings", () => {
    const onSelect = vi.fn();
    const onSelectPrescription = vi.fn();
    render(<ControlledAutocomplete onSelect={onSelect} onSelectPrescription={onSelectPrescription} withPrescriptions />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "AGACHAMENTO progressao" } });

    expect(screen.getByRole("option", { name: /Agachamento livre · 3×12.*Prescrição salva · 3 séries · 12 rep\./i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Agachamento livre · 3×12/i }));
    expect(onSelectPrescription).toHaveBeenCalledWith(prescriptions[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects a saved prescription with the keyboard and keeps focus on the search", () => {
    const onSelectPrescription = vi.fn();
    render(<ControlledAutocomplete onSelect={vi.fn()} onSelectPrescription={onSelectPrescription} withPrescriptions />);

    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "bench press" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelectPrescription).toHaveBeenCalledWith(prescriptions[1]);
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue("");
    expect(screen.getByRole("listbox", { name: "Prescrições salvas" })).toBeInTheDocument();
  });

  it("offers quick saved prescriptions when focused and keeps the picker open after a click", () => {
    const onSelectPrescription = vi.fn();
    render(<ControlledAutocomplete onSelect={vi.fn()} onSelectPrescription={onSelectPrescription} withPrescriptions />);

    const input = screen.getByRole("combobox");
    act(() => input.focus());
    expect(screen.getByRole("listbox", { name: "Prescrições salvas" })).toBeInTheDocument();
    const option = screen.getByRole("option", { name: /Agachamento livre · 3×12/i });
    fireEvent.mouseDown(option);
    fireEvent.click(option);

    expect(onSelectPrescription).toHaveBeenCalledWith(prescriptions[0]);
    expect(document.activeElement).toBe(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("can still search saved prescriptions beyond the four quick suggestions", () => {
    render(<ControlledAutocomplete onSelect={vi.fn()} onSelectPrescription={vi.fn()} withPrescriptions />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "favorito fora do top quatro" } });

    expect(screen.getByRole("option", { name: /Favorito oculto seis.*Prescrição salva · 5 séries · 6 rep\./i })).toBeInTheDocument();
  });

  it("keeps suggestions in the document flow so editor bars cannot clip them", () => {
    render(<ControlledAutocomplete onSelect={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "supino" } });

    const listbox = screen.getByRole("listbox", { name: "Sugestões de exercícios" });
    expect(listbox).not.toHaveClass("absolute");
    expect(listbox).toHaveClass("overflow-y-auto");
  });

  it("shows a useful empty state without closing the combobox", () => {
    render(<ControlledAutocomplete onSelect={vi.fn()} />);

    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "exercicio inexistente" } });

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum exercício encontrado");
  });
});
