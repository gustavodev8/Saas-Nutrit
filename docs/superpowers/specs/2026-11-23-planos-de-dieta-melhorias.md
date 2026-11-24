# Planos de Dieta — Estudo de Melhorias (menos cliques, mais opções, agilidade)

**Data:** 2026-11-23 · **Objetivo:** enxergar melhorias no editor de **plano alimentar** do workspace (System B) —
menos cliques, mais opções e agilidade no dia a dia. Baseado em leitura do código + referências de mercado (BR e global).

## 0. Estado atual (o que JÁ existe — não re-propor)

Diferente do treino, o editor de dieta do workspace **NÃO é pobre**: ele **reaproveita o `MealSection` do editor
rico do admin** (`WorkspaceMealPlanEditor.tsx` importa de `@/components/admin/MealTableEditor`). Então já tem, de fábrica:

- **Autocomplete de alimento** rico (`FoodSearchInput`): busca alimentos customizados no Supabase (`searchFoodsInSupabase`) **+** OpenFoodFacts (`searchOpenFoodFacts`), e ao selecionar **preenche macros + medidas caseiras automaticamente**.
- **Cálculo automático de macros** por alimento (`calculateFoodMacros`, por 100 g × quantidade), com aviso de "conversão estimada".
- **Medida caseira** (quantidade + nome, com datalist), **grupo alimentar**, **nota/modo de preparo** por alimento.
- **Substituição inteligente** (`SmartSubstituteModal`) e **refeições alternativas** (`alternative_meals`) + itens de substituição.
- **Metas de macro** (proteína/carbo/gordura g/dia) + **calorias diárias** + **estratégia**.
- **Resumo nutricional** (totais das refeições principais) + **alertas de consistência** (`summarizeWorkspaceMealPlan`).
- **Metas de kcal por refeição** (`getMealCalorieTargets` distribui a kcal diária entre as refeições).
- **Reordenar refeições** (↑/↓), adicionar/remover refeição; 6 refeições padrão com horários.
- **Exportar PDF** (rico, com opções de alternativas/substituições) e **iniciar a partir de um modelo** (`?templateId=`).
- **Gravação atômica** via RPC `save_workspace_meal_plan` (transacional, com escopo de workspace).

> **Implicação:** aqui a oportunidade é de **workflow/produtividade e automação**, não de "básico faltando".
> Os maiores ganhos são **reaproveitamento** (duplicar/copiar/modelos) e **tirar digitação** (puxar metas da antropometria, autosave).

## 1. Onde o nutri perde tempo hoje

- **Não dá pra reaproveitar um plano**: montou um ótimo plano pro paciente A e quer um parecido pro B → tem que montar do zero. Não há **duplicar plano** nem **copiar de outro paciente** (existe pra treino e laudos, **não** pra dieta).
- **Não dá pra salvar o plano atual como modelo**: `workspaceTemplates.ts` só **lê** modelos (`fetchWorkspaceTemplates`/`...ById`); não há criar. Então o nutri só *consome* modelos — nunca transforma um bom plano em modelo reutilizável pelo SaaS.
- **Refeição ≈ refeição**: almoço e jantar quase iguais → redigita tudo. Não há **duplicar refeição** nem **copiar alimento**.
- **Salvar é manual** (medo de perder): o RPC já aceita `source:"autosave"`, mas a página só grava no botão "Salvar".
- **Metas digitadas à mão**: `daily_calories` e metas de macro são campos vazios, mesmo havendo antropometria/GET do paciente (`measurement_id`, `get_kcal`).
- **Aderência não é visual**: mostra totais crus + alertas, mas não "meta vs atual" por macro/kcal — difícil bater o olho e ver se o plano fecha a meta.

## 2. Melhorias — MENOS CLIQUES (prioridade alta)

Mapeadas a `WorkspaceMealPlanEditor.tsx`, `WorkspaceMealPlanPage.tsx` e `workspaceMealPlans.ts`:

- **D1 · Duplicar plano / copiar de outro paciente** — igual ao que fizemos no treino (O1). *Maior ganho.* Reusa o RPC `save_workspace_meal_plan` (sem schema novo). Inclui "copiar ficha de dieta do paciente X".
- **D2 · Duplicar refeição e copiar alimento** — "duplicar almoço → vira base do jantar"; copiar uma linha de alimento. Puramente no estado do editor (sem backend).
- **D3 · Autosave** — debounce gravando com `source:"autosave"` (já suportado no RPC). Feedback "salvo às HH:MM". Tira o medo de perder + menos cliques.

## 3. Melhorias — MAIS OPÇÕES

- **O1 · Salvar plano atual como modelo** — fecha o ciclo "montei um bom plano → reutilizo". Precisa de `createWorkspaceTemplate` (a tabela de templates já existe; hoje só há leitura).
- **O2 · Lista de substituição/equivalentes explícita por alimento** (exchange list) — já há `SmartSubstitute` e refeições alternativas; falta a "lista de equivalentes" clássica por alimento, visível no PDF do paciente. *(parcial)*
- **O3 · Receitas reutilizáveis** — padrão Dietbox/Nutrium: uma "receita" (conjunto de alimentos + rendimento) inserível como item do cardápio. Hoje só alimentos soltos. *Feature maior (schema).*
- **O4 · Lista de compras** gerada do plano (agrega alimento × quantidade por período) — padrão Eat This Much; extensão natural do PDF.
- **O5 · Prescrição de suplementos** — section dedicada (Dietbox expõe isso). *Nice-to-have.*

## 4. Inteligência / automação (diferencial com base já existente)

- **I1 · Distribuição automática de macros** — a partir de `daily_calories` + metas, sugerir metas por refeição (já há `getMealCalorieTargets` p/ kcal; estender p/ proteína/carbo/gordura) ou até sugerir porções. Mercado (Macrostax/HitMacros) vende "auto meal plan".
- **I2 · Puxar GET/metas da antropometria** — auto-preencher `daily_calories` e metas de macro a partir da última medição/GET do paciente. Campos (`measurement_id`, `get_kcal`) já existem; só falta ligar. *Menos digitação, menos erro.*
- **I3 · Aderência visual às metas** — barras "meta vs atual" por macro e por kcal no resumo (hoje só totais crus + alertas). Bate o olho se o plano fecha a meta.

## 5. Recomendação de sequência

1. **D1 (duplicar/copiar plano de dieta)** + **D2 (duplicar refeição/alimento)** — produtividade direta, reusa o RPC, **sem schema novo**. Espelha o que já validamos no treino.
2. **D3 (autosave)** + **I3 (barras de aderência)** — UX de alto impacto percebido, sem schema.
3. **O1 (salvar como modelo)** — precisa de `createWorkspaceTemplate` (tabela já existe).
4. **I2 (puxar GET da antropometria)** — integração; tira digitação e erro.
5. **O3 (receitas) / O4 (lista de compras) / I1 (auto-distribuição)** — features maiores; algumas com **migração** (passo de deploy seu, na ordem que combinamos).

Cada item vira uma leva de tarefas Haiku como nas fases anteriores; os que exigem coluna/tabela nova trago com a
migração e a ordem de deploy (SQL Editor).

## Fontes (referências de mercado)
- Dietbox — [Capterra](https://www.capterra.com/p/216141/Dietbox/) · [G2](https://www.g2.com/products/dietbox/discuss) (planos calculados/livres, antropometria+GET, receitas, suplementos, app do paciente)
- Nutrium — [produto](https://nutrium.com/product) · [SourceForge](https://sourceforge.net/software/product/Nutrium/) (análise dietética, base de nutrientes, gestão de receitas, etiquetas, faturamento)
- [Eat This Much](https://apps.apple.com/us/app/eat-this-much-meal-planner/id981637806) (receitas + lista de compras automática) · [Macrostax](https://apps.apple.com/us/app/macrostax-macro-meal-planner/id1568593622) / RP Diet (auto macro) · Exchange Diet (lista de substituição por grupo)
