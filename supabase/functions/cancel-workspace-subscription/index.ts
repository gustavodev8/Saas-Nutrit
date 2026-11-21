import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")?.trim();

    if (!supabaseUrl || !supabaseServiceKey || !mpAccessToken) {
      return new Response(
        JSON.stringify({ error: "Configuração incompleta." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Must be workspace owner
    const { data: memberData, error: memberError } = await serviceClient
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (memberError || !memberData) {
      return new Response(
        JSON.stringify({ error: "Workspace não encontrado ou sem permissão." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: subData, error: subError } = await serviceClient
      .from("workspace_subscriptions")
      .select("mp_preapproval_id, status")
      .eq("workspace_id", memberData.workspace_id)
      .single();

    if (subError || !subData) {
      return new Response(
        JSON.stringify({ error: "Assinatura não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (subData.status === "canceled") {
      return new Response(
        JSON.stringify({ ok: true, already_canceled: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cancel in Mercado Pago
    if (subData.mp_preapproval_id) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${subData.mp_preapproval_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "cancelled" }),
        },
      );
      if (!mpRes.ok) {
        const mpErr = await mpRes.text();
        console.error("cancel-workspace-subscription: MP error", mpErr);
        return new Response(
          JSON.stringify({ error: "Erro ao cancelar no Mercado Pago." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    await serviceClient
      .from("workspace_subscriptions")
      .update({ status: "canceled" })
      .eq("workspace_id", memberData.workspace_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cancel-workspace-subscription: unexpected error", err);
    return new Response(JSON.stringify({ error: "Erro interno." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
