# Planos de Treino — Estudo de Melhorias (menos cliques, mais opções, agilidade)

**Data:** 2026-11-23 · **Objetivo:** enxergar melhorias no editor de treino do nutri — menos cliques,
mais opções e agilidade no dia a dia. Baseado em leitura do código + referências de apps de treino.

## 0. Descoberta estrutural (decidir antes de tudo): existem DOIS sistemas de treino

O projeto tem **duas implementações de treino paralelas e desconectadas**:

| | **Sistema A — Admin/Prontuário** | **Sistema B — Workspace/SaaS** |
|---|---|---|
| UI | `PatientTrainingTab.tsx` (1308 l.), wizard 4 etapas | `WorkspaceTrainingTab.tsx` (891 l.), form simples |
| Backend | `trainingPlans.ts` + `workoutLibrary.ts` | `workspaceTraining.ts` + `...Intelligence.ts` |
| Modelo | Plano → Versão → Sessões → Exercícios (versionado) | Plano → Exercícios (raso, "dia" é string livre) |
| Biblioteca/autocomplete | ✅ catálogo + autocomplete + prescrições favoritas + modelos | ❌ nada (nome digitado à mão) |
| Versionamento | ✅ draft/publicado, lineage, imutabilidade | ❌ edita no lugar |
| **Chega ao paciente?** | ✅ **alimenta o Portal** | ❌ **não aparece pro paciente** |
| Inteligência | — | ✅ contraindicações por anamnese, sugestão de objetivo, carga parada |

**Implicação:** o editor do **SaaS (B)** — que é o futuro do produto (multi-consultório) — é o **mais pobre** e
**não publica nada pro paciente**. O **portal lê só o Sistema A**. Ou seja: melhorar a UX do B sem resolver isso
entrega velocidade pro nutri, mas o treino ainda não chega ao paciente pelo SaaS.

> **Decisão estratégica (sua):** (a) focar só em agilidade no editor B agora e tratar o portal depois; ou
> (b) já incluir "publicar no portal" como parte do trabalho; ou (c) convergir B para reusar a riqueza do A
> (catálogo/autocomplete/modelos). Minha recomendação: **ganhos de clique no B agora** (itens U1–U5), e tratar
> "conectar ao portal" como a fase seguinte (é maior).

## 1. Onde o nutri perde tempo hoje (editor Workspace / Sistema B)

Montar uma ficha de 9 exercícios hoje = **9 ciclos completos** de abrir form → digitar nome à mão → salvar →
*refetch da lista inteira* → form fecha. Detalhado:
- **Nome do exercício 100% manual** — sem autocomplete, sem catálogo (`WorkspaceTrainingTab.tsx` `ExerciseForm`).
- **Sem "salvar e adicionar outro"**: `handleAddExercise` (linha ~377) salva, faz `loadExercises()` (refetch) e fecha o form.
- **Sem edição inline** de séries/reps/carga: tem que reabrir o form pelo lápis (`editingExId`).
- **Sem reordenar**: a coluna `position` existe (setada na inserção), mas **não há UI** para mover.
- **"Dia" é string livre por exercício** (`day_label`): dois "A" com espaço diferente viram grupos distintos (agrupamento em memória, ~linha 409).
- Excluir exercício é **imediato, sem confirmação**.

## 2. Melhorias — MENOS CLIQUES (prioridade alta, foco do pedido)

Mapeadas ao editor Workspace (`WorkspaceTrainingTab.tsx` + `workspaceTraining.ts`):

- **U1 · Autocomplete + biblioteca de exercícios.** Reusar o catálogo do Sistema A (`workout_exercise_catalog` + `ExerciseAutocomplete.tsx`) no editor B. Fim da digitação manual. *Maior ganho diário.*
- **U2 · "Salvar e adicionar outro" + não fechar o form + sem refetch total.** Form permanece, foco volta ao nome, novo exercício é *anexado* ao estado (não refaz o fetch). Montar ficha vira fluxo contínuo.
- **U3 · Edição inline** de séries/reps/carga/descanso direto na linha da lista (como o Sistema A já faz), sem reabrir form.
- **U4 · Reordenar exercícios** (botões ↑/↓ reusando a coluna `position`; drag-and-drop como extra).
- **U5 · Atalhos de séries×reps** (3×10, 3×12, 4×10, 4×12) com 1 clique — o Sistema A já tem `applySetRepShortcut`.

## 3. Melhorias — MAIS OPÇÕES

- **O1 · Duplicar** plano / dia / exercício, e **copiar ficha de outro paciente** (hoje inexiste no B).
- **O2 · Modelos editáveis e reutilizáveis** (hoje são 6 fixos no código em `TRAINING_TEMPLATES`): "salvar ficha como modelo" e reaplicar.
- **O3 · Campos que faltam por exercício:** RPE, tempo/cadência, **vídeo/mídia** (o A tem `demo_url`, o B não), e **superset/agrupamento** (padrão de mercado — Exercise.com, 1FIT).
- **O4 · Gestão de "dias/divisões" como entidade** (criar/renomear/reordenar dias), em vez de string livre por exercício.
- **O5 · Exportar PDF / compartilhar** a ficha.

## 4. Inteligência / progressão (diferencial que já tem base)

A "inteligência" (`workspaceTrainingIntelligence.ts`) já faz contraindicação por anamnese, sugestão de objetivo e
**detecta carga parada há +28 dias** (badge "Atualizar carga"). Falta fechar o ciclo:
- **I1 · Progressão automática de verdade:** do badge "carga parada", um botão **"aplicar +2,5 kg"** (ou % configurável) com 1 clique — hoje só *sinaliza*, não aplica. Mercado (Everfit) vende "auto progression" e treino por %.
- **I2 · Puxar objetivo sugerido** da anamnese direto pro form (já é calculado, só exibir/aplicar).

## 5. Recomendação de sequência

1. **Cluster "menos cliques" no editor B:** U2 (salvar-e-continuar, sem refetch) → U3 (inline) → U4 (reordenar) → U5 (atalhos). Baixo risco, alto ganho diário, sem schema novo.
2. **U1 (autocomplete/biblioteca)** — maior ganho, mas envolve reusar tabelas do Sistema A (um pouco mais de integração).
3. **O1/O2 (duplicar, copiar de paciente, modelos editáveis)** — produtividade.
4. **O3 (RPE/tempo/mídia/superset)** e **I1 (progressão 1-clique)** — precisam de colunas novas → **migração** (passo de deploy seu).
5. **Estratégico:** conectar o editor B ao portal (publicação) — fase à parte, maior.

Cada item vira uma leva de tarefas Haiku como nas fases anteriores; os que exigem coluna nova trago com a migração
e a ordem de deploy (SQL Editor, como combinamos).

## Fontes (referências de UX de mercado)
- [Exercise.com — supersets](https://exercise.com/platform/supersets) · [workout plan creator](https://www.exercise.com/platform/workout-plan-creator/)
- [Everfit — auto progression / templates](https://everfit.io/training/)
- [1FIT — training plan builder](https://1fit.com/platform/templates/training-plan/)
- [Movement — drag-and-drop builder](https://movement.so/features/workout-builder)
