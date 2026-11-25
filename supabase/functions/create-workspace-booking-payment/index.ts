import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertMethod,
  buildCorsHeaders,
  enforceRateLimit,
  handlePublicOptions,
  jsonResponse,
} from "../_shared/publicEndpoint.ts";
import {
  getTrustedSupabaseClientIp,
  getWorkspaceBookingLookupRateLimit,
  getWorkspaceBookingRateLimits,
} from "./rateLimits.ts";

const corsHeaders = buildCorsHeaders();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type PaymentMethod = "pix" | "credit_card";

interface BookingRequest {
  workspace_slug?: unknown;
  workspace_id?: unknown;
  service_id?: unknown;
  booking_date?: unknown;
  booking_time?: unknown;
  patient_name?: unknown;
  patient_email?: unknown;
  patient_phone?: unknown;
  payment_method_type?: unknown;
  card_token?: unknown;
  installments?: unknown;
  card_payment_method_id?: unknown;
  issuer_id?: unknown;
}

interface BookingSettingsRow {
  workspace_id: string;
  slug: string;
}

interface BookingServiceRow {
  id: string;
  name: string;
  price_cents: number;
  duration_min: number | null;
}

interface AvailableSlotRow {
  slot_time: string;
}

function stringField(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function validDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function responseJson(data: Record<string, unknown>, status = 200) {
  return jsonResponse(data, status, corsHeaders);
}

serve(async (req) => {
  const optionsResponse = handlePublicOptions(req, corsHeaders);
  if (optionsResponse) return optionsResponse;

  const methodError = assertMethod(req, "POST", corsHeaders);
  if (methodError) return methodError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const mpToken = Deno.env.get("MP_ACCESS_TOKEN")?.trim();
    const rateLimitSecret = Deno.env.get("SAAS_RATE_LIMIT_HMAC_SECRET")?.trim();

    if (!supabaseUrl || !serviceKey || !mpToken || !rateLimitSecret) {
      return responseJson({ error: "Serviço indisponível." }, 503);
    }

    let body: BookingRequest;
    try {
      body = await req.json() as BookingRequest;
    } catch {
      return responseJson({ error: "Dados inválidos." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return responseJson({ error: "Dados inválidos." }, 400);
    }

    const workspaceSlug = stringField(body.workspace_slug, 80);
    const requestedWorkspaceId = stringField(body.workspace_id, 36);
    const hasWorkspaceSlug = body.workspace_slug !== null && body.workspace_slug !== undefined;
    const hasWorkspaceId = body.workspace_id !== null && body.workspace_id !== undefined;
    const serviceId = stringField(body.service_id, 36);
    const bookingDate = stringField(body.booking_date, 10);
    const bookingTime = stringField(body.booking_time, 5);
    const patientName = stringField(body.patient_name, 160);
    const patientEmail = stringField(body.patient_email, 254)?.toLowerCase() ?? null;
    const patientPhone = body.patient_phone === null || body.patient_phone === undefined
      ? null
      : stringField(body.patient_phone, 40);
    const paymentMethod: PaymentMethod = body.payment_method_type === "credit_card" ? "credit_card" : "pix";

    if (
      (hasWorkspaceSlug && (!workspaceSlug || !SLUG_RE.test(workspaceSlug)))
      || (hasWorkspaceId && (!requestedWorkspaceId || !UUID_RE.test(requestedWorkspaceId)))
      || (!workspaceSlug && !requestedWorkspaceId)
      || !serviceId || !UUID_RE.test(serviceId)
      || !bookingDate || !validDate(bookingDate) || !bookingTime || !TIME_RE.test(bookingTime)
      || !patientName || !patientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)
      || (body.patient_phone !== null && body.patient_phone !== undefined && !patientPhone)
      || (body.payment_method_type !== undefined && body.payment_method_type !== "pix" && body.payment_method_type !== "credit_card")
    ) {
      return responseJson({ error: "Dados inválidos." }, 400);
    }

    const cardToken = paymentMethod === "credit_card" ? stringField(body.card_token, 2048) : null;
    if (paymentMethod === "credit_card" && !cardToken) {
      return responseJson({ error: "Token do cartão não informado." }, 400);
    }

    // Supabase Hosted sets cf-connecting-ip. Do not fall back to client-controlled
    // forwarding headers for a security boundary.
    const clientIp = getTrustedSupabaseClientIp(req);
    if (!clientIp) return responseJson({ error: "Serviço temporariamente indisponível." }, 503);

    // The preliminary bucket protects the settings lookup, while canonical
    // workspace buckets follow it after settings resolution.
    const lookupRateLimitError = await enforceRateLimit({
      req,
      corsHeaders,
      ...getWorkspaceBookingLookupRateLimit(clientIp),
    });
    if (lookupRateLimitError) return lookupRateLimitError;

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    };

    const settingsQuery = new URLSearchParams({
      active: "eq.true",
      select: "workspace_id,slug",
      limit: "1",
    });
    if (workspaceSlug) settingsQuery.set("slug", `eq.${workspaceSlug}`);
    if (requestedWorkspaceId) settingsQuery.set("workspace_id", `eq.${requestedWorkspaceId}`);
    const settingsRes = await fetch(
      `${supabaseUrl}/rest/v1/workspace_booking_settings?${settingsQuery.toString()}`,
      { headers },
    );
    if (!settingsRes.ok) return responseJson({ error: "Agendamento indisponível." }, 404);
    const settingsRows = await settingsRes.json() as BookingSettingsRow[];
    const settings = settingsRows[0];
    if (!settings) return responseJson({ error: "Agendamento indisponível." }, 404);

    // Use the resolved workspace UUID so slug and UUID clients share the same
    // identity and IP buckets for one workspace.
    for (const rateLimit of getWorkspaceBookingRateLimits(
      settings.workspace_id,
      patientEmail,
      clientIp,
    )) {
      const rateLimitError = await enforceRateLimit({ req, corsHeaders, ...rateLimit });
      if (rateLimitError) return rateLimitError;
    }

    const serviceQuery = new URLSearchParams({
      id: `eq.${serviceId}`,
      workspace_id: `eq.${settings.workspace_id}`,
      active: "eq.true",
      select: "id,name,price_cents,duration_min",
      limit: "1",
    });
    const serviceRes = await fetch(
      `${supabaseUrl}/rest/v1/workspace_booking_services?${serviceQuery.toString()}`,
      { headers },
    );
    if (!serviceRes.ok) return responseJson({ error: "Serviço não encontrado." }, 404);
    const serviceRows = await serviceRes.json() as BookingServiceRow[];
    const service = serviceRows[0];
    if (!service) return responseJson({ error: "Serviço não encontrado." }, 404);

    // The database RPC validates settings, advance notice, active availability windows,
    // blocked dates and current slot occupancy with the same contract used by the public UI.
    const slotRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_workspace_booking_slots`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_slug: settings.slug,
        p_service_id: service.id,
        p_booking_date: bookingDate,
      }),
    });
    if (!slotRes.ok) return responseJson({ error: "Agendamento indisponível." }, 503);
    const availableSlots = await slotRes.json() as AvailableSlotRow[];
    if (!availableSlots.some((slot) => slot.slot_time.slice(0, 5) === bookingTime)) {
      return responseJson({ error: "Este horário não está mais disponível. Escolha outro." }, 409);
    }

    const totalCents = service.price_cents;
    const platformFeeCents = Math.round(totalCents * 0.05);
    const repasseCents = totalCents - platformFeeCents;
    const totalAmount = totalCents / 100;
    const durationMin = service.duration_min ?? 60;

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/create_workspace_booking_atomic`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        p_workspace_id: settings.workspace_id,
        p_service_id: service.id,
        p_patient_name: patientName,
        p_patient_email: patientEmail,
        p_patient_phone: patientPhone,
        p_booking_date: bookingDate,
        p_booking_time: bookingTime,
        p_service_duration_min: durationMin,
        p_total_amount_cents: totalCents,
        p_platform_fee_cents: platformFeeCents,
        p_repasse_amount_cents: repasseCents,
      }),
    });
    if (!rpcRes.ok) {
      const rpcErr = await rpcRes.text();
      if (rpcErr.includes("BOOKING_CONFLICT") || rpcErr.includes("BOOKING_UNAVAILABLE")) {
        return responseJson({ error: "Este horário já foi reservado ou está em conflito. Escolha outro." }, 409);
      }
      console.error("create_workspace_booking_atomic failed", rpcRes.status);
      return responseJson({ error: "Erro ao criar agendamento." }, 500);
    }
    const bookingId = await rpcRes.json() as string | null;
    if (!bookingId) return responseJson({ error: "Erro ao criar agendamento." }, 500);

    const externalRef = `workspace_booking|${bookingId}|${settings.workspace_id}|${patientEmail}`;
    const nameParts = patientName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Paciente";
    const idempotencyKey = `workspace-booking-${bookingId}`;

    const mpBody: Record<string, unknown> = paymentMethod === "credit_card"
      ? {
        transaction_amount: totalAmount,
        token: cardToken,
        description: `${service.name} — Agendamento`,
        installments: typeof body.installments === "number" ? body.installments : 1,
        payment_method_id: stringField(body.card_payment_method_id, 80) ?? undefined,
        issuer_id: typeof body.issuer_id === "string" ? body.issuer_id : undefined,
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        payer: { email: patientEmail, first_name: firstName, last_name: lastName },
      }
      : {
        transaction_amount: totalAmount,
        payment_method_id: "pix",
        description: `${service.name} — Agendamento`,
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
        payer: { email: patientEmail, first_name: firstName, last_name: lastName },
      };

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

    const bookingFilter = new URLSearchParams({
      id: `eq.${bookingId}`,
      workspace_id: `eq.${settings.workspace_id}`,
    });
    if (!mpRes.ok) {
      console.error("Mercado Pago payment creation failed", mpRes.status);
      await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?${bookingFilter.toString()}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (paymentMethod === "credit_card") {
        return responseJson({ error: "Pagamento recusado. Verifique os dados do cartão." }, 422);
      }
      return responseJson({ error: "Erro ao criar pagamento PIX." }, 500);
    }

    const bookingStatus = mpPayment.status === "approved" ? "paid"
      : mpPayment.status === "rejected" ? "cancelled"
      : "pending_payment";
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/workspace_bookings?${bookingFilter.toString()}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        mp_payment_id: String(mpPayment.id),
        mp_payment_status: mpPayment.status,
        status: bookingStatus,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!updateRes.ok) {
      console.error("workspace booking payment update failed", updateRes.status);
      return responseJson({ error: "Erro ao confirmar agendamento." }, 500);
    }

    if (paymentMethod === "credit_card") {
      if (mpPayment.status === "rejected") {
        return responseJson({ error: "Pagamento recusado. Verifique os dados do cartão." }, 422);
      }
      return responseJson({
        booking_id: bookingId,
        payment_id: String(mpPayment.id),
        payment_status: mpPayment.status,
        payment_type: "credit_card",
      });
    }

    const txData = mpPayment.point_of_interaction?.transaction_data;
    return responseJson({
      booking_id: bookingId,
      payment_id: String(mpPayment.id),
      qr_code: txData?.qr_code ?? "",
      qr_code_base64: txData?.qr_code_base64 ?? "",
      total_amount: totalAmount,
      payment_type: "pix",
    });
  } catch (error) {
    console.error("create-workspace-booking-payment error", error instanceof Error ? error.message : "unknown");
    return responseJson({ error: "Erro interno." }, 500);
  }
});
