import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonResponse, requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";
import { resolveBroadcastAudience } from "../_shared/broadcastAudience.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo nao permitido." }, 405, corsHeaders);

  const auth = await requireAuthenticatedAdmin(req, corsHeaders);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json().catch(() => ({})) as {
      filters?: {
        sources?: string[];
        periodDays?: number | null;
        productName?: string | null;
        manualEmails?: string[];
      };
    };

    const audience = await resolveBroadcastAudience({
      supabaseUrl: auth.supabaseUrl,
      serviceKey: auth.serviceKey,
      filters: body.filters,
    });

    return jsonResponse(audience.summary, 200, corsHeaders);
  } catch (error) {
    console.error("broadcast-audience-preview error:", error);
    return jsonResponse({ error: "Erro ao carregar audiencia." }, 500, corsHeaders);
  }
});
