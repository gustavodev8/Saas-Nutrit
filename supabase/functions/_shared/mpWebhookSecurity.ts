// Mercado Pago timestamps are Unix seconds. Five minutes limits replay exposure
// while allowing normal webhook delivery delays and small clock drift.
export const MP_SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

export interface PaymentWebhookConfig {
  mpAccessToken?: string;
  mpWebhookSecret?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

export interface PaymentWebhookSecurityInput {
  config: PaymentWebhookConfig;
  requestUrl: string;
  rawBody: string;
  bodyDataId: unknown;
  xSignature: string | null;
  xRequestId: string | null;
  nowSeconds?: number;
}

export type PaymentWebhookSecurityResult =
  | { ok: true }
  | { ok: false; status: 401 | 503 };

export function hasRequiredPaymentWebhookConfig(config: PaymentWebhookConfig): boolean {
  return Boolean(
    config.mpAccessToken?.trim() &&
    config.mpWebhookSecret?.trim() &&
    config.supabaseUrl?.trim() &&
    config.supabaseServiceRoleKey?.trim(),
  );
}

export function isMpSignatureTimestampFresh(
  rawTimestamp: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!/^\d{1,12}$/.test(rawTimestamp)) return false;

  const timestamp = Number(rawTimestamp);
  if (!Number.isSafeInteger(timestamp)) return false;

  return (
    timestamp >= nowSeconds - MP_SIGNATURE_MAX_AGE_SECONDS &&
    timestamp <= nowSeconds + MP_SIGNATURE_MAX_AGE_SECONDS
  );
}

export function getSignedPaymentId(requestUrl: string): string | null {
  try {
    const url = new URL(requestUrl);
    const signedId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
    const normalizedId = signedId?.trim() ?? "";
    return normalizedId || null;
  } catch {
    return null;
  }
}

export function signedPaymentIdMatches(requestUrl: string, bodyDataId: unknown): boolean {
  const signedId = getSignedPaymentId(requestUrl);
  if (!signedId || (typeof bodyDataId !== "string" && typeof bodyDataId !== "number")) return false;

  return signedId === String(bodyDataId).trim();
}

export async function verifyMpSignature({
  requestUrl,
  rawBody,
  xSignature,
  xRequestId,
  secret,
  nowSeconds,
}: {
  requestUrl: string;
  rawBody: string;
  xSignature: string | null;
  xRequestId: string | null;
  secret: string;
  nowSeconds?: number;
}): Promise<boolean> {
  try {
    if (!xSignature || !xRequestId) return false;

    let timestamp = "";
    let receivedSignature = "";
    for (const part of xSignature.split(",")) {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex < 0) continue;

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (key === "ts") timestamp = value;
      if (key === "v1") receivedSignature = value;
    }

    if (!timestamp || !receivedSignature) return false;
    if (!isMpSignatureTimestampFresh(timestamp, nowSeconds)) return false;

    const dataId = getSignedPaymentId(requestUrl) ?? "";
    if (!dataId) return false;
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${timestamp};`;
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(manifest),
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature.length !== receivedSignature.length) return false;

    let difference = 0;
    for (let index = 0; index < expectedSignature.length; index++) {
      difference |= expectedSignature.charCodeAt(index) ^ receivedSignature.charCodeAt(index);
    }
    return difference === 0;
  } catch {
    return false;
  }
}

export async function validatePaymentWebhookRequest({
  config,
  requestUrl,
  rawBody,
  bodyDataId,
  xSignature,
  xRequestId,
  nowSeconds,
}: PaymentWebhookSecurityInput): Promise<PaymentWebhookSecurityResult> {
  if (!hasRequiredPaymentWebhookConfig(config)) return { ok: false, status: 503 };
  if (!signedPaymentIdMatches(requestUrl, bodyDataId)) return { ok: false, status: 401 };

  const valid = await verifyMpSignature({
    requestUrl,
    rawBody,
    xSignature,
    xRequestId,
    secret: config.mpWebhookSecret!.trim(),
    nowSeconds,
  });

  return valid ? { ok: true } : { ok: false, status: 401 };
}
