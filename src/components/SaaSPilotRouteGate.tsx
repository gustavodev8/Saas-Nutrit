import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface SaaSPilotRouteGateProps {
  enabled: boolean;
  children: ReactNode;
}

export function SaaSPilotRouteGate({ enabled, children }: SaaSPilotRouteGateProps) {
  const { pathname } = useLocation();
  useEffect(() => {
    if (enabled) document.title = "Acesso profissional | Nutri SaaS";
  }, [enabled]);

  const allowedInPilot = pathname === "/"
    || pathname === "/workspace"
    || pathname.startsWith("/workspace/")
    || pathname === "/platform/invitations"
    || pathname === "/platform/reset-password";

  if (enabled && !allowedInPilot) {
    return <Navigate to="/workspace/login" replace />;
  }

  return children;
}
