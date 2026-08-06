import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, fetchCurrentPortalPatient, type Patient } from "@/lib/supabase";
import {
  PatientPortalAuthContext,
  type PatientPortalAuthContextValue,
} from "@/contexts/patientPortalAuthShared";

async function loadPatientSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function PatientPortalAuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [patientReady, setPatientReady] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const syncFromSession = useCallback(async () => {
    const session = await loadPatientSession();
    const email = session?.user.email?.trim().toLowerCase() ?? null;

    setUserEmail(email);
    setAuthReady(true);

    if (!email) {
      setPatient(null);
      setPatientReady(true);
      return;
    }

    setPatientReady(false);
    const profile = await fetchCurrentPortalPatient();
    setPatient(profile);
    setPatientReady(true);
  }, []);

  useEffect(() => {
    void syncFromSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void syncFromSession();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const requestAccess = useCallback(async (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { ok: false, message: "Informe o e-mail cadastrado no seu prontuario." };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      message: "Enviamos um link de acesso para o seu e-mail.",
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setPatient(null);
    setUserEmail(null);
  }, []);

  const value = useMemo<PatientPortalAuthContextValue>(
    () => ({
      authReady,
      patientReady,
      patient,
      userEmail,
      requestAccess,
      logout,
      refreshPatient: syncFromSession,
    }),
    [authReady, logout, patient, patientReady, requestAccess, syncFromSession, userEmail],
  );

  return (
    <PatientPortalAuthContext.Provider value={value}>
      {children}
    </PatientPortalAuthContext.Provider>
  );
}
