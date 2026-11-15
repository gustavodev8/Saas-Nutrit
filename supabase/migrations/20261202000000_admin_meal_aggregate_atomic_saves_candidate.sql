-- Candidate: atomically persist the three legacy admin-only meal aggregates.
-- This deliberately preserves existing RLS policies and does not claim workspace isolation.
-- Concurrent saves use parent row locks and last-writer-wins semantics (no revision token).

DO $preflight$
BEGIN
  IF to_regprocedure('public.is_admin_email()') IS NULL
     OR to_regclass('public.meal_plans') IS NULL
     OR to_regclass('public.meals') IS NULL
     OR to_regclass('public.meal_foods') IS NULL
     OR to_regclass('public.diet_templates') IS NULL
     OR to_regclass('public.diet_template_meals') IS NULL
     OR to_regclass('public.diet_template_foods') IS NULL
     OR to_regclass('public.meal_presets') IS NULL
     OR to_regclass('public.meal_preset_foods') IS NULL THEN
    RAISE EXCEPTION 'meal aggregate prerequisites are missing';
  END IF;
END;
$preflight$;

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS alternative_meals jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.save_admin_meal_plan_aggregate(
  p_plan_id bigint, p_plan jsonb, p_meals jsonb, p_replace_meals boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_plan public.meal_plans%ROWTYPE;
  v_patient_id bigint;
  v_workspace_id uuid;
  v_meal jsonb;
  v_food jsonb;
  v_meal_id bigint;
  v_plan_id bigint := p_plan_id;
  v_idx integer := 0;
  v_food_idx integer;
  v_result jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL
     OR NOT public.is_admin_email() THEN
    RAISE EXCEPTION 'admin authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_plan IS NOT NULL AND jsonb_typeof(p_plan) <> 'object' THEN RAISE EXCEPTION 'plan must be an object'; END IF;
  IF jsonb_typeof(coalesce(p_meals, '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(coalesce(p_meals, '[]'::jsonb)) > 64
     OR octet_length(coalesce(p_plan, '{}'::jsonb)::text || coalesce(p_meals, '[]'::jsonb)::text) > 1000000 THEN
    RAISE EXCEPTION 'invalid or oversized meal plan payload';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_meals, '[]'::jsonb)) x WHERE jsonb_typeof(x) <> 'object') THEN
    RAISE EXCEPTION 'each meal must be an object';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_meals, '[]'::jsonb)) x
    WHERE jsonb_typeof(coalesce(x->'foods','[]'::jsonb)) <> 'array'
       OR jsonb_typeof(coalesce(x->'substitution_items','[]'::jsonb)) <> 'array'
       OR jsonb_typeof(coalesce(x->'alternative_meals','[]'::jsonb)) <> 'array'
       OR jsonb_array_length(coalesce(x->'foods','[]'::jsonb)) > 128) THEN
    RAISE EXCEPTION 'invalid meal children payload';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_meals, '[]'::jsonb)) x,
                         jsonb_array_elements(coalesce(x->'foods','[]'::jsonb)) f
             WHERE jsonb_typeof(f) <> 'object') THEN
    RAISE EXCEPTION 'each food must be an object';
  END IF;

  IF v_plan_id IS NOT NULL THEN
    SELECT * INTO v_plan FROM public.meal_plans WHERE id = v_plan_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'meal plan not found'; END IF;
  END IF;
  IF p_plan IS NOT NULL AND p_plan ? 'patient_id' THEN
    v_patient_id := nullif(p_plan->>'patient_id','')::bigint;
  ELSIF v_plan_id IS NOT NULL THEN
    v_patient_id := v_plan.patient_id;
  END IF;
  IF v_patient_id IS NULL THEN RAISE EXCEPTION 'patient_id is required'; END IF;
  IF v_plan_id IS NOT NULL AND v_patient_id <> v_plan.patient_id THEN RAISE EXCEPTION 'patient reassignment is not allowed'; END IF;
  SELECT p.workspace_id INTO v_workspace_id FROM public.patients p WHERE p.id = v_patient_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'patient not found'; END IF;

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans(patient_id, workspace_id, title, start_date, end_date, daily_calories, notes,
      strategy_type, target_calories, target_protein_g, target_carbs_g, target_fat_g, measurement_id, get_kcal)
    VALUES (v_patient_id, v_workspace_id,
      coalesce(nullif(p_plan->>'title',''), 'Plano Alimentar'), nullif(p_plan->>'start_date','')::date,
      nullif(p_plan->>'end_date','')::date, nullif(p_plan->>'daily_calories','')::numeric,
      p_plan->>'notes', p_plan->>'strategy_type', nullif(p_plan->>'target_calories','')::numeric,
      nullif(p_plan->>'target_protein_g','')::numeric, nullif(p_plan->>'target_carbs_g','')::numeric,
      nullif(p_plan->>'target_fat_g','')::numeric, nullif(p_plan->>'measurement_id','')::bigint,
      nullif(p_plan->>'get_kcal','')::numeric)
    RETURNING id INTO v_plan_id;
  ELSIF p_plan IS NOT NULL THEN
    UPDATE public.meal_plans SET
      title = CASE WHEN p_plan ? 'title' THEN coalesce(nullif(p_plan->>'title',''), title) ELSE title END,
      start_date = CASE WHEN p_plan ? 'start_date' THEN nullif(p_plan->>'start_date','')::date ELSE start_date END,
      end_date = CASE WHEN p_plan ? 'end_date' THEN nullif(p_plan->>'end_date','')::date ELSE end_date END,
      daily_calories = CASE WHEN p_plan ? 'daily_calories' THEN nullif(p_plan->>'daily_calories','')::numeric ELSE daily_calories END,
      notes = CASE WHEN p_plan ? 'notes' THEN p_plan->>'notes' ELSE notes END,
      strategy_type = CASE WHEN p_plan ? 'strategy_type' THEN p_plan->>'strategy_type' ELSE strategy_type END,
      target_calories = CASE WHEN p_plan ? 'target_calories' THEN nullif(p_plan->>'target_calories','')::numeric ELSE target_calories END,
      target_protein_g = CASE WHEN p_plan ? 'target_protein_g' THEN nullif(p_plan->>'target_protein_g','')::numeric ELSE target_protein_g END,
      target_carbs_g = CASE WHEN p_plan ? 'target_carbs_g' THEN nullif(p_plan->>'target_carbs_g','')::numeric ELSE target_carbs_g END,
      target_fat_g = CASE WHEN p_plan ? 'target_fat_g' THEN nullif(p_plan->>'target_fat_g','')::numeric ELSE target_fat_g END,
      measurement_id = CASE WHEN p_plan ? 'measurement_id' THEN nullif(p_plan->>'measurement_id','')::bigint ELSE measurement_id END,
      get_kcal = CASE WHEN p_plan ? 'get_kcal' THEN nullif(p_plan->>'get_kcal','')::numeric ELSE get_kcal END
    WHERE id = v_plan_id;
  END IF;

  IF p_replace_meals THEN
    DELETE FROM public.meals WHERE plan_id = v_plan_id;
    FOR v_meal IN SELECT value FROM jsonb_array_elements(coalesce(p_meals,'[]'::jsonb)) LOOP
      INSERT INTO public.meals(plan_id, meal_name, time_suggestion, notes, sort_order, substitution_items, alternative_meals)
      VALUES (v_plan_id, coalesce(nullif(v_meal->>'meal_name',''), 'Refeição'), coalesce(v_meal->>'time_suggestion',''),
        coalesce(v_meal->>'notes',''), v_idx, coalesce(v_meal->'substitution_items','[]'::jsonb),
        coalesce(v_meal->'alternative_meals','[]'::jsonb)) RETURNING id INTO v_meal_id;
      v_food_idx := 0;
      FOR v_food IN SELECT value FROM jsonb_array_elements(coalesce(v_meal->'foods','[]'::jsonb)) LOOP
        IF nullif(btrim(coalesce(v_food->>'food_name','')),'') IS NOT NULL THEN
          INSERT INTO public.meal_foods(meal_id, food_name, quantity, unit, calories, protein, carbs, fat, notes,
            sort_order, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, household_measure, measure_amount, food_group)
          VALUES (v_meal_id, btrim(v_food->>'food_name'), nullif(v_food->>'quantity','')::numeric,
            coalesce(v_food->>'unit','g'), nullif(v_food->>'calories','')::numeric, nullif(v_food->>'protein','')::numeric,
            nullif(v_food->>'carbs','')::numeric, nullif(v_food->>'fat','')::numeric, v_food->>'notes', v_food_idx,
            nullif(v_food->>'kcal_per_100g','')::numeric, nullif(v_food->>'protein_per_100g','')::numeric,
            nullif(v_food->>'carbs_per_100g','')::numeric, nullif(v_food->>'fat_per_100g','')::numeric,
            v_food->>'household_measure', nullif(v_food->>'measure_amount','')::numeric, v_food->>'food_group');
          v_food_idx := v_food_idx + 1;
        END IF;
      END LOOP;
      v_idx := v_idx + 1;
    END LOOP;
  END IF;
  SELECT to_jsonb(mp) INTO v_result FROM public.meal_plans mp WHERE id = v_plan_id;
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_admin_diet_template_aggregate(
  p_template_id bigint, p_template jsonb, p_meals jsonb, p_replace_meals boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_template public.diet_templates%ROWTYPE;
  v_id bigint := p_template_id;
  v_parent_meal_id bigint;
  v_meal_id bigint;
  v_meal jsonb;
  v_sub jsonb;
  v_food jsonb;
  v_sub_id bigint;
  v_idx integer := 0;
  v_food_idx integer;
  v_result jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL OR NOT public.is_admin_email() THEN
    RAISE EXCEPTION 'admin authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_template IS NOT NULL AND jsonb_typeof(p_template) <> 'object' THEN RAISE EXCEPTION 'template must be an object'; END IF;
  IF jsonb_typeof(coalesce(p_meals,'[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_meals,'[]'::jsonb)) > 64
     OR octet_length(coalesce(p_template,'{}'::jsonb)::text || coalesce(p_meals,'[]'::jsonb)::text) > 1000000 THEN
    RAISE EXCEPTION 'invalid or oversized template payload';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_meals,'[]'::jsonb)) m WHERE jsonb_typeof(m) <> 'object'
    OR jsonb_typeof(coalesce(m->'foods','[]'::jsonb)) <> 'array'
    OR jsonb_typeof(coalesce(m->'substitutions','[]'::jsonb)) <> 'array'
    OR jsonb_array_length(coalesce(m->'foods','[]'::jsonb)) > 128
    OR jsonb_array_length(coalesce(m->'substitutions','[]'::jsonb)) > 32) THEN
    RAISE EXCEPTION 'invalid template meal payload';
  END IF;
  IF v_id IS NOT NULL THEN
    SELECT * INTO v_template FROM public.diet_templates WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'diet template not found'; END IF;
  END IF;
  IF v_id IS NULL THEN
    INSERT INTO public.diet_templates(name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active, search_aliases)
    VALUES (coalesce(nullif(p_template->>'name',''), 'Modelo'), p_template->>'description', p_template->>'strategy',
      nullif(p_template->>'total_kcal','')::numeric, nullif(p_template->>'protein_g','')::numeric,
      nullif(p_template->>'carbs_g','')::numeric, nullif(p_template->>'fat_g','')::numeric,
      coalesce((p_template->>'is_active')::boolean,true), ARRAY(SELECT jsonb_array_elements_text(coalesce(p_template->'search_aliases','[]'::jsonb))) )
    RETURNING id INTO v_id;
  ELSIF p_template IS NOT NULL THEN
    UPDATE public.diet_templates SET
      name = CASE WHEN p_template ? 'name' THEN coalesce(nullif(p_template->>'name',''),name) ELSE name END,
      description = CASE WHEN p_template ? 'description' THEN p_template->>'description' ELSE description END,
      strategy = CASE WHEN p_template ? 'strategy' THEN p_template->>'strategy' ELSE strategy END,
      total_kcal = CASE WHEN p_template ? 'total_kcal' THEN nullif(p_template->>'total_kcal','')::numeric ELSE total_kcal END,
      protein_g = CASE WHEN p_template ? 'protein_g' THEN nullif(p_template->>'protein_g','')::numeric ELSE protein_g END,
      carbs_g = CASE WHEN p_template ? 'carbs_g' THEN nullif(p_template->>'carbs_g','')::numeric ELSE carbs_g END,
      fat_g = CASE WHEN p_template ? 'fat_g' THEN nullif(p_template->>'fat_g','')::numeric ELSE fat_g END,
      is_active = CASE WHEN p_template ? 'is_active' THEN (p_template->>'is_active')::boolean ELSE is_active END,
      search_aliases = CASE WHEN p_template ? 'search_aliases' THEN ARRAY(SELECT jsonb_array_elements_text(p_template->'search_aliases')) ELSE search_aliases END
    WHERE id = v_id;
  END IF;
  IF p_replace_meals THEN
    DELETE FROM public.diet_template_meals WHERE template_id = v_id;
    FOR v_meal IN SELECT value FROM jsonb_array_elements(coalesce(p_meals,'[]'::jsonb)) LOOP
      INSERT INTO public.diet_template_meals(template_id, meal_name, time_suggestion, order_index, notes)
      VALUES(v_id, coalesce(nullif(v_meal->>'meal_name',''),'Refeição'), coalesce(v_meal->>'time_suggestion',''),
        coalesce(nullif(v_meal->>'order_index','')::smallint,v_idx::smallint), v_meal->>'notes')
      RETURNING id INTO v_parent_meal_id;
      v_food_idx := 0;
      FOR v_food IN SELECT value FROM jsonb_array_elements(coalesce(v_meal->'foods','[]'::jsonb)) LOOP
        IF nullif(btrim(coalesce(v_food->>'food_name','')),'') IS NOT NULL THEN
          INSERT INTO public.diet_template_foods(template_meal_id, food_name, quantity, unit, household_measure,
            measure_amount, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, order_index, food_group, notes)
          VALUES(v_parent_meal_id, btrim(v_food->>'food_name'), nullif(v_food->>'quantity','')::numeric,
            coalesce(v_food->>'unit','g'), v_food->>'household_measure', nullif(v_food->>'measure_amount','')::numeric,
            nullif(v_food->>'kcal_per_100g','')::numeric, nullif(v_food->>'protein_per_100g','')::numeric,
            nullif(v_food->>'carbs_per_100g','')::numeric, nullif(v_food->>'fat_per_100g','')::numeric,
            coalesce(nullif(v_food->>'order_index','')::smallint,v_food_idx::smallint), v_food->>'food_group',v_food->>'notes');
          v_food_idx := v_food_idx + 1;
        END IF;
      END LOOP;
      FOR v_sub IN SELECT value FROM jsonb_array_elements(coalesce(v_meal->'substitutions','[]'::jsonb)) LOOP
        INSERT INTO public.diet_template_meals(template_id, meal_name, time_suggestion, order_index, notes, is_substitution_of)
        VALUES(v_id, coalesce(nullif(v_sub->>'meal_name',''),'Alternativa'), coalesce(v_sub->>'time_suggestion',''),
          coalesce(nullif(v_sub->>'order_index','')::smallint,v_idx::smallint), v_sub->>'notes', v_parent_meal_id)
        RETURNING id INTO v_sub_id;
        v_food_idx := 0;
        FOR v_food IN SELECT value FROM jsonb_array_elements(coalesce(v_sub->'foods','[]'::jsonb)) LOOP
          IF nullif(btrim(coalesce(v_food->>'food_name','')),'') IS NOT NULL THEN
            INSERT INTO public.diet_template_foods(template_meal_id, food_name, quantity, unit, household_measure,
              measure_amount, kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, order_index, food_group, notes)
            VALUES(v_sub_id, btrim(v_food->>'food_name'), nullif(v_food->>'quantity','')::numeric,
              coalesce(v_food->>'unit','g'), v_food->>'household_measure', nullif(v_food->>'measure_amount','')::numeric,
              nullif(v_food->>'kcal_per_100g','')::numeric, nullif(v_food->>'protein_per_100g','')::numeric,
              nullif(v_food->>'carbs_per_100g','')::numeric, nullif(v_food->>'fat_per_100g','')::numeric,
              coalesce(nullif(v_food->>'order_index','')::smallint,v_food_idx::smallint), v_food->>'food_group',v_food->>'notes');
            v_food_idx := v_food_idx + 1;
          END IF;
        END LOOP;
      END LOOP;
      v_idx := v_idx + 1;
    END LOOP;
  END IF;
  SELECT to_jsonb(t) INTO v_result FROM public.diet_templates t WHERE id = v_id;
  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_admin_meal_preset_aggregate(
  p_preset_id bigint, p_preset jsonb, p_foods jsonb, p_replace_foods boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_preset public.meal_presets%ROWTYPE;
  v_id bigint := p_preset_id;
  v_food jsonb;
  v_idx integer := 0;
  v_result jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL OR NOT public.is_admin_email() THEN
    RAISE EXCEPTION 'admin authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_preset IS NOT NULL AND jsonb_typeof(p_preset) <> 'object' THEN RAISE EXCEPTION 'preset must be an object'; END IF;
  IF jsonb_typeof(coalesce(p_foods,'[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_foods,'[]'::jsonb)) > 128
     OR octet_length(coalesce(p_preset,'{}'::jsonb)::text || coalesce(p_foods,'[]'::jsonb)::text) > 500000 THEN
    RAISE EXCEPTION 'invalid or oversized preset payload';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(p_foods,'[]'::jsonb)) f WHERE jsonb_typeof(f) <> 'object') THEN
    RAISE EXCEPTION 'each preset food must be an object';
  END IF;
  IF v_id IS NOT NULL THEN
    SELECT * INTO v_preset FROM public.meal_presets WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'meal preset not found'; END IF;
  END IF;
  IF v_id IS NULL THEN
    INSERT INTO public.meal_presets(name, description, meal_name, time_suggestion, notes, strategy,
      total_kcal, protein_g, carbs_g, fat_g, is_active, source_template_id, source_template_meal_id, search_aliases)
    VALUES(coalesce(nullif(p_preset->>'name',''),'Modelo'), p_preset->>'description',
      coalesce(nullif(p_preset->>'meal_name',''),'Refeição'), p_preset->>'time_suggestion',p_preset->>'notes',p_preset->>'strategy',
      nullif(p_preset->>'total_kcal','')::numeric,nullif(p_preset->>'protein_g','')::numeric,
      nullif(p_preset->>'carbs_g','')::numeric,nullif(p_preset->>'fat_g','')::numeric,
      coalesce((p_preset->>'is_active')::boolean,true), nullif(p_preset->>'source_template_id','')::bigint,
      nullif(p_preset->>'source_template_meal_id','')::bigint,
      ARRAY(SELECT jsonb_array_elements_text(coalesce(p_preset->'search_aliases','[]'::jsonb))))
    RETURNING id INTO v_id;
  ELSIF p_preset IS NOT NULL THEN
    UPDATE public.meal_presets SET
      name = CASE WHEN p_preset ? 'name' THEN coalesce(nullif(p_preset->>'name',''),name) ELSE name END,
      description = CASE WHEN p_preset ? 'description' THEN p_preset->>'description' ELSE description END,
      meal_name = CASE WHEN p_preset ? 'meal_name' THEN coalesce(nullif(p_preset->>'meal_name',''),meal_name) ELSE meal_name END,
      time_suggestion = CASE WHEN p_preset ? 'time_suggestion' THEN p_preset->>'time_suggestion' ELSE time_suggestion END,
      notes = CASE WHEN p_preset ? 'notes' THEN p_preset->>'notes' ELSE notes END,
      strategy = CASE WHEN p_preset ? 'strategy' THEN p_preset->>'strategy' ELSE strategy END,
      total_kcal = CASE WHEN p_preset ? 'total_kcal' THEN nullif(p_preset->>'total_kcal','')::numeric ELSE total_kcal END,
      protein_g = CASE WHEN p_preset ? 'protein_g' THEN nullif(p_preset->>'protein_g','')::numeric ELSE protein_g END,
      carbs_g = CASE WHEN p_preset ? 'carbs_g' THEN nullif(p_preset->>'carbs_g','')::numeric ELSE carbs_g END,
      fat_g = CASE WHEN p_preset ? 'fat_g' THEN nullif(p_preset->>'fat_g','')::numeric ELSE fat_g END,
      is_active = CASE WHEN p_preset ? 'is_active' THEN (p_preset->>'is_active')::boolean ELSE is_active END,
      source_template_id = CASE WHEN p_preset ? 'source_template_id' THEN nullif(p_preset->>'source_template_id','')::bigint ELSE source_template_id END,
      source_template_meal_id = CASE WHEN p_preset ? 'source_template_meal_id' THEN nullif(p_preset->>'source_template_meal_id','')::bigint ELSE source_template_meal_id END,
      search_aliases = CASE WHEN p_preset ? 'search_aliases' THEN ARRAY(SELECT jsonb_array_elements_text(p_preset->'search_aliases')) ELSE search_aliases END
    WHERE id = v_id;
  END IF;
  IF p_replace_foods THEN
    DELETE FROM public.meal_preset_foods WHERE preset_id = v_id;
    FOR v_food IN SELECT value FROM jsonb_array_elements(coalesce(p_foods,'[]'::jsonb)) LOOP
      IF nullif(btrim(coalesce(v_food->>'food_name','')),'') IS NOT NULL THEN
        INSERT INTO public.meal_preset_foods(preset_id, food_name, quantity, unit, calories, protein, carbs, fat,
          kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, notes, sort_order,
          household_measure, measure_amount, food_group)
        VALUES(v_id, btrim(v_food->>'food_name'), nullif(v_food->>'quantity','')::numeric, coalesce(v_food->>'unit','g'),
          nullif(v_food->>'calories','')::numeric, nullif(v_food->>'protein','')::numeric,
          nullif(v_food->>'carbs','')::numeric, nullif(v_food->>'fat','')::numeric,
          nullif(v_food->>'kcal_per_100g','')::numeric, nullif(v_food->>'protein_per_100g','')::numeric,
          nullif(v_food->>'carbs_per_100g','')::numeric, nullif(v_food->>'fat_per_100g','')::numeric,
          v_food->>'notes', coalesce(nullif(v_food->>'sort_order','')::smallint,v_idx::smallint),
          v_food->>'household_measure', nullif(v_food->>'measure_amount','')::numeric, v_food->>'food_group');
        v_idx := v_idx + 1;
      END IF;
    END LOOP;
  END IF;
  SELECT to_jsonb(p) INTO v_result FROM public.meal_presets p WHERE id = v_id;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_admin_meal_plan_aggregate(bigint,jsonb,jsonb,boolean) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.save_admin_diet_template_aggregate(bigint,jsonb,jsonb,boolean) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.save_admin_meal_preset_aggregate(bigint,jsonb,jsonb,boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.save_admin_meal_plan_aggregate(bigint,jsonb,jsonb,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_admin_diet_template_aggregate(bigint,jsonb,jsonb,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_admin_meal_preset_aggregate(bigint,jsonb,jsonb,boolean) TO authenticated;

COMMENT ON FUNCTION public.save_admin_meal_plan_aggregate(bigint,jsonb,jsonb,boolean) IS
  'Atomically saves the legacy admin-only plan aggregate. No workspace isolation guarantee; concurrent writes are last-writer-wins.';
COMMENT ON FUNCTION public.save_admin_diet_template_aggregate(bigint,jsonb,jsonb,boolean) IS
  'Atomically saves the legacy admin-only diet-template aggregate. Concurrent writes are last-writer-wins.';
COMMENT ON FUNCTION public.save_admin_meal_preset_aggregate(bigint,jsonb,jsonb,boolean) IS
  'Atomically saves the legacy admin-only meal-preset aggregate. Concurrent writes are last-writer-wins.';
