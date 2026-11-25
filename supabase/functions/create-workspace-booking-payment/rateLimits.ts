export interface WorkspaceBookingRateLimit {
  endpoint: string;
  identityKey: string;
  limit: number;
  windowSeconds: number;
}

function isValidIpv4(value: string): boolean {
  const octets = value.split(".");
  return octets.length === 4 && octets.every((octet) => {
    if (!/^\d{1,3}$/u.test(octet)) return false;
    const parsed = Number(octet);
    return parsed >= 0 && parsed <= 255;
  });
}

function isValidIpv6(value: string): boolean {
  if (!/^[0-9a-f:]+$/iu.test(value) || !value.includes(":")) return false;

  try {
    return new URL(`http://[${value}]`).hostname.length > 0;
  } catch {
    return false;
  }
}

export function getTrustedSupabaseClientIp(req: Request): string | null {
  const value = req.headers.get("cf-connecting-ip")?.trim();
  if (!value || value.includes(",")) return null;

  return isValidIpv4(value) || isValidIpv6(value) ? value.toLowerCase() : null;
}

export function getWorkspaceBookingLookupRateLimit(clientIp: string): WorkspaceBookingRateLimit {
  return {
    endpoint: "workspace-booking-payment-lookup-ip",
    identityKey: clientIp.trim().toLowerCase(),
    limit: 20,
    windowSeconds: 600,
  };
}

export function getWorkspaceBookingRateLimits(
  workspaceId: string,
  patientEmail: string,
  clientIp: string,
): WorkspaceBookingRateLimit[] {
  const normalizedWorkspaceId = workspaceId.trim().toLowerCase();
  const normalizedEmail = patientEmail.trim().toLowerCase();
  const normalizedClientIp = clientIp.trim().toLowerCase();

  return [
    {
      endpoint: "workspace-booking-payment-identity",
      identityKey: `${normalizedWorkspaceId}|${normalizedEmail}|${normalizedClientIp}`,
      limit: 5,
      windowSeconds: 600,
    },
    {
      endpoint: "workspace-booking-payment-ip",
      identityKey: `${normalizedWorkspaceId}|${normalizedClientIp}`,
      limit: 5,
      windowSeconds: 600,
    },
  ];
}
