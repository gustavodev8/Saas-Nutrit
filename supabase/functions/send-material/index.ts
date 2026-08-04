import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";
import {
  assertAllowedOrigin,
  assertMethod,
  buildCorsHeaders,
  enforceRateLimit,
  handlePublicOptions,
  jsonResponse,
} from "../_shared/publicEndpoint.ts";

const corsHeaders = buildCorsHeaders();

interface Attachment {
  filename: string;
  content: string;
}

interface SendMaterialPayload {
  to?: string;
  client_name?: string;
  subject?: string;
  body?: string;
  public_purpose?: "free_ebook" | "free_booking_confirmation";
  appointment_date?: string;
  appointment_time?: string;
  attachments?: Attachment[];
}

const MAX_ATTACHMENTS = 8;
const MAX_BASE64_BYTES = 14 * 1024 * 1024;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildPublicEmail(payload: SendMaterialPayload) {
  const normalizedSubject = (payload.subject || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (
    payload.public_purpose === "free_ebook" ||
    normalizedSubject.includes("e-book gratuito") ||
    normalizedSubject.includes("ebook gratuito")
  ) {
    return {
      subject: "Seu e-book gratuito chegou!",
      body:
        `Ola${payload.client_name ? `, ${payload.client_name}` : ""}!\n\n` +
        "Obrigado pelo seu interesse. Em breve voce recebera o material gratuito no seu e-mail.\n\n" +
        "Qualquer duvida, entre em contato pelo WhatsApp ou agende uma consulta.\n\n" +
        "Fillipe David - Nutricionista Clinico e Esportivo",
    };
  }

  if (
    payload.public_purpose === "free_booking_confirmation" ||
    normalizedSubject.includes("consulta gratuita foi confirmada")
  ) {
    return {
      subject: "Sua consulta gratuita foi confirmada!",
      body:
        `Ola${payload.client_name ? `, ${payload.client_name}` : ""}!\n\n` +
        "Sua consulta gratuita de 20 minutos com Fillipe David foi confirmada.\n\n" +
        `Data: ${payload.appointment_date || "a confirmar"}\n` +
        `Horario: ${payload.appointment_time || "a confirmar"}\n` +
        "Modalidade: Online\n\n" +
        "Em breve voce recebera o link da videochamada.\n\n" +
        "Qualquer duvida, entre em contato pelo WhatsApp.\n\n" +
        "Fillipe David - Nutricionista",
    };
  }

  return null;
}

serve(async (req) => {
  const optionsResponse = handlePublicOptions(req, corsHeaders);
  if (optionsResponse) return optionsResponse;

  const methodError = assertMethod(req, "POST", corsHeaders);
  if (methodError) return methodError;

  const originError = assertAllowedOrigin(req, corsHeaders);
  if (originError) return originError;

  try {
    const payload = await req.json() as SendMaterialPayload;
    const attachments = payload.attachments ?? [];
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const hasUserToken = Boolean(token && token !== anonKey);

    let subject = payload.subject?.trim() ?? "";
    let body = payload.body?.trim() ?? "";

    if (hasUserToken) {
      const auth = await requireAuthenticatedAdmin(req, corsHeaders);
      if (auth instanceof Response) return auth;
    } else {
      const rateLimitError = await enforceRateLimit({
        req,
        corsHeaders,
        endpoint: "send-material-public",
        limit: 6,
        windowSeconds: 3600,
        extraKey: `${payload.to || ""}|${payload.public_purpose || ""}`,
      });
      if (rateLimitError) return rateLimitError;

      if (attachments.length > 0) {
        return jsonResponse({ error: "Sessao administrativa obrigatoria." }, 401, corsHeaders);
      }

      const publicEmail = buildPublicEmail(payload);
      if (!publicEmail) {
        return jsonResponse({ error: "Tipo de envio publico invalido." }, 400, corsHeaders);
      }

      subject = publicEmail.subject;
      body = publicEmail.body;
    }

    const to = payload.to?.trim() ?? "";
    if (!to || !subject || !body) {
      return jsonResponse({ error: "Campos obrigatorios: to, subject, body." }, 400, corsHeaders);
    }

    if (!isEmail(to)) {
      return jsonResponse({ error: "Email invalido." }, 400, corsHeaders);
    }

    if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) {
      return jsonResponse({ error: "Quantidade de anexos invalida." }, 400, corsHeaders);
    }

    const totalBase64Size = attachments.reduce(
      (acc, attachment) => acc + attachment.content.length,
      0,
    );
    if (totalBase64Size > MAX_BASE64_BYTES) {
      return jsonResponse({ error: "Anexos acima do limite permitido." }, 400, corsHeaders);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nutrivida.com.br";
    const brandName = Deno.env.get("BRAND_NAME") || "NutriVida";

    if (!resendKey) {
      return jsonResponse({ error: "Envio de email nao configurado." }, 500, corsHeaders);
    }

    const safeBrand = escapeHtml(brandName);
    const bodyHtml = escapeHtml(body).replace(/\n/g, "<br>");
    const greeting = payload.client_name
      ? `<p style="margin:0 0 20px;font-size:14px;color:#374151;">Ola, <strong>${escapeHtml(payload.client_name)}</strong>!</p>`
      : "";

    const attachmentHtml = attachments.length > 0
      ? `
        <tr><td style="padding:0 40px 24px;">
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;">
            <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">
              Arquivos em anexo
            </p>
            ${attachments.map((attachment) =>
              `<p style="margin:0 0 4px;font-size:13px;color:#374151;">Anexo: ${escapeHtml(attachment.filename)}</p>`
            ).join("")}
          </div>
        </td></tr>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:#2d5a27;"></td></tr>
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#2d5a27;letter-spacing:-0.3px;">${safeBrand}</p>
        </td></tr>
        <tr><td style="padding:20px 40px 0;">
          <div style="height:1px;background:#f0f0f0;"></div>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          ${greeting}
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;">${bodyHtml}</p>
        </td></tr>
        ${attachmentHtml}
        <tr><td style="padding:0 40px 32px;">
          <div style="height:1px;background:#f0f0f0;margin-bottom:20px;"></div>
          <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">
            ${safeBrand} &nbsp;-&nbsp; Duvidas? Responda este email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendPayload: Record<string, unknown> = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments.map((attachment) => ({
        filename: attachment.filename.replace(/[^\w.\- ]/g, "_").slice(0, 120),
        content: attachment.content,
      }));
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      throw new Error("Falha ao enviar email via Resend.");
    }

    return jsonResponse({ success: true, id: resendData.id }, 200, corsHeaders);
  } catch (error) {
    console.error("send-material error:", error);
    return jsonResponse({ error: "Erro ao enviar material." }, 500, corsHeaders);
  }
});
