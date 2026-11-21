-- RPC: extend a workspace trial (admin only)
-- Adds p_days to the current trial_ends_at (or starts from now if null/expired).
CREATE OR REPLACE FUNCTION extend_workspace_trial(
  p_workspace_id uuid,
  p_days         int DEFAULT 7
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != 'gustavu.dev@gmail.com' THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  UPDATE workspace_subscriptions
  SET
    trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now()) + (p_days || ' days')::interval,
    status        = 'trialing'
  WHERE workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    INSERT INTO workspace_subscriptions (workspace_id, plan, status, trial_ends_at)
    VALUES (p_workspace_id, 'starter', 'trialing', now() + (p_days || ' days')::interval);
  END IF;
END;
$$;
