import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function confirmConsultationBooking(payment: {
  status?: string;
  external_reference?: string;
  payment_method_id?: string;
}) {
  if (payment.status !== "approved") return false;

  const parts = (payment.external_reference || "").split("|");
  if (parts[0] !== "consultation" || !parts[1]) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return false;

  const bookingGroupId = parts[1];
  const res = await fetch(`${supabaseUrl}/rest/v1/bookings?booking_group_id=eq.${encodeURIComponent(bookingGroupId)}`, {
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
      payment_method: payment.payment_method_id === "pix" ? "pix" : "card",
    }),
  });

  if (!res.ok) {
    console.error("check-payment-status booking confirm error:", res.status, await res.text().catch(() => ""));
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const { payment_id } = await req.json();

    if (!MP_ACCESS_TOKEN || !payment_id) {
      return new Response(JSON.stringify({ error: "Pagamento inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const data = await res.json();
    const bookingConfirmed = await confirmConsultationBooking(data);

    return new Response(JSON.stringify({ status: data.status, booking_confirmed: bookingConfirmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
