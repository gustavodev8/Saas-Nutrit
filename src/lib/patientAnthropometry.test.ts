import { describe, expect, it } from "vitest";

import {
  buildAnthropometryPayload,
  buildLatestMeasurementSummary,
  calcBMI,
  formatMeasurementHistoryCount,
} from "@/lib/patientAnthropometry";

describe("patientAnthropometry", () => {
  it("calculates BMI when weight and height exist", () => {
    expect(calcBMI(80, 180)).toBe("24.7");
    expect(calcBMI(undefined, 180)).toBeNull();
  });

  it("builds payload using bioimpedance as official source", async () => {
    const payload = await buildAnthropometryPayload({
      form: {
        assessment_date: "2026-08-06",
        weight: "80",
        height: "180",
        bio_fat_pct: "20",
        waist: "90",
      },
      patientId: 7,
      patientGender: "M",
      patientBirthDate: "1990-01-10",
      protocol: "JP3M",
      officialSource: "bio",
    });

    expect(payload.patient_id).toBe(7);
    expect(payload.weight).toBe(80);
    expect(payload.height).toBe(180);
    expect(payload.body_fat).toBe(20);
    expect(payload.lean_mass).toBe(64);
    expect(payload.waist).toBe(90);
  });

  it("prefers skinfold result when selected as official source", async () => {
    const payload = await buildAnthropometryPayload({
      form: {
        assessment_date: "2026-08-06",
        weight: "80",
        sf_pectoral: "10",
        sf_abdominal: "20",
        sf_thigh_sf: "15",
      },
      patientId: 8,
      patientGender: "M",
      patientBirthDate: "1990-01-10",
      protocol: "JP3M",
      officialSource: "skinfold",
    });

    expect(payload.sf_protocol).toBe("JP3M");
    expect(typeof payload.body_density).toBe("number");
    expect(typeof payload.body_fat).toBe("number");
    expect(typeof payload.lean_mass).toBe("number");
  });

  it("auto-detects bio source when skinfold data is unavailable", async () => {
    const payload = await buildAnthropometryPayload({
      form: {
        assessment_date: "2026-08-06",
        weight: "70",
        bio_fat_pct: "25",
      },
      patientId: 9,
      patientGender: "F",
      patientBirthDate: "1995-03-20",
      protocol: "JP3F",
      officialSource: null,
    });

    expect(payload.body_fat).toBe(25);
    expect(payload.lean_mass).toBe(52.5);
    expect(payload.sf_protocol).toBeUndefined();
  });

  it("builds latest measurement summary with fallback values", () => {
    const summary = buildLatestMeasurementSummary(
      {
        patient_id: 1,
        assessment_date: "2026-08-06",
        weight: 70,
        waist: 82,
      },
      null,
    );

    expect(summary).toEqual([
      { label: "Peso", value: "70 kg", badge: null },
      { label: "Altura", value: "—", badge: null },
      { label: "IMC", value: "—", badge: null },
      { label: "% Gordura", value: "—", badge: null },
      { label: "Cintura", value: "82 cm", badge: null },
    ]);
  });

  it("formats measurement history count", () => {
    expect(formatMeasurementHistoryCount(1)).toBe("1 avaliação registrada");
    expect(formatMeasurementHistoryCount(2)).toBe("2 avaliações registradas");
  });
});
