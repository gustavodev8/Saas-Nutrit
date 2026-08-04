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

async function resolveProduct(productIndex: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;

  const res = await fetch(`${supabaseUrl}/rest/v1/site_content?id=eq.1&select=content`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!res.ok) {
    console.error(
      "create-preference content fetch error:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }

  const rows = await res.json().catch(() => []);
  const items = rows?.[0]?.content?.produtosDigitais?.items;
  if (!Array.isArray(items)) return null;

  const item = items[productIndex];
  if (!item || typeof item.priceAmount !== "number" || !item.name) return null;

  return {
    name: item.name as string,
    pdfUrl: (item.pdfUrl || "") as string,
    amount: item.priceAmount as number,
  };
}

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
      endpoint: "create-preference",
      limit: 12,
      windowSeconds: 300,
    });
    if (rateLimitError) return rateLimitError;

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!mpAccessToken || !supabaseUrl) {
      return jsonResponse({ error: "Pagamento nao configurado." }, 500, corsHeaders);
    }

    const { productIndex, productName, priceAmount, customerEmail, pdfUrl } = await req.json();
    const numericProductIndex = Number(productIndex);
    const product = Number.isInteger(numericProductIndex)
      ? await resolveProduct(numericProductIndex)
      : null;

    if (
      !product ||
      !customerEmail ||
      product.name !== productName ||
      product.pdfUrl !== (pdfUrl || "") ||
      Math.round(Number(priceAmount) * 100) !== Math.round(product.amount * 100)
    ) {
      return jsonResponse({ error: "Produto invalido." }, 400, corsHeaders);
    }

    const externalRef =
      `${numericProductIndex}|${customerEmail}|${encodeURIComponent(product.pdfUrl)}`;

    const isProduction = siteUrl.startsWith("https://");
    const preference: Record<string, unknown> = {
      items: [{
        title: product.name,
        quantity: 1,
        unit_price: product.amount,
        currency_id: "BRL",
      }],
      payer: { email: customerEmail },
      external_reference: externalRef,
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      statement_descriptor: "EBOOK",
    };

    if (isProduction) {
      preference.back_urls = {
        success: `${siteUrl}/pagamento/sucesso`,
        failure: `${siteUrl}/pagamento/erro`,
        pending: `${siteUrl}/pagamento/pendente`,
      };
      preference.auto_return = "approved";
    }

    const preferenceRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const preferenceData = await preferenceRes.json();

    if (!preferenceRes.ok) {
      console.error("MP error:", preferenceData);
      return jsonResponse({ error: "Erro ao criar pagamento." }, 500, corsHeaders);
    }

    return jsonResponse(
      {
        init_point: preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("create-preference error:", error);
    return jsonResponse({ error: "Erro ao criar preferencia." }, 500, corsHeaders);
  }
});
