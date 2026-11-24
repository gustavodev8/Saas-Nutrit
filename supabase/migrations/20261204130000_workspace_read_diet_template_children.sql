-- ============================================================
-- Fix (pré-piloto): membro do workspace precisa LER refeições/alimentos dos modelos
-- ============================================================
-- Bug encontrado na QA: diet_template_meals e diet_template_foods só tinham a
-- policy admin_all_* (is_admin_email()). Logo, um nutricionista comum (não-admin)
-- NÃO conseguia ler o conteúdo dos modelos de dieta. Isso quebrava:
--   - a página de detalhe do modelo (travava em "Carregando modelo...");
--   - "criar plano a partir de modelo" (vinha sem refeições);
--   - o uso da biblioteca de 127 modelos e dos modelos salvos via "Salvar como modelo".
--
-- O pai diet_templates já tem workspace_diet_templates_select (vê globais workspace_id
-- IS NULL + os do próprio workspace). Aqui espelhamos isso para os filhos, checando o
-- template pai pela cadeia de FKs. Apenas SELECT; escrita continua pelo admin/RPC.
-- Idempotente.
-- ============================================================

-- Refeições do template: visíveis se o template pai for global ou do workspace do caller.
drop policy if exists "workspace_diet_template_meals_select" on diet_template_meals;
create policy "workspace_diet_template_meals_select"
  on diet_template_meals
  for select
  to authenticated
  using (
    exists (
      select 1 from diet_templates t
      where t.id = diet_template_meals.template_id
        and (
          t.workspace_id is null
          or t.workspace_id in (
            select workspace_id from workspace_members
            where user_id = auth.uid() and status = 'active'
          )
        )
    )
  );

-- Alimentos do template: cadeia foods -> meal -> template.
drop policy if exists "workspace_diet_template_foods_select" on diet_template_foods;
create policy "workspace_diet_template_foods_select"
  on diet_template_foods
  for select
  to authenticated
  using (
    exists (
      select 1
      from diet_template_meals m
      join diet_templates t on t.id = m.template_id
      where m.id = diet_template_foods.template_meal_id
        and (
          t.workspace_id is null
          or t.workspace_id in (
            select workspace_id from workspace_members
            where user_id = auth.uid() and status = 'active'
          )
        )
    )
  );
