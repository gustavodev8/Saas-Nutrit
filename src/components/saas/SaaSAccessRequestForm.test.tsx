import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SaaSAccessRequestForm from "./SaaSAccessRequestForm";

describe("SaaSAccessRequestForm", () => {
  it("sends only triage fields, including the honeypot, and confirms manual review", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SaaSAccessRequestForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " Ana Nutricionista " } });
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: " ana@example.test " } });
    fireEvent.change(screen.getByLabelText(/WhatsApp/), { target: { value: "+55 11 99999-0000" } });
    fireEvent.change(screen.getByLabelText(/CRN/), { target: { value: "CRN-3 12345" } });
    fireEvent.change(screen.getByLabelText(/Qual área você quer organizar/), { target: { value: "meal_planning" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ }));

    fireEvent.click(screen.getByRole("button", { name: "Solicitar acesso" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      name: "Ana Nutricionista",
      professionalEmail: "ana@example.test",
      whatsapp: "+55 11 99999-0000",
      crn: "CRN-3 12345",
      needCategory: "meal_planning",
      consent: true,
      website: "",
    }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("need");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("needSummary");
    expect(await screen.findByRole("status")).toHaveTextContent("não cria uma conta nem um workspace");
  });

  it("shows a generic failure and never renders backend details", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("private backend detail"));
    render(<SaaSAccessRequestForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "ana@example.test" } });
    fireEvent.change(screen.getByLabelText(/Qual área você quer organizar/), { target: { value: "practice_management" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ }));

    fireEvent.click(screen.getByRole("button", { name: "Solicitar acesso" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o pedido");
    expect(screen.queryByText("private backend detail")).not.toBeInTheDocument();
  });

  it("does not submit until the required consent is selected", () => {
    const onSubmit = vi.fn();
    render(<SaaSAccessRequestForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("E-mail profissional"), { target: { value: "ana@example.test" } });

    expect(screen.getByRole("checkbox", { name: /Autorizo o uso dos dados profissionais/ })).toBeRequired();
    expect(screen.getByLabelText(/Qual área você quer organizar/)).toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar acesso" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("offers only fixed categories and has no text field for a custom reason", () => {
    render(<SaaSAccessRequestForm onSubmit={vi.fn()} />);
    const category = screen.getByRole("combobox", { name: /Qual área você quer organizar/ });
    expect(category.querySelectorAll("option")).toHaveLength(6);
    expect(screen.queryByRole("textbox", { name: /Qual área você quer organizar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /outro/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "gustavu.dev@gmail.com" })).toHaveAttribute("href", "mailto:gustavu.dev@gmail.com");
  });
});
