import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function brandEmail(opts: { title: string; preheader: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(21,63,52,0.10);">
  <tr><td style="height:5px;background:#153f34;"></td></tr>
  <tr><td style="padding:28px 40px 0;">
    <span style="font-size:16px;font-weight:700;color:#153f34;letter-spacing:-0.3px;">Nutrit</span>
  </td></tr>
  <tr><td style="padding:20px 40px 0;"><div style="height:1px;background:#edf1ed;"></div></td></tr>
  <tr><td style="padding:32px 40px 28px;">
    ${opts.body}
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <div style="height:1px;background:#edf1ed;margin-bottom:20px;"></div>
    <p style="margin:0;font-size:12px;color:#9aada5;text-align:center;">Nutrit &nbsp;·&nbsp; Gestão nutricional profissional</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function welcomeEmail(workspaceName: string): string {
  const name = escapeHtml(workspaceName);
  return brandEmail({
    title: "Bem-vindo ao Nutrit!",
    preheader: `Seu workspace "${workspaceName}" está pronto. Aproveite 30 dias grátis.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141e1a;">Seu workspace está pronto! 🌿</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Seja bem-vindo ao Nutrit. Seu espaço <strong>${name}</strong> já está criado e funcionando.</p>
      <div style="background:#f7faf8;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #dde6df;">
        <p style="margin:0 0 4px;font-size:12px;color:#9aada5;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Plano atual</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#153f34;">Trial gratuito — 30 dias</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5a6e66;">Todas as funcionalidades liberadas sem restrição</p>
      </div>
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#1a2f26;">O que você pode fazer agora:</p>
      <ul style="margin:0 0 24px;padding:0 0 0 20px;">
        <li style="font-size:14px;color:#374151;margin-bottom:8px;line-height:1.5;">Cadastrar seus pacientes com histórico completo</li>
        <li style="font-size:14px;color:#374151;margin-bottom:8px;line-height:1.5;">Criar planos alimentares personalizados</li>
        <li style="font-size:14px;color:#374151;margin-bottom:8px;line-height:1.5;">Registrar medições e acompanhar a evolução</li>
        <li style="font-size:14px;color:#374151;line-height:1.5;">Importar dados do seu sistema atual</li>
      </ul>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="background:#153f34;border-radius:8px;padding:14px 28px;">
          <a href="https://nutrit.app/workspace" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Acessar meu workspace</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9aada5;line-height:1.6;">Ficou com dúvida? Responda este email — estamos aqui para ajudar.</p>
    `,
  });
}

function subscriptionActiveEmail(workspaceName: string): string {
  const name = escapeHtml(workspaceName);
  return brandEmail({
    title: "Assinatura ativa — Nutrit",
    preheader: `Sua assinatura do Nutrit está ativa. Obrigado!`,
    body: `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141e1a;">Assinatura confirmada!</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Seu workspace <strong>${name}</strong> agora tem acesso completo ao Nutrit.</p>
      <div style="background:#f7faf8;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #dde6df;">
        <p style="margin:0 0 4px;font-size:12px;color:#9aada5;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Plano ativo</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#153f34;">Starter — R$79,90/mês</p>
        <p style="margin:4px 0 0;font-size:13px;color:#5a6e66;">Cobrado mensalmente pelo Mercado Pago</p>
      </div>
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
        Obrigado por assinar o Nutrit! Você pode gerenciar sua assinatura a qualquer momento nas Configurações do workspace.
      </p>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="background:#153f34;border-radius:8px;padding:14px 28px;">
          <a href="https://nutrit.app/workspace/configuracoes?tab=plano" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Ver minha assinatura</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9aada5;line-height:1.6;">Dúvidas sobre cobrança? Responda este email ou acesse as Configurações do workspace.</p>
    `,
  });
}

function trialExpiringEmail(workspaceName: string, daysLeft: number): string {
  const name = escapeHtml(workspaceName);
  return brandEmail({
    title: `Seu trial expira em ${daysLeft} dias — Nutrit`,
    preheader: `Seu período gratuito termina em ${daysLeft} dias. Assine para continuar.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141e1a;">Seu trial expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">O período gratuito do workspace <strong>${name}</strong> está chegando ao fim.</p>
      <div style="background:#fef9ec;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #f5e3a0;">
        <p style="margin:0 0 4px;font-size:12px;color:#9a7c2c;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">Situação atual</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#7a5c10;">Trial — ${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"}</p>
      </div>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">Para continuar usando o Nutrit sem interrupção, assine o Plano Starter por apenas <strong>R$79,90/mês</strong>.</p>
      <ul style="margin:0 0 24px;padding:0 0 0 20px;">
        <li style="font-size:14px;color:#374151;margin-bottom:6px;">Pacientes ilimitados</li>
        <li style="font-size:14px;color:#374151;margin-bottom:6px;">Planos alimentares e modelos</li>
        <li style="font-size:14px;color:#374151;margin-bottom:6px;">Medições e gráficos</li>
        <li style="font-size:14px;color:#374151;">Suporte por e-mail e WhatsApp</li>
      </ul>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="background:#153f34;border-radius:8px;padding:14px 28px;">
          <a href="https://nutrit.app/workspace/configuracoes?tab=plano" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Assinar agora — R$79,90/mês</a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9aada5;line-height:1.6;">Se precisar de ajuda ou tiver dúvidas, responda este email.</p>
    `,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "Nutrit <noreply@nutrit.app>";

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Configuração incompleta (RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json() as {
      type: "welcome" | "subscription-active" | "trial-expiring-batch" | "admin-new-signup";
      email?: string;
      workspace_name?: string;
      days_left?: number;
    };

    async function sendEmail(to: string, subject: string, html: string, idempotencyKey?: string) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      };
      if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({ from: fromEmail, to, subject, html }),
      });
      return res.ok;
    }

    // ── Welcome email (triggered after workspace trial starts) ──
    if (body.type === "welcome") {
      if (!body.email || !body.workspace_name) {
        return new Response(
          JSON.stringify({ error: "email e workspace_name são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const ok = await sendEmail(
        body.email,
        "Seu workspace Nutrit está pronto!",
        welcomeEmail(body.workspace_name),
        `welcome:${body.email}`,
      );
      return new Response(JSON.stringify({ ok }), {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Subscription active email (triggered by payment-webhook on authorized) ──
    if (body.type === "subscription-active") {
      if (!body.email || !body.workspace_name) {
        return new Response(
          JSON.stringify({ error: "email e workspace_name são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const ok = await sendEmail(
        body.email,
        "Assinatura Nutrit confirmada!",
        subscriptionActiveEmail(body.workspace_name),
        `sub-active:${body.email}`,
      );
      return new Response(JSON.stringify({ ok }), {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Trial expiring batch (called daily by pg_cron) ──
    if (body.type === "trial-expiring-batch") {
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: expiring, error } = await serviceClient.rpc("get_expiring_trials", { days_ahead: 3 });
      if (error) {
        console.error("send-workspace-email: get_expiring_trials error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { email: string; ok: boolean }[] = [];
      for (const row of (expiring ?? []) as Array<{ owner_email: string; workspace_name: string; trial_ends_at: string }>) {
        const daysLeft = Math.ceil(
          (new Date(row.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        const ok = await sendEmail(
          row.owner_email,
          `Seu trial Nutrit expira em ${daysLeft} dias`,
          trialExpiringEmail(row.workspace_name, Math.max(1, daysLeft)),
          `trial-expiring:${row.owner_email}:${row.trial_ends_at.slice(0, 10)}`,
        );
        results.push({ email: row.owner_email, ok });
      }

      return new Response(JSON.stringify({ sent: results.length, results }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Admin new-signup notification ──
    if (body.type === "admin-new-signup") {
      if (!body.email || !body.workspace_name) {
        return new Response(
          JSON.stringify({ error: "email e workspace_name são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const signupEmail = escapeHtml(body.email);
      const signupName = escapeHtml(body.workspace_name);
      const html = brandEmail({
        title: "Novo cadastro no Nutrit",
        preheader: `Novo workspace: ${body.workspace_name} (${body.email})`,
        body: `
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#141e1a;">Novo cadastro 🎉</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Um novo nutricionista acabou de criar um workspace no Nutrit.</p>
          <div style="background:#f7faf8;border-radius:8px;padding:20px 24px;margin-bottom:24px;border:1px solid #dde6df;">
            <p style="margin:0 0 6px;font-size:13px;color:#9aada5;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Detalhes</p>
            <p style="margin:0 0 4px;font-size:14px;color:#1a2f26;"><strong>Clínica:</strong> ${signupName}</p>
            <p style="margin:0;font-size:14px;color:#1a2f26;"><strong>E-mail:</strong> ${signupEmail}</p>
          </div>
          <p style="margin:0;font-size:13px;color:#9aada5;">Acesse o painel admin para acompanhar este workspace.</p>
        `,
      });
      const ok = await sendEmail("gustavu.dev@gmail.com", `Novo cadastro: ${body.workspace_name}`, html);
      return new Response(JSON.stringify({ ok }), {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Tipo inválido." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-workspace-email: unexpected error", err);
    return new Response(JSON.stringify({ error: "Erro interno." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
