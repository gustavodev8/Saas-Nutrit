export interface WorkspaceInvitationToken {
  rawToken: string;
  tokenHash: string;
}

export const WORKSPACE_INVITATION_RATE_LIMITS = {
  administrator: {
    endpoint: "workspace-invitation-admin",
    limit: 20,
    windowSeconds: 60 * 60,
  },
  recipient: {
    endpoint: "workspace-invitation-recipient",
    limit: 5,
    windowSeconds: 24 * 60 * 60,
  },
} as const;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isPlatformAdminEmail(email: string, allowlist: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  return allowlist
    .split(",")
    .map(normalizeEmail)
    .filter(Boolean)
    .includes(normalizedEmail);
}

export function isConfirmedPlatformAdmin(
  email: string,
  emailConfirmedAt: unknown,
  allowlist: string,
): boolean {
  return typeof emailConfirmedAt === "string"
    && emailConfirmedAt.trim().length > 0
    && isPlatformAdminEmail(email, allowlist);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createWorkspaceInvitationToken(
  cryptoProvider: Crypto = crypto,
): Promise<WorkspaceInvitationToken> {
  const randomBytes = cryptoProvider.getRandomValues(new Uint8Array(32));
  const rawToken = bytesToHex(randomBytes);
  const digest = await cryptoProvider.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(rawToken),
  );

  return { rawToken, tokenHash: bytesToHex(new Uint8Array(digest)) };
}

export function buildWorkspaceInvitationUrl(siteUrl: string, rawToken: string): string {
  const url = new URL("/workspace/accept", siteUrl);
  url.searchParams.set("token", rawToken);
  return url.toString();
}

export function isValidInvitationSiteUrl(siteUrl: string): boolean {
  try {
    const url = new URL(siteUrl);
    return url.username === ""
      && url.password === ""
      && (url.protocol === "https:" || (
        url.protocol === "http:"
        && ["localhost", "127.0.0.1"].includes(url.hostname)
      ));
  } catch {
    return false;
  }
}

export function isValidInvitationInput(email: string, workspaceName: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
    && workspaceName.trim().length >= 1
    && workspaceName.trim().length <= 120;
}
