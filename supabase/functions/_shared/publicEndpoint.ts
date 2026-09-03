export function buildCorsHeaders(allowedMethods = "POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": allowedMethods,
  };
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function handlePublicOptions(req: Request, corsHeaders: Record<string, string>) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return null;
}

export function assertMethod(
  req: Request,
  allowedMethod: string,
  corsHeaders: Record<string, string>,
) {
  if (req.method !== allowedMethod) {
    return jsonResponse({ error: "Metodo nao permitido." }, 405, corsHeaders);
  }

  return null;
}

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "").toLowerCase();
}

export function assertAllowedOrigin(
  req: Request,
  corsHeaders: Record<string, string>,
) {
  const configuredSiteUrl = Deno.env.get("SITE_URL")?.trim();
  if (!configuredSiteUrl) return null;

  const allowedOrigin = normalizeOrigin(configuredSiteUrl);
  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();

  if (origin && normalizeOrigin(origin) !== allowedOrigin) {
    return jsonResponse({ error: "Origem nao autorizada." }, 403, corsHeaders);
  }

  if (referer && !normalizeOrigin(referer).startsWith(`${allowedOrigin}/`) && normalizeOrigin(referer) !== allowedOrigin) {
    return jsonResponse({ error: "Origem nao autorizada." }, 403, corsHeaders);
  }

  return null;
}

export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export async function sha256Hex(value: string) {
  const payload = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getClientFingerprint(req: Request, extraKey = "") {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const acceptLanguage = req.headers.get("accept-language") ?? "unknown";
  return sha256Hex(`${ip}|${userAgent}|${acceptLanguage}|${extraKey}`);
}

export async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

interface RateLimitInput {
  req: Request;
  corsHeaders: Record<string, string>;
  endpoint: string;
  limit: number;
  windowSeconds: number;
  extraKey?: string;
}

export async function enforceRateLimit({
  req,
  corsHeaders,
  endpoint,
  limit,
  windowSeconds,
  extraKey = "",
}: RateLimitInput) {
  const unavailableResponse = () =>
    jsonResponse({ error: "Servico temporariamente indisponivel." }, 503, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!supabaseUrl || !serviceKey) return unavailableResponse();

  try {
    const bucketStart = new Date(
      Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
    ).toISOString();

    const fingerprintHash = await getClientFingerprint(req, `${endpoint}|${extraKey}`);
    const commonHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const rateLimitRes = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_public_rate_limit`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        p_endpoint: endpoint,
        p_fingerprint_hash: fingerprintHash,
        p_bucket_start: bucketStart,
        p_hit_limit: limit,
      }),
    });
    if (!rateLimitRes.ok) return unavailableResponse();

    let allowed: unknown;
    try {
      allowed = await rateLimitRes.json();
    } catch {
      return unavailableResponse();
    }

    if (allowed === false) {
      return jsonResponse({ error: "Muitas tentativas. Aguarde e tente novamente." }, 429, corsHeaders);
    }
    if (allowed !== true) return unavailableResponse();
  } catch {
    return unavailableResponse();
  }

  return null;
}
