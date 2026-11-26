-- ============================================================
-- RPCs: excluir (soft) e renomear MODELO de dieta do workspace
-- ============================================================
-- diet_templates só permite ESCRITA a admin (admin_all_*). Membro do workspace
-- tem só SELECT. Para o nutricionista gerenciar os PRÓPRIOS modelos (salvos via
-- create_workspace_diet_template), usamos RPCs SECURITY DEFINER escopados.
--
-- SEGURANÇA: ambas só afetam modelos com workspace_id = p_workspace_id. Os ~127
-- modelos globais da biblioteca têm workspace_id IS NULL, então `workspace_id =
-- p_workspace_id` nunca os atinge (NULL = uuid é falso). Membro só mexe no que é dele.
--
-- Exclusão é soft (is_active = false) — reusa o filtro is_active=true do fetch,
-- é reversível e não cascateia dados. Idempotente (create or replace).
-- ============================================================

create or replace function public.delete_workspace_diet_template(
  p_workspace_id uuid,
  p_template_id bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if p_workspace_id is null or p_template_id is null then
    raise exception 'workspace_id e template_id são obrigatórios';
  end if;
  if not exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Usuário não é membro ativo deste workspace';
  end if;

  update diet_templates
    set is_active = false
    where id = p_template_id and workspace_id = p_workspace_id
    returning id into v_id;

  if v_id is null then
    raise exception 'Modelo não encontrado neste workspace';
  end if;
  return v_id;
end;
$$;

create or replace function public.rename_workspace_diet_template(
  p_workspace_id uuid,
  p_template_id bigint,
  p_name text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if p_workspace_id is null or p_template_id is null then
    raise exception 'workspace_id e template_id são obrigatórios';
  end if;
  if v_name = '' then
    raise exception 'O nome do modelo é obrigatório';
  end if;
  if not exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'Usuário não é membro ativo deste workspace';
  end if;

  update diet_templates
    set name = v_name
    where id = p_template_id and workspace_id = p_workspace_id
    returning id into v_id;

  if v_id is null then
    raise exception 'Modelo não encontrado neste workspace';
  end if;
  return v_id;
end;
$$;

revoke all on function public.delete_workspace_diet_template(uuid, bigint) from public, anon;
revoke all on function public.rename_workspace_diet_template(uuid, bigint, text) from public, anon;
grant execute on function public.delete_workspace_diet_template(uuid, bigint) to authenticated;
grant execute on function public.rename_workspace_diet_template(uuid, bigint, text) to authenticated;
