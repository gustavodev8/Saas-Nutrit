import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createWorkspaceInvitationHandler } from "./workspaceInvitationHandler.ts";

const USER_TOKEN = "user-jwt-token";
const SERVICE_KEY = "service-role-secret";
const ADMIN_EMAIL = "master@example.test";
const BASE_ENV = {
  SITE_URL: "https://legacy.example.test",
  SAAS_SITE_URL: "https://saas.example.test",
  SUPABASE_URL: "https://project.supabase.test/",
  SUPABASE_ANON_KEY: "anon-public-key",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  RESEND_API_KEY: "resend-secret",
  RESEND_FROM_EMAIL: "SaaS <noreply@example.test>",
  SAAS_PLATFORM_ADMIN_EMAILS: ADMIN_EMAIL,
};

function request({ method = "POST", body, headers = {} } = {}) {
  return new Request("https://function.example.test/workspace-invitation", {
    method,
    headers: {
      Authorization: `Bearer ${USER_TOKEN}`,
      Origin: BASE_ENV.SAAS_SITE_URL,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function setup({ user, rpcStatus = 200, resendStatus = 200, rateLimitResult = null } = {}) {
  const calls = [];
  const limiterCalls = [];
  const logs = [];
  const fetch = async (input, init = {}) => {
    const url = String(input);
    const call = { url, init };
    calls.push(call);
    if (url.endsWith("/auth/v1/user")) {
      return Response.json(user ?? {
        email: ADMIN_EMAIL,
        email_confirmed_at: "2026-01-01T00:00:00Z",
      });
    }
    if (url.endsWith("/rpc/create_workspace_invitation")) {
      return rpcStatus === 200 ? Response.json("invitation-id") : Response.json({}, { status: rpcStatus });
    }
    if (url === "https://api.resend.com/emails") {
      return Response.json({}, { status: resendStatus });
    }
    throw new Error(`Unexpected network request: ${url}`);
  };
  const handler = createWorkspaceInvitationHandler({
    env: (name) => BASE_ENV[name],
    fetch,
    rateLimit: async (input) => {
      limiterCalls.push(input);
      return rateLimitResult;
    },
    logError: (message) => logs.push(message),
  });
  return { handler, calls, limiterCalls, logs };
}

function pendingFetchUntilAbort(calls) {
  return (input, init = {}) => new Promise((resolve, reject) => {
    const url = String(input);
    calls.push({ url, init });
    const signal = init.signal;
    if (!signal) {
      reject(new Error("Expected an abort signal"));
      return;
    }
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

function timeoutScenario(timeoutPath) {
  const calls = [];
  const handler = createWorkspaceInvitationHandler({
    env: (name) => BASE_ENV[name],
    fetch: (input, init = {}) => {
      const url = String(input);
      if ((timeoutPath === "auth" && url.endsWith("/auth/v1/user"))
        || (timeoutPath === "rpc" && url.endsWith("/rpc/create_workspace_invitation"))
        || (timeoutPath === "resend" && url === "https://api.resend.com/emails")) {
        return pendingFetchUntilAbort(calls)(input, init);
      }
      calls.push({ url, init });
      if (url.endsWith("/auth/v1/user")) {
        return Promise.resolve(Response.json({ email: ADMIN_EMAIL, email_confirmed_at: "2026-01-01T00:00:00Z" }));
      }
      if (url.endsWith("/rpc/create_workspace_invitation")) {
        return Promise.resolve(Response.json("invitation-id"));
      }
      return Promise.reject(new Error(`Unexpected network request: ${url}`));
    },
    rateLimit: async () => null,
    timeoutMs: 15,
    logError: () => {},
  });
  return { handler, calls };
}

test("success authenticates with the caller bearer, rate-limits both identities and sends only the raw token by email", async () => {
  const { handler, calls, limiterCalls } = setup();
  const response = await handler(request({
    body: { email: " Dietitian@Example.test ", workspaceName: " Consultorio Central " },
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(limiterCalls.length, 2);
  assert.deepEqual(limiterCalls.map(({ endpoint, identityKey }) => [endpoint, identityKey]), [
    ["workspace-invitation-admin", ADMIN_EMAIL],
    ["workspace-invitation-recipient", "dietitian@example.test"],
  ]);

  const authCall = calls.find(({ url }) => url.endsWith("/auth/v1/user"));
  assert.ok(authCall);
  assert.equal(new Headers(authCall.init.headers).get("Authorization"), `Bearer ${USER_TOKEN}`);
  assert.notEqual(new Headers(authCall.init.headers).get("Authorization"), `Bearer ${SERVICE_KEY}`);
  assert.equal(new Headers(authCall.init.headers).get("apikey"), BASE_ENV.SUPABASE_ANON_KEY);
  assert.equal(JSON.stringify(authCall).includes(SERVICE_KEY), false);

  const rpcCall = calls.find(({ url }) => url.endsWith("/rpc/create_workspace_invitation"));
  const emailCall = calls.find(({ url }) => url === "https://api.resend.com/emails");
  assert.ok(rpcCall);
  assert.ok(emailCall);
  const rpcBody = JSON.parse(rpcCall.init.body);
  const emailBody = JSON.parse(emailCall.init.body);
  const link = emailBody.html.match(/href="([^"]+)"/);
  assert.ok(link);
  const rawToken = new URL(link[1]).searchParams.get("token");
  assert.match(rawToken, /^[a-f0-9]{64}$/);
  assert.equal(rpcBody.p_email, "dietitian@example.test");
  assert.equal(rpcBody.p_workspace_name, "Consultorio Central");
  assert.equal(rpcBody.p_token_hash, createHash("sha256").update(rawToken).digest("hex"));
  assert.notEqual(rpcBody.p_token_hash, rawToken);
  assert.equal(JSON.stringify(rpcBody).includes(rawToken), false);
  assert.equal(JSON.stringify({ ...authCall, ...rpcCall }).includes(rawToken), false);
  assert.equal(new Headers(rpcCall.init.headers).get("Authorization"), `Bearer ${SERVICE_KEY}`);
  assert.equal(new Headers(emailCall.init.headers).get("Authorization"), "Bearer resend-secret");
  assert.equal(JSON.stringify(emailBody).includes(rpcBody.p_token_hash), false);
  assert.match(emailBody.html, new RegExp(rawToken));
  assert.equal(JSON.stringify({ ok: true }).includes(rawToken), false);
});

test("rejects non-POST methods and handles CORS preflight before authentication", async () => {
  const methodScenario = setup();
  assert.equal((await methodScenario.handler(request({ method: "GET" }))).status, 405);
  assert.equal(methodScenario.calls.length, 0);

  const optionsScenario = setup();
  const optionsResponse = await optionsScenario.handler(request({ method: "OPTIONS" }));
  assert.equal(optionsResponse.status, 200);
  assert.equal(optionsResponse.headers.get("Access-Control-Allow-Origin"), BASE_ENV.SAAS_SITE_URL);
  assert.equal(optionsScenario.calls.length, 0);
});

test("rejects a foreign origin before authentication", async () => {
  const scenario = setup();
  const response = await scenario.handler(request({ headers: { Origin: "https://attacker.example" } }));
  assert.equal(response.status, 403);
  assert.equal(scenario.calls.length, 0);
});

test("fails closed when the dedicated SaaS site URL is absent or invalid", async () => {
  for (const siteUrl of [undefined, "http://legacy.example.test", "not-a-url"]) {
    let fetchCalls = 0;
    const handler = createWorkspaceInvitationHandler({
      env: (name) => name === "SAAS_SITE_URL" ? siteUrl : BASE_ENV[name],
      fetch: async () => { fetchCalls += 1; throw new Error("must not fetch"); },
    });
    const response = await handler(request());
    assert.equal(response.status, 503);
    assert.equal(fetchCalls, 0);
  }
});

test("requires a bearer token and returns unavailable when required configuration is missing", async () => {
  const missingBearer = setup();
  assert.equal((await missingBearer.handler(request({ headers: { Authorization: "" } }))).status, 503);
  assert.equal(missingBearer.calls.length, 0);

  const missingConfig = createWorkspaceInvitationHandler({
    env: () => undefined,
    fetch: async () => { throw new Error("must not fetch"); },
  });
  assert.equal((await missingConfig(request())).status, 503);
});

test("rejects an unconfirmed account and a confirmed account outside the platform allowlist", async () => {
  const unconfirmed = setup({ user: { email: ADMIN_EMAIL, email_confirmed_at: null } });
  assert.equal((await unconfirmed.handler(request({ body: { email: "a@example.test", workspaceName: "A" } }))).status, 401);
  assert.equal(unconfirmed.limiterCalls.length, 0);

  const notAllowlisted = setup({ user: { email: "other@example.test", email_confirmed_at: "2026-01-01T00:00:00Z" } });
  assert.equal((await notAllowlisted.handler(request({ body: { email: "a@example.test", workspaceName: "A" } }))).status, 403);
  assert.equal(notAllowlisted.limiterCalls.length, 0);
});

test("returns 401 when Supabase Auth rejects the user bearer", async () => {
  const calls = [];
  const handler = createWorkspaceInvitationHandler({
    env: (name) => BASE_ENV[name],
    fetch: async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response("unauthorized", { status: 401 });
    },
  });
  assert.equal((await handler(request())).status, 401);
  assert.equal(calls.length, 1);
});

test("rejects invalid JSON payloads and invalid invitation fields before recipient limit or RPC", async () => {
  for (const body of ["{", { email: "bad", workspaceName: "Workspace" }, { email: "ok@example.test", workspaceName: " " }]) {
    const scenario = setup();
    assert.equal((await scenario.handler(request({ body }))).status, 400);
    assert.equal(scenario.limiterCalls.length, 1);
    assert.equal(scenario.calls.some(({ url }) => url.endsWith("/rpc/create_workspace_invitation")), false);
  }
});

test("fails closed when either administrator or recipient rate limit denies the request", async () => {
  for (const deniedEndpoint of ["workspace-invitation-admin", "workspace-invitation-recipient"]) {
    const limiterCalls = [];
    const scenario = setup();
    const handler = createWorkspaceInvitationHandler({
      env: (name) => BASE_ENV[name],
      fetch: async (input, init) => {
        const url = String(input);
        scenario.calls.push({ url, init });
        if (url.endsWith("/auth/v1/user")) return Response.json({ email: ADMIN_EMAIL, email_confirmed_at: "confirmed" });
        throw new Error("unexpected request after denied limit");
      },
      rateLimit: async (input) => {
        limiterCalls.push(input);
        return input.endpoint === deniedEndpoint ? new Response("denied", { status: 429 }) : null;
      },
    });
    assert.equal((await handler(request({ body: { email: "a@example.test", workspaceName: "A" } }))).status, 429);
    assert.equal(limiterCalls.length, deniedEndpoint === "workspace-invitation-admin" ? 1 : 2);
    assert.equal(scenario.calls.some(({ url }) => url.endsWith("/rpc/create_workspace_invitation")), false);
  }
});

test("returns 503 for a non-2xx invitation RPC response and does not send email", async () => {
  const scenario = setup({ rpcStatus: 409 });
  const response = await scenario.handler(request({ body: { email: "a@example.test", workspaceName: "A" } }));
  assert.equal(response.status, 503);
  assert.equal(scenario.calls.some(({ url }) => url === "https://api.resend.com/emails"), false);
});

test("returns 503 and logs a generic message when Resend fails after the RPC", async () => {
  const scenario = setup({ resendStatus: 500 });
  const response = await scenario.handler(request({ body: { email: "a@example.test", workspaceName: "A" } }));
  assert.equal(response.status, 503);
  assert.deepEqual(scenario.logs, ["workspace-invitation: email delivery failed"]);
  assert.equal(scenario.calls.some(({ url }) => url.endsWith("/rpc/create_workspace_invitation")), true);
});

test("Auth, invitation RPC, and Resend timeouts abort promptly and fail closed", async () => {
  for (const timeoutPath of ["auth", "rpc", "resend"]) {
    const scenario = timeoutScenario(timeoutPath);
    const startedAt = Date.now();
    const response = await scenario.handler(request({
      body: { email: "a@example.test", workspaceName: "A" },
    }));
    const elapsedMs = Date.now() - startedAt;

    assert.equal(response.status, 503, `${timeoutPath} timeout status`);
    assert.ok(elapsedMs < 1_000, `${timeoutPath} timeout should not wait for the production deadline`);
    const timedOutCall = scenario.calls.find(({ url }) => (
      timeoutPath === "auth" ? url.endsWith("/auth/v1/user")
        : timeoutPath === "rpc" ? url.endsWith("/rpc/create_workspace_invitation")
          : url === "https://api.resend.com/emails"
    ));
    assert.ok(timedOutCall, `${timeoutPath} request was reached`);
    assert.equal(timedOutCall.init.signal.aborted, true, `${timeoutPath} request signal was aborted`);
    if (timeoutPath === "auth") {
      assert.equal(scenario.calls.length, 1, "no privileged request follows an Auth timeout");
    }
    if (timeoutPath === "rpc") {
      assert.equal(scenario.calls.some(({ url }) => url === "https://api.resend.com/emails"), false);
    }
  }
});
