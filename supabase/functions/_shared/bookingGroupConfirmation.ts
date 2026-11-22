export type BookingGroupConfirmationStatus =
  | "confirmed"
  | "already_confirmed"
  | "not_found"
  | "not_legacy"
  | "conflict";

export interface BookingGroupConfirmation {
  status: BookingGroupConfirmationStatus;
  count: number;
  bookingIds: string[];
}

const VALID_STATUSES = new Set<BookingGroupConfirmationStatus>([
  "confirmed",
  "already_confirmed",
  "not_found",
  "not_legacy",
  "conflict",
]);

function normalizeBookingId(value: unknown): string | null {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }
  return null;
}

function parseConfirmation(value: unknown): BookingGroupConfirmation | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.status !== "string" ||
    !VALID_STATUSES.has(result.status as BookingGroupConfirmationStatus) ||
    !Number.isSafeInteger(result.count) ||
    (result.count as number) < 0 ||
    !Array.isArray(result.booking_ids)
  ) return null;

  const bookingIds = result.booking_ids.map(normalizeBookingId);
  if (bookingIds.some((id) => id === null)) return null;

  const status = result.status as BookingGroupConfirmationStatus;
  const count = result.count as number;
  const normalizedIds = bookingIds as string[];
  const succeeded = status === "confirmed" || status === "already_confirmed";
  if (succeeded && (count === 0 || normalizedIds.length !== count)) return null;
  if (!succeeded && normalizedIds.length !== 0) return null;

  return { status, count, bookingIds: normalizedIds };
}

export async function confirmLegacyBookingGroup({
  supabaseUrl,
  serviceKey,
  bookingGroupId,
  paymentMethod,
}: {
  supabaseUrl: string;
  serviceKey: string;
  bookingGroupId: string;
  paymentMethod: "pix" | "card";
}): Promise<BookingGroupConfirmation | null> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/confirm_legacy_booking_group`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      p_booking_group_id: bookingGroupId,
      p_payment_method: paymentMethod,
    }),
  });

  if (!response.ok) return null;
  const result = await response.json().catch(() => null);
  return parseConfirmation(result);
}
