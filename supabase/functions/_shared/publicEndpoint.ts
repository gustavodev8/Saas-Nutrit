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
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) return null;

  const bucketStart = new Date(
    Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
  ).toISOString();

  const fingerprintHash = await getClientFingerprint(req, `${endpoint}|${extraKey}`);
  const table = "public_request_rate_limits";
  const commonHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  try {
    const queryUrl =
      `${supabaseUrl}/rest/v1/${table}` +
      `?endpoint=eq.${encodeURIComponent(endpoint)}` +
      `&fingerprint_hash=eq.${encodeURIComponent(fingerprintHash)}` +
      `&bucket_start=eq.${encodeURIComponent(bucketStart)}` +
      "&select=id,hit_count" +
      "&limit=1";

    const currentRes = await fetch(queryUrl, { headers: commonHeaders });
    if (!currentRes.ok) {
      console.warn("Rate limit lookup skipped:", currentRes.status, await currentRes.text().catch(() => ""));
      return null;
    }

    const rows = await currentRes.json().catch(() => []) as Array<{ id: number; hit_count: number }>;
    const current = rows[0];

    if (current && Number(current.hit_count) >= limit) {
      return jsonResponse({ error: "Muitas tentativas. Aguarde e tente novamente." }, 429, corsHeaders);
    }

    if (current) {
      await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${current.id}`, {
        method: "PATCH",
        headers: {
          ...commonHeaders,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          hit_count: Number(current.hit_count) + 1,
          updated_at: new Date().toISOString(),
        }),
      });
      return null;
    }

    await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        ...commonHeaders,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        endpoint,
        fingerprint_hash: fingerprintHash,
        bucket_start: bucketStart,
        hit_count: 1,
      }),
    });
  } catch (error) {
    console.warn("Rate limit skipped due to error:", error);
  }

  return null;
}
