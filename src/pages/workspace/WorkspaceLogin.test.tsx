import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceLogin from "./WorkspaceLogin";

const mocks = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({
    login: mocks.login,
    isAuthenticated: false,
    authReady: false,
  }),
}));

describe("WorkspaceLogin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not link to the pilot root, which redirects back to login", () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <WorkspaceLogin />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Voltar ao site" })).not.toBeInTheDocument();
  });

  it("guides a platform administrator to invitations when workspace membership is missing", async () => {
    mocks.login.mockResolvedValue({
      ok: false,
      message: "Este usuario nao possui uma membership workspace valida.",
    });
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <Routes>
          <Route path="/workspace/login" element={<WorkspaceLogin />} />
          <Route path="/platform/invitations" element={<p>Convites da plataforma</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "master@example.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar no workspace" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O login profissional é para nutricionistas convidados e exige uma membership ativa.",
    );
    const platformLink = screen.getByRole("link", { name: "Abrir convites da plataforma" });
    expect(platformLink).toHaveAttribute("href", "/platform/invitations");
    fireEvent.click(platformLink);
    expect(await screen.findByText("Convites da plataforma")).toBeInTheDocument();
  });
});
