import { useContext } from "react";
import { PatientPortalAuthContext } from "@/contexts/patientPortalAuthShared";

export function usePatientPortalAuth() {
  const context = useContext(PatientPortalAuthContext);
  if (!context) {
    throw new Error("usePatientPortalAuth must be used within PatientPortalAuthProvider");
  }
  return context;
}
