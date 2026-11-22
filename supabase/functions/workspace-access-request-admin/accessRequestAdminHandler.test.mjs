import assert from "node:assert/strict";
import { test } from "node:test";
import { createAccessRequestAdminHandler } from "./accessRequestAdminHandler.ts";

const USER_TOKEN = "confirmed-user-token";
const SERVICE_KEY = "service-role-only-test-key";
const ANON_KEY = "anon-public-test-key";
const ADMIN_EMAIL = "master@example.test";
const USER_ID = "00000000-0000-4000-8000-000000000501";
const SITE_URL = "https://saas.example.test";
const ENV = {
  SAAS_SITE_URL: SITE_URL,
  SUPABASE_URL: "https://project.supabase.test/",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
  SUPABASE_ANON_KEY: ANON_KEY,
  SAAS_PLATFORM_ADMIN_EMAILS: ADMIN_EMAIL,
};

function request({ method = "POST", body = { action: "list" }, headers = {} } = {}) {
  return new Request("https://function.test/workspace-access-request-admin", {
    method,
    headers: {
      Authorization: `Bearer ${USER_TOKEN}`,
      Origin: SITE_URL,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function setup({ user, rpcStatus = 200, rpcValue = [], rateLimitResponse = null } = {}) {
  const calls = [];
  const limits = [];
  const handler = createAccessRequestAdminHandler({
    env: (name) => ENV[name],
    fetch: async (input, init = {}) => {
      const call = { url: String(input), init };
      calls.push(call);
      if (call.url.endsWith("/auth/v1/user")) {
        return user === null ? new Response("unauthorized", { status: 401 }) : Response.json(user ?? {
          id: USER_ID,
          email: ADMIN_EMAIL,
          email_confirmed_at: "2026-01-01T00:00:00Z",
        });
      }
      return rpcStatus === 200 ? Response.json(rpcValue) : Response.json({}, { status: rpcStatus });
    },
    rateLimit: async (input) => {
      limits.push(input);
      return rateLimitResponse;
    },
    logError: () => {},
  });
  return { handler, calls, limits };
}

test("authenticated allowlisted admin can list requests through service-only RPC", async () => {
  const scenario = setup({ rpcValue: [{ id: "request-1", status: "pending" }] });
  const response = await scenario.handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, requests: [{ id: "request-1", status: "pending" }] });
  assert.equal(scenario.calls.length, 2);
  const authCall = scenario.calls[0];
  assert.equal(new Headers(authCall.init.headers).get("Authorization"), `Bearer ${USER_TOKEN}`);
  assert.equal(new Headers(authCall.init.headers).get("apikey"), ANON_KEY);
  const rpc = scenario.calls[1];
  assert.match(rpc.url, /\/rpc\/list_workspace_access_requests$/);
  assert.equal(new Headers(rpc.init.headers).get("Authorization"), `Bearer ${SERVICE_KEY}`);
  assert.equal(JSON.stringify({ authCall, rpc }).includes(USER_TOKEN), true);
  assert.deepEqual(scenario.limits.map(({ endpoint, identityKey }) => [endpoint, identityKey]), [
    ["workspace-access-request-admin", ADMIN_EMAIL],
  ]);
});

test("review RPC uses the authenticated reviewer ID and only permits approved/rejected", async () => {
  const scenario = setup({ rpcValue: true });
  const body = { action: "review", requestId: "00000000-0000-4000-8000-000000000511", status: "approved", reviewedBy: "attacker" };
  const response = await scenario.handler(request({ body }));
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(scenario.calls[1].init.body), {
    p_request_id: body.requestId,
    p_status: "approved",
    p_reviewed_by: USER_ID,
  });

  const invalid = setup();
  assert.equal((await invalid.handler(request({ body: { ...body, status: "pending" } }))).status, 400);
  assert.equal(invalid.calls.length, 1);
});

test("rejects absent, unconfirmed, or non-allowlisted identities before privileged RPC", async () => {
  const absent = setup({ user: null });
  assert.equal((await absent.handler(request())).status, 401);
  assert.equal(absent.calls.length, 1);

  const unconfirmed = setup({ user: { id: USER_ID, email: ADMIN_EMAIL, email_confirmed_at: null } });
  assert.equal((await unconfirmed.handler(request())).status, 401);
  assert.equal(unconfirmed.calls.length, 1);

  const unauthorized = setup({ user: { id: USER_ID, email: "other@example.test", email_confirmed_at: "confirmed" } });
  assert.equal((await unauthorized.handler(request())).status, 403);
  assert.equal(unauthorized.calls.length, 1);
});

test("enforces origin, token, payload, rate limit, and RPC failure closed", async () => {
  const foreign = setup();
  assert.equal((await foreign.handler(request({ headers: { Origin: "https://evil.test" } }))).status, 403);
  assert.equal(foreign.calls.length, 0);

  const noToken = setup();
  assert.equal((await noToken.handler(request({ headers: { Authorization: `Bearer ${ANON_KEY}` } }))).status, 401);
  assert.equal(noToken.calls.length, 0);

  const rateLimited = setup({ rateLimitResponse: new Response("limited", { status: 429 }) });
  assert.equal((await rateLimited.handler(request())).status, 429);
  assert.equal(rateLimited.calls.length, 1);

  const rpcFailure = setup({ rpcStatus: 500 });
  assert.equal((await rpcFailure.handler(request())).status, 503);
});
