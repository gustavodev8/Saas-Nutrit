-- Perfil do nutricionista e personalização do portal do paciente
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS display_name       TEXT CHECK (char_length(btrim(display_name)) <= 80),
  ADD COLUMN IF NOT EXISTS crn                TEXT CHECK (char_length(btrim(crn)) <= 20),
  ADD COLUMN IF NOT EXISTS specialty          TEXT CHECK (char_length(btrim(specialty)) <= 80),
  ADD COLUMN IF NOT EXISTS bio                TEXT CHECK (char_length(btrim(bio)) <= 500),
  ADD COLUMN IF NOT EXISTS portal_accent      TEXT CHECK (portal_accent ~ '^#[0-9a-fA-F]{6}$'),
  ADD COLUMN IF NOT EXISTS portal_welcome_msg TEXT CHECK (char_length(btrim(portal_welcome_msg)) <= 300),
  ADD COLUMN IF NOT EXISTS portal_tabs        JSONB NOT NULL DEFAULT '["plano","treinos","consultas","documentos"]'::jsonb;

-- RPC para owner atualizar perfil
CREATE OR REPLACE FUNCTION update_workspace_profile(
  p_workspace_id  UUID,
  p_display_name  TEXT,
  p_crn           TEXT,
  p_specialty     TEXT,
  p_bio           TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  UPDATE workspaces SET
    display_name = NULLIF(btrim(coalesce(p_display_name, '')), ''),
    crn          = NULLIF(btrim(coalesce(p_crn, '')), ''),
    specialty    = NULLIF(btrim(coalesce(p_specialty, '')), ''),
    bio          = NULLIF(btrim(coalesce(p_bio, '')), '')
  WHERE id = p_workspace_id;
END;
$$;

-- RPC para owner atualizar portal
CREATE OR REPLACE FUNCTION update_workspace_portal(
  p_workspace_id      UUID,
  p_portal_accent     TEXT,
  p_portal_welcome    TEXT,
  p_portal_tabs       JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Acesso negado.';
  END IF;

  UPDATE workspaces SET
    portal_accent      = NULLIF(btrim(coalesce(p_portal_accent, '')), ''),
    portal_welcome_msg = NULLIF(btrim(coalesce(p_portal_welcome, '')), ''),
    portal_tabs        = coalesce(p_portal_tabs, '["plano","treinos","consultas","documentos"]'::jsonb)
  WHERE id = p_workspace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_workspace_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_workspace_portal  TO authenticated;
