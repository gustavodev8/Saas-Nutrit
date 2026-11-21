-- ─────────────────────────────────────────────────────────────────────────────
-- SaaS Admin + Email support migration
-- ─────────────────────────────────────────────────────────────────────────────

-- RPC: list all workspaces for SaaS admin
-- Only the designated admin email can call this.
CREATE OR REPLACE FUNCTION list_all_workspaces_admin()
RETURNS TABLE (
  workspace_id   uuid,
  workspace_name text,
  owner_email    text,
  plan           text,
  status         text,
  trial_ends_at  timestamptz,
  next_payment_date timestamptz,
  mp_preapproval_id text,
  created_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != 'gustavu.dev@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    w.id                        AS workspace_id,
    w.name                      AS workspace_name,
    au.email                    AS owner_email,
    COALESCE(ws.plan, 'none')   AS plan,
    COALESCE(ws.status::text, 'sem_assinatura') AS status,
    ws.trial_ends_at,
    ws.next_payment_date,
    ws.mp_preapproval_id,
    w.created_at
  FROM workspaces w
  JOIN workspace_members wm
    ON wm.workspace_id = w.id AND wm.role = 'owner'
  JOIN auth.users au
    ON au.id = wm.user_id
  LEFT JOIN workspace_subscriptions ws
    ON ws.workspace_id = w.id
  ORDER BY w.created_at DESC;
END;
$$;

-- RPC: workspaces whose trials expire in exactly N days (used by email cron)
-- Called by the send-workspace-email edge function (trial-expiring-batch).
CREATE OR REPLACE FUNCTION get_expiring_trials(days_ahead int DEFAULT 3)
RETURNS TABLE (
  workspace_id   uuid,
  workspace_name text,
  owner_email    text,
  trial_ends_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id          AS workspace_id,
    w.name        AS workspace_name,
    au.email      AS owner_email,
    ws.trial_ends_at
  FROM workspace_subscriptions ws
  JOIN workspaces w         ON w.id  = ws.workspace_id
  JOIN workspace_members wm ON wm.workspace_id = ws.workspace_id AND wm.role = 'owner'
  JOIN auth.users au        ON au.id = wm.user_id
  WHERE ws.status = 'trialing'
    AND ws.trial_ends_at::date = (now() + (days_ahead || ' days')::interval)::date;
END;
$$;

-- ─── pg_cron: schedule daily trial-expiring email at 10:00 UTC ───────────────
-- Requires pg_cron and pg_net extensions (enabled by default on Supabase).
-- Replace <SUPABASE_URL> and <SERVICE_ROLE_KEY> with your actual values.
-- Run this block separately in the Supabase SQL editor after deploying
-- the send-workspace-email edge function.
--
-- SELECT cron.schedule(
--   'nutrit-trial-expiring-emails',
--   '0 10 * * *',
--   $$
--   SELECT net.http_post(
--     url     := '<SUPABASE_URL>/functions/v1/send-workspace-email',
--     headers := jsonb_build_object(
--       'Content-Type',  'application/json',
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--     ),
--     body    := '{"type":"trial-expiring-batch"}'::jsonb
--   ) AS request_id;
--   $$
-- );
