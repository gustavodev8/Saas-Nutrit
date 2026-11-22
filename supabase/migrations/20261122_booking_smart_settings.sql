-- ============================================================
-- Booking Smart Settings — buffer, notice, interval, blocked dates
-- Safe to re-run (all IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- New columns on workspace_booking_settings
ALTER TABLE workspace_booking_settings
  ADD COLUMN IF NOT EXISTS buffer_minutes    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_notice_hours  integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS max_advance_days  integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS slot_interval_min integer NOT NULL DEFAULT 30;

-- Store service duration on each booking for duration-aware conflict detection
ALTER TABLE workspace_bookings
  ADD COLUMN IF NOT EXISTS service_duration_min integer NOT NULL DEFAULT 60;

-- Datas bloqueadas (feriados, férias, etc.)
CREATE TABLE IF NOT EXISTS workspace_booking_blocked_dates (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  blocked_date date        NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_workspace
  ON workspace_booking_blocked_dates(workspace_id, blocked_date);

ALTER TABLE workspace_booking_blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_dates_anon_read"  ON workspace_booking_blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_member_all" ON workspace_booking_blocked_dates;

-- Anon can read blocked dates (needs to know which calendar days are off)
CREATE POLICY "blocked_dates_anon_read" ON workspace_booking_blocked_dates
  FOR SELECT TO anon USING (true);

-- Members manage their own blocked dates
CREATE POLICY "blocked_dates_member_all" ON workspace_booking_blocked_dates
  FOR ALL TO authenticated USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
