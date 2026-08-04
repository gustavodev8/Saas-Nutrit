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

interface DiscountConfig {
  active?: boolean;
  ebookPercentage?: number;
  percentage?: number;
  ebookScope?: "all" | "some";
  selectedEbookNames?: string[];
  ebookItemPercentages?: Record<string, number>;
  expiresAt?: string | null;
}

const toCents = (amount: unknown) => Math.round(Number(amount) * 100);

const isDiscountActive = (discount?: DiscountConfig) => {
  if (!discount?.active) return false;
  if (!discount.expiresAt) return true;
  return new Date(discount.expiresAt).getTime() > Date.now();
};

const ebookDiscountPercent = (
  discount: DiscountConfig | undefined,
  productName: string,
) => {
  if (!isDiscountActive(discount)) return 0;

  if (
    discount?.ebookScope === "some" &&
    !discount.selectedEbookNames?.includes(productName)
  ) {
    return 0;
  }

  const itemPercent = discount?.ebookItemPercentages?.[productName];
  const percent =
    itemPercent ??
    discount?.ebookPercentage ??
    discount?.percentage ??
    0;

  return Math.min(Math.max(Number(percent) || 0, 0), 95);
};

async function resolveExpectedProduct(productIndex: number) {
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
      "create-pix-payment content fetch error:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }

  const rows = await res.json().catch(() => []);
  const content = rows?.[0]?.content;
  const items = Array.isArray(content?.produtosDigitais?.items)
    ? content.produtosDigitais.items
    : [];
  const item = items[productIndex];
  if (!item || typeof item.priceAmount !== "number" || !item.name) return null;

  const percent = ebookDiscountPercent(content?.discount, item.name);
  const expectedAmount = Math.round(item.priceAmount * (1 - percent / 100) * 100) / 100;

  return {
    name: item.name as string,
    pdfUrl: (item.pdfUrl || "") as string,
    amount: expectedAmount,
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
      endpoint: "create-pix-payment",
      limit: 18,
      windowSeconds: 300,
    });
    if (rateLimitError) return rateLimitError;

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!mpAccessToken || !supabaseUrl) {
      return jsonResponse({ error: "Pagamento nao configurado." }, 500, corsHeaders);
    }

    const {
      productIndex,
      productName,
      priceAmount,
      customerEmail,
      pdfUrl,
      customerName,
      customerCpf,
    } = await req.json();

    const numericProductIndex = Number(productIndex);

    if (!Number.isInteger(numericProductIndex) || !customerEmail || !priceAmount) {
      return jsonResponse({ error: "Dados de pagamento invalidos." }, 400, corsHeaders);
    }

    const expectedProduct = await resolveExpectedProduct(numericProductIndex);
    if (
      !expectedProduct ||
      expectedProduct.name !== productName ||
      (expectedProduct.pdfUrl && expectedProduct.pdfUrl !== pdfUrl) ||
      toCents(priceAmount) !== toCents(expectedProduct.amount)
    ) {
      console.warn("Rejected product payment mismatch", {
        productIndex: numericProductIndex,
        receivedAmount: Number(priceAmount),
        expectedAmount: expectedProduct?.amount,
      });
      return jsonResponse({ error: "Valor do produto invalido." }, 400, corsHeaders);
    }

    const cpfDigits = (customerCpf || "").replace(/\D/g, "") || "00000000000";
    const cpfHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(cpfDigits),
    );
    const cpfHash = Array.from(new Uint8Array(cpfHashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const pollToken = crypto.randomUUID().replace(/-/g, "");
    const externalRef =
      `${numericProductIndex}|${customerEmail}|${encodeURIComponent(expectedProduct.pdfUrl || "")}|` +
      `${encodeURIComponent(customerName || "")}|${cpfHash}|${pollToken}`;

    const nameParts = (customerName || "Cliente").trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "NutriVida";

    const paymentBody = {
      transaction_amount: expectedProduct.amount,
      payment_method_id: "pix",
      description: expectedProduct.name,
      external_reference: externalRef,
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      payer: {
        email: customerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: { type: "CPF", number: cpfDigits },
      },
    };

    const idempotencyKey =
      `product-${numericProductIndex}-${customerEmail}-${expectedProduct.amount.toFixed(2)}-${cpfHash}`;

    const paymentRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const payment = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error("MP error:", JSON.stringify(payment));
      return jsonResponse({ error: "Erro ao criar pagamento Pix" }, 500, corsHeaders);
    }

    const transactionData = payment.point_of_interaction?.transaction_data;

    return jsonResponse(
      {
        payment_id: payment.id,
        qr_code: transactionData?.qr_code || "",
        qr_code_base64: transactionData?.qr_code_base64 || "",
        status: payment.status,
        poll_token: pollToken,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ error: "Erro ao criar pagamento Pix" }, 500, corsHeaders);
  }
});
