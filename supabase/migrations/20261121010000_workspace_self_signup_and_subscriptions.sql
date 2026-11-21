-- ─────────────────────────────────────────────────────────────────────────────
-- Self-service signup + subscription tracking for open SaaS billing.
-- R$79,90/month after 30-day free trial.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. workspace_subscriptions ───────────────────────────────────────────────

CREATE TABLE public.workspace_subscriptions (
  workspace_id    UUID        PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan            TEXT        NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter')),
  status          TEXT        NOT NULL DEFAULT 'trialing'
                              CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'suspended')),
  trial_ends_at   TIMESTAMPTZ NOT NULL,
  -- Mercado Pago fields (populated once user subscribes)
  mp_preapproval_id   TEXT    UNIQUE,
  mp_customer_email   TEXT,
  next_payment_date   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX workspace_subscriptions_status_idx ON public.workspace_subscriptions (status);
CREATE INDEX workspace_subscriptions_trial_ends_idx ON public.workspace_subscriptions (trial_ends_at)
  WHERE status = 'trialing';

ALTER TABLE public.workspace_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.workspace_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.workspace_subscriptions TO authenticated;

-- Members may read their own workspace subscription
CREATE POLICY workspace_subscriptions_select_member
  ON public.workspace_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_subscriptions.workspace_id
        AND wm.user_id = (SELECT auth.uid())
        AND wm.status = 'active'
    )
  );

-- ── 2. create_workspace_self_signup RPC ──────────────────────────────────────
-- Called by authenticated user right after email verification.
-- Atomically creates workspace + owner membership + 30-day trial subscription.

CREATE FUNCTION public.create_workspace_self_signup(p_workspace_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid := auth.uid();
  v_workspace_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated: usuário não autenticado';
  END IF;

  -- Idempotent: return existing workspace if user already owns one
  SELECT wm.workspace_id INTO v_workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = v_user_id AND wm.role = 'owner' AND wm.status = 'active'
  LIMIT 1;

  IF v_workspace_id IS NOT NULL THEN
    RETURN v_workspace_id;
  END IF;

  -- Validate name
  IF char_length(trim(coalesce(p_workspace_name, ''))) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'invalid_name: nome da clínica deve ter entre 1 e 120 caracteres';
  END IF;

  -- Create workspace
  INSERT INTO workspaces (name)
  VALUES (trim(p_workspace_name))
  RETURNING id INTO v_workspace_id;

  -- Create owner membership
  INSERT INTO workspace_members (workspace_id, user_id, role, status)
  VALUES (v_workspace_id, v_user_id, 'owner', 'active');

  -- Create 30-day trial subscription
  INSERT INTO workspace_subscriptions (workspace_id, plan, status, trial_ends_at)
  VALUES (v_workspace_id, 'starter', 'trialing', now() + interval '30 days');

  RETURN v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace_self_signup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace_self_signup(text) TO authenticated;

-- ── 3. update_workspace_name RPC (settings phase) ────────────────────────────

CREATE OR REPLACE FUNCTION public.update_workspace_name(
  p_workspace_id uuid,
  p_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
    AND status = 'active';

  IF v_role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION 'permission_denied: apenas o owner pode alterar o nome do workspace';
  END IF;

  IF char_length(trim(coalesce(p_name, ''))) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'invalid_name: nome deve ter entre 1 e 120 caracteres';
  END IF;

  UPDATE workspaces SET name = trim(p_name) WHERE id = p_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_workspace_name(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_workspace_name(uuid, text) TO authenticated;

-- ── 4. list_workspace_members RPC (settings phase) ───────────────────────────

CREATE OR REPLACE FUNCTION public.list_workspace_members(p_workspace_id uuid)
RETURNS TABLE (
  user_id    uuid,
  email      text,
  role       text,
  status     text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'permission_denied: você não é membro ativo deste workspace';
  END IF;

  RETURN QUERY
  SELECT
    wm.user_id,
    au.email::text,
    wm.role,
    wm.status,
    wm.created_at
  FROM workspace_members wm
  JOIN auth.users au ON au.id = wm.user_id
  WHERE wm.workspace_id = p_workspace_id
  ORDER BY
    CASE wm.role WHEN 'owner' THEN 0 ELSE 1 END,
    wm.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.list_workspace_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_workspace_members(uuid) TO authenticated;

COMMENT ON TABLE public.workspace_subscriptions IS
  'Subscription state per workspace. Trialing = 30-day free; active = paid R$79.90/mo via Mercado Pago.';
