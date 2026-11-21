-- Generic audit for global catalog search alias changes. Patient audit records
-- require patient identity/snapshots and are not suitable for global catalogs.
CREATE TABLE IF NOT EXISTS public.catalog_alias_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  catalog_table TEXT NOT NULL CHECK (catalog_table IN (
    'foods', 'master_foods', 'global_exams_catalog',
    'global_exam_protocols', 'diet_templates', 'meal_presets'
  )),
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_aliases TEXT[] NOT NULL DEFAULT '{}',
  new_aliases TEXT[] NOT NULL DEFAULT '{}',
  actor_id UUID,
  actor_email TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_alias_audit_changed_at
  ON public.catalog_alias_audit_logs (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_alias_audit_record
  ON public.catalog_alias_audit_logs (catalog_table, record_id, changed_at DESC);

ALTER TABLE public.catalog_alias_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.catalog_alias_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.catalog_alias_audit_logs TO authenticated;

CREATE POLICY catalog_alias_audit_admin_read
  ON public.catalog_alias_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin_email());

CREATE OR REPLACE FUNCTION public.audit_catalog_search_aliases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  previous_aliases TEXT[] := '{}';
  current_aliases TEXT[] := '{}';
  affected_id TEXT;
  event_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    current_aliases := COALESCE(NEW.search_aliases, '{}');
    affected_id := NEW.id::TEXT;
    event_action := 'create';
    IF cardinality(current_aliases) = 0 THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    previous_aliases := COALESCE(OLD.search_aliases, '{}');
    current_aliases := COALESCE(NEW.search_aliases, '{}');
    affected_id := NEW.id::TEXT;
    event_action := 'update';
    IF previous_aliases IS NOT DISTINCT FROM current_aliases THEN RETURN NEW; END IF;
  ELSE
    previous_aliases := COALESCE(OLD.search_aliases, '{}');
    affected_id := OLD.id::TEXT;
    event_action := 'delete';
    IF cardinality(previous_aliases) = 0 THEN RETURN OLD; END IF;
  END IF;

  INSERT INTO public.catalog_alias_audit_logs (
    catalog_table, record_id, action, old_aliases, new_aliases, actor_id, actor_email
  ) VALUES (
    TG_TABLE_NAME, affected_id, event_action, previous_aliases, current_aliases,
    auth.uid(), auth.jwt() ->> 'email'
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_catalog_search_aliases() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  catalog_name TEXT;
BEGIN
  FOREACH catalog_name IN ARRAY ARRAY[
    'foods', 'master_foods', 'global_exams_catalog',
    'global_exam_protocols', 'diet_templates', 'meal_presets'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER catalog_search_alias_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.audit_catalog_search_aliases()',
      catalog_name
    );
  END LOOP;
END;
$$;
