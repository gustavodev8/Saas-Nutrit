import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  isUuid,
  isWorkspaceAccessRequestStatus,
  parseWorkspaceAccessRequest,
} from "./workspaceAccessRequests.ts";

test("normalizes valid access requests and keeps only approved fields", () => {
  assert.deepEqual(parseWorkspaceAccessRequest({
    applicantName: "  Dra. Ana  ",
    professionalEmail: " ANA@EXAMPLE.TEST ",
    phone: "(75) 99999-0000",
    crn: "CRN-5/12345",
    needCategory: "meal_planning",
    consent: true,
    unexpected: "ignored",
  }), {
    kind: "valid",
    value: {
      applicantName: "Dra. Ana",
      professionalEmail: "ana@example.test",
      phone: "(75) 99999-0000",
      crn: "CRN-5/12345",
      needCategory: "meal_planning",
      consent: true,
    },
  });
});

test("rejects malformed values and invalid optional fields", () => {
  assert.equal(parseWorkspaceAccessRequest(null).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({ applicantName: "A", professionalEmail: "bad", needCategory: "meal_planning", consent: true }).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({ applicantName: "Ana", professionalEmail: "ana@example.test", needCategory: "meal_planning", consent: false }).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({ applicantName: "Ana", professionalEmail: "ana@example.test", needCategory: "custom free text", consent: true }).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({ applicantName: "Ana", professionalEmail: "ana@example.test", needCategory: "meal_planning", needSummary: "Clinical notes", consent: true }).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({
    applicantName: "Ana",
    professionalEmail: "ana@example.test",
    phone: "abc",
    needCategory: "appointments",
    consent: true,
  }).kind, "invalid");
  assert.equal(parseWorkspaceAccessRequest({
    applicantName: "Ana",
    professionalEmail: "ana@example.test",
    crn: "CRN <script>",
    needCategory: "practice_management",
    consent: true,
  }).kind, "invalid");
});

test("silently classifies honeypot submissions and strictly validates review inputs", () => {
  assert.equal(parseWorkspaceAccessRequest({ website: "bot-filled" }).kind, "spam");
  assert.equal(isWorkspaceAccessRequestStatus("approved"), true);
  assert.equal(isWorkspaceAccessRequestStatus("rejected"), true);
  assert.equal(isWorkspaceAccessRequestStatus("pending"), false);
  assert.equal(isUuid("00000000-0000-4000-8000-000000000001"), true);
  assert.equal(isUuid("not-an-id"), false);
});
