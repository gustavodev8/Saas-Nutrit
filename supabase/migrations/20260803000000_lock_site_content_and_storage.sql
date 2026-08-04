-- Lock editable site content and storage writes.
--
-- Public visitors may read published site content and submit public forms.
-- Only authenticated admin sessions may mutate site_content or upload assets.

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

    CREATE POLICY "public_read"
      ON public.site_content
      FOR SELECT
      TO anon, authenticated
      USING (true);

    CREATE POLICY "authenticated_manage_site_content"
      ON public.site_content
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon;

    DROP POLICY IF EXISTS "anon_upload_images" ON storage.objects;
    DROP POLICY IF EXISTS "anon_update_images" ON storage.objects;
    DROP POLICY IF EXISTS "anon_delete_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_upload_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_update_images" ON storage.objects;
    DROP POLICY IF EXISTS "authenticated_delete_images" ON storage.objects;

    CREATE POLICY "authenticated_upload_images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'images');

    CREATE POLICY "authenticated_update_images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'images')
      WITH CHECK (bucket_id = 'images');

    CREATE POLICY "authenticated_delete_images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'images');
  END IF;
END $$;
