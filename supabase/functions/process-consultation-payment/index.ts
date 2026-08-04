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

async function confirmBookingGroup(
  bookingGroupId: string,
  paymentMethod: "pix" | "card",
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return false;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/bookings?booking_group_id=eq.${encodeURIComponent(bookingGroupId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "confirmed",
        payment_status: "paid",
        payment_method: paymentMethod,
      }),
    },
  );

  if (!res.ok) {
    console.error(
      "process-consultation-payment booking confirm error:",
      res.status,
      await res.text().catch(() => ""),
    );
    return false;
  }

  return true;
}

interface DiscountConfig {
  active?: boolean;
  servicePercentage?: number;
  percentage?: number;
  serviceScope?: "all" | "some";
  selectedServiceNames?: string[];
  serviceItemPercentages?: Record<string, number>;
  expiresAt?: string | null;
}

const toCents = (amount: unknown) => Math.round(Number(amount) * 100);

const isDiscountActive = (discount?: DiscountConfig) => {
  if (!discount?.active) return false;
  if (!discount.expiresAt) return true;
  return new Date(discount.expiresAt).getTime() > Date.now();
};

const serviceDiscountPercent = (
  discount: DiscountConfig | undefined,
  planName: string,
) => {
  if (!isDiscountActive(discount)) return 0;

  if (
    discount?.serviceScope === "some" &&
    !discount.selectedServiceNames?.includes(planName)
  ) {
    return 0;
  }

  const itemPercent = discount?.serviceItemPercentages?.[planName];
  const percent =
    itemPercent ??
    discount?.servicePercentage ??
    discount?.percentage ??
    0;

  return Math.min(Math.max(Number(percent) || 0, 0), 95);
};

async function resolveExpectedConsultationAmount(planName: string) {
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
      "process-consultation-payment content fetch error:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }

  const rows = await res.json().catch(() => []);
  const content = rows?.[0]?.content;
  const plans = Array.isArray(content?.loja?.plans) ? content.loja.plans : [];
  const plan = plans.find((item: { name?: string }) => item.name === planName);
  if (!plan || typeof plan.priceAmount !== "number") return null;

  const percent = serviceDiscountPercent(content?.discount, planName);
  const expected = plan.priceAmount * (1 - percent / 100);
  return Math.round(expected * 100) / 100;
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
      endpoint: "process-consultation-payment",
      limit: 24,
      windowSeconds: 300,
    });
    if (rateLimitError) return rateLimitError;

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!mpAccessToken || !supabaseUrl) {
      return jsonResponse({ error: "Pagamento nao configurado." }, 500, corsHeaders);
    }

    const body = await req.json();
    const {
      paymentMethod,
      formData,
      amount,
      customerEmail,
      customerName,
      planName,
      bookingGroupId,
    } = body;

    if (!bookingGroupId || !customerEmail || !amount || !planName) {
      return jsonResponse({ error: "Dados de pagamento incompletos." }, 400, corsHeaders);
    }

    const expectedAmount = await resolveExpectedConsultationAmount(planName);
    if (expectedAmount === null || toCents(amount) !== toCents(expectedAmount)) {
      console.warn("Rejected consultation payment amount mismatch", {
        planName,
        received: Number(amount),
        expected: expectedAmount,
      });
      return jsonResponse({ error: "Valor da consulta invalido." }, 400, corsHeaders);
    }

    const pollToken = crypto.randomUUID().replace(/-/g, "");
    const externalRef =
      `consultation|${bookingGroupId}|${customerEmail}|` +
      `${encodeURIComponent(customerName || "")}|${encodeURIComponent(planName || "")}|${pollToken}`;

    let paymentBody: Record<string, unknown>;

    if (paymentMethod === "pix") {
      const nameParts = (customerName || "Cliente").trim().split(" ");
      paymentBody = {
        transaction_amount: Number(amount),
        payment_method_id: "pix",
        description: planName,
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        payer: {
          email: customerEmail,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || "Cliente",
          identification: { type: "CPF", number: "00000000000" },
        },
      };
    } else {
      paymentBody = {
        transaction_amount: Number(amount),
        token: formData.token,
        description: planName,
        installments: Number(formData.installments) || 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        payer: {
          email: formData.payer?.email || customerEmail,
          identification: formData.payer?.identification,
        },
      };
    }

    const paymentTokenPart =
      paymentMethod === "pix" ? "pix" : String(formData?.token || "card");
    const idempotencyKey =
      `consult-${bookingGroupId}-${paymentMethod}-${Number(amount).toFixed(2)}-${paymentTokenPart}`;

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
      return jsonResponse(
        { error: payment.message || "Erro no pagamento" },
        400,
        corsHeaders,
      );
    }

    const bookingConfirmed = payment.status === "approved"
      ? await confirmBookingGroup(
          bookingGroupId,
          paymentMethod === "pix" ? "pix" : "card",
        )
      : false;

    if (paymentMethod === "pix") {
      const transactionData = payment.point_of_interaction?.transaction_data;
      return jsonResponse(
        {
          payment_id: payment.id,
          status: payment.status,
          qr_code: transactionData?.qr_code || "",
          qr_code_base64: transactionData?.qr_code_base64 || "",
          poll_token: pollToken,
          booking_confirmed: bookingConfirmed,
        },
        200,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        poll_token: pollToken,
        booking_confirmed: bookingConfirmed,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Erro ao processar pagamento." }, 500, corsHeaders);
  }
});
