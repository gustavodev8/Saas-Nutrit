import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspaceAccessRequestHandler } from "./workspaceAccessRequestHandler.ts";

const SERVICE_KEY = "service-role-only-test-key";
const SITE_URL = "https://saas.example.test";
const ENV = {
  SAAS_SITE_URL: SITE_URL,
  SUPABASE_URL: "https://project.supabase.test/",
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
};

function request({ method = "POST", body, headers = {} } = {}) {
  return new Request("https://function.test/workspace-access-request", {
    method,
    headers: {
      Origin: SITE_URL,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

function setup({
  siteUrl = SITE_URL,
  rpcStatus = 200,
  rpcValue = true,
  rateLimitResponse = null,
  emailRateLimitResponse = rateLimitResponse,
} = {}) {
  const calls = [];
  const limits = [];
  const handler = createWorkspaceAccessRequestHandler({
    env: (name) => name === "SAAS_SITE_URL" ? siteUrl : ENV[name],
    fetch: async (input, init = {}) => {
      calls.push({ url: String(input), init });
      return rpcStatus === 200 ? Response.json(rpcValue) : Response.json({}, { status: rpcStatus });
    },
    rateLimit: async (input) => {
      limits.push(input);
      return input.endpoint === "workspace-access-request-email"
        ? emailRateLimitResponse
        : rateLimitResponse;
    },
    logError: () => {},
  });
  return { handler, calls, limits };
}

const validRequest = {
  applicantName: " Ana Nutricionista ",
  professionalEmail: " ANA@EXAMPLE.TEST ",
  phone: "(75) 99999-0000",
  crn: "CRN-5/12345",
  needCategory: "practice_management",
  consent: true,
};

test("valid request applies IP and normalized-email rate limits and calls only the privileged RPC", async () => {
  const scenario = setup();
  const response = await scenario.handler(request({ body: validRequest }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(scenario.limits.map(({ endpoint, identityKey }) => [endpoint, identityKey]), [
    ["workspace-access-request-ip", undefined],
    ["workspace-access-request-email", "ana@example.test"],
  ]);
  const rpc = scenario.calls[0];
  assert.match(rpc.url, /\/rpc\/submit_workspace_access_request$/);
  assert.equal(new Headers(rpc.init.headers).get("Authorization"), `Bearer ${SERVICE_KEY}`);
  assert.deepEqual(JSON.parse(rpc.init.body), {
    p_applicant_name: "Ana Nutricionista",
    p_professional_email: "ana@example.test",
    p_phone: "(75) 99999-0000",
    p_crn: "CRN-5/12345",
    p_need_category: "practice_management",
    p_consent: true,
  });
});

test("rejects foreign origins, invalid configuration, methods, and malformed input before RPC", async () => {
  const foreign = setup();
  assert.equal((await foreign.handler(request({ headers: { Origin: "https://attacker.test" }, body: validRequest }))).status, 403);
  assert.equal(foreign.calls.length, 0);

  const missingSite = setup({ siteUrl: "" });
  assert.equal((await missingSite.handler(request({ body: validRequest }))).status, 503);

  const method = setup();
  assert.equal((await method.handler(request({ method: "GET" }))).status, 405);
  assert.equal((await method.handler(request({ method: "OPTIONS" }))).status, 200);

  const invalid = setup();
  assert.equal((await invalid.handler(request({ body: { ...validRequest, professionalEmail: "bad" } }))).status, 400);
  assert.equal((await invalid.handler(request({ body: { ...validRequest, consent: false } }))).status, 400);
  assert.equal((await invalid.handler(request({ body: { ...validRequest, needCategory: "unlisted" } }))).status, 400);
  assert.equal((await invalid.handler(request({ body: { ...validRequest, needSummary: "free text" } }))).status, 400);
  assert.equal(invalid.calls.length, 0);
});

test("fails closed on rate limits, oversized body, and RPC failure; honeypot creates no row", async () => {
  const denied = setup({ rateLimitResponse: new Response("denied", { status: 429 }) });
  assert.equal((await denied.handler(request({ body: validRequest }))).status, 429);
  assert.equal(denied.calls.length, 0);

  const oversized = setup();
  assert.equal((await oversized.handler(request({ body: "x".repeat(9_000) }))).status, 413);

  const rpcFailure = setup({ rpcStatus: 500 });
  assert.equal((await rpcFailure.handler(request({ body: validRequest }))).status, 503);

  const spam = setup();
  assert.deepEqual(await (await spam.handler(request({ body: { website: "filled" } }))).json(), { ok: true });
  assert.equal(spam.calls.length, 0);
});

test("email bucket 429 is indistinguishable from success and performs no RPC", async () => {
  const successScenario = setup();
  const success = await successScenario.handler(request({ body: validRequest }));

  const limitedScenario = setup({
    emailRateLimitResponse: new Response("email activity limited", { status: 429 }),
  });
  const limited = await limitedScenario.handler(request({ body: validRequest }));

  assert.equal(limited.status, success.status);
  assert.equal(await limited.text(), await success.text());
  assert.deepEqual([...limited.headers.entries()], [...success.headers.entries()]);
  assert.equal(limitedScenario.calls.length, 0);
  assert.deepEqual(limitedScenario.limits.map(({ endpoint }) => endpoint), [
    "workspace-access-request-ip",
    "workspace-access-request-email",
  ]);
});

test("email rate-limit infrastructure failure remains fail-closed 503 without RPC", async () => {
  const scenario = setup({ emailRateLimitResponse: new Response("unavailable", { status: 503 }) });
  const response = await scenario.handler(request({ body: validRequest }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false });
  assert.equal(scenario.calls.length, 0);
});
