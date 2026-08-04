import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonResponse, requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";
import { resolveBroadcastAudience } from "../_shared/broadcastAudience.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nutrivida.com.br";
const BRAND_NAME = "Fillipe David Nutricionista";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo nao permitido." }, 405, corsHeaders);

  const auth = await requireAuthenticatedAdmin(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return jsonResponse({ error: "Disparo nao configurado." }, 500, corsHeaders);
    }

    const body = await req.json() as {
      subject?: string;
      html?: string;
      previewText?: string;
      filters?: {
        sources?: string[];
        periodDays?: number | null;
        productName?: string | null;
        manualEmails?: string[];
      };
    };

    const subject = body.subject?.trim() ?? "";
    const html = body.html?.trim() ?? "";
    const previewText = body.previewText?.trim() ?? "";

    if (!subject || !html) {
      return jsonResponse({ error: "Assunto e mensagem sao obrigatorios." }, 400, corsHeaders);
    }

    const audience = await resolveBroadcastAudience({
      supabaseUrl: auth.supabaseUrl,
      serviceKey: auth.serviceKey,
      filters: body.filters,
    });
    const recipients = audience.recipients;
    if (recipients.length === 0) {
      return jsonResponse({ error: "Nenhum e-mail encontrado com os filtros selecionados." }, 400, corsHeaders);
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <tr><td style="height:4px;background:#2d5a27;"></td></tr>
        <tr><td style="padding:28px 40px 0;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#2d5a27;">${BRAND_NAME}</p>
        </td></tr>
        <tr><td style="padding:16px 40px 0;"><div style="height:1px;background:#f0f0f0;"></div></td></tr>
        <tr><td style="padding:32px 40px;">
          ${html}
        </td></tr>
        <tr><td style="padding:0 40px 28px;">
          <div style="height:1px;background:#f0f0f0;margin-bottom:20px;"></div>
          <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">${BRAND_NAME} &nbsp;-&nbsp; Para descadastrar, responda este email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let sent = 0;
    let failed = 0;
    const batchSize = 50;

    for (let index = 0; index < recipients.length; index += batchSize) {
      const batch = recipients.slice(index, index + batchSize);
      const results = await Promise.allSettled(
        batch.map((to) =>
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to,
              subject,
              html: fullHtml,
            }),
          }).then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
          }),
        ),
      );

      for (const result of results) {
        if (result.status === "fulfilled") sent++;
        else failed++;
      }
    }

    return jsonResponse({ sent, failed, total: recipients.length }, 200, corsHeaders);
  } catch (error) {
    console.error("send-broadcast error:", error);
    return jsonResponse({ error: "Erro ao enviar disparo." }, 500, corsHeaders);
  }
});
