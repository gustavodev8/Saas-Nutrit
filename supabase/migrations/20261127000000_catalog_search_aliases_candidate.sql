-- Adds optional synonyms for normalized catalog search. This migration deliberately
-- does not change RLS, grants, policies, or existing catalog values.
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.master_foods
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.global_exams_catalog
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.global_exam_protocols
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.diet_templates
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.meal_presets
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}';
