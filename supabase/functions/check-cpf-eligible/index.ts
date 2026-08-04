import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertAllowedOrigin,
  assertMethod,
  buildCorsHeaders,
  delay,
  enforceRateLimit,
  handlePublicOptions,
  jsonResponse,
  sha256Hex,
} from "../_shared/publicEndpoint.ts";

const corsHeaders = buildCorsHeaders();

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

serve(async (req) => {
  const optionsResponse = handlePublicOptions(req, corsHeaders);
  if (optionsResponse) return optionsResponse;

  const methodError = assertMethod(req, "POST", corsHeaders);
  if (methodError) return methodError;

  const originError = assertAllowedOrigin(req, corsHeaders);
  if (originError) return originError;

  const startTime = Date.now();

  try {
    const { cpf, email } = await req.json() as { cpf?: string; email?: string };
    const digits = String(cpf || "").replace(/\D/g, "");
    const normalizedEmail = normalizeEmail(email);
    const cpfHash = digits ? await sha256Hex(digits) : "missing";

    const rateLimitError = await enforceRateLimit({
      req,
      corsHeaders,
      endpoint: "check-cpf-eligible",
      limit: 8,
      windowSeconds: 600,
      extraKey: `${cpfHash}|${normalizedEmail}`,
    });
    if (rateLimitError) return rateLimitError;

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (digits.length !== 11 || !emailIsValid) {
      const remaining = 250 - (Date.now() - startTime);
      if (remaining > 0) await delay(remaining);
      return jsonResponse({ eligible: false }, 200, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      const remaining = 250 - (Date.now() - startTime);
      if (remaining > 0) await delay(remaining);
      return jsonResponse({ eligible: false }, 200, corsHeaders);
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    };

    const byCpfUrl =
      `${supabaseUrl}/rest/v1/payment_logs` +
      `?customer_cpf_hash=eq.${encodeURIComponent(cpfHash)}` +
      "&product_index=not.is.null" +
      "&status=eq.approved" +
      "&select=id" +
      "&limit=1";

    const cpfRes = await fetch(byCpfUrl, { headers });
    if (cpfRes.ok) {
      const cpfData = await cpfRes.json().catch(() => []);
      if (Array.isArray(cpfData) && cpfData.length > 0) {
        const remaining = 250 - (Date.now() - startTime);
        if (remaining > 0) await delay(remaining);
        return jsonResponse({ eligible: false }, 200, corsHeaders);
      }
    } else {
      console.error("check-cpf-eligible CPF query error:", cpfRes.status);
    }

    const byEmailUrl =
      `${supabaseUrl}/rest/v1/payment_logs` +
      `?customer_email=eq.${encodeURIComponent(normalizedEmail)}` +
      "&product_index=not.is.null" +
      "&status=eq.approved" +
      "&select=id" +
      "&limit=1";

    const emailRes = await fetch(byEmailUrl, { headers });
    if (emailRes.ok) {
      const emailData = await emailRes.json().catch(() => []);
      if (Array.isArray(emailData) && emailData.length > 0) {
        const remaining = 250 - (Date.now() - startTime);
        if (remaining > 0) await delay(remaining);
        return jsonResponse({ eligible: false }, 200, corsHeaders);
      }
    } else {
      console.error("check-cpf-eligible email query error:", emailRes.status);
    }

    const remaining = 250 - (Date.now() - startTime);
    if (remaining > 0) await delay(remaining);
    return jsonResponse({ eligible: true }, 200, corsHeaders);
  } catch (error) {
    console.error("check-cpf-eligible error:", error);
    const remaining = 250 - (Date.now() - startTime);
    if (remaining > 0) await delay(remaining);
    return jsonResponse({ eligible: false }, 200, corsHeaders);
  }
});
