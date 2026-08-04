import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertAllowedOrigin,
  assertMethod,
  buildCorsHeaders,
  enforceRateLimit,
  handlePublicOptions,
  jsonResponse,
} from "../_shared/publicEndpoint.ts";

const corsHeaders = buildCorsHeaders();

serve(async (req) => {
  const optionsResponse = handlePublicOptions(req, corsHeaders);
  if (optionsResponse) return optionsResponse;

  const methodError = assertMethod(req, "POST", corsHeaders);
  if (methodError) return methodError;

  const originError = assertAllowedOrigin(req, corsHeaders);
  if (originError) return originError;

  try {
    const rateLimitError = await enforceRateLimit({
      req,
      corsHeaders,
      endpoint: "check-payment-status",
      limit: 90,
      windowSeconds: 300,
    });
    if (rateLimitError) return rateLimitError;

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const { payment_id, poll_token } = await req.json() as {
      payment_id?: number | string;
      poll_token?: string;
    };

    if (!mpAccessToken || !payment_id) {
      return jsonResponse({ error: "Pagamento invalido." }, 400, corsHeaders);
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!paymentRes.ok) {
      return jsonResponse({ error: "Pagamento invalido." }, 400, corsHeaders);
    }

    const payment = await paymentRes.json();
    const parts = String(payment?.external_reference || "").split("|");
    const expectedPollToken = parts.length >= 6 ? parts[5] : "";

    if (expectedPollToken && poll_token !== expectedPollToken) {
      return jsonResponse({ error: "Consulta de pagamento nao autorizada." }, 403, corsHeaders);
    }

    return jsonResponse({ status: payment.status }, 200, corsHeaders);
  } catch (error) {
    console.error("check-payment-status error:", error);
    return jsonResponse({ error: "Erro ao consultar pagamento." }, 500, corsHeaders);
  }
});
