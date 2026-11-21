import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PATIENT_PORTAL_SETTINGS,
  clonePatientPortalSettings,
  mergePatientPortalSettings,
  type PatientPortalSettings,
} from "@/lib/patientPortalSettings";
import {
  fetchPatientPortalSettings,
  savePatientPortalSettings,
  supabase,
} from "@/lib/supabase";
import {
  PatientPortalSettingsContext,
  type PatientPortalSettingsContextValue,
  type PatientPortalSettingsSaveStatus,
} from "@/contexts/patientPortalSettingsShared";

export function PatientPortalSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PatientPortalSettings>(() =>
    clonePatientPortalSettings(DEFAULT_PATIENT_PORTAL_SETTINGS),
  );
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<PatientPortalSettingsSaveStatus>("idle");

  const reloadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const nextSettings = await fetchPatientPortalSettings();
      setSettings(nextSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let loadedForUserId: string | null = null;

    const loadForSession = (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      const userId = session?.user.id ?? null;
      if (!userId) {
        loadedForUserId = null;
        if (mounted) setLoading(false);
        return;
      }

      if (userId === loadedForUserId) {
        return;
      }

      loadedForUserId = userId;
      void reloadSettings();
    };

    void supabase.auth.getSession().then(({ data }) => loadForSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadForSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [reloadSettings]);

  useEffect(() => {
    if (saveStatus !== "saved" && saveStatus !== "error") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveStatus("idle");
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [saveStatus]);

  const replaceSettings = useCallback(async (nextSettings: PatientPortalSettings) => {
    const normalized = mergePatientPortalSettings(nextSettings);
    setSaveStatus("saving");

    const saved = await savePatientPortalSettings(normalized);
    if (!saved) {
      setSaveStatus("error");
      return false;
    }

    setSettings(normalized);
    setSaveStatus("saved");
    return true;
  }, []);

  const updateSettings = useCallback(
    async (updater: (prev: PatientPortalSettings) => PatientPortalSettings) => {
      return replaceSettings(updater(settings));
    },
    [replaceSettings, settings],
  );

  const resetSettings = useCallback(async () => {
    return replaceSettings(clonePatientPortalSettings(DEFAULT_PATIENT_PORTAL_SETTINGS));
  }, [replaceSettings]);

  const value = useMemo<PatientPortalSettingsContextValue>(
    () => ({
      settings,
      loading,
      saveStatus,
      reloadSettings,
      replaceSettings,
      updateSettings,
      resetSettings,
    }),
    [loading, reloadSettings, replaceSettings, resetSettings, saveStatus, settings, updateSettings],
  );

  return (
    <PatientPortalSettingsContext.Provider value={value}>
      {children}
    </PatientPortalSettingsContext.Provider>
  );
}
