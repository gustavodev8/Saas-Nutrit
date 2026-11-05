import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  assertAllowedOrigin,
  buildCorsHeaders,
  enforceRateLimit,
  getRateLimitIdentityHash,
} from "./publicEndpoint.ts";

async function withRateLimitRuntime(
  hmacSecret: string | undefined,
  run: () => Promise<void>,
): Promise<void> {
  const originalDeno = Object.getOwnPropertyDescriptor(globalThis, "Deno");
  Object.defineProperty(globalThis, "Deno", {
    configurable: true,
    value: {
      env: {
        get: (key: string) => ({
          SUPABASE_URL: "https://supabase.test",
          SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
          SAAS_RATE_LIMIT_HMAC_SECRET: hmacSecret,
        } as Record<string, string>)[key],
      },
    },
  });

  try {
    await run();
  } finally {
    if (originalDeno) Object.defineProperty(globalThis, "Deno", originalDeno);
    else Reflect.deleteProperty(globalThis, "Deno");
  }
}

test("identity fingerprints normalize input, stay 64-hex, and depend on the dedicated HMAC secret", async () => {
  await withRateLimitRuntime("hmac-secret-a", async () => {
    const normalized = await getRateLimitIdentityHash("workspace-invitation-admin", " ADMIN@example.com ");
    const equivalent = await getRateLimitIdentityHash("workspace-invitation-admin", "admin@example.com");
    assert.match(normalized, /^[a-f0-9]{64}$/);
    assert.equal(normalized, equivalent);
  });

  let firstKeyHash = "";
  let secondKeyHash = "";
  await withRateLimitRuntime("hmac-secret-a", async () => {
    firstKeyHash = await getRateLimitIdentityHash("workspace-invitation-admin", "admin@example.com");
  });
  await withRateLimitRuntime("hmac-secret-b", async () => {
    secondKeyHash = await getRateLimitIdentityHash("workspace-invitation-admin", "admin@example.com");
  });
  assert.notEqual(firstKeyHash, secondKeyHash);
});

test("identity fingerprints fail closed when the dedicated HMAC secret is missing or blank", async () => {
  for (const hmacSecret of [undefined, "   "]) {
    await withRateLimitRuntime(hmacSecret, async () => {
      await assert.rejects(
        getRateLimitIdentityHash("workspace-invitation-admin", "admin@example.com"),
        /SAAS_RATE_LIMIT_HMAC_SECRET is required/,
      );

      const response = await enforceRateLimit({
        req: new Request("https://function.test"),
        corsHeaders: {},
        endpoint: "workspace-invitation-admin",
        limit: 20,
        windowSeconds: 3600,
        identityKey: "admin@example.com",
      });
      assert.equal(response?.status, 503);
    });
  }
});

test("origin helpers default to SITE_URL and accept a configured override", async () => {
  const originalDeno = Object.getOwnPropertyDescriptor(globalThis, "Deno");
  Object.defineProperty(globalThis, "Deno", {
    configurable: true,
    value: { env: { get: (key: string) => key === "SITE_URL" ? "https://legacy.example/" : undefined } },
  });

  try {
    const defaultHeaders = buildCorsHeaders();
    assert.equal(defaultHeaders["Access-Control-Allow-Origin"], "https://legacy.example/");

    const overrideHeaders = buildCorsHeaders("POST, OPTIONS", "https://saas.example/");
    assert.equal(overrideHeaders["Access-Control-Allow-Origin"], "https://saas.example/");

    const defaultAllowed = assertAllowedOrigin(
      new Request("https://function.test", { headers: { origin: "https://legacy.example" } }),
      defaultHeaders,
    );
    assert.equal(defaultAllowed, null);

    const defaultDenied = assertAllowedOrigin(
      new Request("https://function.test", { headers: { origin: "https://other.example" } }),
      defaultHeaders,
    );
    assert.equal(defaultDenied?.status, 403);

    const overrideAllowed = assertAllowedOrigin(
      new Request("https://function.test", { headers: { origin: "https://saas.example" } }),
      overrideHeaders,
      "https://saas.example/",
    );
    assert.equal(overrideAllowed, null);
  } finally {
    if (originalDeno) Object.defineProperty(globalThis, "Deno", originalDeno);
    else Reflect.deleteProperty(globalThis, "Deno");
  }
});

test("rate-limit RPC timeout is 10 seconds and fails closed", async () => {
  const originalTimeout = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");
  let configuredTimeout: number | undefined;
  Object.defineProperty(AbortSignal, "timeout", {
    configurable: true,
    writable: true,
    value: (milliseconds: number) => {
      configuredTimeout = milliseconds;
      const controller = new AbortController();
      controller.abort(new DOMException("The operation was aborted.", "AbortError"));
      return controller.signal;
    },
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    assert.equal(configuredTimeout, 10_000);
    assert.equal(init?.signal?.aborted, true);
    throw new DOMException("The operation was aborted.", "AbortError");
  };

  try {
    await withRateLimitRuntime("hmac-secret-a", async () => {
      const response = await enforceRateLimit({
        req: new Request("https://function.test"),
        corsHeaders: {},
        endpoint: "workspace-invitation-admin",
        limit: 20,
        windowSeconds: 3600,
        identityKey: "admin@example.com",
      });
      assert.equal(response?.status, 503);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalTimeout) Object.defineProperty(AbortSignal, "timeout", originalTimeout);
    else Reflect.deleteProperty(AbortSignal, "timeout");
  }
});
