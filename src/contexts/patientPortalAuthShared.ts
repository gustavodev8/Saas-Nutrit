import { createContext } from "react";
import type { Patient } from "@/lib/supabase";

export interface PatientPortalAuthContextValue {
  authReady: boolean;
  patientReady: boolean;
  patient: Patient | null;
  userEmail: string | null;
  loginWithCredentials: (
    login: string,
    password: string,
  ) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshPatient: () => Promise<void>;
}

export const PatientPortalAuthContext = createContext<PatientPortalAuthContextValue | null>(null);
