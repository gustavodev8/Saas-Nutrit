import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  hasRequiredPaymentWebhookConfig,
  validatePaymentWebhookRequest,
} from "../_shared/mpWebhookSecurity.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sanitize a string for safe embedding into HTML to prevent XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function isSafeBookingGroupId(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 120) return false;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(normalized);
  const isPublicBookingId =
    /^booking_[0-9]{10,16}_[a-z0-9]{4,16}$/i.test(normalized);

  return isUuid || isPublicBookingId;
}

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type ParsedReference =
  | {
    kind: "consultation";
    bookingGroupId: string;
    customerEmail: string;
    customerName: string;
    planName: string;
    pollToken: string | null;
  }
  | {
    kind: "ebook";
    productIndex: number;
    customerEmail: string;
    fallbackPdfUrl: string;
    customerName: string;
    cpfHash: string | null;
    pollToken: string | null;
  };

function isSafePollToken(value: string) {
  return /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

function parseExternalReference(rawReference: unknown): ParsedReference | null {
  if (typeof rawReference !== "string") return null;

  const externalReference = rawReference.trim();
  if (!externalReference || externalReference.length > 1200) return null;

  const parts = externalReference.split("|");

  if (parts[0] === "consultation") {
    if (parts.length !== 5 && parts.length !== 6) return null;

    const bookingGroupId = parts[1]?.trim() ?? "";
    const customerEmail = decodeURIComponent(parts[2] ?? "").trim().toLowerCase();
    const customerName = parts[3] ? decodeURIComponent(parts[3]) : "";
    const planName = parts[4] ? decodeURIComponent(parts[4]) : "";
    const pollToken = parts[5]?.trim() ? parts[5].trim() : null;

    if (
      !isSafeBookingGroupId(bookingGroupId) ||
      !isPlausibleEmail(customerEmail) ||
      !planName.trim()
    ) {
      return null;
    }

    if (pollToken && !isSafePollToken(pollToken)) {
      return null;
    }

    return {
      kind: "consultation",
      bookingGroupId,
      customerEmail,
      customerName,
      planName,
      pollToken,
    };
  }

  if (!/^\d+$/.test(parts[0] ?? "")) return null;
  if (parts.length < 4 || parts.length > 6) return null;

  const productIndex = Number(parts[0]);
  const customerEmail = decodeURIComponent(parts[1] ?? "").trim().toLowerCase();
  const fallbackPdfUrl = parts[2] ? decodeURIComponent(parts[2]) : "";
  const customerName = parts[3] ? decodeURIComponent(parts[3]) : "";
  let cpfHash: string | null = null;
  let pollToken: string | null = null;

  if (parts.length >= 5) {
    const part4 = parts[4]?.trim() ?? "";
    if (part4) {
      if (/^[a-f0-9]{64}$/i.test(part4)) {
        cpfHash = part4;
      } else if (parts.length === 5 && isSafePollToken(part4)) {
        pollToken = part4;
      } else {
        return null;
      }
    }
  }

  if (parts.length === 6) {
    const part5 = parts[5]?.trim() ?? "";
    if (!part5 || !isSafePollToken(part5)) {
      return null;
    }
    pollToken = part5;
  }

  if (!Number.isInteger(productIndex) || productIndex < 0 || !isPlausibleEmail(customerEmail)) {
    return null;
  }

  if (fallbackPdfUrl) {
    try {
      const url = new URL(fallbackPdfUrl);
      if (!["http:", "https:"].includes(url.protocol)) return null;
    } catch {
      return null;
    }
  }

  return {
    kind: "ebook",
    productIndex,
    customerEmail,
    fallbackPdfUrl,
    customerName,
    cpfHash,
    pollToken,
  };
}

type PaymentClaimState = "claimed" | "approved" | "processing";

function serviceUnavailableResponse() {
  return new Response("Service unavailable", { status: 503 });
}

function redactIdentifier(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= 4) return "***";
  return `${normalized.slice(0, 3)}...${normalized.slice(-3)}`;
}

async function claimPaymentWebhook(
  supabaseUrl: string,
  serviceKey: string,
  paymentId: string,
): Promise<PaymentClaimState | null> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/claim_payment_webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      p_payment_id: paymentId,
      p_stale_after_seconds: 900,
    }),
  });

  if (!response.ok) return null;

  try {
    const state = await response.json();
    return state === "claimed" || state === "approved" || state === "processing" ? state : null;
  } catch {
    return null;
  }
}

async function finalizePaymentLog(
  supabaseUrl: string,
  serviceKey: string,
  paymentId: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/payment_logs?payment_id=eq.${encodeURIComponent(paymentId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ...fields, status: "approved", updated_at: new Date().toISOString() }),
    },
  );

  return response.ok;
}

// ── Webhook handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const config = {
      mpAccessToken: Deno.env.get("MP_ACCESS_TOKEN")?.trim(),
      mpWebhookSecret: Deno.env.get("MP_WEBHOOK_SECRET")?.trim(),
      supabaseUrl: Deno.env.get("SUPABASE_URL")?.trim(),
      supabaseServiceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim(),
    };

    if (!hasRequiredPaymentWebhookConfig(config)) return serviceUnavailableResponse();

    const rawBody = await req.text();
    let body: { type?: unknown; data?: { id?: unknown } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("ok", { status: 200 });
    }

    const security = await validatePaymentWebhookRequest({
      config,
      requestUrl: req.url,
      rawBody,
      bodyDataId: body.data?.id,
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
    });

    if (!security.ok) {
      if (security.status === 503) return serviceUnavailableResponse();
      console.error("payment-webhook: invalid MP signature — possible fake webhook attempt");
      return new Response("Unauthorized", { status: 401 });
    }

    const mpAccessToken = config.mpAccessToken!;
    const supabaseUrl = config.supabaseUrl!;
    const supabaseServiceKey = config.supabaseServiceRoleKey!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")?.trim();
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nutrivida.com.br";

    // MP sends type=payment for payment events
    if (body.type !== "payment") {
      return new Response("ok", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return new Response("ok", { status: 200 });

    // Fetch payment details from MP API (source of truth — can't be faked)
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });
    if (!paymentRes.ok) {
      return paymentRes.status >= 500 || paymentRes.status === 429
        ? serviceUnavailableResponse()
        : new Response("ok", { status: 200 });
    }

    let payment: {
      id?: unknown;
      status?: unknown;
      external_reference?: unknown;
      payment_method_id?: unknown;
      transaction_amount?: unknown;
      additional_info?: { items?: Array<{ title?: unknown }> };
      description?: unknown;
    };
    try {
      payment = await paymentRes.json();
    } catch {
      return serviceUnavailableResponse();
    }

    if (payment.status !== "approved") {
      return new Response("ok", { status: 200 });
    }

    const parsedReference = parseExternalReference(payment.external_reference);
    if (!parsedReference) {
      console.error("payment-webhook: invalid external_reference", {
        paymentId: redactIdentifier(String(payment.id ?? paymentId)),
      });
      return serviceUnavailableResponse();
    }

    const resolvedPaymentId = String(payment.id ?? paymentId).trim();
    if (!resolvedPaymentId) return new Response("ok", { status: 200 });

    const claimState = await claimPaymentWebhook(supabaseUrl, supabaseServiceKey, resolvedPaymentId);
    if (!claimState) return serviceUnavailableResponse();
    if (claimState === "approved") return new Response("ok", { status: 200 });
    if (claimState === "processing") return serviceUnavailableResponse();

    // ── Consultation payment ──────────────────────────────────────────────────
    if (parsedReference.kind === "consultation") {
      const bookingGroupId = parsedReference.bookingGroupId;
      const customerEmail = parsedReference.customerEmail;
      const customerName = escapeHtml(parsedReference.customerName);
      const planName = escapeHtml(parsedReference.planName);

      // Update booking status to confirmed — check HTTP status, not response body
      // (PATCH returns 204 No Content on success, so .json() would throw and give false negative)
      const bookingUpdateRes = await fetch(`${supabaseUrl}/rest/v1/bookings?booking_group_id=eq.${encodeURIComponent(bookingGroupId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          status: "confirmed",
          payment_status: "paid",
          payment_method: payment.payment_method_id === "pix" ? "pix" : "card",
        }),
      });

      if (!bookingUpdateRes.ok) {
        console.error("payment-webhook: booking confirmation update failed");
        return serviceUnavailableResponse();
      }

      // Send confirmation email
      const confirmationHtml = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <tr><td style="height:4px;background:#2d5a27;"></td></tr>
                <tr><td style="padding:32px 40px 0;text-align:left;">
                  <p style="margin:0;font-size:15px;font-weight:700;color:#2d5a27;">NutriVida</p>
                </td></tr>
                <tr><td style="padding:20px 40px 0;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>
                <tr><td style="padding:32px 40px;">
                  <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Consulta confirmada</h2>
                  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Pagamento aprovado — obrigado, ${customerName || "cliente"}!</p>
                  <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;font-weight:500;">Plano contratado</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${planName}</p>
                  </div>
                  <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                    Seu agendamento foi confirmado. Em breve entraremos em contato para confirmar todos os detalhes.
                  </p>
                  <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">Dúvidas? Responda este email ou entre em contato pelo WhatsApp.</p>
                </td></tr>
                <tr><td style="padding:0 40px 32px;">
                  <div style="height:1px;background:#f0f0f0;margin-bottom:20px;"></div>
                  <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">NutriVida &nbsp;·&nbsp; Este é um email automático</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `;

      if (!RESEND_API_KEY) return serviceUnavailableResponse();

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `payment-webhook:${resolvedPaymentId}:consultation`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: customerEmail,
          subject: `Consulta confirmada — ${planName}`,
          html: confirmationHtml,
        }),
      });
      if (!emailRes.ok) return serviceUnavailableResponse();

      const logUpdated = await finalizePaymentLog(supabaseUrl, supabaseServiceKey, resolvedPaymentId, {
        customer_name: customerName,
        customer_email: customerEmail,
        product_name: planName,
        amount: payment.transaction_amount,
      });
      if (!logUpdated) {
        console.error("payment-webhook: consultation payment log update failed");
        return serviceUnavailableResponse();
      }

      return new Response("ok", { status: 200 });
    }

    // ── Ebook payment ─────────────────────────────────────────────────────────
    const customerEmail = parsedReference.customerEmail;
    const fallbackPdfUrl = parsedReference.fallbackPdfUrl;
    const cpfHash = parsedReference.cpfHash; // already SHA-256 hashed
    const productIndex = parsedReference.productIndex;
    const productName = escapeHtml(
      payment.additional_info?.items?.[0]?.title || payment.description || "E-book"
    );

    if (!customerEmail) {
      return new Response("ok", { status: 200 });
    }
    if (!RESEND_API_KEY) return serviceUnavailableResponse();

    // Fetch pdfFiles from site_content by productIndex
    type PdfFile = { url: string; label: string };
    let pdfFiles: PdfFile[] = [];
    let primaryPdfUrl = fallbackPdfUrl;

    const scRes = await fetch(
      `${supabaseUrl}/rest/v1/site_content?id=eq.1&select=content`,
      { headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}` } }
    );
    if (!scRes.ok) return serviceUnavailableResponse();

    let scData: { content?: { produtosDigitais?: { items?: Array<{ pdfFiles?: PdfFile[]; pdfUrl?: string }> } } }[];
    try {
      scData = await scRes.json();
    } catch {
      return serviceUnavailableResponse();
    }

    const item = scData?.[0]?.content?.produtosDigitais?.items?.[productIndex];
    if (!item) {
      console.error("payment-webhook: product fulfillment unavailable", {
        paymentId: redactIdentifier(resolvedPaymentId),
      });
      return serviceUnavailableResponse();
    }
    if (Array.isArray(item.pdfFiles) && item.pdfFiles.length > 0) {
      pdfFiles = item.pdfFiles;
    } else if (item.pdfUrl) {
      primaryPdfUrl = item.pdfUrl;
    }

    const hasPdfFulfillment = pdfFiles.some((pdfFile) => Boolean(pdfFile?.url?.trim())) || Boolean(primaryPdfUrl.trim());
    if (!hasPdfFulfillment) {
      console.error("payment-webhook: product fulfillment unavailable", {
        paymentId: redactIdentifier(resolvedPaymentId),
      });
      return serviceUnavailableResponse();
    }

    // Build PDF links block for email
    const isCombo = pdfFiles.length > 1;
    const pdfsBlock = pdfFiles.length > 0
      ? pdfFiles.map((pf, idx) => {
          const label = escapeHtml(pf.label || `E-book ${idx + 1}`);
          const url = escapeHtml(pf.url);
          return `
            <div style="margin-bottom:12px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">${label}</p>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="background:#2d5a27;border-radius:8px;padding:12px 24px;">
                  <a href="${url}" style="color:#fff;font-size:14px;font-weight:600;text-decoration:none;">Baixar PDF</a>
                </td></tr>
              </table>
              <p style="margin:6px 0 0;font-size:11px;color:#2d5a27;word-break:break-all;line-height:1.5;">${url}</p>
            </div>
          `;
        }).join("")
      : primaryPdfUrl
        ? `
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#2d5a27;border-radius:8px;padding:14px 28px;">
              <a href="${escapeHtml(primaryPdfUrl)}" style="color:#fff;font-size:14px;font-weight:600;text-decoration:none;">Baixar e-book</a>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Link direto:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#2d5a27;word-break:break-all;line-height:1.5;">${escapeHtml(primaryPdfUrl)}</p>
        `
        : `
          <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">Em breve você receberá o link de acesso. Qualquer dúvida, responda este email.</p>
          </div>
        `;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <tr><td style="height:4px;background:#2d5a27;"></td></tr>
              <tr><td style="padding:32px 40px 0;"><p style="margin:0;font-size:15px;font-weight:700;color:#2d5a27;">NutriVida</p></td></tr>
              <tr><td style="padding:20px 40px 0;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>
              <tr><td style="padding:32px 40px;">
                <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
                  ${isCombo ? "Seu combo está pronto" : "Seu e-book está pronto"}
                </h2>
                <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Pagamento confirmado — obrigado pela sua compra!</p>
                <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;font-weight:500;">Material adquirido</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${productName}</p>
                </div>
                ${isCombo ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;font-weight:600;">Seus ${pdfFiles.length} e-books:</p>` : ""}
                ${pdfsBlock}
                <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">Dúvidas? Responda este email ou entre em contato pelo WhatsApp.</p>
              </td></tr>
              <tr><td style="padding:0 40px 32px;">
                <div style="height:1px;background:#f0f0f0;margin-bottom:20px;"></div>
                <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">NutriVida &nbsp;·&nbsp; Este é um email automático</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const customerName = escapeHtml(parsedReference.customerName);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `payment-webhook:${resolvedPaymentId}:ebook`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: customerEmail,
        subject: isCombo ? `Seu combo "${productName}" está aqui!` : `Seu e-book "${productName}" está aqui!`,
        html: emailHtml,
      }),
    });
    if (!emailRes.ok) return serviceUnavailableResponse();

    const logUpdated = await finalizePaymentLog(supabaseUrl, supabaseServiceKey, resolvedPaymentId, {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_cpf_hash: cpfHash,
      product_name: productName,
      product_index: productIndex,
      amount: payment.transaction_amount,
      pdf_url: pdfFiles.length > 0 ? pdfFiles[0].url : primaryPdfUrl,
    });
    if (!logUpdated) {
      console.error("payment-webhook: ebook payment log update failed");
      return serviceUnavailableResponse();
    }

    return new Response("ok", { status: 200 });
  } catch {
    console.error("payment-webhook: unexpected processing error");
    return new Response("Service unavailable", { status: 503 });
  }
});
