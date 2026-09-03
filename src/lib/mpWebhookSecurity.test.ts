import { describe, expect, it } from "vitest";
import {
  hasRequiredPaymentWebhookConfig,
  isMpSignatureTimestampFresh,
  MP_SIGNATURE_MAX_AGE_SECONDS,
  signedPaymentIdMatches,
  validatePaymentWebhookRequest,
} from "../../supabase/functions/_shared/mpWebhookSecurity";

async function createSignature(secret: string, manifest: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(manifest),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

describe("Mercado Pago webhook timestamp validation", () => {
  const now = 1_700_000_000;

  it("accepts timestamps inside the five-minute delivery window", () => {
    expect(isMpSignatureTimestampFresh(String(now), now)).toBe(true);
    expect(isMpSignatureTimestampFresh(String(now - MP_SIGNATURE_MAX_AGE_SECONDS), now)).toBe(true);
    expect(isMpSignatureTimestampFresh(String(now + MP_SIGNATURE_MAX_AGE_SECONDS), now)).toBe(true);
  });

  it("rejects stale, future, and malformed timestamps", () => {
    expect(isMpSignatureTimestampFresh(String(now - MP_SIGNATURE_MAX_AGE_SECONDS - 1), now)).toBe(false);
    expect(isMpSignatureTimestampFresh(String(now + MP_SIGNATURE_MAX_AGE_SECONDS + 1), now)).toBe(false);
    expect(isMpSignatureTimestampFresh("not-a-timestamp", now)).toBe(false);
    expect(isMpSignatureTimestampFresh("1.7e9", now)).toBe(false);
  });

  it("accepts a valid Mercado Pago HMAC signature", async () => {
    const secret = "test-webhook-secret";
    const requestUrl = "https://example.test/functions/v1/payment-webhook?data.id=payment-123";
    const requestId = "request-123";
    const timestamp = String(now);
    const manifest = `id:payment-123;request-id:${requestId};ts:${timestamp};`;
    const signature = await createSignature(secret, manifest);

    const result = await validatePaymentWebhookRequest({
      config: {
        mpAccessToken: "token",
        mpWebhookSecret: secret,
        supabaseUrl: "https://project.supabase.co",
        supabaseServiceRoleKey: "service-key",
      },
      requestUrl,
      rawBody: '{"type":"payment"}',
      bodyDataId: "payment-123",
      xSignature: `ts=${timestamp},v1=${signature}`,
      xRequestId: requestId,
      nowSeconds: now,
    });

    expect(result).toEqual({ ok: true });
  });

  it("returns 401 for invalid and expired signatures", async () => {
    const config = {
      mpAccessToken: "token",
      mpWebhookSecret: "test-webhook-secret",
      supabaseUrl: "https://project.supabase.co",
      supabaseServiceRoleKey: "service-key",
    };
    const input = {
      config,
      requestUrl: "https://example.test/functions/v1/payment-webhook?data.id=payment-123",
      rawBody: '{"type":"payment"}',
      bodyDataId: "payment-123",
      xSignature: `ts=${now},v1=invalid`,
      xRequestId: "request-123",
      nowSeconds: now,
    };

    await expect(validatePaymentWebhookRequest(input)).resolves.toEqual({ ok: false, status: 401 });
    await expect(validatePaymentWebhookRequest({
      ...input,
      xSignature: `ts=${now - MP_SIGNATURE_MAX_AGE_SECONDS - 1},v1=invalid`,
    })).resolves.toEqual({ ok: false, status: 401 });
  });

  it("returns 503 when required handler configuration is missing", async () => {
    expect(hasRequiredPaymentWebhookConfig({
      mpAccessToken: "token",
      mpWebhookSecret: "secret",
      supabaseUrl: "",
      supabaseServiceRoleKey: "service-key",
    })).toBe(false);

    await expect(validatePaymentWebhookRequest({
      config: { mpAccessToken: "token" },
      requestUrl: "https://example.test/functions/v1/payment-webhook",
      rawBody: "{}",
      bodyDataId: undefined,
      xSignature: null,
      xRequestId: null,
      nowSeconds: now,
    })).resolves.toEqual({ ok: false, status: 503 });
  });

  it("rejects a body payment id different from the signed query id", async () => {
    expect(signedPaymentIdMatches(
      "https://example.test/functions/v1/payment-webhook?data.id=payment-123",
      "payment-456",
    )).toBe(false);

    const result = await validatePaymentWebhookRequest({
      config: {
        mpAccessToken: "token",
        mpWebhookSecret: "test-webhook-secret",
        supabaseUrl: "https://project.supabase.co",
        supabaseServiceRoleKey: "service-key",
      },
      requestUrl: "https://example.test/functions/v1/payment-webhook?data.id=payment-123",
      rawBody: '{"type":"payment"}',
      bodyDataId: "payment-456",
      xSignature: "ts=1700000000,v1=not-checked",
      xRequestId: "request-123",
      nowSeconds: 1_700_000_000,
    });

    expect(result).toEqual({ ok: false, status: 401 });
  });
});
