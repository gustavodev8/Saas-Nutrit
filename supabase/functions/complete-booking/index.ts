import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonResponse, requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";
import { addLegacyWorkspaceFilter } from "../_shared/workspaceGuards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireAuthenticatedAdmin(req, corsHeaders);
    if (auth instanceof Response) return auth;

    const { booking_id } = await req.json() as { booking_id: number };

    if (!booking_id) {
      return jsonResponse({ error: "booking_id obrigatório" }, 400, corsHeaders);
    }

    const updateUrl = addLegacyWorkspaceFilter(
      new URL(`${auth.supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(String(booking_id))}`),
    );
    const res = await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: auth.serviceKey,
        Authorization: `Bearer ${auth.serviceKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DB update failed: ${err}`);
    }

    const updatedRows = await res.json().catch(() => []);
    if (!Array.isArray(updatedRows) || updatedRows.length !== 1) {
      return jsonResponse({ error: "Agendamento legado nao encontrado." }, 404, corsHeaders);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error("complete-booking error:", e);
    return jsonResponse({ error: "Erro ao concluir consulta." }, 500, corsHeaders);
  }
});
