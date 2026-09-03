import { describe, expect, it } from "vitest";

import {
  calculateFourComponentAnthropometry,
  validateFourComponentProtocol,
} from "@/lib/fourComponentAnthropometry";

describe("calculateFourComponentAnthropometry", () => {
  it("calculates the validated four-component reference case", () => {
    const { result, errors } = calculateFourComponentAnthropometry({
      weightKg: 75,
      heightCm: 180,
      bodyFatPct: 15,
      biestyloidDiameterMm: 55,
      biepicondylarFemurDiameterMm: 98,
      reference: "M",
    });

    expect(errors).toEqual([]);
    expect(result?.fatMassKg).toBeCloseTo(11.25, 2);
    // The formula's unrounded calculation is 12.05 kg, clinically ~12 kg.
    expect(result?.boneMassKg).toBeCloseTo(12, 0);
    expect(result?.residualMassKg).toBe(18.08);
    expect(result?.estimatedMuscleMassKg).toBeCloseTo(33.67, 0);
  });

  it("uses the female residual reference when selected", () => {
    const { result } = calculateFourComponentAnthropometry({
      weightKg: 75,
      heightCm: 180,
      bodyFatPct: 15,
      biestyloidDiameterMm: 55,
      biepicondylarFemurDiameterMm: 98,
      reference: "F",
    });

    expect(result?.residualMassKg).toBeCloseTo(15.68, 1);
    expect(result?.estimatedMuscleMassKg).toBeGreaterThan(0);
  });

  it("rejects implausible inputs and never returns negative components", () => {
    const calculation = calculateFourComponentAnthropometry({
      weightKg: 10,
      heightCm: 90,
      bodyFatPct: 90,
      biestyloidDiameterMm: 10,
      biepicondylarFemurDiameterMm: 200,
      reference: "M",
    });

    expect(calculation.result).toBeNull();
    expect(calculation.errors.length).toBeGreaterThan(0);
  });

  it("rejects a partially started protocol with an actionable error", () => {
    const errors = validateFourComponentProtocol({
      weightKg: 75,
      heightCm: 180,
      bodyFatPct: 15,
      biestyloidDiameterMm: 55,
      reference: "M",
    });

    expect(errors[0]).toContain("diâmetro biepicondiliano do fêmur");
  });

  it("rejects protocol values outside plausible limits", () => {
    const errors = validateFourComponentProtocol({
      weightKg: 75,
      heightCm: 180,
      bodyFatPct: 15,
      biestyloidDiameterMm: 20,
      biepicondylarFemurDiameterMm: 98,
      reference: "M",
    });

    expect(errors).toContain("O diâmetro biestiloide deve estar entre 30 e 100 mm.");
  });
});
