import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrainingConfirmationDialog, type TrainingConfirmation } from "./TrainingConfirmationDialog";

const confirmation: TrainingConfirmation = {
  title: "Substituir séries e repetições?",
  description: "Os valores preenchidos serão trocados por 3 séries × 10 repetições.",
  confirmLabel: "Substituir valores",
  onConfirm: vi.fn(),
};

describe("TrainingConfirmationDialog", () => {
  it("shows a styled, accessible confirmation with the original choice intact on cancel", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<TrainingConfirmationDialog confirmation={confirmation} onCancel={onCancel} onConfirm={onConfirm} />);

    expect(screen.getByRole("dialog", { name: confirmation.title })).toBeInTheDocument();
    expect(screen.getByText(confirmation.description)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("runs the requested action only after explicit confirmation", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<TrainingConfirmationDialog confirmation={confirmation} onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Substituir valores" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
