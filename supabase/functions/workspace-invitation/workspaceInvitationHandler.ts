import {
  enforceRateLimit,
} from "../_shared/publicEndpoint.ts";
import {
  buildWorkspaceInvitationUrl,
  createWorkspaceInvitationToken,
  isConfirmedPlatformAdmin,
  isValidInvitationInput,
  isValidInvitationSiteUrl,
  normalizeEmail,
  WORKSPACE_INVITATION_RATE_LIMITS,
} from "../_shared/workspaceInvitation.ts";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvitationPayload {
  email?: unknown;
  workspaceName?: unknown;
}

interface AuthenticatedUser {
  email?: unknown;
  email_confirmed_at?: unknown;
}

type InvitationStage =
  | "auth_lookup"
  | "admin_rate_limit"
  | "request_processing"
  | "recipient_rate_limit"
  | "create_rpc"
  | "resend";

export interface WorkspaceInvitationHandlerDependencies {
  env: (name: string) => string | undefined;
  fetch?: typeof fetch;
  rateLimit?: (input: Parameters<typeof enforceRateLimit>[0]) => Promise<Response | null>;
  logError?: (message: string) => void;
  timeoutMs?: number;
}

function jsonResponse(body: Record<string, unknown>, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSafeErrorClass(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  return ["AbortError", "TimeoutError", "TypeError", "SyntaxError", "Error"].includes(name)
    ? name
    : "UnknownError";
}

function logStageFailure(
  logError: (message: string) => void,
  stage: string,
  status: number,
  errorClass: string,
): void {
  try {
    logError(`workspace-invitation stage=${stage} status=${status} error_class=${errorClass}`);
  } catch {
    // Logging must not change invitation semantics.
  }
}

function getBearerToken(req: Request): string | null {
  const match = req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

function isInvitationPayload(value: unknown): value is InvitationPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildCorsHeaders(siteUrl: string | null): Record<string, string> {
  if (!siteUrl) return { ...CORS_HEADERS };

  try {
    return {
      ...CORS_HEADERS,
      "Access-Control-Allow-Origin": new URL(siteUrl).origin,
    };
  } catch {
    return { ...CORS_HEADERS };
  }
}

function assertAllowedOrigin(
  req: Request,
  corsHeaders: Record<string, string>,
  siteUrl: string,
): Response | null {
  const allowedOrigin = new URL(siteUrl).origin.toLowerCase();
  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();

  for (const source of [origin, referer]) {
    if (!source) continue;

    try {
      if (new URL(source).origin.toLowerCase() !== allowedOrigin) {
        return jsonResponse({ ok: false, code: "origin_not_allowed" }, 403, corsHeaders);
      }
    } catch {
      return jsonResponse({ ok: false, code: "origin_not_allowed" }, 403, corsHeaders);
    }
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createWorkspaceInvitationHandler({
  env,
  fetch: fetchImpl = fetch,
  rateLimit = enforceRateLimit,
  logError = (message) => console.error(message),
  timeoutMs = 10_000,
}: WorkspaceInvitationHandlerDependencies): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const siteUrl = env("SAAS_SITE_URL")?.trim();
    const siteUrlIsValid = Boolean(siteUrl) && isValidInvitationSiteUrl(siteUrl);
    const corsHeaders = buildCorsHeaders(siteUrlIsValid ? siteUrl : null);

    if (!siteUrlIsValid) {
      logStageFailure(logError, "configuration", 503, "invalid_config");
      return jsonResponse({ ok: false, code: "service_unavailable" }, 503, corsHeaders);
    }

    const originError = assertAllowedOrigin(req, corsHeaders, siteUrl);
    if (originError) return originError;

    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return jsonResponse({ ok: false, code: "method_not_allowed" }, 405, corsHeaders);

    const supabaseUrl = env("SUPABASE_URL")?.trim();
    const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const anonKey = env("SUPABASE_ANON_KEY")?.trim();
    const resendKey = env("RESEND_API_KEY")?.trim();
    const resendFrom = env("RESEND_FROM_EMAIL")?.trim();
    const allowedAdmins = env("SAAS_PLATFORM_ADMIN_EMAILS") ?? "";
    const bearerToken = getBearerToken(req);

    if (!supabaseUrl || !serviceKey || !anonKey || !resendKey || !resendFrom || !allowedAdmins.trim()) {
      logStageFailure(logError, "configuration", 503, "missing_config");
      return jsonResponse({ ok: false, code: "service_unavailable" }, 503, corsHeaders);
    }
    if (!bearerToken || bearerToken === serviceKey || bearerToken === anonKey) {
      return jsonResponse({ ok: false, code: "unauthorized" }, 401, corsHeaders);
    }

    let invitationMayBePending = false;
    let stage: InvitationStage = "auth_lookup";
    try {
      const baseUrl = supabaseUrl.replace(/\/+$/, "");
      const authResponse = await fetchImpl(`${baseUrl}/auth/v1/user`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${bearerToken}`,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!authResponse.ok) {
        logStageFailure(logError, "auth_lookup", authResponse.status, "http_response");
        return jsonResponse({ ok: false, code: "unauthorized" }, 401, corsHeaders);
      }

      const user = await authResponse.json() as AuthenticatedUser;
      const userEmail = typeof user.email === "string" ? normalizeEmail(user.email) : "";
      if (!userEmail) return jsonResponse({ ok: false, code: "unauthorized" }, 401, corsHeaders);
      if (!isConfirmedPlatformAdmin(userEmail, user.email_confirmed_at, allowedAdmins)) {
        const isConfirmed = typeof user.email_confirmed_at === "string" && Boolean(user.email_confirmed_at);
        return jsonResponse({ ok: false, code: isConfirmed ? "forbidden" : "unauthorized" }, isConfirmed ? 403 : 401, corsHeaders);
      }

      stage = "admin_rate_limit";
      const adminRateLimitError = await rateLimit({
        req,
        corsHeaders,
        ...WORKSPACE_INVITATION_RATE_LIMITS.administrator,
        identityKey: userEmail,
      });
      if (adminRateLimitError) {
        logStageFailure(logError, "admin_rate_limit", adminRateLimitError.status, "http_response");
        const isRateLimited = adminRateLimitError.status === 429;
        return jsonResponse({ ok: false, code: isRateLimited ? "rate_limited" : "service_unavailable" }, adminRateLimitError.status, corsHeaders);
      }

      stage = "request_processing";
      let payload: InvitationPayload;
      try {
        payload = await req.json() as InvitationPayload;
      } catch {
        return jsonResponse({ ok: false, code: "invalid_input" }, 400, corsHeaders);
      }
      if (!isInvitationPayload(payload)
        || typeof payload.email !== "string"
        || typeof payload.workspaceName !== "string") {
        return jsonResponse({ ok: false, code: "invalid_input" }, 400, corsHeaders);
      }

      const email = normalizeEmail(payload.email);
      const workspaceName = payload.workspaceName.trim();
      if (!isValidInvitationInput(email, workspaceName)) return jsonResponse({ ok: false, code: "invalid_input" }, 400, corsHeaders);

      stage = "recipient_rate_limit";
      const recipientRateLimitError = await rateLimit({
        req,
        corsHeaders,
        ...WORKSPACE_INVITATION_RATE_LIMITS.recipient,
        identityKey: email,
      });
      if (recipientRateLimitError) {
        logStageFailure(logError, "recipient_rate_limit", recipientRateLimitError.status, "http_response");
        const isRateLimited = recipientRateLimitError.status === 429;
        return jsonResponse({ ok: false, code: isRateLimited ? "rate_limited" : "service_unavailable" }, recipientRateLimitError.status, corsHeaders);
      }

      stage = "create_rpc";
      const { rawToken, tokenHash } = await createWorkspaceInvitationToken();
      const expiresAt = new Date(Date.now() + INVITATION_TTL_MS).toISOString();
      invitationMayBePending = true;
      const rpcResponse = await fetchImpl(`${baseUrl}/rest/v1/rpc/create_workspace_invitation`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_email: email,
          p_workspace_name: workspaceName,
          p_token_hash: tokenHash,
          p_expires_at: expiresAt,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!rpcResponse.ok) {
        logStageFailure(logError, "create_rpc", rpcResponse.status, "http_response");
        const code = rpcResponse.status < 500 ? "invitation_not_created" : "invitation_status_unknown";
        return jsonResponse({ ok: false, code }, 503, corsHeaders);
      }

      const invitationId: unknown = await rpcResponse.json().catch(() => null);
      if (typeof invitationId !== "string" || !invitationId) {
        logStageFailure(logError, "create_rpc", rpcResponse.status, "invalid_response");
        return jsonResponse({ ok: false, code: "invitation_status_unknown" }, 503, corsHeaders);
      }

      stage = "resend";
      const invitationUrl = buildWorkspaceInvitationUrl(siteUrl, rawToken);
      const workspaceLabel = escapeHtml(workspaceName);
      const emailResponse = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: email,
          subject: "Seu convite para o SaaS Nutrit",
          html: `<p>Voce foi convidado para configurar o workspace <strong>${workspaceLabel}</strong>.</p><p><a href="${escapeHtml(invitationUrl)}">Aceitar convite</a></p><p>Este link expira em 7 dias e pode ser usado uma unica vez.</p>`,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!emailResponse.ok) {
        logStageFailure(logError, "resend", emailResponse.status, "http_response");
        const deliveryStatusIsUnknown = emailResponse.status >= 500;
        return jsonResponse({
          ok: false,
          code: deliveryStatusIsUnknown ? "invitation_status_unknown" : "email_delivery_failed",
        }, 503, corsHeaders);
      }

      return jsonResponse({ ok: true }, 200, corsHeaders);
    } catch (error) {
      logStageFailure(logError, `outer_exception_${stage}`, 503, getSafeErrorClass(error));
      return jsonResponse({ ok: false, code: invitationMayBePending ? "invitation_status_unknown" : "service_unavailable" }, 503, corsHeaders);
    }
  };
}
