import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { submitWorkspaceAccessRequest } from "@/lib/workspaceAccessRequests";
import PublicSaaSLandingPage from "./PublicSaaSLandingPage";

vi.mock("@/lib/workspaceAccessRequests", () => ({
  submitWorkspaceAccessRequest: vi.fn(),
}));

describe("PublicSaaSLandingPage", () => {
  it("keeps public signup and current pricing visible without collecting access requests by default", () => {
    render(<MemoryRouter><PublicSaaSLandingPage /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/workspace/login");
    expect(screen.getByRole("link", { name: "Criar workspace grátis" })).toHaveAttribute("href", "/workspace/signup");
    expect(screen.getByRole("heading", { level: 1, name: "Nutrit" })).toBeInTheDocument();
    expect(screen.getByText(/Sua prática nutricional, em um só lugar/)).toBeInTheDocument();
    expect(screen.getByLabelText("Prévia ilustrativa do painel")).toBeInTheDocument();
    expect(screen.getByText("Prévia ilustrativa · dados fictícios")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Do cadastro ao acompanhamento" })).toBeInTheDocument();
    expect(screen.getByText(/30 dias grátis após confirmar o e-mail/)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$79,90/)).toHaveLength(2);
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    expect(screen.queryByText(/acesso por convite|solicitações públicas estão temporariamente fechadas/i)).not.toBeInTheDocument();
    expect(submitWorkspaceAccessRequest).not.toHaveBeenCalled();
  });

  it("keeps optional contact requests secondary to public signup", () => {
    render(<MemoryRouter><PublicSaaSLandingPage accessRequestsEnabled /></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: "Nutrit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/workspace/login");
    expect(screen.getByRole("link", { name: "Criar workspace grátis" })).toHaveAttribute("href", "/workspace/signup");
    expect(screen.getByRole("button", { name: "Solicitar acesso" })).toBeInTheDocument();
    expect(screen.getByText(/pedido não cria usuário nem workspace/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ })).toBeRequired();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Prévia ilustrativa do painel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contato para privacidade" })).toHaveAttribute("href", "mailto:gustavu.dev@gmail.com");
    expect(screen.getAllByText(/R\$79,90/)).toHaveLength(2);
  });

  it("maps the form fields to the access-request endpoint contract", async () => {
    render(<MemoryRouter><PublicSaaSLandingPage accessRequestsEnabled /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Nutricionista" } });
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByLabelText(/Qual área você quer organizar/), { target: { value: "practice_management" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar acesso" }));

    await waitFor(() => expect(vi.mocked(submitWorkspaceAccessRequest)).toHaveBeenCalledWith({
      applicantName: "Ana Nutricionista",
      professionalEmail: "ana@example.test",
      phone: undefined,
      crn: undefined,
      needCategory: "practice_management",
      consent: true,
      website: "",
    }));
  });
});
