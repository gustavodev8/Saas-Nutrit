import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MP_ACCESS_TOKEN")!;

    if (!supabaseUrl || !serviceKey || !mpToken) {
      return json({ error: "Serviço indisponível." }, 503);
    }

    const body = await req.json();
    const {
      workspace_id,
      service_id,
      booking_date,
      booking_time,
      patient_name,
      patient_email,
      patient_phone,
    } = body;

    if (!workspace_id || !service_id || !booking_date || !booking_time || !patient_name || !patient_email) {
      return json({ error: "Dados incompletos." }, 400);
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient_email)) {
      return json({ error: "E-mail inválido." }, 400);
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    // 1. Fetch service to get price and duration
    const svcRes = await fetch(
      `${supabaseUrl}/rest/v1/workspace_booking_services?id=eq.${service_id}&workspace_id=eq.${workspace_id}&active=eq.true&limit=1`,
      { headers },
    );
    if (!svcRes.ok) return json({ error: "Serviço não encontrado." }, 404);
    const svcs = await svcRes.json();
    const service = svcs[0];
    if (!service) return json({ error: "Serviço não encontrado." }, 404);

    // 3. Calculate amounts (5% platform fee)
    const totalCents = service.price_cents;
    const platformFeeCents = Math.round(totalCents * 0.05);
    const repasseCents = totalCents - platformFeeCents;
    const totalAmount = totalCents / 100;

    // 2+4. Atomic conflict check + insert (pending_payment) in one transaction.
    // Requires migration 20261122120000_workspace_booking_atomic_insert.sql applied first.
    const durationMin = service.duration_min ?? 60;
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/create_workspace_booking_atomic`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        p_workspace_id: workspace_id,
        p_service_id: service_id,
        p_patient_name: patient_name.trim(),
        p_patient_email: patient_email.trim().toLowerCase(),
        p_patient_phone: patient_phone ?? null,
        p_booking_date: booking_date,
        p_booking_time: booking_time,
        p_service_duration_min: durationMin,
        p_total_amount_cents: totalCents,
        p_platform_fee_cents: platformFeeCents,
        p_repasse_amount_cents: repasseCents,
      }),
    });
    if (!rpcRes.ok) {
      const rpcErr = await rpcRes.text();
      if (rpcErr.includes("BOOKING_CONFLICT")) {
        return json({ error: "Este horário já foi reservado ou está em conflito. Escolha outro." }, 409);
      }
      console.error("create_workspace_booking_atomic error:", rpcErr);
      return json({ error: "Erro ao criar agendamento." }, 500);
    }
    const bookingId = (await rpcRes.json()) as string | null;
    if (!bookingId) return json({ error: "Erro ao criar agendamento." }, 500);
    const booking = { id: bookingId };

    // 5. Create MP PIX payment
    const externalRef = `workspace_booking|${booking.id}|${workspace_id}|${patient_email.trim().toLowerCase()}`;

    const nameParts = patient_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Paciente";

    const mpBody = {
      transaction_amount: totalAmount,
      payment_method_id: "pix",
      description: `${service.name} — Agendamento`,
      external_reference: externalRef,
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      payer: {
        email: patient_email.trim().toLowerCase(),
        first_name: firstName,
        last_name: lastName,
      },
    };

    const idempotencyKey = `workspace-booking-${booking.id}`;

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(mpBody),
    });

    const mpPayment = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MP error:", JSON.stringify(mpPayment));
      // Cleanup the pending booking
      await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?id=eq.${booking.id}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      return json({ error: "Erro ao criar pagamento PIX." }, 500);
    }

    // 6. Update booking with payment_id
    await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?id=eq.${booking.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        mp_payment_id: String(mpPayment.id),
        mp_payment_status: mpPayment.status,
        updated_at: new Date().toISOString(),
      }),
    });

    const txData = mpPayment.point_of_interaction?.transaction_data;

    return json({
      booking_id: booking.id,
      payment_id: String(mpPayment.id),
      qr_code: txData?.qr_code ?? "",
      qr_code_base64: txData?.qr_code_base64 ?? "",
      total_amount: totalAmount,
    });
  } catch (err) {
    console.error("create-workspace-booking-payment error:", err);
    return json({ error: "Erro interno." }, 500);
  }
});
