import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(
  process.cwd(),
  "supabase/migrations/20261130000000_workout_draft_atomicity_idempotency_candidate.sql",
), "utf8");

describe("workout hardening migration contract", () => {
  it("keeps draft replacement inside one invoker RPC with optimistic revision", () => {
    expect(sql).toContain("FUNCTION public.save_workout_plan_draft");
    expect(sql).toContain("SECURITY INVOKER");
    expect(sql).toContain("version_row.revision = p_expected_revision");
    expect(sql).toContain("DELETE FROM public.workout_sessions WHERE version_id = p_version_id");
  });

  it("uses a durable request id and rejects divergent retries", () => {
    expect(sql).toContain("workout_session_logs_request_uidx");
    expect(sql).toContain("request_fingerprint");
    expect(sql).toContain("request id already used with different workout payload");
    expect(sql).toContain("create_workout_session_log_v2");
  });

  it("checks both old and new parents before moving immutable children", () => {
    expect(sql).toContain("OLD.version_id");
    expect(sql).toContain("NEW.version_id");
    expect(sql).toContain("OLD.session_id");
    expect(sql).toContain("NEW.session_id");
  });
});
