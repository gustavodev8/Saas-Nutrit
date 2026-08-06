import { createContext } from "react";
import type { PatientPortalSettings } from "@/lib/patientPortalSettings";

export type PatientPortalSettingsSaveStatus = "idle" | "saving" | "saved" | "error";

export interface PatientPortalSettingsContextValue {
  settings: PatientPortalSettings;
  loading: boolean;
  saveStatus: PatientPortalSettingsSaveStatus;
  reloadSettings: () => Promise<void>;
  replaceSettings: (nextSettings: PatientPortalSettings) => Promise<boolean>;
  updateSettings: (
    updater: (prev: PatientPortalSettings) => PatientPortalSettings,
  ) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

export const PatientPortalSettingsContext =
  createContext<PatientPortalSettingsContextValue | null>(null);
