import { describe, expect, it } from "vitest";

import { bookingBelongsToPatient } from "@/lib/patientBookingMatch";

describe("bookingBelongsToPatient", () => {
  const patient = {
    id: 42,
    name: "Maria Clara Santos",
    email: "maria@example.com",
    phone: "(75) 99999-1234",
    cpf: "123.456.789-09",
  };

  it("matches directly by patient_id", () => {
    expect(
      bookingBelongsToPatient(patient, {
        patient_id: 42,
        client_name: null,
        client_email: null,
        client_phone: null,
        client_cpf: null,
      }),
    ).toBe(true);
  });

  it("matches by normalized cpf", () => {
    expect(
      bookingBelongsToPatient(patient, {
        patient_id: null,
        client_name: "Outra Pessoa",
        client_email: null,
        client_phone: null,
        client_cpf: "12345678909",
      }),
    ).toBe(true);
  });

  it("matches by normalized email", () => {
    expect(
      bookingBelongsToPatient(patient, {
        patient_id: null,
        client_name: null,
        client_email: "MARIA@example.com",
        client_phone: null,
        client_cpf: null,
      }),
    ).toBe(true);
  });

  it("matches by phone plus normalized name", () => {
    expect(
      bookingBelongsToPatient(patient, {
        patient_id: null,
        client_name: "Maria Clara Santos",
        client_email: null,
        client_phone: "75999991234",
        client_cpf: null,
      }),
    ).toBe(true);
  });

  it("does not match unrelated bookings", () => {
    expect(
      bookingBelongsToPatient(patient, {
        patient_id: null,
        client_name: "Joao Pedro",
        client_email: "joao@example.com",
        client_phone: "75911112222",
        client_cpf: "98765432100",
      }),
    ).toBe(false);
  });
});
