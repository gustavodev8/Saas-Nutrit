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
  it("keeps intake closed by default without collecting or submitting data", () => {
    render(<MemoryRouter><PublicSaaSLandingPage /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/workspace/login");
    expect(screen.getByRole("heading", { name: "Sua prática nutricional, em um só lugar." })).toBeInTheDocument();
    expect(screen.getByLabelText("Prévia ilustrativa do painel")).toBeInTheDocument();
    expect(screen.getByText("Prévia ilustrativa · dados fictícios")).toBeInTheDocument();
    expect(screen.getByText(/solicitações públicas estão temporariamente fechadas/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Solicitar acesso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Pedir acesso" })).not.toBeInTheDocument();
    expect(submitWorkspaceAccessRequest).not.toHaveBeenCalled();
  });

  it("connects the SaaS invitation flow without unsupported pricing or trial claims", () => {
    render(<MemoryRouter><PublicSaaSLandingPage accessRequestsEnabled /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Sua prática nutricional, em um só lugar." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/workspace/login");
    expect(screen.getByRole("link", { name: "Solicitar acesso" })).toHaveAttribute("href", "#solicitar-acesso");
    expect(screen.getByText(/pedido não cria usuário nem workspace/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ })).toBeRequired();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Prévia ilustrativa do painel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contato para privacidade" })).toHaveAttribute("href", "mailto:gustavu.dev@gmail.com");
    expect(screen.queryByText(/grátis|teste gratuito|R\$/i)).not.toBeInTheDocument();
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
