-- ============================================================
-- Workspace Booking System
-- Run this in Supabase SQL Editor
-- ============================================================

-- Configurações de agendamento por workspace
CREATE TABLE IF NOT EXISTS workspace_booking_settings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug            text        UNIQUE NOT NULL,
  pix_key         text,
  pix_key_type    text        NOT NULL DEFAULT 'cpf',  -- cpf | email | phone | random
  active          boolean     NOT NULL DEFAULT false,
  presentation_name text,
  bio             text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

-- Tipos de consulta/serviço
CREATE TABLE IF NOT EXISTS workspace_booking_services (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  price_cents   integer     NOT NULL CHECK (price_cents > 0),
  duration_min  integer     NOT NULL DEFAULT 60 CHECK (duration_min > 0),
  active        boolean     NOT NULL DEFAULT true,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Disponibilidade semanal (0=dom, 1=seg, ..., 6=sáb)
CREATE TABLE IF NOT EXISTS workspace_booking_availability (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  day_of_week   integer     NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  active        boolean     NOT NULL DEFAULT true,
  UNIQUE(workspace_id, day_of_week)
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS workspace_bookings (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_id            uuid        NOT NULL REFERENCES workspace_booking_services(id),
  patient_name          text        NOT NULL,
  patient_email         text        NOT NULL,
  patient_phone         text,
  booking_date          date        NOT NULL,
  booking_time          time        NOT NULL,
  status                text        NOT NULL DEFAULT 'pending_payment',
  -- pending_payment | paid | confirmed | cancelled | completed | no_show
  mp_payment_id         text,
  mp_payment_status     text,
  total_amount_cents    integer     NOT NULL,
  platform_fee_cents    integer     NOT NULL,
  repasse_amount_cents  integer     NOT NULL,
  repasse_status        text        NOT NULL DEFAULT 'pending',
  -- pending | sent | failed
  repasse_transfer_id   text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Índices ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_booking_settings_slug
  ON workspace_booking_settings(slug);

CREATE INDEX IF NOT EXISTS idx_booking_services_workspace
  ON workspace_booking_services(workspace_id, active);

CREATE INDEX IF NOT EXISTS idx_booking_availability_workspace
  ON workspace_booking_availability(workspace_id);

CREATE INDEX IF NOT EXISTS idx_bookings_workspace_date
  ON workspace_bookings(workspace_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_mp_payment
  ON workspace_bookings(mp_payment_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────────
ALTER TABLE workspace_booking_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_booking_services    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_booking_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_bookings            ENABLE ROW LEVEL SECURITY;

-- Drop policies first so this script is safe to re-run
DROP POLICY IF EXISTS "booking_settings_anon_read"      ON workspace_booking_settings;
DROP POLICY IF EXISTS "booking_services_anon_read"      ON workspace_booking_services;
DROP POLICY IF EXISTS "booking_availability_anon_read"  ON workspace_booking_availability;
DROP POLICY IF EXISTS "bookings_anon_slots_read"        ON workspace_bookings;
DROP POLICY IF EXISTS "bookings_anon_insert"            ON workspace_bookings;
DROP POLICY IF EXISTS "booking_settings_member_all"     ON workspace_booking_settings;
DROP POLICY IF EXISTS "booking_services_member_all"     ON workspace_booking_services;
DROP POLICY IF EXISTS "booking_availability_member_all" ON workspace_booking_availability;
DROP POLICY IF EXISTS "bookings_member_all"             ON workspace_bookings;

-- Anon lê settings ativos (página pública)
CREATE POLICY "booking_settings_anon_read" ON workspace_booking_settings
  FOR SELECT TO anon USING (active = true);

-- Anon lê serviços ativos (página pública)
CREATE POLICY "booking_services_anon_read" ON workspace_booking_services
  FOR SELECT TO anon USING (active = true);

-- Anon lê disponibilidade ativa (página pública)
CREATE POLICY "booking_availability_anon_read" ON workspace_booking_availability
  FOR SELECT TO anon USING (active = true);

-- Anon lê agendamentos pagos para verificar slots ocupados (sem dados pessoais)
CREATE POLICY "bookings_anon_slots_read" ON workspace_bookings
  FOR SELECT TO anon USING (status IN ('paid', 'confirmed', 'completed'));

-- Anon cria agendamentos (checkout)
CREATE POLICY "bookings_anon_insert" ON workspace_bookings
  FOR INSERT TO anon WITH CHECK (true);

-- Membros do workspace: acesso total às suas tabelas
CREATE POLICY "booking_settings_member_all" ON workspace_booking_settings
  FOR ALL TO authenticated USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "booking_services_member_all" ON workspace_booking_services
  FOR ALL TO authenticated USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "booking_availability_member_all" ON workspace_booking_availability
  FOR ALL TO authenticated USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "bookings_member_all" ON workspace_bookings
  FOR ALL TO authenticated USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
