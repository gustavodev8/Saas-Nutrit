import {
  assertAllowedOrigin,
  buildCorsHeaders,
  enforceRateLimit,
} from "../_shared/publicEndpoint.ts";
import {
  isUuid,
  isWorkspaceAccessRequestStatus,
} from "../_shared/workspaceAccessRequests.ts";
import {
  isConfirmedPlatformAdmin,
  isValidInvitationSiteUrl,
  normalizeEmail,
} from "../_shared/workspaceInvitation.ts";

interface HandlerDependencies {
  env: (name: string) => string | undefined;
  fetch?: typeof fetch;
  rateLimit?: (input: Parameters<typeof enforceRateLimit>[0]) => Promise<Response | null>;
  logError?: (message: string) => void;
  timeoutMs?: number;
}

interface AuthenticatedUser {
  id?: unknown;
  email?: unknown;
  email_confirmed_at?: unknown;
}

function response(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  return req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
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

export function createAccessRequestAdminHandler({
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
    if (!siteUrlIsValid) return response({ ok: false }, 503, corsHeaders);

    const originError = assertAllowedOrigin(req, corsHeaders, siteUrl);
    if (originError) return originError;
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return response({ ok: false }, 405, corsHeaders);

    const supabaseUrl = env("SUPABASE_URL")?.trim().replace(/\/+$/, "");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const anonKey = env("SUPABASE_ANON_KEY")?.trim();
    const allowedAdmins = env("SAAS_PLATFORM_ADMIN_EMAILS") ?? "";
    const bearerToken = getBearerToken(req);
    if (!supabaseUrl || !serviceKey || !anonKey || !allowedAdmins.trim()
      || !bearerToken || bearerToken === serviceKey || bearerToken === anonKey) {
      return response({ ok: false }, 401, corsHeaders);
    }

    try {
      const authResponse = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${bearerToken}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!authResponse.ok) return response({ ok: false }, 401, corsHeaders);

      const user = await authResponse.json() as AuthenticatedUser;
      const userEmail = typeof user.email === "string" ? normalizeEmail(user.email) : "";
      if (!isUuid(user.id) || !userEmail) return response({ ok: false }, 401, corsHeaders);
      if (!isConfirmedPlatformAdmin(userEmail, user.email_confirmed_at, allowedAdmins)) {
        return response({ ok: false }, typeof user.email_confirmed_at === "string" && user.email_confirmed_at ? 403 : 401, corsHeaders);
      }

      const limitError = await rateLimit({
        req,
        corsHeaders,
        endpoint: "workspace-access-request-admin",
        limit: 60,
        windowSeconds: 60 * 60,
        identityKey: userEmail,
      });
      if (limitError) return response({ ok: false }, limitError.status, corsHeaders);

      const rawBody = await req.text();
      if (rawBody.length > 2_048) return response({ ok: false }, 400, corsHeaders);
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return response({ ok: false }, 400, corsHeaders);
      }
      if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        return response({ ok: false }, 400, corsHeaders);
      }

      const action = (payload as Record<string, unknown>).action;
      let rpcName: string;
      let rpcBody: Record<string, unknown>;
      if (action === "list") {
        rpcName = "list_workspace_access_requests";
        rpcBody = {};
      } else if (action === "review") {
        const requestId = (payload as Record<string, unknown>).requestId;
        const status = (payload as Record<string, unknown>).status;
        if (!isUuid(requestId) || !isWorkspaceAccessRequestStatus(status)) {
          return response({ ok: false }, 400, corsHeaders);
        }
        rpcName = "review_workspace_access_request";
        rpcBody = { p_request_id: requestId, p_status: status, p_reviewed_by: user.id };
      } else {
        return response({ ok: false }, 400, corsHeaders);
      }

      const rpcResponse = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rpcBody),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!rpcResponse.ok) return response({ ok: false }, 503, corsHeaders);
      const data: unknown = await rpcResponse.json().catch(() => null);
      if (action === "list") {
        return Array.isArray(data)
          ? response({ ok: true, requests: data }, 200, corsHeaders)
          : response({ ok: false }, 503, corsHeaders);
      }
      if (data !== true) return response({ ok: false }, 409, corsHeaders);
      return response({ ok: true }, 200, corsHeaders);
    } catch {
      logError("workspace-access-request-admin: request failed");
      return response({ ok: false }, 503, corsHeaders);
    }
  };
}
