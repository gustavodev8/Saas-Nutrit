import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  addSingleLegacyBookingFilter,
  addLegacyWorkspaceFilter,
  areAllRowsLegacy,
  isSingleLegacyRow,
  isLegacyWorkspaceRow,
} from "./workspaceGuards.ts";

test("legacy filter explicitly excludes workspace-scoped rows", () => {
  const url = addLegacyWorkspaceFilter(new URL("https://db.test/rest/v1/bookings?id=eq.7"));
  assert.equal(url.searchParams.get("workspace_id"), "is.null");
  assert.equal(url.searchParams.get("id"), "eq.7");
});

test("single-booking payment update targets only its preflight ID and legacy scope", () => {
  const url = addSingleLegacyBookingFilter(
    new URL("https://db.test/rest/v1/bookings?booking_group_id=eq.group-1"),
    "booking-7",
  );
  assert.equal(url.searchParams.get("workspace_id"), "is.null");
  assert.equal(url.searchParams.get("id"), "eq.booking-7");
  assert.equal(url.searchParams.get("booking_group_id"), "eq.group-1");
});

test("only explicit NULL workspace rows are legacy", () => {
  assert.equal(isLegacyWorkspaceRow({ workspace_id: null }), true);
  assert.equal(isLegacyWorkspaceRow({ workspace_id: "workspace-1" }), false);
  assert.equal(isLegacyWorkspaceRow({}), false);
});

test("group operations require at least one row and every row legacy", () => {
  assert.equal(areAllRowsLegacy([]), false);
  assert.equal(areAllRowsLegacy([{ workspace_id: null }]), true);
  assert.equal(areAllRowsLegacy([{ workspace_id: null }, { workspace_id: "workspace-1" }]), false);
});

test("non-transactional payment updates accept only one legacy booking row", () => {
  assert.equal(isSingleLegacyRow([]), false);
  assert.equal(isSingleLegacyRow([{ workspace_id: null }]), true);
  assert.equal(isSingleLegacyRow([{ workspace_id: null }, { workspace_id: null }]), false);
  assert.equal(isSingleLegacyRow([{ workspace_id: "workspace-1" }]), false);
});
