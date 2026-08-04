-- Introduce a database-side admin allowlist and replace broad
-- "authenticated can do everything" policies with admin-only policies.
--
-- Bootstrap strategy:
-- - Seed the earliest confirmed auth user as the first admin email when the
--   allowlist is empty. This avoids locking out the current operator while
--   preventing future authenticated users from inheriting admin access.

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_emails FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_emails TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT lower(nullif(coalesce(auth.jwt() ->> 'email', ''), ''))
$$;

CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email text;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  jwt_email := public.current_user_email();

  IF jwt_email IS NULL OR jwt_email = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_emails ae
    WHERE ae.email = jwt_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_email() TO anon, authenticated, service_role;

INSERT INTO public.admin_emails (email, note)
SELECT lower(seed.email), 'Bootstrap admin imported during RLS hardening'
FROM (
  SELECT u.email
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL
  ORDER BY u.created_at ASC
  LIMIT 1
) AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_emails
)
ON CONFLICT (email) DO NOTHING;

DROP POLICY IF EXISTS "admin_select_admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_manage_admin_emails" ON public.admin_emails;

CREATE POLICY "admin_select_admin_emails"
  ON public.admin_emails
  FOR SELECT
  TO authenticated
  USING (public.is_admin_email());

CREATE POLICY "admin_manage_admin_emails"
  ON public.admin_emails
  FOR ALL
  TO authenticated
  USING (public.is_admin_email())
  WITH CHECK (public.is_admin_email());

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
    'payment_logs',
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
    'prescription_block_items',
    'patient_audit_logs'
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
            OR 'authenticated' = ANY (p.roles)
          )
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY "admin_all_%s" ON public.%I FOR ALL TO authenticated USING (public.is_admin_email()) WITH CHECK (public.is_admin_email())',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_content') THEN
    ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

    REVOKE INSERT, UPDATE, DELETE ON public.site_content FROM anon;
    GRANT SELECT ON public.site_content TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;

    DROP POLICY IF EXISTS "public_read" ON public.site_content;
    DROP POLICY IF EXISTS "public_update" ON public.site_content;
    DROP POLICY IF EXISTS "public_upsert" ON public.site_content;
    DROP POLICY IF EXISTS "authenticated_manage_site_content" ON public.site_content;
    DROP POLICY IF EXISTS "admin_manage_site_content" ON public.site_content;

    CREATE POLICY "public_read"
      ON public.site_content
      FOR SELECT
      TO anon, authenticated
      USING (true);

    CREATE POLICY "admin_manage_site_content"
      ON public.site_content
      FOR ALL
      TO authenticated
      USING (public.is_admin_email())
      WITH CHECK (public.is_admin_email());
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_slots') THEN
    ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can manage availability" ON public.availability_slots;
    DROP POLICY IF EXISTS "Anyone can read availability" ON public.availability_slots;
    DROP POLICY IF EXISTS "anon_read_slots" ON public.availability_slots;
    DROP POLICY IF EXISTS "service_write_slots" ON public.availability_slots;
    DROP POLICY IF EXISTS "public_read_slots" ON public.availability_slots;
    DROP POLICY IF EXISTS "anon_write_slots" ON public.availability_slots;
    DROP POLICY IF EXISTS "authenticated_manage_slots" ON public.availability_slots;
    DROP POLICY IF EXISTS "admin_manage_slots" ON public.availability_slots;

    CREATE POLICY "public_read_slots"
      ON public.availability_slots
      FOR SELECT
      TO anon, authenticated
      USING (active = true);

    CREATE POLICY "admin_manage_slots"
      ON public.availability_slots
      FOR ALL
      TO authenticated
      USING (public.is_admin_email())
      WITH CHECK (public.is_admin_email());
  END IF;

  ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anon full access bookings" ON public.bookings;
  DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;
  DROP POLICY IF EXISTS "allow_update_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "anon_insert_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "anon_read_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "Authenticated can manage bookings" ON public.bookings;
  DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;
  DROP POLICY IF EXISTS "service_write_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "public_read_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "anon_update_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "public_insert_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "authenticated_all_bookings" ON public.bookings;
  DROP POLICY IF EXISTS "admin_all_bookings" ON public.bookings;

  REVOKE SELECT, UPDATE, DELETE ON public.bookings FROM anon;
  REVOKE INSERT ON public.bookings FROM anon;

  GRANT USAGE, SELECT ON SEQUENCE public.bookings_id_seq TO anon;
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
  ) ON public.bookings TO anon;

  CREATE POLICY "public_insert_bookings"
    ON public.bookings
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

  CREATE POLICY "admin_all_bookings"
    ON public.bookings
    FOR ALL
    TO authenticated
    USING (public.is_admin_email())
    WITH CHECK (public.is_admin_email());

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
    ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;
    DROP POLICY IF EXISTS "authenticated_all_leads" ON public.leads;
    DROP POLICY IF EXISTS "admin_all_leads" ON public.leads;

    CREATE POLICY "anon_insert_leads"
      ON public.leads
      FOR INSERT
      TO anon
      WITH CHECK (true);

    CREATE POLICY "admin_all_leads"
      ON public.leads
      FOR ALL
      TO authenticated
      USING (public.is_admin_email())
      WITH CHECK (public.is_admin_email());
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
    ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

    REVOKE INSERT, UPDATE, DELETE ON public.blog_posts FROM anon;
    GRANT SELECT ON public.blog_posts TO anon, authenticated;
    GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

    DROP POLICY IF EXISTS "public_read_published_posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "anon_write_posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "authenticated_all_blog_posts" ON public.blog_posts;
    DROP POLICY IF EXISTS "admin_all_blog_posts" ON public.blog_posts;

    CREATE POLICY "public_read_published_posts"
      ON public.blog_posts
      FOR SELECT
      TO anon, authenticated
      USING (published = true);

    CREATE POLICY "admin_all_blog_posts"
      ON public.blog_posts
      FOR ALL
      TO authenticated
      USING (public.is_admin_email())
      WITH CHECK (public.is_admin_email());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
  ) THEN
    REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon;

    DROP POLICY IF EXISTS "anon_upload_images" ON storage.objects;
    DROP POLICY IF EXISTS "anon_update_images" ON storage.objects;
    DROP POLICY IF EXISTS "anon_delete_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_upload_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_update_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_delete_images" ON storage.objects;
    DROP POLICY IF EXISTS "admin_upload_images" ON storage.objects;
    DROP POLICY IF EXISTS "admin_update_images" ON storage.objects;
    DROP POLICY IF EXISTS "admin_delete_images" ON storage.objects;

    CREATE POLICY "admin_upload_images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'images'
        AND public.is_admin_email()
      );

    CREATE POLICY "admin_update_images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'images'
        AND public.is_admin_email()
      )
      WITH CHECK (
        bucket_id = 'images'
        AND public.is_admin_email()
      );

    CREATE POLICY "admin_delete_images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'images'
        AND public.is_admin_email()
      );
  END IF;
END $$;
