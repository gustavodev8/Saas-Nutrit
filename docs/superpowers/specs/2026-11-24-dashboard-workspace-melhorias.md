# Dashboard do Workspace — Estudo de Melhorias (menos espaço vazio, mais organização)

**Data:** 2026-11-24 · **Contexto:** a home da área clínica (`WorkspaceDashboardPage.tsx`) "está com muito
espaço vazio em branco e desorganizada", principalmente para quem tem pouco dado (poucos pacientes/consultas).
Baseado em leitura do código + referências de dashboards clínicos (Nutrium, Practice Better).

## 0. Aviso de coordenação (ler antes de implementar)

Agora há mudanças **não-commitadas de outra sessão (Codex)** em arquivos ligados à home: `WorkspaceShell.tsx`,
`WorkspaceOnboarding.tsx`, `WorkspaceConsultasTab.tsx`, entre outros (por isso o print mostra o onboarding no
topo, enquanto no código `WorkspaceDashboardPage.tsx` ele está no fim). **Implementar o redesenho da dashboard
agora pode conflitar** com esse trabalho. Recomendação: alinhar/aguardar o commit da outra sessão (ou isolar em
branch própria) antes de mexer em `WorkspaceDashboardPage.tsx` / shell / onboarding.

## 1. Diagnóstico — por que parece vazia e desorganizada

Estrutura atual (ordem no código): saudação → 4 KPIs → alerta (inativos) → acesso rápido (3 links) →
grid de 2 colunas (Últimas consultas | Pacientes recentes) → empty state → onboarding.

Problemas:
- **Buraco no grid de 2 colunas.** "Últimas consultas" só aparece se houver consultas; "Pacientes recentes" só se
  houver pacientes. Com pouco dado (ex.: 1 paciente, 0 consultas), **uma coluna some e a outra fica sozinha** —
  é a origem do grande vazio à direita/esquerda.
- **KPIs quase todos zerados** no começo (0 consultas, 0 ativos) — ocupam espaço sem informar.
- **Sem foco no "hoje".** Falta o que o mercado põe no centro: próximos atendimentos/retornos do dia. O dado de
  consultas já é buscado (`fetchRecentConsultations`), mas só as *recentes*, não as *próximas*.
- **Alerta passivo.** "X pacientes sem avaliação" é um aviso solto; não vira lista de ação (quem são, 1 clique
  pra agir).
- **Ações são navegação, não criação.** "Acesso rápido" leva a páginas; falta o atalho de **criar** (novo
  paciente / novo plano / nova consulta) direto da home.
- **Hierarquia difusa.** Saudação, KPIs, alerta, acesso rápido, recentes e onboarding competem no mesmo peso,
  sem agrupar "panorama" vs "o que fazer agora" vs "atalhos".

## 2. Reorganização proposta (IA + layout que não deixa buraco)

Trocar o grid frágil por um layout que **sempre preenche**, agrupado por intenção:

```
┌ Saudação + Ações rápidas  [Novo paciente] [Novo plano] [Nova consulta] ┐
├────────────────────────────────────────────────────────────────────────┤
│ KPIs (4) — clicáveis, com tendência (ex.: "+1 vs mês passado")           │
├──────────────────────────────┬───────────────────────────────────────────┤
│ COLUNA A — "O que fazer agora"│ COLUNA B — "Atividade recente"            │
│  • Hoje & próximos (agenda)   │  • Feed unificado: pacientes novos +      │
│  • Pendências (retornos,      │    consultas recentes, por data           │
│    planos a revisar)          │  • Fallback útil quando vazio             │
├──────────────────────────────┴───────────────────────────────────────────┤
│ Onboarding (enquanto incompleto) · Acesso rápido (secundário)            │
└──────────────────────────────────────────────────────────────────────────┘
```

Regras que matam o vazio:
- **Unificar "Pacientes recentes" + "Últimas consultas"** num só feed "Atividade recente" (uma coluna só) —
  elimina a coluna que colapsa.
- **Coluna A sempre tem conteúdo:** se não há pendências, mostra estado positivo ("Tudo em dia ✓"); se não há
  próximos atendimentos, mostra CTA ("Agende o primeiro retorno").
- **Cada card vazio vira CTA** em vez de sumir (empty state *dentro* do card, não seção ausente).

## 3. Preencher o vazio com conteúdo ÚTIL (prioridade alta)

- **D1 · Hoje & próximos atendimentos** (🔴) — lista dos próximos retornos/consultas (precisa de um
  `fetchUpcomingConsultations`; o backend de consultas já existe). É o coração do dashboard clínico.
- **D2 · Pendências acionáveis** (🔴) — transformar o alerta em lista: "N pacientes sem avaliação há +30d" →
  mostra os nomes (reusa `measurements`/`inactiveCount`) com link direto; incluir "planos sem atualização".
- **D3 · Ações rápidas de CRIAÇÃO** (🔴) — botões "Novo paciente / Novo plano / Nova consulta" no topo.
- **D4 · Feed de atividade recente unificado** (🟡) — pacientes novos + consultas num só fluxo por data.
- **D5 · Onboarding compacto no topo enquanto incompleto** (🟡) — alinhar com a outra sessão (já está mexendo
  nisso); colapsar quando 3/3.

## 4. KPIs melhores

- **K1 · KPIs clicáveis** (🟡) — cada card leva à lista filtrada (ex.: "Ativos 30 dias" → pacientes avaliados).
- **K2 · Tendência** (🟡) — "Novos este mês" com comparação ao mês anterior (seta +/−); sparkline simples.
- **K3 · KPI de receita/assinatura** (⚪) — amarrar ao trial/billing ("28 dias restantes" já existe no topo).

## 5. UI/UX de alto impacto

1. **Densidade progressiva:** conteúdo que serve mesmo com 0 dado (dicas, próximos passos, CTAs) em vez de
   seções que somem.
2. **Empty state dentro do card** (não seção ausente) — mantém a grade preenchida.
3. **Saudação com contexto do dia** ("Você tem N atendimentos hoje") em vez de genérica.
4. **Agrupar por intenção** (panorama / agir agora / atalhos) com cabeçalhos leves.
5. **Largura e respiro:** hoje usa `max-w-7xl`; com pouco conteúdo, considerar `max-w-5xl` + colunas que
   reflow pra 1 no mobile (já responsivo, mas o buraco é lógico, não de breakpoint).
6. **Ações de criação > navegação** no topo.

## 6. Sequência sugerida

1. **Reorganização sem backend novo** (unificar recentes num feed, empty-state-dentro-do-card, ações de criação,
   KPIs clicáveis) — resolve a maior parte do "vazio/desorganizado", baixo risco. *Depende de coordenar com a
   sessão que mexe no shell/onboarding.*
2. **Hoje & próximos atendimentos** (D1) — precisa de `fetchUpcomingConsultations` (sem migração; só query).
3. **Pendências acionáveis** (D2) e **tendência nos KPIs** (K2).
4. **KPI de assinatura/receita** (K3) — amarra ao billing.

Cada item vira uma leva de tarefas Haiku; nada aqui exige migração (as tabelas de pacientes/consultas/medições
já existem).

## Fontes (referências de mercado)
- Nutrium — dashboard como hub de agenda, próximos atendimentos e notificações ([comparativo](https://casadesante.com/blogs/dietitian-resources/nutrium-vs-practice-better), [perfil](https://www.softwareadvice.com/nutrition-analysis/nutrium-profile/))
- Practice Better — visão "at-a-glance" de agenda e atendimentos do cliente ([nutricionistas](https://practicebetter.io/who-we-serve/nutritionists), [features G2](https://www.g2.com/products/practice-better/features))
