import { useContext } from "react";
import { PatientPortalSettingsContext } from "@/contexts/patientPortalSettingsShared";

export function usePatientPortalSettings() {
  const context = useContext(PatientPortalSettingsContext);

  if (!context) {
    throw new Error("usePatientPortalSettings must be used within PatientPortalSettingsProvider");
  }

  return context;
}
