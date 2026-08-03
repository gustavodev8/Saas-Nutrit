import { describe, expect, it } from "vitest";
import {
  getOperationalErrorMessage,
  sanitizeOperationalContext,
  summarizeOperationalLogs,
  type OperationalLogEvent,
} from "@/lib/operationalLogs";

describe("operationalLogs", () => {
  it("sanitizes context without leaking identifiers or complex objects", () => {
    const context = sanitizeOperationalContext({
      patient: "Maria",
      customerEmail: "maria@example.com",
      amount: 120,
      retryable: true,
      skipped: undefined,
      error: new Error("Falha no envio"),
      payload: { nested: "value" },
    });

    expect(context).toEqual({
      patient: "[redacted]",
      customerEmail: "[redacted]",
      amount: 120,
      retryable: true,
      error: "Falha no envio",
      payload: "{\"nested\":\"value\"}",
    });
  });

  it("summarizes log volume by area and status", () => {
    const base = {
      id: "1",
      createdAt: "2026-08-03T00:00:00.000Z",
      page: "/admin",
      action: "test",
      message: "ok",
    };
    const logs: OperationalLogEvent[] = [
      { ...base, area: "email", status: "error" },
      { ...base, id: "2", area: "payment", status: "warning" },
      { ...base, id: "3", area: "payment", status: "success" },
    ];

    expect(summarizeOperationalLogs(logs)).toMatchObject({
      total: 3,
      errorCount: 1,
      warningCount: 1,
      successCount: 1,
      byArea: { email: 1, payment: 2 },
    });
  });

  it("returns area-specific admin guidance", () => {
    expect(getOperationalErrorMessage("booking", "Falha ao salvar.")).toContain("disponibilidade");
  });
});
