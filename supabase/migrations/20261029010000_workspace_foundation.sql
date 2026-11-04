-- Workspace identity foundation. This migration does not change clinical tables.
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'nutritionist', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE UNIQUE INDEX workspace_members_one_active_owner
  ON public.workspace_members (workspace_id)
  WHERE role = 'owner' AND status = 'active';

CREATE INDEX workspace_members_user_status_workspace_idx
  ON public.workspace_members (user_id, status, workspace_id);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.workspaces, public.workspace_members FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.workspaces, public.workspace_members TO authenticated;

DROP POLICY IF EXISTS workspaces_select_active_member ON public.workspaces;
CREATE POLICY workspaces_select_active_member
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = workspaces.id
        AND member.user_id = (SELECT auth.uid())
        AND member.status = 'active'
    )
  );

DROP POLICY IF EXISTS workspace_members_select_self ON public.workspace_members;
CREATE POLICY workspace_members_select_self
  ON public.workspace_members
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.workspaces IS
  'SaaS workspace identities. Clinical data remains unchanged until a separately reviewed migration.';
COMMENT ON TABLE public.workspace_members IS
  'User-to-workspace membership. Client-side membership writes are intentionally disabled.';
