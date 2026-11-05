import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolveBroadcastAudience } from "./broadcastAudience.ts";

test("broadcast booking and patient sources query legacy rows only", async () => {
  const requests: URL[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)));
    return Response.json([]);
  };

  try {
    await resolveBroadcastAudience({
      supabaseUrl: "https://db.test",
      serviceKey: "local-test-key",
      filters: { sources: ["bookings", "patients"] },
      scope: "legacy-fillipe",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests.map((url) => url.pathname).sort(), [
    "/rest/v1/bookings",
    "/rest/v1/patients",
  ]);
  for (const url of requests) {
    assert.equal(url.searchParams.get("workspace_id"), "is.null");
  }
});

test("payment and lead audiences are explicitly legacy scoped", async () => {
  const requests: URL[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    requests.push(new URL(String(input)));
    return Response.json([]);
  };

  try {
    await resolveBroadcastAudience({
      supabaseUrl: "https://db.test",
      serviceKey: "local-test-key",
      filters: { sources: ["ebooks", "leads"] },
      scope: "legacy-fillipe",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests.map((url) => url.pathname).sort(), [
    "/rest/v1/leads",
    "/rest/v1/payment_logs",
  ]);
  const payments = requests.find((url) => url.pathname.endsWith("/payment_logs"));
  assert.equal(payments?.searchParams.get("workspace_id"), "is.null");
});

test("broadcast helper rejects any non-legacy runtime scope", async () => {
  await assert.rejects(
    resolveBroadcastAudience({
      supabaseUrl: "https://db.test",
      serviceKey: "local-test-key",
      scope: "tenant" as "legacy-fillipe",
    }),
    /restricted to the legacy Fillipe scope/,
  );
});
