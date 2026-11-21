import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../migrations/20261201000000_workout_parent_mutation_lock_candidate.sql", import.meta.url),
  "utf8",
);

test("serializes session mutations with version publication using ordered parent locks", () => {
  assert.match(migration, /TG_TABLE_NAME = 'workout_sessions'[\s\S]*?WHERE version_row\.id = v_old_version_id OR version_row\.id = v_new_version_id[\s\S]*?ORDER BY version_row\.id\s+FOR UPDATE/);
  assert.match(migration, /IF TG_OP IN \('UPDATE', 'DELETE'\) THEN\s+v_old_version_id := OLD\.version_id/);
  assert.match(migration, /IF TG_OP IN \('INSERT', 'UPDATE'\) THEN\s+v_new_version_id := NEW\.version_id/);
  assert.match(migration, /v_parent\.status IN \('published', 'archived'\)/);
});

test("locks exercise OLD and NEW parent versions and checks for a stale parent after waiting", () => {
  assert.match(migration, /v_old_session_id := OLD\.session_id/);
  assert.match(migration, /v_new_session_id := NEW\.session_id/);
  assert.match(migration, /WHERE version_row\.id = v_old_session_version_id\s+OR version_row\.id = v_new_session_version_id\s+ORDER BY version_row\.id\s+FOR UPDATE/);
  assert.match(migration, /v_old_version_id IS DISTINCT FROM v_old_session_version_id/);
  assert.match(migration, /v_new_version_id IS DISTINCT FROM v_new_session_version_id/);
});

test("preserves publish-to-archive transition and does not change ACLs", () => {
  assert.match(migration, /OLD\.status = 'published'[\s\S]*?NEW\.status = 'archived'/);
  assert.doesNotMatch(migration, /\b(REVOKE|GRANT)\b/i);
  assert.match(migration, /SET search_path TO ''/);
});
