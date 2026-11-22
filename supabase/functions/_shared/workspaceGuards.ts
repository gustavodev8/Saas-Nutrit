export interface WorkspaceScopedRow {
  workspace_id?: string | null;
}

export function addLegacyWorkspaceFilter(url: URL): URL {
  const scopedUrl = new URL(url);
  scopedUrl.searchParams.set("workspace_id", "is.null");
  return scopedUrl;
}

export function addSingleLegacyBookingFilter(url: URL, bookingId: string): URL {
  const scopedUrl = addLegacyWorkspaceFilter(url);
  scopedUrl.searchParams.set("id", `eq.${bookingId}`);
  return scopedUrl;
}

export function isLegacyWorkspaceRow(row: WorkspaceScopedRow): boolean {
  return row.workspace_id === null;
}

export function areAllRowsLegacy(rows: WorkspaceScopedRow[]): boolean {
  return rows.length > 0 && rows.every(isLegacyWorkspaceRow);
}

export function isSingleLegacyRow(rows: WorkspaceScopedRow[]): boolean {
  return rows.length === 1 && isLegacyWorkspaceRow(rows[0]);
}
