import { describe, expect, it } from "vitest";
import {
  formatCPF,
  hasPatientProfileChanges,
  validateCPF,
} from "@/lib/patientProfileUtils";
import type { Patient } from "@/lib/supabase";

const basePatient: Patient = {
  id: "patient-1",
  name: "Maria Silva",
  email: "maria@example.com",
  phone: "75999990000",
  city: "Alagoinhas",
  birth_date: "1990-01-15",
  gender: "F",
  occupation: "Nutricionista",
  notes: "Sem observacoes",
  cpf: "52998224725",
};

describe("patientProfileUtils", () => {
  it("formats partial and complete CPF values", () => {
    expect(formatCPF("52998")).toBe("529.98");
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("validates CPF numbers correctly", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("111.111.111-11")).toBe(false);
    expect(validateCPF("529.982.247-26")).toBe(false);
  });

  it("detects tracked profile changes only", () => {
    expect(hasPatientProfileChanges({ ...basePatient }, basePatient)).toBe(false);
    expect(
      hasPatientProfileChanges(
        { ...basePatient, occupation: "Atleta" },
        basePatient,
      ),
    ).toBe(true);
  });
});
