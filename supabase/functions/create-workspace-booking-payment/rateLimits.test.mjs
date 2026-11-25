import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getTrustedSupabaseClientIp,
  getWorkspaceBookingLookupRateLimit,
  getWorkspaceBookingRateLimits,
} from "./rateLimits.ts";

test("booking trusts only the Supabase-hosted cf-connecting-ip header", () => {
  const trusted = new Request("https://function.example.test", {
    headers: {
      "cf-connecting-ip": "203.0.113.42",
      "x-forwarded-for": "198.51.100.99, 203.0.113.42",
    },
  });
  assert.equal(getTrustedSupabaseClientIp(trusted), "203.0.113.42");

  assert.equal(getTrustedSupabaseClientIp(new Request("https://function.example.test", {
    headers: { "x-forwarded-for": "198.51.100.99" },
  })), null);
  assert.equal(getTrustedSupabaseClientIp(new Request("https://function.example.test", {
    headers: { "cf-connecting-ip": "203.0.113.42, 198.51.100.99" },
  })), null);
  assert.equal(getTrustedSupabaseClientIp(new Request("https://function.example.test", {
    headers: { "cf-connecting-ip": "not-an-ip" },
  })), null);
});

test("booking payment uses independent workspace-email-IP and workspace-IP buckets", () => {
  const limits = getWorkspaceBookingRateLimits(
    " Workspace-A ",
    " Patient@Example.test ",
    " 203.0.113.42 ",
  );

  assert.deepEqual(limits, [
    {
      endpoint: "workspace-booking-payment-identity",
      identityKey: "workspace-a|patient@example.test|203.0.113.42",
      limit: 5,
      windowSeconds: 600,
    },
    {
      endpoint: "workspace-booking-payment-ip",
      identityKey: "workspace-a|203.0.113.42",
      limit: 5,
      windowSeconds: 600,
    },
  ]);
});

test("changing email cannot change the canonical workspace-IP rate-limit bucket", () => {
  const first = getWorkspaceBookingRateLimits("3a30f80d-f6f3-43c3-a466-3128bd798452", "one@example.test", "203.0.113.42");
  const second = getWorkspaceBookingRateLimits("3a30f80d-f6f3-43c3-a466-3128bd798452", "two@example.test", "203.0.113.42");

  assert.notEqual(first[0].identityKey, second[0].identityKey);
  assert.equal(first[1].identityKey, second[1].identityKey);
});

test("a slug and UUID selector converge after settings resolution to the same canonical workspace buckets", () => {
  const canonicalWorkspaceId = "3a30f80d-f6f3-43c3-a466-3128bd798452";
  const selectedBySlug = getWorkspaceBookingRateLimits(canonicalWorkspaceId, "patient@example.test", "203.0.113.42");
  const selectedByUuid = getWorkspaceBookingRateLimits(canonicalWorkspaceId, "patient@example.test", "203.0.113.42");

  assert.deepEqual(selectedBySlug, selectedByUuid);
});

test("lookup protection is a deliberately higher preliminary IP bucket", () => {
  assert.deepEqual(getWorkspaceBookingLookupRateLimit(" 203.0.113.42 "), {
    endpoint: "workspace-booking-payment-lookup-ip",
    identityKey: "203.0.113.42",
    limit: 20,
    windowSeconds: 600,
  });
});
