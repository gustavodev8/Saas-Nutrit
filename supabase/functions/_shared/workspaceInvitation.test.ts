import { strict as assert } from "node:assert";
import { test } from "node:test";
import { enforceRateLimit, getRateLimitIdentityHash } from "./publicEndpoint.ts";
import {
  buildWorkspaceInvitationUrl,
  createWorkspaceInvitationToken,
  isConfirmedPlatformAdmin,
  isPlatformAdminEmail,
  isValidInvitationSiteUrl,
  isValidInvitationInput,
  WORKSPACE_INVITATION_RATE_LIMITS,
} from "./workspaceInvitation.ts";

async function withRateLimitRuntime(
  fetchHandler: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  const originalDeno = Object.getOwnPropertyDescriptor(globalThis, "Deno");
  Object.defineProperty(globalThis, "Deno", {
    configurable: true,
    value: { env: { get: (key: string) => ({
      SUPABASE_URL: "https://supabase.test",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      SAAS_RATE_LIMIT_HMAC_SECRET: "test-rate-limit-hmac-secret",
    } as Record<string, string>)[key] } },
  });
  globalThis.fetch = fetchHandler;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
    if (originalDeno) Object.defineProperty(globalThis, "Deno", originalDeno);
    else Reflect.deleteProperty(globalThis, "Deno");
  }
}

test("platform admin allowlist is normalized and independent of database admins", () => {
  assert.equal(isPlatformAdminEmail("  OWNER@Example.com ", "owner@example.com, admin@example.com"), true);
  assert.equal(isPlatformAdminEmail("admin@example.com", "owner@example.com"), false);
  assert.equal(isPlatformAdminEmail("owner@example.com", ""), false);
});

test("unconfirmed users are not platform admins even when allowlisted", () => {
  assert.equal(isConfirmedPlatformAdmin("admin@example.com", "2026-01-01T00:00:00Z", "admin@example.com"), true);
  assert.equal(isConfirmedPlatformAdmin("admin@example.com", null, "admin@example.com"), false);
  assert.equal(isConfirmedPlatformAdmin("admin@example.com", "", "admin@example.com"), false);
});

test("invitation endpoints enforce independent per-identity hourly and daily limits", () => {
  assert.deepEqual(WORKSPACE_INVITATION_RATE_LIMITS.administrator, {
    endpoint: "workspace-invitation-admin",
    limit: 20,
    windowSeconds: 3600,
  });
  assert.deepEqual(WORKSPACE_INVITATION_RATE_LIMITS.recipient, {
    endpoint: "workspace-invitation-recipient",
    limit: 5,
    windowSeconds: 86400,
  });
});

test("invitation rate-limit fingerprints are stable, normalized, and do not store the identity", async () => {
  await withRateLimitRuntime(async () => Response.json(true), async () => {
    const first = await getRateLimitIdentityHash("workspace-invitation-admin", " ADMIN@example.com ");
    const normalized = await getRateLimitIdentityHash("workspace-invitation-admin", "admin@example.com");
    const otherScope = await getRateLimitIdentityHash("workspace-invitation-recipient", "admin@example.com");

    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(first, normalized);
    assert.notEqual(first, otherScope);
    assert.equal(first.includes("admin@example.com"), false);
  });
});

test("rate-limit RPC receives only the hashed admin identity and correct limit", async () => {
  let captured: Request | null = null;
  await withRateLimitRuntime(async (input, init) => {
    captured = new Request(String(input), init);
    return Response.json(true);
  }, async () => {
    const response = await enforceRateLimit({
      req: new Request("https://function.test", { headers: { "user-agent": "test" } }),
      corsHeaders: {},
      endpoint: WORKSPACE_INVITATION_RATE_LIMITS.administrator.endpoint,
      limit: WORKSPACE_INVITATION_RATE_LIMITS.administrator.limit,
      windowSeconds: WORKSPACE_INVITATION_RATE_LIMITS.administrator.windowSeconds,
      identityKey: "admin@example.test",
    });
    assert.equal(response, null);
  });

  assert.ok(captured);
  const body = await captured.json() as { p_fingerprint_hash: string; p_hit_limit: number };
  assert.match(body.p_fingerprint_hash, /^[a-f0-9]{64}$/);
  assert.equal(body.p_hit_limit, 20);
  assert.equal(JSON.stringify(body).includes("admin@example.test"), false);
});

test("rate-limit RPC failure is fail-closed and a denied hit returns 429", async () => {
  await withRateLimitRuntime(async () => Response.json({ error: "unavailable" }, { status: 500 }), async () => {
    const unavailable = await enforceRateLimit({
      req: new Request("https://function.test"),
      corsHeaders: {},
      ...WORKSPACE_INVITATION_RATE_LIMITS.recipient,
      identityKey: "recipient@example.test",
    });
    assert.equal(unavailable?.status, 503);
  });

  await withRateLimitRuntime(async () => Response.json(false), async () => {
    const denied = await enforceRateLimit({
      req: new Request("https://function.test"),
      corsHeaders: {},
      ...WORKSPACE_INVITATION_RATE_LIMITS.recipient,
      identityKey: "recipient@example.test",
    });
    assert.equal(denied?.status, 429);
  });
});

test("invitation input validates email and workspace name boundaries", () => {
  assert.equal(isValidInvitationInput("owner@example.com", "Consultorio"), true);
  assert.equal(isValidInvitationInput("invalid", "Consultorio"), false);
  assert.equal(isValidInvitationInput("owner@example.com", " "), false);
  assert.equal(isValidInvitationInput("owner@example.com", "x".repeat(121)), false);
});

test("invitation URL uses the accept route and encodes the raw token", () => {
  const url = new URL(buildWorkspaceInvitationUrl("https://saas.example/", "a".repeat(64)));
  assert.equal(url.origin, "https://saas.example");
  assert.equal(url.pathname, "/workspace/accept");
  assert.equal(url.searchParams.get("token"), "a".repeat(64));
});

test("invitation site URL must be HTTPS except for local development", () => {
  assert.equal(isValidInvitationSiteUrl("https://saas.example"), true);
  assert.equal(isValidInvitationSiteUrl("http://localhost:54321"), true);
  assert.equal(isValidInvitationSiteUrl("http://saas.example"), false);
  assert.equal(isValidInvitationSiteUrl("https://user:password@saas.example"), false);
  assert.equal(isValidInvitationSiteUrl("not a URL"), false);
});

test("invitation token is 32 random bytes and stores only a lowercase SHA-256 digest", async () => {
  const token = await createWorkspaceInvitationToken();
  assert.match(token.rawToken, /^[a-f0-9]{64}$/);
  assert.match(token.tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(token.rawToken, token.tokenHash);

  const expectedDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token.rawToken));
  const expectedHash = Array.from(new Uint8Array(expectedDigest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  assert.equal(token.tokenHash, expectedHash);
});
