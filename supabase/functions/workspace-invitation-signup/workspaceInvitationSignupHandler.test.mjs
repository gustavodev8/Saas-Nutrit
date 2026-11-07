import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { createWorkspaceInvitationSignupHandler } from "./workspaceInvitationSignupHandler.ts";

const TOKEN = "a".repeat(64);
const EMAIL = "dietitian@example.test";
const PASSWORD = "correct-horse-42";
const ANON_KEY = "anon-public-key";
const SERVICE_KEY = "service-role-secret";
const ENV = {
  SAAS_SITE_URL: "https://saas.example.test",
  SUPABASE_URL: "https://project.supabase.test/",
  SUPABASE_ANON_KEY: ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
};

function request({ method = "POST", body = { token: TOKEN, email: EMAIL, password: PASSWORD }, headers = {} } = {}) {
  return new Request("https://project.supabase.test/functions/v1/workspace-invitation-signup", {
    method,
    headers: {
      Origin: ENV.SAAS_SITE_URL,
      "Content-Type": "application/json",
      ...(body === null ? {} : {}),
      ...headers,
    },
    body: body === null ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function setup({ validation = true, validationStatus = 200, createStatus = 200, createCode = "", rateLimitResponse = null } = {}) {
  const calls = [];
  const limits = [];
  const logs = [];
  const fetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/rpc/validate_workspace_invitation_before_signup")) {
      return validationStatus === 200
        ? Response.json(validation)
        : Response.json({ error: "unavailable" }, { status: validationStatus });
    }
    if (url.endsWith("/auth/v1/admin/users")) {
      return createStatus === 200
        ? Response.json({ id: "new-auth-user-id" })
        : Response.json({ code: createCode }, { status: createStatus });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const handler = createWorkspaceInvitationSignupHandler({
    env: (name) => ENV[name],
    fetch,
    rateLimit: async (input) => {
      limits.push(input);
      return rateLimitResponse;
    },
    logError: (message) => logs.push(message),
  });
  return { handler, calls, limits, logs };
}

test("validates the pending invite before creating a confirmed account without logging secrets", async () => {
  const scenario = setup();
  const response = await scenario.handler(request({ body: { token: TOKEN, email: " Dietitian@Example.test ", password: PASSWORD } }));

  assert.equal(response.status, 200);
  const responseBody = JSON.stringify(await response.json());
  assert.equal(responseBody, JSON.stringify({ ok: true }));
  assert.equal(scenario.calls.length, 2);
  assert.match(scenario.calls[0].url, /rpc\/validate_workspace_invitation_before_signup$/);
  assert.match(scenario.calls[1].url, /auth\/v1\/admin\/users$/);

  const validationCall = scenario.calls[0];
  assert.equal(new Headers(validationCall.init.headers).get("apikey"), ANON_KEY);
  assert.equal(new Headers(validationCall.init.headers).get("Authorization"), `Bearer ${ANON_KEY}`);
  assert.deepEqual(JSON.parse(validationCall.init.body), { p_token: TOKEN, p_email: EMAIL });

  const createCall = scenario.calls[1];
  assert.equal(new Headers(createCall.init.headers).get("apikey"), SERVICE_KEY);
  assert.equal(new Headers(createCall.init.headers).get("Authorization"), `Bearer ${SERVICE_KEY}`);
  assert.deepEqual(JSON.parse(createCall.init.body), { email: EMAIL, password: PASSWORD, email_confirm: true });
  assert.equal(JSON.stringify(createCall.init.body).includes(TOKEN), false);
  assert.equal(scenario.limits.length, 3);
  assert.deepEqual(scenario.limits.map(({ endpoint }) => endpoint), [
    "workspace-invitation-signup-ip",
    "workspace-invitation-signup-token",
    "workspace-invitation-signup-email",
  ]);
  assert.equal(scenario.limits[1].identityKey, createHash("sha256").update(TOKEN).digest("hex"));
  assert.equal(responseBody.includes(TOKEN), false);
  assert.equal(responseBody.includes(EMAIL), false);
  assert.equal(responseBody.includes(PASSWORD), false);
  assert.deepEqual(scenario.logs, []);
});

test("fails closed for invalid, expired, revoked, or mismatched invitations before Auth creation", async () => {
  const scenario = setup({ validation: false });
  const response = await scenario.handler(request());

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: false, code: "invitation_invalid" });
  assert.equal(scenario.calls.length, 1);
  assert.equal(scenario.calls.some(({ url }) => url.endsWith("/auth/v1/admin/users")), false);
});

test("fails closed when the existing invitation RPC is unavailable", async () => {
  const scenario = setup({ validationStatus: 500 });
  const response = await scenario.handler(request());

  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(body.includes(TOKEN), false);
  assert.equal(body.includes(EMAIL), false);
  assert.equal(body.includes(PASSWORD), false);
  assert.equal(scenario.calls.length, 1);
  assert.deepEqual(scenario.logs, ["workspace-invitation-signup: invitation validation unavailable"]);
});

test("returns a login path for an existing Auth account without updating its password", async () => {
  const scenario = setup({ createStatus: 422, createCode: "email_exists" });
  const response = await scenario.handler(request());

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: false, code: "account_exists" });
  assert.equal(scenario.calls.length, 2);
  assert.deepEqual(JSON.parse(scenario.calls[1].init.body), { email: EMAIL, password: PASSWORD, email_confirm: true });
});

test("rate limits before validating or creating the account", async () => {
  const scenario = setup({ rateLimitResponse: new Response("limited", { status: 429 }) });
  const response = await scenario.handler(request());

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { ok: false, code: "rate_limited" });
  assert.equal(scenario.calls.length, 0);
  assert.equal(scenario.limits.length, 1);
});

test("rejects invalid requests and foreign origins before privileged creation", async () => {
  const malformed = setup();
  assert.equal((await malformed.handler(request({ body: { token: "bad", email: EMAIL, password: PASSWORD } }))).status, 400);
  assert.equal(malformed.calls.length, 0);

  const foreign = setup();
  const response = await foreign.handler(request({ headers: { Origin: "https://attacker.example" } }));
  assert.equal(response.status, 403);
  assert.equal(foreign.calls.length, 0);
});

test("does not leak Auth errors or credential values to logs or response", async () => {
  const scenario = setup({ createStatus: 500, createCode: "internal_error" });
  const response = await scenario.handler(request());
  const responseBody = await response.text();

  assert.equal(response.status, 503);
  assert.equal(responseBody.includes(TOKEN), false);
  assert.equal(responseBody.includes(EMAIL), false);
  assert.equal(responseBody.includes(PASSWORD), false);
  assert.deepEqual(scenario.logs, ["workspace-invitation-signup: Auth account creation failed"]);
  assert.equal(scenario.logs.some((message) => message.includes(TOKEN) || message.includes(EMAIL) || message.includes(PASSWORD)), false);
});
