import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteBookingGroup: vi.fn(), toast: vi.fn() }));

vi.mock("@/lib/supabase", () => ({
  deleteBookingGroup: mocks.deleteBookingGroup,
  updateBookingPaymentStatus: vi.fn(),
  updateBookingStatus: vi.fn(),
  supabase: {},
}));
vi.mock("@/hooks/use-toast", () => ({ toast: mocks.toast }));

import { useBookingStatusActions } from "./useBookingStatusActions";

describe("useBookingStatusActions deletion feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("explains the clinical block and preserves the booking UI state", async () => {
    mocks.deleteBookingGroup.mockResolvedValue("blocked-by-consultation");
    const setBookings = vi.fn();
    const setDetail = vi.fn();
    const { result } = renderHook(() => useBookingStatusActions({ setBookings, setDetail }));

    act(() => result.current.setConfirmDeleteGroup("group-1"));
    await act(async () => result.current.handleDeleteGroup("group-1"));

    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Agendamento vinculado a uma consulta",
      description: expect.stringContaining("prontuário associado foi preservado"),
      variant: "destructive",
    }));
    expect(result.current.confirmDeleteGroup).toBe("group-1");
    expect(result.current.deletingGroup).toBe(false);
    expect(setBookings).not.toHaveBeenCalled();
    expect(setDetail).not.toHaveBeenCalled();
  });

  it("clears the busy state after an unexpected rejection", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.deleteBookingGroup.mockRejectedValue(new Error("synthetic network failure"));
    const { result } = renderHook(() => useBookingStatusActions({
      setBookings: vi.fn(),
      setDetail: vi.fn(),
    }));

    await act(async () => result.current.handleDeleteGroup("group-1"));

    expect(result.current.deletingGroup).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Erro ao excluir agendamento.",
      variant: "destructive",
    }));
    vi.restoreAllMocks();
  });
});
