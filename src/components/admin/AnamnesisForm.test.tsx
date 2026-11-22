import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnamnesisForm, type AnamnesisFormAdapter } from "./AnamnesisForm";
import type { Anamnesis } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  fetchAnamnesis: vi.fn(),
  upsertAnamnesis: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  fetchAnamnesis: mocks.fetchAnamnesis,
  upsertAnamnesis: mocks.upsertAnamnesis,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

describe("AnamnesisForm request scope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears a pending save spinner when the legacy patient changes", async () => {
    const saveA = deferred<{ id: number }>();
    const adapter: AnamnesisFormAdapter = {
      fetch: vi.fn((patientId: number) => Promise.resolve<Anamnesis>({ patient_id: patientId, structured_data: {} })),
      save: vi.fn(() => saveA.promise),
    };
    const view = render(<AnamnesisForm patientId="1" scopeKey="legacy:1" adapter={adapter} />);
    await screen.findByText("Tudo salvo");
    fireEvent.change(screen.getByPlaceholderText("Ex: brócolis, fígado, frutos do mar…"), { target: { value: "couve" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();

    view.rerender(<AnamnesisForm patientId="2" scopeKey="legacy:2" adapter={adapter} />);
    await waitFor(() => expect(screen.getByText("Tudo salvo")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Salvando..." })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    await act(async () => { saveA.resolve({ id: 1 }); });
    expect(screen.queryByRole("button", { name: "Salvando..." })).not.toBeInTheDocument();
    expect(screen.queryByText("Falha ao salvar")).not.toBeInTheDocument();
  });

  it("blocks save after a load error and allows save only after a successful retry", async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error("falha de leitura"))
      .mockResolvedValueOnce({ patient_id: 1, structured_data: {} } satisfies Anamnesis);
    const save = vi.fn().mockResolvedValue({ id: 4 });
    const adapter: AnamnesisFormAdapter = { fetch, save };
    render(<AnamnesisForm patientId="1" scopeKey="legacy:retry" adapter={adapter} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("falha de leitura");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Ex: brócolis, fígado, frutos do mar…"), { target: { value: "couve" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(save).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Recarregar anamnese" }));
    await waitFor(() => expect(screen.getByText("Tudo salvo")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Ex: brócolis, fígado, frutos do mar…"), { target: { value: "couve" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  });

  it("keeps the legacy fetch and upsert path when no adapter is supplied", async () => {
    mocks.fetchAnamnesis.mockResolvedValue({ patient_id: 1, structured_data: {} });
    mocks.upsertAnamnesis.mockResolvedValue({ id: 8 });
    render(<AnamnesisForm patientId="1" scopeKey="legacy:default" />);
    await screen.findByText("Tudo salvo");
    expect(mocks.fetchAnamnesis).toHaveBeenCalledWith(1);
    fireEvent.change(screen.getByPlaceholderText("Ex: brócolis, fígado, frutos do mar…"), { target: { value: "couve" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocks.upsertAnamnesis).toHaveBeenCalledWith(expect.objectContaining({ patient_id: 1, structured_data: expect.objectContaining({ diet_aversions: "couve" }) })));
  });
});
