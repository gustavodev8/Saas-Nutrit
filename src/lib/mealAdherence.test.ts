import { describe, expect, it } from "vitest";
import { mealAdherence } from "@/lib/mealAdherence";

describe("mealAdherence", () => {
  it("returns no bar when the target is undefined, zero or negative", () => {
    expect(mealAdherence(50, undefined)).toMatchObject({ status: "none", pct: 0 });
    expect(mealAdherence(50, null)).toMatchObject({ status: "none", pct: 0 });
    expect(mealAdherence(50, 0)).toMatchObject({ status: "none", pct: 0 });
    expect(mealAdherence(50, -100)).toMatchObject({ status: "none", pct: 0 });
  });

  it("is on target when actual equals the target", () => {
    expect(mealAdherence(100, 100)).toEqual({ status: "on", pct: 100, rawPct: 100 });
  });

  it("is under target when actual is half of the target", () => {
    expect(mealAdherence(50, 100)).toEqual({ status: "under", pct: 50, rawPct: 50 });
  });

  it("is over target and clamps the bar width to 100", () => {
    expect(mealAdherence(200, 100)).toEqual({ status: "over", pct: 100, rawPct: 200 });
  });

  it("applies the 90% and 110% boundaries inclusively for on-target", () => {
    expect(mealAdherence(90, 100).status).toBe("on");
    expect(mealAdherence(89.9, 100).status).toBe("under");
    expect(mealAdherence(110, 100).status).toBe("on");
    expect(mealAdherence(110.1, 100).status).toBe("over");
  });

  it("treats a non-finite actual value as zero", () => {
    expect(mealAdherence(Number.NaN, 100)).toEqual({ status: "under", pct: 0, rawPct: 0 });
    expect(mealAdherence(Number.POSITIVE_INFINITY, 100)).toEqual({ status: "under", pct: 0, rawPct: 0 });
  });
});
