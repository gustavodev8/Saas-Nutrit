-- Security hardening for clinical data and public booking flows.
--
-- Goals:
-- 1. Remove legacy anon policies from sensitive clinical data.
-- 2. Keep public users able to create bookings only.
-- 3. Prevent double confirmed bookings for the same slot.
-- 4. Expose only minimal unavailable-slot data to the public booking page.

-- ---------------------------------------------------------------------
-- Sensitive clinical tables: authenticated sessions only.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  table_name text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'patients',
    'patient_photos',
    'anamnesis',
    'measurements',
    'meal_plans',
    'meals',
    'meal_foods',
    'consultation_records',
    'patient_reports',
    'lab_exams',
    'lab_results',
    'exams_catalog',
    'exam_protocols',
    'protocol_exams',
    'patient_exam_requests',
    'patient_exam_request_items',
    'patient_exam_results',
    'global_exams_catalog',
    'global_exam_protocols',
    'global_protocol_items',
    'diet_templates',
    'diet_template_meals',
    'diet_template_foods',
    'meal_presets',
    'meal_preset_foods',
    'smart_substitutions',
    'master_foods',
    'foods',
    'substrates',
    'ready_formulas',
    'formula_items',
    'prescriptions',
    'prescription_blocks',
    'prescription_block_items'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);

      FOR policy_name IN
        SELECT p.policyname
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = table_name
          AND (
            'anon' = ANY (p.roles)
            OR 'public' = ANY (p.roles)
          )
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "all_%s" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "authenticated_all_%s" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON public.%I', table_name, table_name);

      EXECUTE format(
        'CREATE POLICY "authenticated_all_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_slots') THEN
    ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can manage availability" ON availability_slots;
    DROP POLICY IF EXISTS "Anyone can read availability" ON availability_slots;
    DROP POLICY IF EXISTS "anon_read_slots" ON availability_slots;
    DROP POLICY IF EXISTS "service_write_slots" ON availability_slots;
    DROP POLICY IF EXISTS "public_read_slots" ON availability_slots;
    DROP POLICY IF EXISTS "anon_write_slots" ON availability_slots;
    DROP POLICY IF EXISTS "authenticated_manage_slots" ON availability_slots;
    CREATE POLICY "public_read_slots"
      ON availability_slots
      FOR SELECT
      TO anon
      USING (active = true);
    CREATE POLICY "authenticated_manage_slots"
      ON availability_slots
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
    ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "anon_write_posts" ON blog_posts;
    DROP POLICY IF EXISTS "authenticated_all_blog_posts" ON blog_posts;
    CREATE POLICY "authenticated_all_blog_posts"
      ON blog_posts
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- Bookings: public can create; only authenticated users can read/update.
-- ---------------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon full access bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can read bookings" ON bookings;
DROP POLICY IF EXISTS "allow_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_read_bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated can manage bookings" ON bookings;
DROP POLICY IF EXISTS "Service role can manage bookings" ON bookings;
DROP POLICY IF EXISTS "service_write_bookings" ON bookings;
DROP POLICY IF EXISTS "public_read_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "authenticated_all_bookings" ON bookings;

REVOKE SELECT, UPDATE, DELETE ON bookings FROM anon;
REVOKE INSERT ON bookings FROM anon;

GRANT USAGE, SELECT ON SEQUENCE bookings_id_seq TO anon;
GRANT INSERT (
  booking_group_id,
  session_number,
  total_sessions,
  client_name,
  client_email,
  client_phone,
  client_cpf,
  plan_name,
  plan_index,
  appointment_date,
  appointment_time,
  type,
  status,
  payment_status,
  payment_method,
  notes
) ON bookings TO anon;

CREATE POLICY "public_insert_bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (
    patient_id IS NULL
    AND completed_at IS NULL
    AND (
      (
        COALESCE(status, 'pending') = 'pending'
        AND COALESCE(payment_status, 'pending') = 'pending'
        AND (payment_method IS NULL OR payment_method IN ('pix', 'card'))
      )
      OR
      (
        status = 'confirmed'
        AND payment_status = 'free'
        AND payment_method = 'free'
      )
    )
  );

CREATE POLICY "authenticated_all_bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT appointment_date, appointment_time, type
    FROM bookings
    WHERE status = 'confirmed'
    GROUP BY appointment_date, appointment_time, type
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create uniq_confirmed_booking_slot: duplicate confirmed bookings exist for the same date/time/type';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_confirmed_booking_slot
  ON bookings (appointment_date, appointment_time, type)
  WHERE status = 'confirmed';

-- Minimal public availability view for the booking page.
CREATE OR REPLACE FUNCTION public.public_unavailable_booking_slots(
  p_date date,
  p_type text,
  p_exclude_group_id text DEFAULT NULL
)
RETURNS TABLE (
  appointment_time text,
  status text,
  created_at timestamptz,
  booking_group_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.appointment_time,
    b.status,
    b.created_at,
    b.booking_group_id
  FROM bookings b
  WHERE b.appointment_date = p_date
    AND b.type = p_type
    AND b.status NOT IN ('cancelled', 'no_show')
    AND NOT (
      b.status = 'pending'
      AND b.created_at < now() - interval '30 minutes'
    )
    AND (p_exclude_group_id IS NULL OR b.booking_group_id <> p_exclude_group_id);
$$;

REVOKE ALL ON FUNCTION public.public_unavailable_booking_slots(date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_unavailable_booking_slots(date, text, text) TO anon, authenticated;
