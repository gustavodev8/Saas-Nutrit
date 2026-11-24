import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeafLoader } from "./LeafLoader";

describe("LeafLoader", () => {
  it("announces the loading label without exposing decorative leaves", () => {
    const { container } = render(<LeafLoader label="Carregando pacientes…" />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando pacientes…");
    expect(container.querySelectorAll("svg.leaf-loader__leaf")).toHaveLength(3);
    expect(container.querySelector("[aria-hidden='true'] svg")).toBeInTheDocument();
  });

  it("provides a static reduced-motion state", () => {
    const { container } = render(<LeafLoader size="sm" label="" />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando...");
    expect(container.querySelector("style")?.textContent).toContain("prefers-reduced-motion: reduce");
    expect(container.querySelector("style")?.textContent).toContain("animation: none");
  });
});
