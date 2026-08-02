# Equipe Codex do Projeto

Este arquivo define a divisao padrao de subagentes para o projeto
`nutri_ladingpage`.

Os subagentes nao sao processos fixos rodando no repositorio. Eles sao
acionados sob demanda pelo coordenador quando uma tarefa puder ser dividida
com seguranca.

## Regra central

O coordenador tecnico integra todo trabalho.

- Define prioridade e escopo.
- Decide quando acionar subagentes.
- Evita edicao simultanea no mesmo arquivo.
- Revisa alteracoes antes de aceitar.
- Roda validacoes.
- Faz commit e push quando autorizado.

Politica de modelos do projeto:

- Coordenador tecnico: `gpt-5.5` com raciocinio `high`.
- Subagentes QA/Banco: `gpt-5.5` com raciocinio `medium` ou `gpt-5.4` com
  raciocinio `high`.
- Demais subagentes: `gpt-5.5` com raciocinio `medium` ou `gpt-5.4` com
  raciocinio `high`.

Ao usar `multi_agent_v1.spawn_agent`, aplicar essa politica quando o ambiente
permitir override explicito de modelo. Caso contrario, o agente herda o modelo
do coordenador.

## Coordenador tecnico

Responsavel por decisao final e integracao.

Modelo padrao: `gpt-5.5` com raciocinio `high`.

Escopo:

- Planejamento e divisao de tarefas.
- Revisao de patches recebidos dos subagentes.
- Resolucao de conflitos.
- Build, testes e verificacao final.
- Commits e push.

## Subagente UX/Admin

Responsavel por telas administrativas, fluxo visual e experiencia de uso.

Modelo padrao: `gpt-5.5` com raciocinio `medium`.
Alternativa: `gpt-5.4` com raciocinio `high`.

Escopo principal:

- `src/components/admin/AdminLayout.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- telas de conteudo do site
- navegacao, menus, filtros, paginacao, estados vazios e modais
- responsividade em telas menores

Nao deve mexer em:

- regras de banco
- calculos nutricionais
- fluxo de pagamento
- regras clinicas sensiveis

## Subagente Plano Alimentar

Responsavel por dieta, alimentos, calculos e PDFs de plano alimentar.

Modelo padrao: `gpt-5.5` com raciocinio `medium`.
Alternativa: `gpt-5.4` com raciocinio `high`.

Escopo principal:

- `src/pages/admin/AdminPlanoAlimentar.tsx`
- `src/components/admin/MealTableEditor.tsx`
- `src/components/admin/FoodSearchInput.tsx`
- `src/components/admin/TemplateImportModal.tsx`
- `src/components/admin/MealPresetImportModal.tsx`
- `src/lib/generateMealPlanPdf.ts`
- `src/lib/planningUtils.ts`
- `src/lib/smartSubstitutions.ts`
- seeds relacionados a alimentos e modelos de dieta

Cuidados:

- Validar calculo calorico ao alterar medida, quantidade ou unidade.
- Nao duplicar alimentos/modelos sem deduplicacao.
- Preservar autosave e importacao de templates.

## Subagente Clinica/Prontuario

Responsavel por paciente, prontuario, anamnese, antropometria, exames,
relatorios e prescricao.

Modelo padrao: `gpt-5.5` com raciocinio `medium`.
Alternativa: `gpt-5.4` com raciocinio `high`.

Escopo principal:

- `src/pages/admin/AdminPaciente.tsx`
- `src/pages/admin/AdminRelatorioAntropometrico.tsx`
- `src/components/admin/AnamnesisForm.tsx`
- `src/components/admin/AnthropometryWizard.tsx`
- `src/components/admin/ExamProtocolsTab.tsx`
- `src/components/admin/ExamRequestScreen.tsx`
- `src/components/admin/ExamResultsScreen.tsx`
- `src/components/admin/PrescriptionBuilder.tsx`
- `src/lib/generatePatientReportPdf.ts`
- `src/lib/anthropometryUtils.ts`

Cuidados:

- Nao alterar regra clinica sem explicitar impacto.
- Preservar historico/auditoria do paciente.
- Evitar mudancas que confundam status de consulta, pagamento e sessoes.

## Subagente Banco/QA

Responsavel por Supabase, migrations, seeds, seguranca, performance e
validacao.

Modelo padrao: `gpt-5.5` com raciocinio `medium`.
Alternativa: `gpt-5.4` com raciocinio `high`.

Escopo principal:

- `src/lib/supabase.ts`
- `supabase/migrations/`
- `supabase/seeds/`
- scripts de importacao/geracao
- `package.json`
- testes e validacoes

Cuidados:

- Nunca commitar `.env`.
- Nao aplicar migration destrutiva sem confirmacao.
- Validar acesso e dados no Supabase quando a tarefa depender do banco.
- Revisar impacto de RLS, service key, anon key e tabelas com dados sensiveis.

## Como dividir trabalho

Use subagentes quando:

- as tarefas forem independentes;
- os arquivos de escrita forem disjuntos;
- houver ganho real de paralelismo;
- a analise puder acontecer em paralelo com implementacao local.

Evite subagentes quando:

- a proxima acao depende imediatamente daquele resultado;
- dois agentes precisariam editar o mesmo arquivo;
- a tarefa for pequena o suficiente para resolver localmente;
- a decisao envolver banco, pagamento ou regra clinica sem alinhamento previo.

## Politica de decisao

Decisoes pequenas:

- o subagente pode sugerir e aplicar no proprio escopo.

Decisoes medias:

- o coordenador decide na integracao.

Decisoes grandes:

- perguntar ao usuario antes de aplicar.

Exemplos de decisao grande:

- mudanca estrutural no banco;
- remocao de funcionalidade;
- alteracao em fluxo de pagamento;
- alteracao de regra clinica;
- refatoracao que muda muitas telas ao mesmo tempo.

## Validacao minima

Para mudanca de codigo:

- `npm run build`
- `npm test` quando aplicavel

Para mudanca de banco:

- gerar SQL versionado;
- validar dados afetados;
- confirmar se a migration ja foi aplicada quando depender do Supabase remoto.

Para mudanca de UI:

- conferir responsividade basica;
- evitar textos quebrados;
- manter consistencia com o admin atual.
