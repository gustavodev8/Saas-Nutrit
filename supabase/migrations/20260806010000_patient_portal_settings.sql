CREATE TABLE IF NOT EXISTS public.patient_portal_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.patient_portal_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.patient_portal_settings FROM anon;
GRANT SELECT ON public.patient_portal_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.patient_portal_settings TO authenticated;

DROP POLICY IF EXISTS "authenticated_read_patient_portal_settings" ON public.patient_portal_settings;
CREATE POLICY "authenticated_read_patient_portal_settings"
  ON public.patient_portal_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_manage_patient_portal_settings" ON public.patient_portal_settings;
CREATE POLICY "admin_manage_patient_portal_settings"
  ON public.patient_portal_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

INSERT INTO public.patient_portal_settings (id, settings, updated_at, updated_by)
VALUES (1, '{}'::jsonb, now(), public.current_user_email())
ON CONFLICT (id) DO NOTHING;
