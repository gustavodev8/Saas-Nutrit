import { strict as assert } from "node:assert";
import { test } from "node:test";
import { confirmLegacyBookingGroup } from "./bookingGroupConfirmation.ts";

async function withRpcResult(
  result: unknown,
  run: (confirmation: Awaited<ReturnType<typeof confirmLegacyBookingGroup>>, request: Request) => Promise<void>,
) {
  const originalFetch = globalThis.fetch;
  let capturedRequest: Request | null = null;
  globalThis.fetch = async (input, init) => {
    capturedRequest = new Request(String(input), init);
    return Response.json(result);
  };

  try {
    const confirmation = await confirmLegacyBookingGroup({
      supabaseUrl: "https://db.test",
      serviceKey: "test-service-key",
      bookingGroupId: "booking_group_test",
      paymentMethod: "pix",
    });
    assert.ok(capturedRequest);
    await run(confirmation, capturedRequest);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("single-session legacy group RPC returns confirmed IDs", async () => {
  await withRpcResult(
    { status: "confirmed", count: 1, booking_ids: [31] },
    async (confirmation, request) => {
      assert.deepEqual(confirmation, { status: "confirmed", count: 1, bookingIds: ["31"] });
      const body = await request.json();
      assert.equal(new URL(request.url).pathname, "/rest/v1/rpc/confirm_legacy_booking_group");
      assert.deepEqual(body, { p_booking_group_id: "booking_group_test", p_payment_method: "pix" });
    },
  );
});

test("multiple-session legacy groups are returned as one atomic result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    status: "confirmed",
    count: 3,
    booking_ids: [41, 42, 43],
  });
  try {
    const result = await confirmLegacyBookingGroup({
      supabaseUrl: "https://db.test",
      serviceKey: "test-service-key",
      bookingGroupId: "multi-group",
      paymentMethod: "pix",
    });
    assert.deepEqual(result, {
      status: "confirmed",
      count: 3,
      bookingIds: ["41", "42", "43"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mixed, absent, and conflict outcomes cannot masquerade as success", async () => {
  for (const result of [
    { status: "not_legacy", count: 2, booking_ids: [] },
    { status: "not_found", count: 0, booking_ids: [] },
    { status: "conflict", count: 2, booking_ids: [] },
  ]) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json(result);
    try {
      const parsed = await confirmLegacyBookingGroup({
        supabaseUrl: "https://db.test",
        serviceKey: "test-service-key",
        bookingGroupId: "test-group",
        paymentMethod: "pix",
      });
      assert.equal(parsed?.status, result.status);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});

test("retry of a previously confirmed group is explicitly idempotent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    status: "already_confirmed",
    count: 2,
    booking_ids: [51, 52],
  });
  try {
    const result = await confirmLegacyBookingGroup({
      supabaseUrl: "https://db.test",
      serviceKey: "test-service-key",
      bookingGroupId: "retry-group",
      paymentMethod: "card",
    });
    assert.deepEqual(result, {
      status: "already_confirmed",
      count: 2,
      bookingIds: ["51", "52"],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
