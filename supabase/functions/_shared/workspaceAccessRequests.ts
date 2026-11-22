import { normalizeEmail } from "./workspaceInvitation.ts";

export const WORKSPACE_ACCESS_REQUEST_CATEGORIES = [
  "patient_management",
  "meal_planning",
  "appointments",
  "clinical_records",
  "practice_management",
] as const;

export type WorkspaceAccessRequestCategory = typeof WORKSPACE_ACCESS_REQUEST_CATEGORIES[number];

export interface WorkspaceAccessRequestInput {
  applicantName: string;
  professionalEmail: string;
  phone: string | null;
  crn: string | null;
  needCategory: WorkspaceAccessRequestCategory;
  consent: true;
}

export type ParsedWorkspaceAccessRequest =
  | { kind: "valid"; value: WorkspaceAccessRequestInput }
  | { kind: "spam" }
  | { kind: "invalid" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseWorkspaceAccessRequest(value: unknown): ParsedWorkspaceAccessRequest {
  if (!isRecord(value)) return { kind: "invalid" };
  if (typeof value.website === "string" && value.website.trim()) return { kind: "spam" };
  if (value.consent !== true) return { kind: "invalid" };
  if (Object.prototype.hasOwnProperty.call(value, "need")
    || Object.prototype.hasOwnProperty.call(value, "needSummary")) return { kind: "invalid" };

  if (typeof value.applicantName !== "string"
    || typeof value.professionalEmail !== "string"
    || typeof value.needCategory !== "string"
    || !WORKSPACE_ACCESS_REQUEST_CATEGORIES.includes(value.needCategory as WorkspaceAccessRequestCategory)) {
    return { kind: "invalid" };
  }

  const applicantName = value.applicantName.trim();
  const professionalEmail = normalizeEmail(value.professionalEmail);
  const needCategory = value.needCategory as WorkspaceAccessRequestCategory;
  const phone = typeof value.phone === "string" ? value.phone.trim() || null : null;
  const crn = typeof value.crn === "string" ? value.crn.trim() || null : null;
  const phoneDigits = phone?.replace(/\D/g, "") ?? "";
  const emailIsValid = professionalEmail.length <= 320
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professionalEmail);
  const phoneIsValid = phone === null || (
    phone.length <= 40
    && /^[0-9+(). -]+$/.test(phone)
    && phoneDigits.length >= 8
    && phoneDigits.length <= 15
  );
  const crnIsValid = crn === null || (crn.length <= 40 && /^[\p{L}\p{N} ./-]+$/u.test(crn));

  if (applicantName.length < 2 || applicantName.length > 120
    || !emailIsValid || !phoneIsValid || !crnIsValid) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    value: { applicantName, professionalEmail, phone, crn, needCategory, consent: true },
  };
}

export function isWorkspaceAccessRequestStatus(value: unknown): value is "approved" | "rejected" {
  return value === "approved" || value === "rejected";
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
