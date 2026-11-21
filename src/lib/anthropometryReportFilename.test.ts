import { describe, expect, it, vi } from "vitest";
import {
  buildAnthropometryReportFilename,
  printWithSuggestedPdfName,
  type AnthropometryReportPrintEnvironment,
} from "./anthropometryReportFilename";

describe("buildAnthropometryReportFilename", () => {
  it("uses the normalized patient name and the single assessment date", () => {
    expect(buildAnthropometryReportFilename("  Ana-Cláudia  ", ["2026-11-11"]))
      .toBe("relatorio-antropometrico-ana-claudia-2026-11-11.pdf");
  });

  it("uses the chronological date range for a comparison", () => {
    expect(buildAnthropometryReportFilename("João / Silva", ["2026-10-12", "2026-01-03", "2026-10-12"]))
      .toBe("relatorio-antropometrico-joao-silva-2026-01-03_a_2026-10-12.pdf");
  });

  it("uses safe fallbacks for absent patient names and invalid dates", () => {
    expect(buildAnthropometryReportFilename("", ["invalid", undefined]))
      .toBe("relatorio-antropometrico-paciente-data-nao-informada.pdf");
  });
});

describe("printWithSuggestedPdfName", () => {
  it("restores the document title after printing", () => {
    const documentRef = { title: "Fillipe David" };
    const listeners = new Map<string, () => void>();
    let deferredPrint: (() => void) | undefined;
    const windowRef = {
      addEventListener: vi.fn((name: string, listener: () => void) => listeners.set(name, listener)),
      removeEventListener: vi.fn((name: string) => listeners.delete(name)),
      setTimeout: vi.fn((callback: () => void) => {
        deferredPrint = callback;
        return 1;
      }),
      clearTimeout: vi.fn(),
      print: vi.fn(() => listeners.get("afterprint")?.()),
    } as unknown as AnthropometryReportPrintEnvironment["windowRef"];

    printWithSuggestedPdfName("relatorio-antropometrico-ana-2026-11-11.pdf", { documentRef, windowRef });
    expect(documentRef.title).toBe("relatorio-antropometrico-ana-2026-11-11");
    deferredPrint?.();

    expect(windowRef.print).toHaveBeenCalledOnce();
    expect(documentRef.title).toBe("Fillipe David");
    expect(windowRef.removeEventListener).toHaveBeenCalledWith("afterprint", expect.any(Function));
  });

  it("restores the title through the fallback when printing is cancelled", () => {
    const documentRef = { title: "Fillipe David" };
    const scheduledCallbacks: Array<() => void> = [];
    const windowRef = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: vi.fn((callback: () => void) => {
        scheduledCallbacks.push(callback);
        return scheduledCallbacks.length;
      }),
      clearTimeout: vi.fn(),
      print: vi.fn(),
    } as unknown as AnthropometryReportPrintEnvironment["windowRef"];

    printWithSuggestedPdfName("relatorio-antropometrico-ana-2026-11-11.pdf", { documentRef, windowRef });

    expect(documentRef.title).toBe("relatorio-antropometrico-ana-2026-11-11");
    scheduledCallbacks[0]?.();
    scheduledCallbacks[1]?.();
    expect(documentRef.title).toBe("Fillipe David");
    expect(windowRef.removeEventListener).toHaveBeenCalledWith("afterprint", expect.any(Function));
  });
});
