import {
  assertAllowedOrigin,
  buildCorsHeaders,
  enforceRateLimit,
} from "../_shared/publicEndpoint.ts";
import { isValidInvitationSiteUrl } from "../_shared/workspaceInvitation.ts";
import { parseWorkspaceAccessRequest } from "../_shared/workspaceAccessRequests.ts";

interface HandlerDependencies {
  env: (name: string) => string | undefined;
  fetch?: typeof fetch;
  rateLimit?: (input: Parameters<typeof enforceRateLimit>[0]) => Promise<Response | null>;
  logError?: (message: string) => void;
  timeoutMs?: number;
}

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

export function createWorkspaceAccessRequestHandler({
  env,
  fetch: fetchImpl = fetch,
  rateLimit = enforceRateLimit,
  logError = (message) => console.error(message),
  timeoutMs = 10_000,
}: HandlerDependencies): (req: Request) => Promise<Response> {
  return async (req) => {
    const configuredSiteUrl = env("SAAS_SITE_URL")?.trim() ?? "";
    const siteUrlIsValid = isValidSiteOrigin(configuredSiteUrl);
    const corsHeaders = getCorsHeaders(siteUrlIsValid ? configuredSiteUrl : null);
    if (!siteUrlIsValid) return response({ ok: false }, 503, corsHeaders);

    const originError = assertAllowedOrigin(req, corsHeaders, configuredSiteUrl);
    if (originError) return originError;
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return response({ ok: false }, 405, corsHeaders);

    const supabaseUrl = env("SUPABASE_URL")?.trim().replace(/\/+$/, "");
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!supabaseUrl || !serviceKey) return response({ ok: false }, 503, corsHeaders);

    const ipLimit = await rateLimit({
      req,
      corsHeaders,
      endpoint: "workspace-access-request-ip",
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (ipLimit) return response({ ok: false }, ipLimit.status, corsHeaders);

    let rawBody: string;
    try {
      rawBody = await req.text();
    } catch {
      return response({ ok: false }, 400, corsHeaders);
    }
    if (rawBody.length > 8_192) return response({ ok: false }, 413, corsHeaders);

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return response({ ok: false }, 400, corsHeaders);
    }

    const parsed = parseWorkspaceAccessRequest(payload);
    if (parsed.kind === "invalid") return response({ ok: false }, 400, corsHeaders);
    if (parsed.kind === "spam") return response({ ok: true }, 200, corsHeaders);

    const emailLimit = await rateLimit({
      req,
      corsHeaders,
      endpoint: "workspace-access-request-email",
      limit: 3,
      windowSeconds: 24 * 60 * 60,
      identityKey: parsed.value.professionalEmail,
    });
    if (emailLimit?.status === 429) return response({ ok: true }, 200, corsHeaders);
    if (emailLimit) return response({ ok: false }, emailLimit.status, corsHeaders);

    try {
      const rpcResponse = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/submit_workspace_access_request`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_applicant_name: parsed.value.applicantName,
          p_professional_email: parsed.value.professionalEmail,
          p_phone: parsed.value.phone,
          p_crn: parsed.value.crn,
          p_need_category: parsed.value.needCategory,
          p_consent: parsed.value.consent,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!rpcResponse.ok || await rpcResponse.json().catch(() => null) !== true) {
        return response({ ok: false }, 503, corsHeaders);
      }

      return response({ ok: true }, 200, corsHeaders);
    } catch {
      logError("workspace-access-request: request failed");
      return response({ ok: false }, 503, corsHeaders);
    }
  };
}
