-- ============================================================
-- RPC: salvar um plano alimentar do workspace como MODELO (template)
-- ============================================================
-- Contexto: as tabelas diet_templates / diet_template_meals / diet_template_foods
-- só permitem ESCRITA a admins (policies admin_all_* com is_admin_email()).
-- Membros do workspace têm apenas SELECT (diet_templates, workspace_id do próprio
-- workspace ou global). Logo, para o nutricionista do workspace "salvar como
-- modelo", usamos um RPC SECURITY DEFINER que:
--   1) valida que auth.uid() é membro ATIVO do workspace informado;
--   2) insere template + refeições + alimentos atomicamente (workspace_id do caller),
--      contornando o RLS com segurança (roda como owner).
--
-- Mesma linha do save_workspace_meal_plan e do create_workspace_booking_atomic.
-- Idempotente (create or replace). GRANT só a authenticated.
-- ============================================================

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
  v_food jsonb;
  v_meal_order int := 0;
  v_food_order int;
begin
  if p_workspace_id is null then
    raise exception 'workspace_id é obrigatório';
  end if;

  -- Autorização: o chamador precisa ser membro ATIVO do workspace.
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
    insert into diet_template_meals (
      template_id, meal_name, time_suggestion, order_index, notes
    ) values (
      v_template_id,
      coalesce(nullif(btrim(v_meal->>'meal_name'), ''), 'Refeição'),
      nullif(v_meal->>'time_suggestion', ''),
      v_meal_order,
      nullif(v_meal->>'notes', '')
    )
    returning id into v_meal_id;

    v_food_order := 0;
    for v_food in select * from jsonb_array_elements(coalesce(v_meal->'foods', '[]'::jsonb))
    loop
      -- Ignora alimentos sem nome.
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

    v_meal_order := v_meal_order + 1;
  end loop;

  return v_template_id;
end;
$$;

revoke all on function public.create_workspace_diet_template(uuid, jsonb, jsonb) from public;
revoke all on function public.create_workspace_diet_template(uuid, jsonb, jsonb) from anon;
grant execute on function public.create_workspace_diet_template(uuid, jsonb, jsonb) to authenticated;
