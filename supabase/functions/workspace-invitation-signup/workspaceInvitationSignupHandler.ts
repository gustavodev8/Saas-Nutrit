import {
  assertAllowedOrigin,
  buildCorsHeaders,
  enforceRateLimit,
  sha256Hex,
} from "../_shared/publicEndpoint.ts";
import { isValidInvitationSiteUrl, normalizeEmail } from "../_shared/workspaceInvitation.ts";

interface HandlerDependencies {
  env: (name: string) => string | undefined;
  fetch?: typeof fetch;
  rateLimit?: (input: Parameters<typeof enforceRateLimit>[0]) => Promise<Response | null>;
  logError?: (message: string) => void;
  timeoutMs?: number;
}

interface SignupPayload {
  token?: unknown;
  email?: unknown;
  password?: unknown;
}

const GENERIC_FAILURE = { ok: false, code: "signup_unavailable" };
const MAX_BODY_BYTES = 8_192;

function response(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function getCorsHeaders(siteUrl: string | null) {
  const origin = siteUrl ? new URL(siteUrl).origin : "null";
  return buildCorsHeaders("POST, OPTIONS", origin);
}

function isValidSiteOrigin(value: string) {
  if (!isValidInvitationSiteUrl(value)) return false;
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash;
}

function isSignupPayload(value: unknown): value is SignupPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSignupInput(email: string, token: string, password: string) {
  return email.length <= 320
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && /^[a-fA-F0-9]{64}$/.test(token)
    && password.length >= 6
    && password.length <= 256;
}

async function readAuthErrorCode(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (typeof payload !== "object" || payload === null) return "";
  const record = payload as Record<string, unknown>;
  return typeof record.code === "string" ? record.code : "";
}

export function createWorkspaceInvitationSignupHandler({
  env,
  fetch: fetchImpl = fetch,
  rateLimit = enforceRateLimit,
  logError = (message) => console.error(message),
  timeoutMs = 10_000,
}: HandlerDependencies): (req: Request) => Promise<Response> {
  return async (req) => {
    const siteUrl = env("SAAS_SITE_URL")?.trim() ?? "";
    const siteUrlIsValid = isValidSiteOrigin(siteUrl);
    const corsHeaders = getCorsHeaders(siteUrlIsValid ? siteUrl : null);
    if (!siteUrlIsValid) return response(GENERIC_FAILURE, 503, corsHeaders);

    const originError = assertAllowedOrigin(req, corsHeaders, siteUrl);
    if (originError) return originError;
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return response(GENERIC_FAILURE, 405, corsHeaders);

    const supabaseUrl = env("SUPABASE_URL")?.trim().replace(/\/+$/, "");
    const anonKey = env("SUPABASE_ANON_KEY")?.trim();
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !anonKey || !serviceKey) return response(GENERIC_FAILURE, 503, corsHeaders);

    const ipLimit = await rateLimit({
      req,
      corsHeaders,
      endpoint: "workspace-invitation-signup-ip",
      limit: 10,
      windowSeconds: 60 * 60,
    });
    if (ipLimit) {
      return ipLimit.status === 429
        ? response({ ok: false, code: "rate_limited" }, 429, corsHeaders)
        : response(GENERIC_FAILURE, 503, corsHeaders);
    }

    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      return response({ ok: false, code: "invalid_request" }, 400, corsHeaders);
    }
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return response({ ok: false, code: "invalid_request" }, 413, corsHeaders);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return response({ ok: false, code: "invalid_request" }, 400, corsHeaders);
    }
    if (!isSignupPayload(payload)
      || typeof payload.token !== "string"
      || typeof payload.email !== "string"
      || typeof payload.password !== "string") {
      return response({ ok: false, code: "invalid_request" }, 400, corsHeaders);
    }

    const token = payload.token.trim();
    const email = normalizeEmail(payload.email);
    const password = payload.password;
    if (!isValidSignupInput(email, token, password)) {
      return response({ ok: false, code: "invalid_request" }, 400, corsHeaders);
    }

    try {
      const tokenFingerprint = await sha256Hex(token.toLowerCase());
      const [tokenLimit, emailLimit] = await Promise.all([
        rateLimit({
          req,
          corsHeaders,
          endpoint: "workspace-invitation-signup-token",
          limit: 5,
          windowSeconds: 60 * 60,
          identityKey: tokenFingerprint,
        }),
        rateLimit({
          req,
          corsHeaders,
          endpoint: "workspace-invitation-signup-email",
          limit: 5,
          windowSeconds: 60 * 60,
          identityKey: email,
        }),
      ]);
      const deniedLimit = [tokenLimit, emailLimit].find((limit) => limit !== null);
      if (deniedLimit) {
        return deniedLimit.status === 429
          ? response({ ok: false, code: "rate_limited" }, 429, corsHeaders)
          : response(GENERIC_FAILURE, 503, corsHeaders);
      }

      const validationResponse = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/validate_workspace_invitation_before_signup`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_token: token, p_email: email }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!validationResponse.ok) {
        logError("workspace-invitation-signup: invitation validation unavailable");
        return response(GENERIC_FAILURE, 503, corsHeaders);
      }
      if (await validationResponse.json().catch(() => null) !== true) {
        return response({ ok: false, code: "invitation_invalid" }, 200, corsHeaders);
      }

      // The validated, high-entropy email token is the mailbox proof. Admin user
      // creation bypasses Before User Created, so no metadata or hook is trusted here.
      const createUserResponse = await fetchImpl(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, email_confirm: true }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!createUserResponse.ok) {
        const authErrorCode = await readAuthErrorCode(createUserResponse);
        if (authErrorCode === "email_exists") {
          return response({ ok: false, code: "account_exists" }, 200, corsHeaders);
        }
        logError("workspace-invitation-signup: Auth account creation failed");
        return response(GENERIC_FAILURE, 503, corsHeaders);
      }

      return response({ ok: true }, 200, corsHeaders);
    } catch {
      logError("workspace-invitation-signup: request failed");
      return response(GENERIC_FAILURE, 503, corsHeaders);
    }
  };
}
