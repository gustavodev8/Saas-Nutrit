BEGIN;
SELECT plan(24);

INSERT INTO auth.users (id, email, aud, role, encrypted_password, email_confirmed_at)
VALUES ('00000000-0000-0000-0000-000000000501', 'reviewer@example.test', 'authenticated', 'authenticated', 'x', pg_catalog.now())
ON CONFLICT (id) DO NOTHING;

SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.workspace_access_requests'::regclass), 'RLS is enabled');
SELECT is((SELECT count(*)::integer FROM pg_catalog.pg_policy WHERE polrelid = 'public.workspace_access_requests'::regclass), 0, 'no table policies grant client access');
SELECT ok(
  NOT has_table_privilege('anon', 'public.workspace_access_requests', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.workspace_access_requests', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  AND NOT has_table_privilege('service_role', 'public.workspace_access_requests', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
  'clients and service_role have no direct table privileges'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] AND pg_catalog.pg_get_userbyid(proowner) = 'postgres'
   FROM pg_catalog.pg_proc WHERE oid = 'public.submit_workspace_access_request(text,text,text,text,text,boolean)'::regprocedure),
  'submit RPC is SECURITY DEFINER, postgres-owned, and has an empty search_path'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] AND pg_catalog.pg_get_userbyid(proowner) = 'postgres'
   FROM pg_catalog.pg_proc WHERE oid = 'public.list_workspace_access_requests()'::regprocedure),
  'list RPC is SECURITY DEFINER, postgres-owned, and has an empty search_path'
);
SELECT ok(
  (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] AND pg_catalog.pg_get_userbyid(proowner) = 'postgres'
   FROM pg_catalog.pg_proc WHERE oid = 'public.review_workspace_access_request(uuid,text,uuid)'::regprocedure),
  'review RPC is SECURITY DEFINER, postgres-owned, and has an empty search_path'
);
SELECT ok(
  has_function_privilege('service_role', 'public.submit_workspace_access_request(text,text,text,text,text,boolean)', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.list_workspace_access_requests()', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.review_workspace_access_request(uuid,text,uuid)', 'EXECUTE'),
  'service_role can call the three trusted RPCs'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.submit_workspace_access_request(text,text,text,text,text,boolean)', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.list_workspace_access_requests()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.review_workspace_access_request(uuid,text,uuid)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.submit_workspace_access_request(text,text,text,text,text,boolean)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.list_workspace_access_requests()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.review_workspace_access_request(uuid,text,uuid)', 'EXECUTE'),
  'anon and authenticated cannot call trusted RPCs'
);

SELECT ok(public.submit_workspace_access_request('Nutricionista Teste', ' TRIAGE@EXAMPLE.TEST ', '(75) 99999-0000', 'CRN-5/1234', 'meal_planning', true), 'valid consented request with a fixed category is accepted');
SELECT is((SELECT professional_email FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'triage@example.test', 'email is normalized');
SELECT is((SELECT status FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'pending', 'new requests start pending');
SELECT is((SELECT need_category FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'meal_planning', 'only the selected category is persisted');
SELECT ok((SELECT consented_at IS NOT NULL FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'consent timestamp is persisted');
SELECT ok(public.submit_workspace_access_request('Outra Tentativa', 'triage@example.test', NULL, NULL, 'meal_planning', true), 'duplicate pending request returns generic success');
SELECT is((SELECT count(*)::integer FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 1, 'duplicate pending request does not create another row');
SELECT ok(NOT public.submit_workspace_access_request('Pessoa', 'no-consent@example.test', NULL, NULL, 'meal_planning', false), 'request without affirmative consent is rejected');
SELECT ok(NOT public.submit_workspace_access_request('x', 'bad-email', NULL, NULL, 'meal_planning', true), 'invalid request is rejected');
SELECT ok(NOT public.submit_workspace_access_request('Pessoa', 'invalid-category@example.test', NULL, NULL, 'free text is not a category', true), 'free-text categories are rejected');
SELECT is((SELECT count(*)::integer FROM public.list_workspace_access_requests()), 1, 'list RPC returns the request without exposing extra records');
SELECT ok(public.review_workspace_access_request((SELECT id FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'approved', '00000000-0000-0000-0000-000000000501'), 'pending request can be approved');
SELECT is((SELECT status FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'approved', 'approved status is persisted');
SELECT ok((SELECT reviewed_at IS NOT NULL AND reviewed_by = '00000000-0000-0000-0000-000000000501' FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'review audit fields are set');
SELECT ok(NOT public.review_workspace_access_request((SELECT id FROM public.workspace_access_requests WHERE professional_email = 'triage@example.test'), 'rejected', '00000000-0000-0000-0000-000000000501'), 'reviewed requests cannot be silently changed');
SELECT ok(NOT public.review_workspace_access_request(gen_random_uuid(), 'pending', '00000000-0000-0000-0000-000000000501'), 'invalid status and missing request fail closed');

SELECT * FROM finish();
ROLLBACK;
