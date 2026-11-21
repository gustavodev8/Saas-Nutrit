import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useWorkspaceAuth } from "@/contexts/WorkspaceAuthContext";
import { LeafLoader } from "@/components/workspace/LeafLoader";

export default function WorkspaceProtectedRoute({ children }: { children: ReactNode }) {
  const { authReady, membershipReady, isAuthenticated } = useWorkspaceAuth();
  const location = useLocation();

  if (!authReady || !membershipReady) {
    return <div className="flex min-h-screen items-center justify-center"><LeafLoader size="lg" label="Carregando acesso..." /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/workspace/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
