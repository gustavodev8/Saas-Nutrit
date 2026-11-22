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
      // payment type (default pix for backwards compat)
      payment_method_type = "pix",
      card_token,
      installments,
      card_payment_method_id,
      issuer_id,
    } = body;

    if (!workspace_id || !service_id || !booking_date || !booking_time || !patient_name || !patient_email) {
      return json({ error: "Dados incompletos." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient_email)) {
      return json({ error: "E-mail inválido." }, 400);
    }

    if (payment_method_type === "credit_card" && !card_token) {
      return json({ error: "Token do cartão não informado." }, 400);
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

    // 2+4. Atomic conflict check + insert
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

    // 5. Create MP payment
    const externalRef = `workspace_booking|${bookingId}|${workspace_id}|${patient_email.trim().toLowerCase()}`;
    const nameParts = patient_name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Paciente";
    const idempotencyKey = `workspace-booking-${bookingId}`;

    let mpBody: Record<string, unknown>;

    if (payment_method_type === "credit_card") {
      mpBody = {
        transaction_amount: totalAmount,
        token: card_token,
        description: `${service.name} — Agendamento`,
        installments: installments ?? 1,
        payment_method_id: card_payment_method_id,
        issuer_id: issuer_id ?? undefined,
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        payer: {
          email: patient_email.trim().toLowerCase(),
          first_name: firstName,
          last_name: lastName,
        },
      };
    } else {
      mpBody = {
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
    }

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
      await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?id=eq.${bookingId}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (payment_method_type === "credit_card") {
        const cause = mpPayment?.cause?.[0]?.description ?? "";
        return json({ error: `Pagamento recusado. ${cause}`.trim() }, 422);
      }
      return json({ error: "Erro ao criar pagamento PIX." }, 500);
    }

    // 6. Update booking with payment info
    const bookingStatus =
      mpPayment.status === "approved" ? "paid"
      : mpPayment.status === "rejected" ? "cancelled"
      : "pending_payment";

    await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?id=eq.${bookingId}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        mp_payment_id: String(mpPayment.id),
        mp_payment_status: mpPayment.status,
        status: bookingStatus,
        updated_at: new Date().toISOString(),
      }),
    });

    if (payment_method_type === "credit_card") {
      if (mpPayment.status === "rejected") {
        const detail = mpPayment.status_detail ?? "";
        return json({ error: `Pagamento recusado (${detail}). Verifique os dados do cartão.` }, 422);
      }
      return json({
        booking_id: bookingId,
        payment_id: String(mpPayment.id),
        payment_status: mpPayment.status,
        payment_type: "credit_card",
      });
    }

    // PIX: return QR code
    const txData = mpPayment.point_of_interaction?.transaction_data;
    return json({
      booking_id: bookingId,
      payment_id: String(mpPayment.id),
      qr_code: txData?.qr_code ?? "",
      qr_code_base64: txData?.qr_code_base64 ?? "",
      total_amount: totalAmount,
      payment_type: "pix",
    });
  } catch (err) {
    console.error("create-workspace-booking-payment error:", err);
    return json({ error: "Erro interno." }, 500);
  }
});
