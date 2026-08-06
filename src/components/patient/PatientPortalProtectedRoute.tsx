import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";

interface PatientPortalProtectedRouteProps {
  children: ReactNode;
}

export default function PatientPortalProtectedRoute({
  children,
}: PatientPortalProtectedRouteProps) {
  const { authReady, patientReady, userEmail, patient } = usePatientPortalAuth();
  const location = useLocation();

  if (!authReady || !patientReady) {
    return null;
  }

  if (!userEmail) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (!patient) {
    return <Navigate to="/portal/login?status=sem-acesso" replace />;
  }

  return <>{children}</>;
}
