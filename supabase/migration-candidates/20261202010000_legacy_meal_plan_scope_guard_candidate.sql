-- Local candidate; execute transactionally, only AFTER the historical RPC and workspace schema.
-- Preserve the exact signature, owner and ACL of c659c50; never create a missing RPC with default privileges.
DO $prerequisite$
BEGIN
  IF to_regprocedure('public.save_admin_meal_plan_aggregate(bigint,jsonb,jsonb,boolean)') IS NULL THEN
    RAISE EXCEPTION 'historical admin meal plan RPC required';
  END IF;
  PERFORM p.workspace_id, m.workspace_id, mp.workspace_id
    FROM public.patients p, public.measurements m, public.meal_plans mp WHERE false;
END;
$prerequisite$;

CREATE OR REPLACE FUNCTION public.save_admin_meal_plan_aggregate(
  p_plan_id bigint, p_plan jsonb, p_meals jsonb, p_replace_meals boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  v_plan public.meal_plans%ROWTYPE;
  v_patient_id bigint;
  v_measurement_id bigint;
  v_meal jsonb;
  v_food jsonb;
  v_meal_id bigint;
  v_plan_id bigint := p_plan_id;
  v_idx integer := 0;
  v_food_idx integer;
  v_result jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'authenticated' OR auth.uid() IS NULL
     OR public.is_admin_email() IS NOT TRUE THEN
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
    SELECT * INTO v_plan FROM public.meal_plans WHERE id = v_plan_id AND workspace_id IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'legacy meal plan access denied' USING ERRCODE = '42501'; END IF;
  END IF;
  IF p_plan IS NOT NULL AND p_plan ? 'patient_id' THEN
    v_patient_id := nullif(p_plan->>'patient_id','')::bigint;
  ELSIF v_plan_id IS NOT NULL THEN
    v_patient_id := v_plan.patient_id;
  END IF;
  IF v_patient_id IS NULL OR (v_plan_id IS NOT NULL AND v_patient_id IS DISTINCT FROM v_plan.patient_id) THEN
    RAISE EXCEPTION 'legacy meal plan access denied' USING ERRCODE = '42501';
  END IF;
  -- FOR SHARE (not KEY SHARE) also conflicts with updates of non-key scope columns.
  PERFORM 1 FROM public.patients p WHERE p.id = v_patient_id AND p.workspace_id IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'legacy meal plan access denied' USING ERRCODE = '42501'; END IF;

  -- Even a meals-only edit must validate the existing measurement when omitted.
  v_measurement_id := CASE WHEN p_plan ? 'measurement_id' THEN nullif(p_plan->>'measurement_id','')::bigint
                          ELSE v_plan.measurement_id END;
  IF v_measurement_id IS NOT NULL THEN
    PERFORM 1 FROM public.measurements m
     WHERE m.id = v_measurement_id AND m.patient_id = v_patient_id AND m.workspace_id IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'legacy meal plan access denied' USING ERRCODE = '42501'; END IF;
  END IF;

  IF v_plan_id IS NULL THEN
    INSERT INTO public.meal_plans(patient_id, workspace_id, title, start_date, end_date, daily_calories, notes,
      strategy_type, target_calories, target_protein_g, target_carbs_g, target_fat_g, measurement_id, get_kcal)
    VALUES (v_patient_id, NULL,
      coalesce(nullif(p_plan->>'title',''), 'Plano Alimentar'), nullif(p_plan->>'start_date','')::date,
      nullif(p_plan->>'end_date','')::date, nullif(p_plan->>'daily_calories','')::numeric,
      p_plan->>'notes', p_plan->>'strategy_type', nullif(p_plan->>'target_calories','')::numeric,
      nullif(p_plan->>'target_protein_g','')::numeric, nullif(p_plan->>'target_carbs_g','')::numeric,
      nullif(p_plan->>'target_fat_g','')::numeric, v_measurement_id,
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
      measurement_id = v_measurement_id,
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
