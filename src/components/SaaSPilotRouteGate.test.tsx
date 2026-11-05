import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SaaSPilotRouteGate } from "./SaaSPilotRouteGate";
import { isSaaSPilotModeEnabled } from "@/lib/saasPilotMode";

function CurrentRoute() {
  const { pathname } = useLocation();
  return <p>Rota: {pathname}</p>;
}

function renderRoutes(flag: string | undefined, initialPath: string) {
  const enabled = isSaaSPilotModeEnabled(flag);
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SaaSPilotRouteGate enabled={enabled}>
        <Routes>
          <Route path="/" element={<p>{enabled ? "Landing SaaS" : "Landing legada"}</p>} />
          <Route path="/consultas" element={<p>Consultas legadas</p>} />
          <Route path="/workspace/*" element={<CurrentRoute />} />
          <Route path="/platform/invitations" element={<CurrentRoute />} />
          <Route path="*" element={<p>Não encontrado legado</p>} />
        </Routes>
      </SaaSPilotRouteGate>
    </MemoryRouter>,
  );
}

describe("SaaS pilot route gate", () => {
  it("allows the SaaS landing, workspace, and platform invitation routes and redirects unknown paths", () => {
    expect(isSaaSPilotModeEnabled("true")).toBe(true);

    const allowedRoutes = ["/", "/workspace/login", "/workspace/accept", "/platform/invitations"];
    for (const path of allowedRoutes) {
      const { unmount } = renderRoutes("true", path);
      expect(path === "/" ? screen.getByText("Landing SaaS") : screen.getByText(`Rota: ${path}`)).toBeInTheDocument();
      unmount();
    }

    for (const path of ["/unknown", "/consultas"]) {
      const { unmount } = renderRoutes("true", path);
      expect(screen.getByText("Rota: /workspace/login")).toBeInTheDocument();
      unmount();
    }
  });

  it("preserves legacy routes unless the flag is exactly true", () => {
    expect(isSaaSPilotModeEnabled(undefined)).toBe(false);
    expect(isSaaSPilotModeEnabled("false")).toBe(false);

    const { unmount: unmountRoot } = renderRoutes(undefined, "/");
    expect(screen.getByText("Landing legada")).toBeInTheDocument();
    unmountRoot();

    renderRoutes("false", "/consultas");
    expect(screen.getByText("Consultas legadas")).toBeInTheDocument();
  });

  it("sets a SaaS title only when pilot mode is enabled", () => {
    document.title = "Título legado";
    const { unmount: unmountPilot } = renderRoutes("true", "/workspace/login");
    expect(document.title).toBe("Acesso profissional | Nutri SaaS");
    unmountPilot();

    document.title = "Nutricionista Clínica e Esportiva";
    const { unmount: unmountLegacy } = renderRoutes(undefined, "/consultas");
    expect(document.title).toBe("Nutricionista Clínica e Esportiva");
    unmountLegacy();
  });
});
