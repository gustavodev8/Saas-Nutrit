-- ============================================================
-- CANDIDATA (nao aplicar): create_workspace_diet_template com alternativas e substituicoes
-- ============================================================
-- Problema: o RPC original (20261204000000) so inseria refeicoes principais + alimentos,
-- entao "Salvar como modelo" descartava opcoes alternativas e substituicoes por alimento.
--
-- Esta versao:
--   * adiciona diet_template_meals.substitution_items (jsonb) p/ trocas por alimento;
--   * para cada refeicao em p_meals aceita:
--       - "substitutions": [{meal_name, time_suggestion, notes, foods[]}]  -> refeicoes-filhas
--         (is_substitution_of = refeicao principal), mesmo formato do modelo admin;
--       - "substitution_items": [{food_name, quantity, unit, notes, replaces_food}] -> jsonb.
--   * mantem a assinatura (uuid, jsonb, jsonb) e os mesmos grants; payload antigo continua valido.
-- Promover conforme supabase/migration-candidates/README.md.
-- ============================================================

alter table public.diet_template_meals
  add column if not exists substitution_items jsonb not null default '[]'::jsonb;

create or replace function public.create_workspace_diet_template(
  p_workspace_id uuid,
  p_template jsonb,
  p_meals jsonb
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id bigint;
  v_meal jsonb;
  v_meal_id bigint;
  v_sub jsonb;
  v_sub_id bigint;
  v_food jsonb;
  v_meal_order int := 0;
  v_sub_order int;
  v_food_order int;
  v_items jsonb;
begin
  if p_workspace_id is null then
    raise exception 'workspace_id é obrigatório';
  end if;

  if not exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
      and status = 'active'
  ) then
    raise exception 'Usuário não é membro ativo deste workspace';
  end if;

  insert into diet_templates (
    name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, workspace_id, is_active
  ) values (
    coalesce(nullif(btrim(p_template->>'name'), ''), 'Modelo'),
    nullif(p_template->>'description', ''),
    nullif(p_template->>'strategy', ''),
    (p_template->>'total_kcal')::numeric,
    (p_template->>'protein_g')::numeric,
    (p_template->>'carbs_g')::numeric,
    (p_template->>'fat_g')::numeric,
    p_workspace_id,
    true
  )
  returning id into v_template_id;

  for v_meal in select * from jsonb_array_elements(coalesce(p_meals, '[]'::jsonb))
  loop
    v_items := case
      when jsonb_typeof(v_meal->'substitution_items') = 'array' then v_meal->'substitution_items'
      else '[]'::jsonb
    end;

    insert into diet_template_meals (
      template_id, meal_name, time_suggestion, order_index, notes, substitution_items
    ) values (
      v_template_id,
      coalesce(nullif(btrim(v_meal->>'meal_name'), ''), 'Refeição'),
      nullif(v_meal->>'time_suggestion', ''),
      v_meal_order,
      nullif(v_meal->>'notes', ''),
      v_items
    )
    returning id into v_meal_id;

    v_food_order := 0;
    for v_food in select * from jsonb_array_elements(coalesce(v_meal->'foods', '[]'::jsonb))
    loop
      if coalesce(btrim(v_food->>'food_name'), '') <> '' then
        insert into diet_template_foods (
          template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
          kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, order_index, food_group, notes
        ) values (
          v_meal_id,
          btrim(v_food->>'food_name'),
          coalesce((v_food->>'quantity')::numeric, 0),
          coalesce(nullif(v_food->>'unit', ''), 'g'),
          nullif(v_food->>'household_measure', ''),
          (v_food->>'measure_amount')::numeric,
          coalesce((v_food->>'kcal_per_100g')::numeric, 0),
          coalesce((v_food->>'protein_per_100g')::numeric, 0),
          coalesce((v_food->>'carbs_per_100g')::numeric, 0),
          coalesce((v_food->>'fat_per_100g')::numeric, 0),
          v_food_order,
          nullif(v_food->>'food_group', ''),
          nullif(v_food->>'notes', '')
        );
        v_food_order := v_food_order + 1;
      end if;
    end loop;

    -- Opcoes alternativas: refeicoes-filhas apontando para a refeicao principal.
    v_sub_order := 0;
    for v_sub in select * from jsonb_array_elements(
      case when jsonb_typeof(v_meal->'substitutions') = 'array' then v_meal->'substitutions' else '[]'::jsonb end
    )
    loop
      insert into diet_template_meals (
        template_id, meal_name, time_suggestion, order_index, notes, is_substitution_of
      ) values (
        v_template_id,
        coalesce(nullif(btrim(v_sub->>'meal_name'), ''), 'Alternativa'),
        nullif(v_sub->>'time_suggestion', ''),
        v_sub_order,
        nullif(v_sub->>'notes', ''),
        v_meal_id
      )
      returning id into v_sub_id;

      v_food_order := 0;
      for v_food in select * from jsonb_array_elements(coalesce(v_sub->'foods', '[]'::jsonb))
      loop
        if coalesce(btrim(v_food->>'food_name'), '') <> '' then
          insert into diet_template_foods (
            template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
            kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, order_index, food_group, notes
          ) values (
            v_sub_id,
            btrim(v_food->>'food_name'),
            coalesce((v_food->>'quantity')::numeric, 0),
            coalesce(nullif(v_food->>'unit', ''), 'g'),
            nullif(v_food->>'household_measure', ''),
            (v_food->>'measure_amount')::numeric,
            coalesce((v_food->>'kcal_per_100g')::numeric, 0),
            coalesce((v_food->>'protein_per_100g')::numeric, 0),
            coalesce((v_food->>'carbs_per_100g')::numeric, 0),
            coalesce((v_food->>'fat_per_100g')::numeric, 0),
            v_food_order,
            nullif(v_food->>'food_group', ''),
            nullif(v_food->>'notes', '')
          );
          v_food_order := v_food_order + 1;
        end if;
      end loop;

      v_sub_order := v_sub_order + 1;
    end loop;

    v_meal_order := v_meal_order + 1;
  end loop;

  return v_template_id;
end;
$$;

revoke all on function public.create_workspace_diet_template(uuid, jsonb, jsonb) from public;
revoke all on function public.create_workspace_diet_template(uuid, jsonb, jsonb) from anon;
grant execute on function public.create_workspace_diet_template(uuid, jsonb, jsonb) to authenticated;
