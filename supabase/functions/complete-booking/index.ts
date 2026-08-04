import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsonResponse, requireAuthenticatedAdmin } from "../_shared/adminAuth.ts";

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

    const res = await fetch(`${auth.supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(String(booking_id))}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: auth.serviceKey,
        Authorization: `Bearer ${auth.serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DB update failed: ${err}`);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (e) {
    console.error("complete-booking error:", e);
    return jsonResponse({ error: "Erro ao concluir consulta." }, 500, corsHeaders);
  }
});
