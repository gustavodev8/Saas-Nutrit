import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import WorkspaceLogin from "./WorkspaceLogin";

vi.mock("@/contexts/WorkspaceAuthContext", () => ({
  useWorkspaceAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
    authReady: false,
  }),
}));

describe("WorkspaceLogin", () => {
  it("does not link to the pilot root, which redirects back to login", () => {
    render(
      <MemoryRouter initialEntries={["/workspace/login"]}>
        <WorkspaceLogin />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Voltar ao site" })).not.toBeInTheDocument();
  });
});
