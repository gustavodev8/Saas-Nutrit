import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")?.trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

    if (!mpAccessToken || !supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Configuração incompleta." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve workspace (user must be active owner or member)
    const { data: members, error: membersError } = await userClient
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (membersError || !members?.length) {
      return new Response(JSON.stringify({ error: "Workspace não encontrado." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only owner may initiate subscription
    const ownerMember = members.find((m: { role: string }) => m.role === "owner");
    if (!ownerMember) {
      return new Response(JSON.stringify({ error: "Apenas o owner pode ativar a assinatura." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workspaceId = ownerMember.workspace_id as string;
    const userEmail = user.email ?? "";

    // Determine back_url from request body (optional)
    let backUrl = `${req.headers.get("origin") ?? "https://nutrit.app"}/workspace/configuracoes?subscribed=1`;
    try {
      const body = await req.json() as { back_url?: string };
      if (body.back_url && /^https?:\/\//.test(body.back_url)) {
        backUrl = body.back_url;
      }
    } catch { /* no body */ }

    const externalReference = `workspace_subscription|${workspaceId}|starter`;

    // Create Mercado Pago Preapproval (recurring subscription)
    const preapprovalRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `workspace-sub-${workspaceId}`,
      },
      body: JSON.stringify({
        reason: "Nutrit Workspace — Plano Starter",
        external_reference: externalReference,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 79.90,
          currency_id: "BRL",
        },
        back_url: backUrl,
        status: "pending",
      }),
    });

    if (!preapprovalRes.ok) {
      const errBody = await preapprovalRes.text().catch(() => "");
      console.error("create-workspace-subscription: MP error", preapprovalRes.status, errBody);
      return new Response(JSON.stringify({ error: "Erro ao criar assinatura no Mercado Pago." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const preapproval = await preapprovalRes.json() as {
      id?: string;
      init_point?: string;
      status?: string;
    };

    if (!preapproval.id || !preapproval.init_point) {
      console.error("create-workspace-subscription: unexpected MP response", preapproval);
      return new Response(JSON.stringify({ error: "Resposta inesperada do Mercado Pago." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store preapproval id — service key bypasses RLS for this write
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    await serviceClient
      .from("workspace_subscriptions")
      .upsert({
        workspace_id: workspaceId,
        mp_preapproval_id: preapproval.id,
        mp_customer_email: userEmail,
        // keep status as-is; webhook will set it to 'active' once user subscribes
      }, { onConflict: "workspace_id", ignoreDuplicates: false });

    return new Response(JSON.stringify({ init_point: preapproval.init_point }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-workspace-subscription: unexpected error", err);
    return new Response(JSON.stringify({ error: "Erro interno." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
