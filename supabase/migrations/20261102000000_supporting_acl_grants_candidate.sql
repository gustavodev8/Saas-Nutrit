-- Narrow API-role grants for legacy operational tables without changing their RLS policies.

-- Remove existing table privileges from API roles, including non-DML ACLs.
REVOKE ALL PRIVILEGES ON TABLE public.leads FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.availability_slots FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL PRIVILEGES ON TABLE public.payment_logs FROM PUBLIC, anon, authenticated, service_role;

-- Table-level REVOKE does not remove column-level ACLs, so clear those too.
DO $candidate_column_revokes$
DECLARE
  target_table text;
  target_role text;
  target_is_public boolean;
  column_name text;
BEGIN
  FOR target_table, target_role, target_is_public IN
    SELECT t.table_name, r.role_name, r.is_public
    FROM (VALUES ('leads'), ('availability_slots'), ('payment_logs')) AS t(table_name)
    CROSS JOIN (VALUES ('PUBLIC', true), ('anon', false), ('authenticated', false), ('service_role', false)) AS r(role_name, is_public)
  LOOP
    FOR column_name IN
      SELECT a.attname
      FROM pg_catalog.pg_attribute AS a
      WHERE a.attrelid = pg_catalog.to_regclass(pg_catalog.format('public.%I', target_table))
        AND a.attnum > 0
        AND NOT a.attisdropped
    LOOP
      EXECUTE pg_catalog.format(
        'REVOKE SELECT (%1$I), INSERT (%1$I), UPDATE (%1$I), REFERENCES (%1$I) ON TABLE public.%2$I FROM %3$s',
        column_name,
        target_table,
        CASE WHEN target_is_public THEN 'PUBLIC' ELSE pg_catalog.quote_ident(target_role) END
      );
    END LOOP;
  END LOOP;
END
$candidate_column_revokes$;

GRANT INSERT (name, email, source) ON TABLE public.leads TO anon;
GRANT SELECT, DELETE ON TABLE public.leads TO authenticated;
GRANT SELECT (email, created_at) ON TABLE public.leads TO service_role;

GRANT SELECT ON TABLE public.availability_slots TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.availability_slots TO authenticated;

GRANT SELECT ON TABLE public.payment_logs TO authenticated;
GRANT SELECT (customer_email, customer_cpf_hash, product_index, status, created_at, product_name, id, payment_id)
  ON TABLE public.payment_logs TO service_role;
GRANT INSERT (payment_id, customer_name, customer_email, customer_cpf_hash, product_name, product_index, amount, status, pdf_url)
  ON TABLE public.payment_logs TO service_role;
GRANT UPDATE (customer_name, customer_email, product_name, amount, status, updated_at)
  ON TABLE public.payment_logs TO service_role;

DO $candidate_sequence_grants$
DECLARE
  sequence_name text;
BEGIN
  sequence_name := pg_catalog.pg_get_serial_sequence('public.leads', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE pg_catalog.format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role', sequence_name);
    EXECUTE pg_catalog.format('GRANT USAGE ON SEQUENCE %s TO anon', sequence_name);
  END IF;

  sequence_name := pg_catalog.pg_get_serial_sequence('public.availability_slots', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE pg_catalog.format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role', sequence_name);
    EXECUTE pg_catalog.format('GRANT USAGE ON SEQUENCE %s TO authenticated', sequence_name);
  END IF;

  sequence_name := pg_catalog.pg_get_serial_sequence('public.payment_logs', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE pg_catalog.format('REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role', sequence_name);
    EXECUTE pg_catalog.format('GRANT USAGE ON SEQUENCE %s TO service_role', sequence_name);
  END IF;
END
$candidate_sequence_grants$;
