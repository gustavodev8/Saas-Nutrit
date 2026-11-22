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

    // 2. Check slot is still available
    const slotRes = await fetch(
      `${supabaseUrl}/rest/v1/workspace_bookings?workspace_id=eq.${workspace_id}&booking_date=eq.${booking_date}&booking_time=eq.${booking_time}&status=in.(paid,confirmed,completed)&limit=1`,
      { headers },
    );
    if (slotRes.ok) {
      const existing = await slotRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return json({ error: "Este horário já foi reservado. Escolha outro." }, 409);
      }
    }

    // 3. Calculate amounts (5% platform fee)
    const totalCents = service.price_cents;
    const platformFeeCents = Math.round(totalCents * 0.05);
    const repasseCents = totalCents - platformFeeCents;
    const totalAmount = totalCents / 100;

    // 4. Create booking record (pending_payment)
    const bookingRes = await fetch(`${supabaseUrl}/rest/v1/workspace_bookings`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        workspace_id,
        service_id,
        patient_name: patient_name.trim(),
        patient_email: patient_email.trim().toLowerCase(),
        patient_phone: patient_phone ?? null,
        booking_date,
        booking_time,
        status: "pending_payment",
        total_amount_cents: totalCents,
        platform_fee_cents: platformFeeCents,
        repasse_amount_cents: repasseCents,
      }),
    });
    if (!bookingRes.ok) return json({ error: "Erro ao criar agendamento." }, 500);
    const bookings = await bookingRes.json();
    const booking = bookings[0];
    if (!booking) return json({ error: "Erro ao criar agendamento." }, 500);

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
