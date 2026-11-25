-- Candidate only: replace patients' global CPF uniqueness with normalized,
-- workspace-scoped uniqueness. No data is rewritten or backfilled.
-- All checks, the local lock timeout, the DDL swap, and postconditions run in
-- one DO statement/transaction, independent of migration-runner transaction
-- wrapping. Existing RLS policies are intentionally unchanged.

DO $cpf_scope_atomic_swap$
DECLARE
  v_cpf_attnum smallint;
  v_workspace_attnum smallint;
  v_cpf_collation oid;
  v_constraint record;
  v_index record;
  v_normalized_expression constant text := 'nullif(regexp_replace(cpf,''[^0-9]'','''',''g''),'''')';
  v_legacy_predicate constant text := '((workspace_idisnull)and(nullif(regexp_replace(cpf,''[^0-9]'','''',''g''),'''')isnotnull))';
  v_workspace_predicate constant text := '((workspace_idisnotnull)and(nullif(regexp_replace(cpf,''[^0-9]'','''',''g''),'''')isnotnull))';
  v_name text;
  v_expression text;
  v_predicate text;
BEGIN
  SELECT attnum, attcollation INTO v_cpf_attnum, v_cpf_collation
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.patients'::regclass AND attname = 'cpf' AND NOT attisdropped;
  SELECT attnum INTO v_workspace_attnum
  FROM pg_catalog.pg_attribute
  WHERE attrelid = 'public.patients'::regclass AND attname = 'workspace_id' AND NOT attisdropped;

  IF v_cpf_attnum IS NULL OR v_workspace_attnum IS NULL THEN
    RAISE EXCEPTION 'CPF scope preflight failed: expected schema is unavailable.';
  END IF;

  SELECT c.conname, c.conkey, c.conindid, c.convalidated, c.condeferrable, c.condeferred,
         i.indisunique, i.indisvalid, i.indisready, i.indislive, i.indpred,
         i.indexprs, i.indnkeyatts, i.indnatts, i.indkey, i.indnullsnotdistinct,
         i.indclass, i.indcollation, i.indoption, access_method.amname,
         cpf_attribute.attcollation,
         (SELECT opclass.oid
          FROM pg_catalog.pg_opclass AS opclass
          WHERE opclass.opcmethod = access_method.oid
            AND opclass.opcintype = cpf_attribute.atttypid
            AND opclass.opcdefault) AS default_cpf_opclass
  INTO v_constraint
  FROM pg_catalog.pg_constraint c
  JOIN pg_catalog.pg_index i ON i.indexrelid = c.conindid
  JOIN pg_catalog.pg_class AS index_relation ON index_relation.oid = i.indexrelid
  JOIN pg_catalog.pg_am AS access_method ON access_method.oid = index_relation.relam
  JOIN pg_catalog.pg_attribute AS cpf_attribute
    ON cpf_attribute.attrelid = c.conrelid
   AND cpf_attribute.attnum = v_cpf_attnum
   AND NOT cpf_attribute.attisdropped
  WHERE c.conrelid = 'public.patients'::regclass AND c.conname = 'patients_cpf_key' AND c.contype = 'u';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CPF scope preflight failed: expected global uniqueness is unavailable.';
  END IF;
  IF cardinality(v_constraint.conkey) <> 1 OR v_constraint.conkey[1] <> v_cpf_attnum
     OR NOT v_constraint.convalidated OR v_constraint.condeferrable OR v_constraint.condeferred
     OR NOT v_constraint.indisunique OR NOT v_constraint.indisvalid OR NOT v_constraint.indisready OR NOT v_constraint.indislive
     OR v_constraint.indpred IS NOT NULL OR v_constraint.indexprs IS NOT NULL
     OR v_constraint.indnkeyatts <> 1 OR v_constraint.indnatts <> 1
     OR v_constraint.indkey[0] <> v_cpf_attnum
     OR v_constraint.amname IS DISTINCT FROM 'btree'
     OR v_constraint.indnullsnotdistinct IS DISTINCT FROM false
     OR v_constraint.default_cpf_opclass IS NULL
     OR v_constraint.indclass[0] IS DISTINCT FROM v_constraint.default_cpf_opclass
     OR v_constraint.indcollation[0] IS DISTINCT FROM v_constraint.attcollation
     OR v_constraint.indoption[0] IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'CPF scope preflight failed: existing uniqueness differs from the expected schema.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_index i
    WHERE i.indrelid = 'public.patients'::regclass
      AND i.indisunique
      AND i.indexrelid <> v_constraint.conindid
      AND (
        EXISTS (SELECT 1 FROM pg_catalog.unnest(i.indkey) AS key_attribute(attnum) WHERE key_attribute.attnum = v_cpf_attnum)
        OR (i.indexprs IS NOT NULL AND pg_catalog.pg_get_expr(i.indexprs, i.indrelid) ILIKE '%cpf%')
        OR (i.indpred IS NOT NULL AND pg_catalog.pg_get_expr(i.indpred, i.indrelid) ILIKE '%cpf%')
      )
  ) THEN
    RAISE EXCEPTION 'CPF scope preflight failed: an additional unique CPF index exists.';
  END IF;

  FOREACH v_name IN ARRAY ARRAY['patients_legacy_cpf_normalized_key', 'patients_workspace_cpf_normalized_key'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_name
    ) THEN
      RAISE EXCEPTION 'CPF scope preflight failed: an expected index name is already occupied.';
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM public.patients p
    WHERE NULLIF(pg_catalog.regexp_replace(p.cpf, '[^0-9]', '', 'g'), '') IS NOT NULL
    GROUP BY p.workspace_id, NULLIF(pg_catalog.regexp_replace(p.cpf, '[^0-9]', '', 'g'), '')
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'CPF scope preflight failed: duplicate normalized CPF exists within a scope.';
  END IF;

  -- Transaction-local and active before the first table lock/DDL. If a writer
  -- races the preflight, CREATE UNIQUE INDEX fails and this entire DO rolls back.
  PERFORM pg_catalog.set_config('lock_timeout', '2s', true);
  ALTER TABLE public.patients DROP CONSTRAINT patients_cpf_key;

  CREATE UNIQUE INDEX patients_legacy_cpf_normalized_key
    ON public.patients ((NULLIF(pg_catalog.regexp_replace(cpf, '[^0-9]', '', 'g'), '')))
    WHERE workspace_id IS NULL
      AND NULLIF(pg_catalog.regexp_replace(cpf, '[^0-9]', '', 'g'), '') IS NOT NULL;

  CREATE UNIQUE INDEX patients_workspace_cpf_normalized_key
    ON public.patients (workspace_id, (NULLIF(pg_catalog.regexp_replace(cpf, '[^0-9]', '', 'g'), '')))
    WHERE workspace_id IS NOT NULL
      AND NULLIF(pg_catalog.regexp_replace(cpf, '[^0-9]', '', 'g'), '') IS NOT NULL;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.patients'::regclass AND conname = 'patients_cpf_key'
  ) THEN
    RAISE EXCEPTION 'CPF scope postcondition failed: old global constraint remains.';
  END IF;

  FOR v_index IN
    SELECT c.relname, i.indexrelid, am.amname, i.indisunique, i.indisvalid, i.indisready, i.indislive,
           i.indpred, i.indexprs, i.indnkeyatts, i.indnatts, i.indkey, i.indclass,
           i.indcollation, i.indoption, i.indnullsnotdistinct
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_index i ON i.indexrelid = c.oid
    JOIN pg_catalog.pg_class table_relation ON table_relation.oid = i.indrelid
    JOIN pg_catalog.pg_am am ON am.oid = c.relam
    WHERE n.nspname = 'public'
      AND c.relname IN ('patients_legacy_cpf_normalized_key', 'patients_workspace_cpf_normalized_key')
  LOOP
    v_expression := pg_catalog.lower(pg_catalog.regexp_replace(
      pg_catalog.pg_get_expr(v_index.indexprs, 'public.patients'::regclass), '[[:space:]]|::text', '', 'g'));
    v_predicate := pg_catalog.lower(pg_catalog.regexp_replace(
      pg_catalog.pg_get_expr(v_index.indpred, 'public.patients'::regclass), '[[:space:]]|::text', '', 'g'));

    IF v_index.amname <> 'btree'
       OR NOT v_index.indisunique OR NOT v_index.indisvalid OR NOT v_index.indisready OR NOT v_index.indislive
       OR v_index.indpred IS NULL OR v_index.indexprs IS NULL
       OR v_index.indnatts <> v_index.indnkeyatts
       OR v_index.indnullsnotdistinct IS DISTINCT FROM false
       OR v_expression <> v_normalized_expression
       OR (v_index.relname = 'patients_legacy_cpf_normalized_key'
           AND (v_index.indnkeyatts <> 1
                OR v_index.indkey[0] <> 0
                OR v_index.indclass[0] IS DISTINCT FROM (
                  SELECT opc.oid FROM pg_catalog.pg_opclass opc
                  JOIN pg_catalog.pg_am am ON am.oid = opc.opcmethod
                  WHERE am.amname = 'btree' AND opc.opcintype = 'text'::regtype AND opc.opcdefault
                )
                OR v_index.indcollation[0] IS DISTINCT FROM v_cpf_collation
                OR v_index.indoption[0] IS DISTINCT FROM 0
                OR v_predicate <> v_legacy_predicate))
       OR (v_index.relname = 'patients_workspace_cpf_normalized_key'
           AND (v_index.indnkeyatts <> 2
                OR v_index.indkey[0] <> v_workspace_attnum OR v_index.indkey[1] <> 0
                OR v_index.indclass[0] IS DISTINCT FROM (
                  SELECT opc.oid FROM pg_catalog.pg_opclass opc
                  JOIN pg_catalog.pg_am am ON am.oid = opc.opcmethod
                  WHERE am.amname = 'btree' AND opc.opcintype = 'uuid'::regtype AND opc.opcdefault
                )
                OR v_index.indclass[1] IS DISTINCT FROM (
                  SELECT opc.oid FROM pg_catalog.pg_opclass opc
                  JOIN pg_catalog.pg_am am ON am.oid = opc.opcmethod
                  WHERE am.amname = 'btree' AND opc.opcintype = 'text'::regtype AND opc.opcdefault
                )
                OR v_index.indcollation[0] IS DISTINCT FROM 0::oid
                OR v_index.indcollation[1] IS DISTINCT FROM v_cpf_collation
                OR v_index.indoption[0] IS DISTINCT FROM 0
                OR v_index.indoption[1] IS DISTINCT FROM 0
                OR v_predicate <> v_workspace_predicate)) THEN
      RAISE EXCEPTION 'CPF scope postcondition failed: replacement index definition differs from the expected scope.';
    END IF;
  END LOOP;

  IF (SELECT count(*) FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('patients_legacy_cpf_normalized_key', 'patients_workspace_cpf_normalized_key')) <> 2 THEN
    RAISE EXCEPTION 'CPF scope postcondition failed: replacement indexes are incomplete.';
  END IF;
END;
$cpf_scope_atomic_swap$;
