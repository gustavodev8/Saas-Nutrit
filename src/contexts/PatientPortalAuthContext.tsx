import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Patient } from "@/lib/supabase";
import { patientPortalSupabase } from "@/lib/patientPortalSupabase";
import { fetchCurrentPortalPatient } from "@/lib/patientPortalApi";
import {
  buildPatientPortalAuthEmail,
  isValidPatientPortalLogin,
} from "@/lib/patientPortalAuth";
import {
  PatientPortalAuthContext,
  type PatientPortalAuthContextValue,
} from "@/contexts/patientPortalAuthShared";

async function loadPatientSession() {
  const { data } = await patientPortalSupabase.auth.getSession();
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

    const { data: listener } = patientPortalSupabase.auth.onAuthStateChange(() => {
      void syncFromSession();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const loginWithCredentials = useCallback(async (login: string, password: string) => {
    const normalizedLogin = login.trim().toLowerCase();
    if (!normalizedLogin || !password.trim()) {
      return { ok: false, message: "Informe seu login e sua senha." };
    }

    if (!isValidPatientPortalLogin(normalizedLogin)) {
      return { ok: false, message: "Login invalido. Use letras, numeros, ponto, traço ou underscore." };
    }

    const { error } = await patientPortalSupabase.auth.signInWithPassword({
      email: buildPatientPortalAuthEmail(normalizedLogin),
      password,
    });

    if (error) {
      return { ok: false, message: "Login ou senha incorretos." };
    }

    return {
      ok: true,
      message: "Login realizado com sucesso.",
    };
  }, []);

  const logout = useCallback(async () => {
    await patientPortalSupabase.auth.signOut();
    setPatient(null);
    setUserEmail(null);
  }, []);

  const value = useMemo<PatientPortalAuthContextValue>(
    () => ({
      authReady,
      patientReady,
      patient,
      userEmail,
      loginWithCredentials,
      logout,
      refreshPatient: syncFromSession,
    }),
    [authReady, loginWithCredentials, logout, patient, patientReady, syncFromSession, userEmail],
  );

  return (
    <PatientPortalAuthContext.Provider value={value}>
      {children}
    </PatientPortalAuthContext.Provider>
  );
}
