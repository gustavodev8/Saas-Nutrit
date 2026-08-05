# Memoria de Execucao - Bloco 1 (Arquitetura)

Contexto: sistema React + TypeScript + Supabase para nutricionista. A coordenacao de produto definiu o Bloco 1 com:

- mensagens prontas e follow-up operacional;
- questionario pre-consulta;
- tags e segmentos de pacientes;
- financeiro basico.

Objetivo desta memoria: definir a ordem tecnica, os pontos seguros de entrada e os limites para evitar acoplamento excessivo.

## 1. Ordem tecnica do Bloco 1

### 1.1. Comecar por estruturas reutilizaveis, nao pela tela mais pesada

Primeira camada:

- novos tipos/fetchers/helpers em [src/lib/supabase.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/supabase.ts)
- regras puras em `src/lib/` para segmentacao, resumo financeiro e templates
- testes pequenos dessas regras em `src/lib/*.test.ts` ou `src/test/`

Motivo:

- evita espalhar regra de negocio em `tsx`;
- deixa o Bloco 1 entrar em mais de uma tela sem duplicacao;
- reduz risco de regressao visual precoce.

### 1.2. Entregar primeiro o que encaixa na agenda

Ordem recomendada:

1. `questionario pre-consulta`
2. `mensagens prontas`
3. `tags e segmentos`
4. `financeiro basico`

Justificativa tecnica:

- [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx) ja esta parcialmente modularizado via `src/pages/admin/agendamentos/`;
- o questionario e as mensagens podem nascer perto do fluxo de consulta/agendamento sem depender de refatorar o prontuario inteiro;
- tags/segmentos dependem de consolidar sinais de pacientes e agendamentos;
- financeiro basico depende de leitura coerente de `bookings` + `payment_logs`, entao entra melhor depois que os outros contratos estiverem mais claros.

### 1.3. So depois encostar no prontuario pesado

Integracao final no prontuario:

- mostrar resumo da pre-consulta;
- sugerir acao operacional;
- exibir tags/segmentos relevantes.

Essa integracao deve acontecer por ultimo em [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx), porque hoje ele e o maior ponto de concentracao de estado e efeitos.

## 2. Arquivos e areas mais seguras para comecar

### 2.1. Agenda e seus modulos auxiliares

Ponto mais seguro:

- [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx)
- pasta [src/pages/admin/agendamentos](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/agendamentos)

Razao:

- a tela ja usa hooks e componentes extraidos como `useBookingFilters`, `useBookingRecords`, `BookingDashboardSummary`, `BookingFiltersBar`, `BookingDetailModal`;
- o bloco de agendamentos ja suporta crescimento incremental sem concentrar tudo no arquivo raiz.

Uso recomendado:

- questionario pre-consulta por agendamento;
- CTA de mensagem pronta a partir da sessao/paciente;
- sinalizacao operacional de retorno, no-show e pendencia.

### 2.2. Lista de pacientes

Bom ponto de entrada:

- [src/pages/admin/AdminPacientes.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPacientes.tsx)

Razao:

- ja existe conceito de filtros, indicadores operacionais e cards;
- tags e segmentos podem entrar aqui sem depender do prontuario detalhado;
- a tela ja consome `fetchPatientOperationalIndicators`, o que encaixa bem com a ideia de segmentos automaticos.

Uso recomendado:

- filtros por segmento;
- badges de tags;
- cards operacionais com contagem segmentada.

### 2.3. Checklist/onboarding existente

Base segura para reaproveitar:

- [src/components/admin/patient/PatientOnboardingChecklist.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/components/admin/patient/PatientOnboardingChecklist.tsx)
- [src/lib/patientOnboarding.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/patientOnboarding.ts)

Razao:

- ja existe modelagem de itens, progresso e acao contextual;
- o questionario pre-consulta pode seguir a mesma logica em vez de nascer como bloco isolado.

### 2.4. Pagamentos como origem de leitura, nao como centro de regra

Area segura para leitura:

- [src/pages/admin/AdminPagamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPagamentos.tsx)
- [src/lib/operationalLogs.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/operationalLogs.ts)

Uso recomendado:

- gerar resumo financeiro agregado;
- melhorar mensagem operacional de falha;
- reaproveitar eventos para auditoria leve.

## 3. Onde NAO concentrar mudanca

### 3.1. Nao abrir o Bloco 1 dentro de `AdminPaciente.tsx`

Arquivo critico:

- [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx)

Motivo:

- arquivo muito grande, com alto acoplamento entre tabs, fetches, formularios, uploads, PDF, medidas, exames e prontuario;
- qualquer feature nova ali tende a virar estado local extra, branching de render e callbacks cruzados;
- e o lugar mais facil para criar regressao silenciosa.

Regra pratica:

- `AdminPaciente.tsx` deve consumir componentes/hooks novos;
- ele nao deve ser o lugar onde a regra do Bloco 1 nasce.

### 3.2. Nao colocar regra de segmento espalhada em varias telas

Evitar:

- recalcular paciente inativo, sem retorno, sem plano ativo ou com exame pendente em cada pagina separadamente.

Lugar correto:

- helper unico em `src/lib/` consumido por [src/pages/admin/AdminPacientes.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPacientes.tsx), [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx) e [src/pages/admin/AdminDashboard.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminDashboard.tsx).

### 3.3. Nao transformar `src/lib/supabase.ts` em deposito desorganizado

Arquivo importante:

- [src/lib/supabase.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/supabase.ts)

Motivo:

- ele ja concentra muito acesso a dados;
- se o Bloco 1 entrar com funcoes sem agrupamento e sem nomes claros, a manutencao piora rapido.

Regra pratica:

- adicionar funcoes por dominio;
- manter tipos proximos das funcoes;
- se um subconjunto crescer demais, extrair depois para um arquivo dedicado.

## 4. Riscos de acoplamento

### 4.1. Acoplamento agenda <-> prontuario

Risco:

- salvar pre-consulta direto no mesmo estado do prontuario detalhado;
- depender de `AdminPaciente.tsx` para a agenda mostrar contexto.

Melhor caminho:

- agenda consulta um resumo proprio;
- prontuario apenas exibe/consome o mesmo dado por leitura compartilhada.

### 4.2. Acoplamento tags <-> filtros locais

Risco:

- implementar tags como mera decoracao visual em uma tela e como filtro real em outra.

Melhor caminho:

- definir um contrato unico de `tag manual` e `segmento automatico`;
- centralizar normalizacao e regras antes de chegar na UI.

### 4.3. Acoplamento financeiro <-> status visual

Risco:

- usar rótulos da UI como fonte de verdade do financeiro;
- misturar `payment_logs` com `bookings.payment_status` sem criterio.

Melhor caminho:

- definir explicitamente a fonte de cada numero;
- manter helper unico para resumo financeiro;
- documentar diferenca entre `receita registrada`, `receita recebida` e `consulta pendente`.

### 4.4. Acoplamento mensagens <-> canal de envio

Risco:

- modelar mensagem pronta ja assumindo automacao de WhatsApp, e-mail ou disparo em massa.

Melhor caminho:

- tratar Bloco 1 como `template + variaveis + contexto operacional + ultimo envio`;
- o canal pode evoluir depois.

## 5. Modularizacao leve recomendada

Objetivo: modularizar so o suficiente para permitir entrega sem reescrever o admin.

### 5.1. Criar utilitarios de dominio em `src/lib/`

Sugestao:

- `src/lib/patientSegments.ts`
- `src/lib/preConsultation.ts`
- `src/lib/messageTemplates.ts`
- `src/lib/financialSummary.ts`

Responsabilidade:

- tipos;
- normalizacao;
- regras puras;
- transformacao de dados para cards/resumos.

### 5.2. Criar componentes pequenos por superficie, nao mega-componentes

Sugestao:

- em `src/pages/admin/agendamentos/`:
  - `PreConsultationCard.tsx`
  - `MessageTemplatePicker.tsx`
- em `src/components/admin/patient/`:
  - `PatientTagsPanel.tsx`
  - `PatientSegmentsSummary.tsx`
- em `src/components/admin/`:
  - `FinancialSummaryCards.tsx`

### 5.3. Criar hooks so onde ja existe padrao de composicao

Melhores candidatos:

- `src/pages/admin/agendamentos/usePreConsultation.ts`
- `src/pages/admin/agendamentos/useMessageTemplates.ts`

Evitar por enquanto:

- abrir muitos hooks para `AdminPaciente.tsx` sem antes recortar a responsabilidade visual.

### 5.4. Entradas de integracao recomendadas

Ordem de encaixe:

1. `src/lib/`
2. `src/pages/admin/agendamentos/`
3. `src/pages/admin/AdminPacientes.tsx`
4. `src/pages/admin/AdminDashboard.tsx`
5. `src/pages/admin/AdminPaciente.tsx`

Essa ordem reduz risco porque o prontuario detalhado vira consumidor final, e nao ponto de partida.

## Resumo executivo

Se a execucao for disciplinada, a ordem tecnica do Bloco 1 deve ser:

1. criar regras e contratos em `src/lib/`;
2. plugar primeiro em agenda e lista de pacientes;
3. agregar financeiro por leitura;
4. so depois integrar no prontuario detalhado.

O principal limite arquitetural e simples:

- usar [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx) e [src/pages/admin/AdminPacientes.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPacientes.tsx) como portas de entrada;
- evitar concentrar a origem da mudanca em [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx).
