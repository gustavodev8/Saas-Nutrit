-- LOCAL CANDIDATE ONLY. Requires workspace scope, portal links and the 070200
-- RLS delta. The owner classified the 20 listed rows as legacy records without
-- a valid booking. Their original booking IDs remain in a restricted archive
-- and legacy_booking_id; no group/email inference or booking recreation occurs.

ALTER TABLE public.consultation_records
  ADD COLUMN booking_link_state text NOT NULL DEFAULT 'linked',
  ADD COLUMN legacy_booking_id integer;

CREATE TABLE public.consultation_record_legacy_booking_archive (
  consultation_record_id integer PRIMARY KEY,
  original_booking_id integer NOT NULL,
  original_booking_group_id text,
  session_number integer,
  disposition text NOT NULL CHECK (disposition = 'legacy_without_valid_booking'),
  authority text NOT NULL DEFAULT 'owner-approved-legacy-disposition'
    CHECK (authority = 'owner-approved-legacy-disposition'),
  recorded_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  migration_version text NOT NULL DEFAULT '20261108000000'
);
ALTER TABLE public.consultation_record_legacy_booking_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.consultation_record_legacy_booking_archive
  FROM PUBLIC, anon, authenticated, service_role;

DO $consultation_preflight$
DECLARE
  v_total integer;
  v_invalid integer;
  v_valid integer;
  v_target integer;
BEGIN
  IF to_regclass('public.consultation_records') IS NULL THEN
    RAISE EXCEPTION 'consultation_records candidate prerequisite is missing';
  END IF;

  EXECUTE 'LOCK TABLE public.consultation_records IN SHARE ROW EXCLUSIVE MODE';
  EXECUTE 'LOCK TABLE public.bookings IN SHARE ROW EXCLUSIVE MODE';
  EXECUTE 'LOCK TABLE public.patients IN SHARE ROW EXCLUSIVE MODE';

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'id' AND atttypid = 'int4'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'booking_id' AND atttypid = 'int4'::regtype AND NOT attisdropped
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = 'public.consultation_records'::regclass
      AND attname = 'session_number' AND atttypid = 'int4'::regtype AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'consultation record key column types differ from the diagnosed baseline';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.consultation_records'::regclass
      AND conname = 'consultation_records_booking_id_not_null_check'
      AND contype = 'c' AND convalidated
      AND pg_get_constraintdef(oid) = 'CHECK ((booking_id IS NOT NULL))'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.consultation_records'::regclass
      AND conname = 'consultation_records_booking_id_fkey'
      AND contype = 'f' AND NOT convalidated
      AND pg_get_constraintdef(oid) = 'FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT NOT VALID'
  ) THEN
    RAISE EXCEPTION 'consultation booking constraints differ from the diagnosed baseline';
  END IF;

  SELECT count(*) INTO v_total FROM public.consultation_records;
  SELECT count(*) INTO v_invalid
  FROM public.consultation_records AS record
  LEFT JOIN public.bookings AS booking ON booking.id = record.booking_id
  LEFT JOIN public.patients AS patient ON patient.id = booking.patient_id
  WHERE record.booking_id IS NULL
     OR booking.id IS NULL
     OR record.booking_group_id IS NULL
     OR record.booking_group_id IS DISTINCT FROM booking.booking_group_id
     OR (booking.patient_id IS NOT NULL AND
         (patient.id IS NULL OR booking.workspace_id IS DISTINCT FROM patient.workspace_id));

  SELECT count(*) INTO v_valid
  FROM public.consultation_records AS record
  JOIN public.bookings AS booking ON booking.id = record.booking_id
  LEFT JOIN public.patients AS patient ON patient.id = booking.patient_id
  WHERE record.booking_group_id IS NOT NULL
    AND record.booking_group_id = booking.booking_group_id
    AND (booking.patient_id IS NULL OR
         (patient.id IS NOT NULL AND booking.workspace_id IS NOT DISTINCT FROM patient.workspace_id));

  WITH expected(record_id, booking_id, session_number) AS (VALUES
    (26, 61, 1), (27, 62, 2), (28, 63, 3), (29, 64, 4), (30, 65, 5),
    (31, 67, 1), (32, 68, 2), (33, 69, 3), (34, 70, 4),
    (35, 71, 5), (36, 72, 6), (37, 73, 7), (38, 74, 8),
    (39, 76, 1), (40, 77, 2), (41, 78, 3), (42, 79, 4), (43, 80, 5),
    (44, 83, 1), (45, 84, 1)
  )
  SELECT count(*) INTO v_target
  FROM expected
  JOIN public.consultation_records AS record
    ON record.id = expected.record_id
   AND record.booking_id = expected.booking_id
   AND record.session_number = expected.session_number
  LEFT JOIN public.bookings AS booking ON booking.id = expected.booking_id
  WHERE booking.id IS NULL;

  IF v_total <> 25 OR v_invalid <> 20 OR v_valid <> 5 OR v_target <> 20 THEN
    RAISE EXCEPTION 'NO-GO: diagnosed legacy disposition changed (total %, invalid %, valid %, exact targets %)',
      v_total, v_invalid, v_valid, v_target;
  END IF;

  IF EXISTS (SELECT 1 FROM public.consultation_record_legacy_booking_archive) THEN
    RAISE EXCEPTION 'legacy booking archive is unexpectedly non-empty';
  END IF;
END
$consultation_preflight$;

DO $consultation_legacy_disposition$
DECLARE
  v_archived integer;
  v_updated integer;
  v_legacy integer;
  v_linked integer;
BEGIN
  WITH expected(record_id, booking_id, session_number) AS (VALUES
    (26, 61, 1), (27, 62, 2), (28, 63, 3), (29, 64, 4), (30, 65, 5),
    (31, 67, 1), (32, 68, 2), (33, 69, 3), (34, 70, 4),
    (35, 71, 5), (36, 72, 6), (37, 73, 7), (38, 74, 8),
    (39, 76, 1), (40, 77, 2), (41, 78, 3), (42, 79, 4), (43, 80, 5),
    (44, 83, 1), (45, 84, 1)
  )
  INSERT INTO public.consultation_record_legacy_booking_archive (
    consultation_record_id, original_booking_id, original_booking_group_id,
    session_number, disposition
  )
  SELECT record.id, record.booking_id, record.booking_group_id,
         record.session_number, 'legacy_without_valid_booking'
  FROM expected
  JOIN public.consultation_records AS record
    ON record.id = expected.record_id
   AND record.booking_id = expected.booking_id
   AND record.session_number = expected.session_number
  LEFT JOIN public.bookings AS booking ON booking.id = expected.booking_id
  WHERE booking.id IS NULL;
  GET DIAGNOSTICS v_archived = ROW_COUNT;
  IF v_archived <> 20 THEN
    RAISE EXCEPTION 'NO-GO: expected 20 archive rows, recorded %', v_archived;
  END IF;

  EXECUTE 'ALTER TABLE public.consultation_records DROP CONSTRAINT consultation_records_booking_id_not_null_check';

  WITH expected(record_id, booking_id, session_number) AS (VALUES
    (26, 61, 1), (27, 62, 2), (28, 63, 3), (29, 64, 4), (30, 65, 5),
    (31, 67, 1), (32, 68, 2), (33, 69, 3), (34, 70, 4),
    (35, 71, 5), (36, 72, 6), (37, 73, 7), (38, 74, 8),
    (39, 76, 1), (40, 77, 2), (41, 78, 3), (42, 79, 4), (43, 80, 5),
    (44, 83, 1), (45, 84, 1)
  )
  UPDATE public.consultation_records AS record
  SET booking_link_state = 'legacy_orphan',
      legacy_booking_id = record.booking_id,
      booking_id = NULL
  FROM expected
  WHERE record.id = expected.record_id
    AND record.booking_id = expected.booking_id
    AND record.session_number = expected.session_number
    AND NOT EXISTS (SELECT 1 FROM public.bookings AS booking WHERE booking.id = expected.booking_id);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated <> 20 THEN
    RAISE EXCEPTION 'NO-GO: expected 20 legacy rows updated, updated %', v_updated;
  END IF;

  SELECT count(*) INTO v_legacy
  FROM public.consultation_records
  WHERE booking_link_state = 'legacy_orphan'
    AND booking_id IS NULL AND legacy_booking_id IS NOT NULL;
  SELECT count(*) INTO v_linked
  FROM public.consultation_records AS record
  JOIN public.bookings AS booking ON booking.id = record.booking_id
  WHERE record.booking_link_state = 'linked'
    AND record.legacy_booking_id IS NULL
    AND record.booking_group_id = booking.booking_group_id;

  IF v_archived <> v_legacy OR v_legacy <> 20 OR v_linked <> 5
     OR EXISTS (
       SELECT 1 FROM public.consultation_record_legacy_booking_archive AS archive
       JOIN public.consultation_records AS record
         ON record.id = archive.consultation_record_id
       WHERE archive.original_booking_id IS DISTINCT FROM record.legacy_booking_id
          OR archive.original_booking_group_id IS DISTINCT FROM record.booking_group_id
          OR archive.session_number IS DISTINCT FROM record.session_number
     ) THEN
    RAISE EXCEPTION 'NO-GO: legacy disposition postcondition mismatch (archived %, legacy %, linked %)',
      v_archived, v_legacy, v_linked;
  END IF;

  EXECUTE 'ALTER TABLE public.consultation_records VALIDATE CONSTRAINT consultation_records_booking_id_fkey';
END
$consultation_legacy_disposition$;

ALTER TABLE public.consultation_records
  ADD CONSTRAINT consultation_records_booking_link_state_check CHECK (
    (booking_link_state = 'linked' AND booking_id IS NOT NULL AND legacy_booking_id IS NULL)
    OR (booking_link_state = 'legacy_orphan' AND booking_id IS NULL AND legacy_booking_id IS NOT NULL)
  );

COMMENT ON TABLE public.consultation_record_legacy_booking_archive IS
  'Restricted, owner-authorized disposition of consultation records with no valid booking. Original booking IDs remain on consultation_records. Direct API access is denied.';

ALTER TABLE public.consultation_records
  ADD COLUMN IF NOT EXISTS workspace_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_workspace_id_id_key
  ON public.bookings (workspace_id, id);

DO $consultation_workspace_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.consultation_records'::regclass
      AND conname = 'consultation_records_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.consultation_records
      ADD CONSTRAINT consultation_records_workspace_id_fkey
      FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id)
      ON DELETE NO ACTION NOT VALID;
  END IF;
END
$consultation_workspace_fk$;

CREATE INDEX IF NOT EXISTS consultation_records_workspace_booking_idx
  ON public.consultation_records (workspace_id, booking_id);

CREATE OR REPLACE FUNCTION public.derive_consultation_record_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_booking_workspace_id uuid;
  v_booking_group_id public.bookings.booking_group_id%TYPE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id THEN
      RAISE EXCEPTION 'workspace scope is immutable on existing consultation records'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.booking_id IS NOT DISTINCT FROM OLD.booking_id
      AND NEW.booking_group_id IS NOT DISTINCT FROM OLD.booking_group_id THEN
      RETURN NEW;
    END IF;
    IF NEW.booking_id IS NULL THEN
      IF OLD.workspace_id IS NOT NULL THEN
        RAISE EXCEPTION 'scoped consultation cannot be detached from its booking'
          USING ERRCODE = '42501';
      END IF;
      RETURN NEW;
    END IF;

    SELECT booking.workspace_id, booking.booking_group_id
      INTO v_booking_workspace_id, v_booking_group_id
    FROM public.bookings AS booking
      WHERE booking.id = NEW.booking_id
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'consultation booking does not exist' USING ERRCODE = '23503';
    END IF;
    IF NEW.booking_group_id IS DISTINCT FROM v_booking_group_id THEN
      RAISE EXCEPTION 'consultation booking/group pair is inconsistent'
        USING ERRCODE = '23514';
    END IF;
    IF v_booking_workspace_id IS DISTINCT FROM OLD.workspace_id THEN
      RAISE EXCEPTION 'consultation relation cannot cross workspace scope'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.booking_id IS NULL THEN
    RAISE EXCEPTION 'consultation requires an exact booking'
      USING ERRCODE = '23514';
  END IF;

  SELECT booking.workspace_id, booking.booking_group_id
    INTO v_booking_workspace_id, v_booking_group_id
  FROM public.bookings AS booking
  WHERE booking.id = NEW.booking_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'consultation booking does not exist' USING ERRCODE = '23503';
  END IF;
  IF NEW.booking_group_id IS DISTINCT FROM v_booking_group_id THEN
    RAISE EXCEPTION 'consultation booking/group pair is inconsistent'
      USING ERRCODE = '23514';
  END IF;
  IF v_booking_workspace_id IS NULL THEN
    RAISE EXCEPTION 'consultation booking has no workspace'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.workspace_id IS NOT NULL
    AND NEW.workspace_id IS DISTINCT FROM v_booking_workspace_id THEN
    RAISE EXCEPTION 'consultation workspace does not match its booking'
      USING ERRCODE = '23514';
  END IF;
  NEW.workspace_id := v_booking_workspace_id;

  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.derive_consultation_record_workspace()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS derive_consultation_record_workspace
  ON public.consultation_records;
CREATE TRIGGER derive_consultation_record_workspace
  BEFORE INSERT OR UPDATE ON public.consultation_records
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_consultation_record_workspace();

CREATE OR REPLACE FUNCTION public.prevent_consultation_booking_group_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.booking_group_id IS DISTINCT FROM OLD.booking_group_id
    AND EXISTS (
      SELECT 1
      FROM public.consultation_records AS record
      WHERE record.booking_id = OLD.id
    ) THEN
    RAISE EXCEPTION 'booking group cannot change while consultation records reference it'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.prevent_consultation_booking_group_change()
  FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS prevent_consultation_booking_group_change ON public.bookings;
CREATE TRIGGER prevent_consultation_booking_group_change
  BEFORE UPDATE OF booking_group_id ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_consultation_booking_group_change();

CREATE OR REPLACE FUNCTION public.enforce_consultation_record_booking_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.booking_link_state IS DISTINCT FROM 'linked'
      OR NEW.booking_id IS NULL
      OR NEW.legacy_booking_id IS NOT NULL THEN
      RAISE EXCEPTION 'new consultation records require a valid linked booking'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.booking_link_state IS DISTINCT FROM OLD.booking_link_state
    OR NEW.legacy_booking_id IS DISTINCT FROM OLD.legacy_booking_id THEN
    RAISE EXCEPTION 'consultation booking link state and legacy reference are immutable'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.booking_link_state = 'legacy_orphan'
    AND (NEW.booking_id IS DISTINCT FROM OLD.booking_id
      OR NEW.booking_group_id IS DISTINCT FROM OLD.booking_group_id
      OR NEW.workspace_id IS DISTINCT FROM OLD.workspace_id) THEN
    RAISE EXCEPTION 'legacy consultation booking references are immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.enforce_consultation_record_booking_link()
  FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER consultation_record_booking_link_guard
  BEFORE INSERT OR UPDATE ON public.consultation_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_consultation_record_booking_link();

CREATE OR REPLACE FUNCTION public.can_manage_workspace_clinical(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND auth.uid() IS NOT NULL
    AND p_workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members AS member
      WHERE member.workspace_id = p_workspace_id
        AND member.user_id = auth.uid()
        AND member.role IN ('owner', 'nutritionist')
        AND member.status = 'active'
        AND (SELECT count(*) FROM public.workspace_members AS active_member
             WHERE active_member.user_id = auth.uid()
               AND active_member.status = 'active') = 1
    )
$function$;

REVOKE ALL ON FUNCTION public.can_manage_workspace_clinical(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace_clinical(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_consultation_record(
  p_booking_id bigint,
  p_record_workspace_id uuid,
  p_allow_unassigned boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND p_booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings AS booking
      WHERE booking.id = p_booking_id
        AND (
          (
            booking.workspace_id IS NOT NULL
            AND public.can_manage_workspace_clinical(booking.workspace_id)
            AND (
              p_record_workspace_id IS NOT DISTINCT FROM booking.workspace_id
              OR (p_allow_unassigned AND p_record_workspace_id IS NULL)
            )
          )
          OR (
            booking.workspace_id IS NULL
            AND p_allow_unassigned
            AND p_record_workspace_id IS NULL
            AND public.is_admin_email()
            AND (
              booking.patient_id IS NULL
              OR EXISTS (
                SELECT 1 FROM public.patients AS patient
                WHERE patient.id = booking.patient_id
                  AND patient.workspace_id IS NULL
              )
            )
          )
        )
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_read_legacy_consultation_record(p_booking_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT auth.role() = 'authenticated'
    AND p_booking_id IS NOT NULL
    AND public.current_patient_id() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings AS booking
      JOIN public.patients AS patient ON patient.id = booking.patient_id
      WHERE booking.id = p_booking_id
        AND booking.workspace_id IS NULL
        AND patient.workspace_id IS NULL
        AND booking.patient_id = public.current_patient_id()
    )
$function$;

REVOKE ALL ON FUNCTION public.can_manage_consultation_record(bigint, uuid, boolean)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_read_legacy_consultation_record(bigint)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_consultation_record(bigint, uuid, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_legacy_consultation_record(bigint)
  TO authenticated;

CREATE TABLE public.consultation_record_legacy_access_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  accessed_by uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  record_ids integer[] NOT NULL
);
ALTER TABLE public.consultation_record_legacy_access_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.consultation_record_legacy_access_audit
  FROM PUBLIC, anon, authenticated, service_role;
DO $legacy_access_audit_sequence_acl$
DECLARE
  v_sequence text;
BEGIN
  v_sequence := pg_catalog.pg_get_serial_sequence(
    'public.consultation_record_legacy_access_audit', 'id'
  );
  IF v_sequence IS NOT NULL THEN
    EXECUTE format(
      'REVOKE ALL ON SEQUENCE %s FROM PUBLIC, anon, authenticated, service_role',
      v_sequence
    );
  END IF;
END
$legacy_access_audit_sequence_acl$;

CREATE FUNCTION public.get_legacy_consultation_records()
RETURNS SETOF public.consultation_records
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_record_ids integer[];
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated'
    OR auth.uid() IS NULL
    OR NOT public.is_admin_email() THEN
    RAISE EXCEPTION 'legacy consultation access requires an authorized administrator'
      USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(array_agg(record.id ORDER BY record.id), ARRAY[]::integer[])
    INTO v_record_ids
  FROM public.consultation_records AS record
  WHERE record.booking_link_state = 'legacy_orphan';

  INSERT INTO public.consultation_record_legacy_access_audit(accessed_by, record_ids)
  VALUES (auth.uid(), v_record_ids);

  RETURN QUERY
  SELECT record.*
  FROM public.consultation_records AS record
  WHERE record.booking_link_state = 'legacy_orphan'
  ORDER BY record.id;
END
$function$;

REVOKE ALL ON FUNCTION public.get_legacy_consultation_records()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_legacy_consultation_records()
  TO authenticated;

ALTER TABLE public.consultation_records ENABLE ROW LEVEL SECURITY;
DO $consultation_drop_policies$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policy.polname
    FROM pg_catalog.pg_policy AS policy
    WHERE policy.polrelid = 'public.consultation_records'::regclass
  LOOP
    EXECUTE format('DROP POLICY %I ON public.consultation_records', policy_name);
  END LOOP;
END
$consultation_drop_policies$;

REVOKE ALL PRIVILEGES ON TABLE public.consultation_records
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consultation_records
  TO authenticated;
DO $consultation_sequence_acl$
DECLARE sequence_name text;
BEGIN
  sequence_name := pg_catalog.pg_get_serial_sequence('public.consultation_records', 'id');
  IF sequence_name IS NOT NULL THEN
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON SEQUENCE %s FROM PUBLIC, anon, authenticated',
      sequence_name
    );
    EXECUTE format(
      'GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated',
      sequence_name
    );
  END IF;
END
$consultation_sequence_acl$;

CREATE POLICY workspace_select_consultation_records
  ON public.consultation_records FOR SELECT TO authenticated
  USING (public.can_manage_consultation_record(booking_id, workspace_id, true));

CREATE POLICY workspace_insert_consultation_records
  ON public.consultation_records FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_consultation_record(booking_id, workspace_id, false));

CREATE POLICY workspace_update_consultation_records
  ON public.consultation_records FOR UPDATE TO authenticated
  USING (public.can_manage_consultation_record(booking_id, workspace_id, true))
  WITH CHECK (public.can_manage_consultation_record(booking_id, workspace_id, true));

CREATE POLICY workspace_delete_consultation_records
  ON public.consultation_records FOR DELETE TO authenticated
  USING (public.can_manage_consultation_record(booking_id, workspace_id, true));

CREATE POLICY legacy_patient_read_consultation_records
  ON public.consultation_records FOR SELECT TO authenticated
  USING (
    workspace_id IS NULL
    AND public.can_read_legacy_consultation_record(booking_id)
  );

COMMENT ON TABLE public.consultation_records IS
  'Live records require an exact validated booking_id FK. Explicit legacy_orphan rows preserve their original ID and are available only through the admin-audited legacy RPC.';
COMMENT ON COLUMN public.consultation_records.booking_link_state IS
  'Immutable booking state: linked for valid bookings or legacy_orphan for the explicitly archived legacy set.';
COMMENT ON COLUMN public.consultation_records.legacy_booking_id IS
  'Original missing booking ID retained for legacy_orphan records; never a live booking link.';
