# Tela de Pacientes (Workspace) — Estudo de Melhorias

**Data:** 2026-11-24 · **Arquivo:** `src/pages/workspace/WorkspacePatientsPage.tsx` (+ `src/lib/workspacePatients.ts`).
Objetivo: mais densidade clínica e agilidade. A tela já é sólida — foco em "quem precisa de atenção" e menos cliques.

## 0. Estado atual (não re-propor)

Já existe: busca (nome/contato/cidade), filtros (sexo, cidade), ordenação (nome / mais recentes), paginação (10/pág),
formulário **sticky** de criar/editar ao lado da lista, fluxo "usar modelo" (seleção de paciente), empty states,
dark mode. Cada linha mostra avatar, nome e `sexo · idade · cidade`, com ações **abrir prontuário** e **editar**.

## 1. Onde dá pra melhorar

- **Stats magros:** só duas métricas inline ("X com e-mail", "X novos este mês"). Pouco útil pra bater o olho.
- **Linha sem status clínico:** mostra sexo/idade/cidade, mas **não** mostra o que importa pra decidir ação —
  última consulta, se tem plano ativo, última avaliação/medição, pendência. O nutri não enxerga "quem está
  atrasado" sem abrir cada prontuário.
- **Formulário sempre ocupando 320px:** o cadastro fica fixo na lateral mesmo quando não se está cadastrando,
  comendo largura da lista. Padrão de mercado é **botão "Novo paciente" → drawer/modal**, lista em largura cheia.
- **Filtros só demográficos:** faltam filtros **clínicos/operacionais** (sem avaliação há 30d, com/sem plano,
  aniversariantes do mês).
- **Ações de linha limitadas:** só abrir/editar. Falta atalho pra **nova consulta / novo plano / WhatsApp**.
- **Ordenação limitada** (nome, recentes): falta "por última consulta" / "por pendência".
- **Sem exportar** a lista (CSV) nem **tags/segmentação** (objetivo, origem).
- **Contatos não acionáveis:** telefone/e-mail são texto; poderiam abrir WhatsApp/mailto.

## 2. Melhorias — prioridade

🔴 alta · 🟡 média · ⚪ nice-to-have

**Densidade / "quem precisa de atenção"**
- **P1 · Status clínico na linha** (🔴) — badge/linha extra por paciente: última consulta (data), tem plano ativo?,
  última avaliação / "sem avaliação há Nd". É o maior ganho pra operar a carteira. *Precisa de dados agregados
  (consultas/planos/medições por paciente) — queries novas, sem migração.*
- **P2 · Filtros clínicos** (🔴) — "sem avaliação 30d", "com plano" / "sem plano", "aniversariantes do mês".
  Reaproveita P1.
- **P3 · Stats em cards** (🟡) — total · novos mês · ativos 30d · pendentes (sem avaliação) · aniversariantes.
  Clicáveis, viram filtro.

**Agilidade / menos cliques**
- **A1 · "Novo paciente" em drawer/modal** (🟡) — libera a lista pra largura cheia; cadastro abre sob demanda.
  (Mantém criar/editar; muda só o container.)
- **A2 · Ações rápidas na linha** (🟡) — menu/botões: Nova consulta, Novo plano, WhatsApp (abre `wa.me`), Editar.
- **A3 · Contatos acionáveis** (⚪) — telefone → WhatsApp, e-mail → mailto.
- **A4 · Ordenar por última consulta / pendência** (🟡) — reaproveita P1.

**Organização / dados**
- **O1 · Exportar CSV** da lista filtrada (⚪).
- **O2 · Tags/segmentação** por paciente (objetivo, origem, convênio) + filtro por tag (⚪ — precisa de coluna/tabela = migração).

## 3. UI/UX de alto impacto

1. **Lista em largura cheia** com o cadastro em drawer (A1) — mais espaço pra P1 (status clínico).
2. **Badge de pendência** vermelho/âmbar na linha ("sem avaliação há 45d") — scaneável.
3. **Cabeçalho com stats-cards clicáveis** que viram filtro (P3 + P2).
4. **Ações rápidas** por linha (A2) — operar sem abrir o prontuário.
5. **Aniversariantes do mês** como filtro/atalho — toque clínico de relacionamento.

## 4. Sequência sugerida

1. **P1 (status clínico na linha)** + **P2 (filtros clínicos)** — maior valor; precisa de agregados por paciente
   (consultas/planos/medições). Sem migração. É a base de quase tudo.
2. **P3 (stats-cards clicáveis)** + **A4 (ordenar por pendência)** — reaproveita P1.
3. **A1 (cadastro em drawer)** + **A2/A3 (ações rápidas / contatos acionáveis)** — agilidade, sem backend.
4. **O1 (export CSV)**; **O2 (tags)** fica por último (migração).

Nada aqui exige migração, exceto O2 (tags). Os agregados de P1 são queries novas em `workspacePatients.ts`
(ou um RPC de resumo, se a performance pedir).

## Referências
- Padrões de lista/CRM clínico: linha com status + ações rápidas, filtros salvos, cadastro em drawer
  (Practice Better, Nutrium — ver estudo da dashboard `2026-11-24-dashboard-workspace-melhorias.md`).
