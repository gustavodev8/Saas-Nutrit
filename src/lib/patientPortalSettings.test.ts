import { describe, expect, it } from "vitest";
import {
  DEFAULT_PATIENT_PORTAL_SETTINGS,
  clonePatientPortalSettings,
  mergePatientPortalSettings,
  setPatientPortalFlag,
} from "@/lib/patientPortalSettings";

describe("patientPortalSettings", () => {
  it("returns cloned defaults when payload is invalid", () => {
    const merged = mergePatientPortalSettings(null);

    expect(merged).toEqual(DEFAULT_PATIENT_PORTAL_SETTINGS);
    expect(merged).not.toBe(DEFAULT_PATIENT_PORTAL_SETTINGS);
  });

  it("merges partial payloads and ignores invalid field types", () => {
    const merged = mergePatientPortalSettings({
      navigation: {
        plan: false,
        documents: "no",
      },
      home: {
        reports: false,
      },
      plan: {
        calories: false,
        macros: false,
      },
      branding: {
        portalTitle: "Area VIP",
        portalSubtitle: "",
        supportLabel: 42,
      },
    });

    expect(merged.navigation.plan).toBe(false);
    expect(merged.navigation.documents).toBe(true);
    expect(merged.home.reports).toBe(false);
    expect(merged.plan.calories).toBe(false);
    expect(merged.plan.macros).toBe(false);
    expect(merged.branding.portalTitle).toBe("Area VIP");
    expect(merged.branding.portalSubtitle).toBe(DEFAULT_PATIENT_PORTAL_SETTINGS.branding.portalSubtitle);
    expect(merged.branding.supportLabel).toBe(DEFAULT_PATIENT_PORTAL_SETTINGS.branding.supportLabel);
  });

  it("updates a boolean flag without mutating the original config", () => {
    const base = clonePatientPortalSettings();
    const next = setPatientPortalFlag(base, "documents.attachments", false);

    expect(next.documents.attachments).toBe(false);
    expect(base.documents.attachments).toBe(true);
    expect(next.home).toEqual(base.home);
  });
});
