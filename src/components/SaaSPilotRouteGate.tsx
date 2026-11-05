import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface SaaSPilotRouteGateProps {
  enabled: boolean;
  children: ReactNode;
}

export function SaaSPilotRouteGate({ enabled, children }: SaaSPilotRouteGateProps) {
  const { pathname } = useLocation();
  const allowedInPilot = pathname === "/workspace"
    || pathname.startsWith("/workspace/")
    || pathname === "/platform/invitations";

  if (enabled && !allowedInPilot) {
    return <Navigate to="/workspace/login" replace />;
  }

  return children;
}
