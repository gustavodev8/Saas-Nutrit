export type FourComponentReference = "M" | "F";

export interface FourComponentInput {
  weightKg: number;
  heightCm: number;
  bodyFatPct: number;
  biestyloidDiameterMm: number;
  biepicondylarFemurDiameterMm: number;
  reference: FourComponentReference;
}

export interface FourComponentResult {
  fatMassKg: number;
  boneMassKg: number;
  residualMassKg: number;
  estimatedMuscleMassKg: number;
  fatMassPct: number;
  boneMassPct: number;
  residualMassPct: number;
  estimatedMuscleMassPct: number;
}

export interface FourComponentCalculation {
  result: FourComponentResult | null;
  errors: string[];
}

type FourComponentProtocolInput = Omit<Partial<FourComponentInput>, "reference"> & {
  reference?: FourComponentReference | "";
};

// Avoids banker's/binary floating-point artifacts such as 75 * 0.241 => 18.07.
const round = (value: number) => Math.floor(value * 100 + 0.5 + 1e-10) / 100;

function validateCompleteInput(input: FourComponentInput): string[] {
  const errors: string[] = [];
  const { weightKg, heightCm, bodyFatPct, biestyloidDiameterMm, biepicondylarFemurDiameterMm, reference } = input;

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 350) {
    errors.push("O peso deve estar entre 20 e 350 kg.");
  }
  if (!Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250) {
    errors.push("A altura deve estar entre 100 e 250 cm.");
  }
  if (!Number.isFinite(bodyFatPct) || bodyFatPct < 1 || bodyFatPct > 70) {
    errors.push("Defina um percentual de gordura oficial entre 1% e 70%.");
  }
  if (!Number.isFinite(biestyloidDiameterMm) || biestyloidDiameterMm < 30 || biestyloidDiameterMm > 100) {
    errors.push("O diâmetro biestiloide deve estar entre 30 e 100 mm.");
  }
  if (!Number.isFinite(biepicondylarFemurDiameterMm) || biepicondylarFemurDiameterMm < 50 || biepicondylarFemurDiameterMm > 150) {
    errors.push("O diâmetro biepicondiliano do fêmur deve estar entre 50 e 150 mm.");
  }
  if (reference !== "M" && reference !== "F") {
    errors.push("Selecione a referência masculina ou feminina do protocolo.");
  }

  return errors;
}

/** Validates only when the optional protocol has started, preventing partial records. */
export function validateFourComponentProtocol(input: FourComponentProtocolInput): string[] {
  const protocolStarted = [
    input.biestyloidDiameterMm,
    input.biepicondylarFemurDiameterMm,
  ].some((value) => value !== undefined && value !== null && value !== "");
  if (!protocolStarted) return [];

  const missing: string[] = [];
  if (input.weightKg == null) missing.push("peso");
  if (input.heightCm == null) missing.push("altura");
  if (input.bodyFatPct == null) missing.push("% de gordura oficial");
  if (input.biestyloidDiameterMm == null) missing.push("diâmetro biestiloide");
  if (input.biepicondylarFemurDiameterMm == null) missing.push("diâmetro biepicondiliano do fêmur");
  if (input.reference !== "M" && input.reference !== "F") missing.push("referência M/F");
  if (missing.length > 0) {
    return [`Para salvar o fracionamento, informe: ${missing.join(", ")}.`];
  }

  return validateCompleteInput(input as FourComponentInput);
}

/**
 * Estimates the four anthropometric components. This is an anthropometric
 * estimate, not a diagnostic method or a replacement for densitometry.
 */
export function calculateFourComponentAnthropometry(
  input: FourComponentInput,
): FourComponentCalculation {
  const errors = validateCompleteInput(input);

  if (errors.length > 0) return { result: null, errors };

  const { weightKg, heightCm, bodyFatPct, biestyloidDiameterMm, biepicondylarFemurDiameterMm, reference } = input;

  const heightM = heightCm / 100;
  const biestyloidM = biestyloidDiameterMm / 1000;
  const biepicondylarFemurM = biepicondylarFemurDiameterMm / 1000;
  const fatMassKg = weightKg * (bodyFatPct / 100);
  const boneMassKg = 3.02 * Math.pow(
    heightM ** 2 * biestyloidM * biepicondylarFemurM * 400,
    0.712,
  );
  const residualMassKg = weightKg * (reference === "M" ? 0.241 : 0.209);
  const estimatedMuscleMassKg = weightKg - (fatMassKg + boneMassKg + residualMassKg);

  if (estimatedMuscleMassKg < 0) {
    return {
      result: null,
      errors: ["As medidas informadas geram massa muscular estimada negativa; revise os dados."],
    };
  }

  const toPct = (massKg: number) => (massKg / weightKg) * 100;
  return {
    result: {
      fatMassKg: round(fatMassKg),
      boneMassKg: round(boneMassKg),
      residualMassKg: round(residualMassKg),
      estimatedMuscleMassKg: round(estimatedMuscleMassKg),
      fatMassPct: round(toPct(fatMassKg)),
      boneMassPct: round(toPct(boneMassKg)),
      residualMassPct: round(toPct(residualMassKg)),
      estimatedMuscleMassPct: round(toPct(estimatedMuscleMassKg)),
    },
    errors: [],
  };
}
