# Backlog de Execucao - Bloco 1

Contexto: backlog consolidado a partir de 2 coordenadores e 2 agentes de codigo.

Documentos de apoio:

- [ROADMAP_PRODUTO_SAAS_NUTRI.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/ROADMAP_PRODUTO_SAAS_NUTRI.md)
- [MEMORIA_PRODUTO_BLOCO_1_SAAS.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/MEMORIA_PRODUTO_BLOCO_1_SAAS.md)
- [MEMORIA_EXECUCAO_BLOCO_1_ARQUITETURA.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/MEMORIA_EXECUCAO_BLOCO_1_ARQUITETURA.md)

## Principio de execucao

Regra principal: as novas regras devem nascer em `src/lib/` e entrar primeiro em agenda e lista de pacientes. O prontuario pesado em [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx) deve consumir isso por ultimo.

## Onde comecar com mais seguranca

- [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx)
- [src/pages/admin/agendamentos](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/agendamentos)
- [src/pages/admin/AdminPacientes.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPacientes.tsx)
- [src/components/admin/patient/PatientOnboardingChecklist.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/components/admin/patient/PatientOnboardingChecklist.tsx)
- [src/lib/patientOnboarding.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/patientOnboarding.ts)

## Onde nao concentrar mudanca

- [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx)

Motivo:

- arquivo grande;
- muito estado local;
- muito efeito colateral;
- alto risco de regressao.

## Bloco 1A - Contratos e dados

Objetivo: definir tipagem, regras puras e contratos antes de espalhar comportamento na UI.

### Tarefas

1. Criar `src/lib/preConsultation.ts`
2. Criar `src/lib/operationalMessageTemplates.ts`
3. Criar `src/lib/patientSegments.ts`
4. Criar `src/lib/adminFinanceUtils.ts`
5. Adicionar testes unitarios para essas regras

### Observacoes

- pre-consulta pode nascer primeiro sem tabela nova, expandindo e tipando `bookings.notes`
- segmentos automaticos podem continuar derivados em codigo no MVP
- financeiro basico precisa helper proprio para nao misturar log bruto com UI

### Possiveis migrations do MVP

Se decidirmos persistir desde ja:

- `message_templates`
- `message_events`
- `patient_tags`
- `patient_tag_assignments`

Para financeiro confiavel, considerar evolucao de `payment_logs` com:

- `source_kind`
- `booking_group_id`
- `patient_id`
- `payment_method`

## Bloco 1B - Pre-consulta e mensagens

Objetivo: melhorar o fluxo antes e logo depois da consulta.

### Arquivos principais

- [src/pages/BookingPage.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/BookingPage.tsx)
- [src/pages/admin/AdminAgendamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminAgendamentos.tsx)
- [src/pages/admin/agendamentos/bookingPatientDetails.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/agendamentos/bookingPatientDetails.ts)
- [src/pages/admin/agendamentos/BookingPatientPanel.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/agendamentos/BookingPatientPanel.tsx)

### Componentes novos recomendados

- `src/components/admin/messages/QuickMessageActions.tsx`
- `src/components/admin/patient/PreConsultationSummaryCard.tsx`

### Entrega esperada

- BookingPage com campos de pre-consulta expandidos
- resumo de pre-consulta visivel no admin
- templates de mensagem prontos para copiar ou abrir no WhatsApp
- sem automacao pesada neste bloco

## Bloco 1C - Tags, segmentos e financeiro

Objetivo: deixar a base de pacientes mais acionavel e criar leitura simples do consultorio.

### Arquivos principais

- [src/pages/admin/AdminPacientes.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPacientes.tsx)
- [src/pages/admin/AdminPagamentos.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPagamentos.tsx)
- [src/pages/admin/AdminDashboard.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminDashboard.tsx)
- [src/lib/adminDashboardUtils.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/lib/adminDashboardUtils.ts)
- [supabase/functions/payment-webhook/index.ts](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/supabase/functions/payment-webhook/index.ts)

### Componentes novos recomendados

- `src/components/admin/patient/PatientTagsEditor.tsx`
- `src/components/admin/patient/PatientSegmentsBadges.tsx`
- `src/components/admin/FinancialSummaryCards.tsx`

### Entrega esperada

- tags manuais persistidas
- segmentos automaticos derivados em codigo
- filtros e badges na lista de pacientes
- AdminPagamentos evoluido de log para financeiro basico
- 1 ou 2 cards financeiros melhores no dashboard

## Ordem sugerida de commits

1. `feat: add pre-consultation contracts and tests`
2. `feat: expand booking pre-consultation and admin summary`
3. `feat: add operational message templates and quick actions`
4. `feat: add patient tags and automatic segments`
5. `feat: add basic clinic finance summary`

## Riscos a vigiar

- repetir regra de segmento em varias telas
- acoplar mensagens a um canal especifico cedo demais
- usar texto da UI como fonte de verdade do financeiro
- enterrar regra nova dentro de `AdminPaciente.tsx`

## Definicoes de MVP

### MVP de mensagens

- geracao rapida;
- copiar mensagem;
- abrir WhatsApp;
- registro simples de ultimo envio depois, se necessario.

### MVP de pre-consulta

- tipar melhor o que ja vai para `bookings.notes`;
- expandir campos faltantes;
- exibir resumo no admin;
- depois permitir aproveitar dados na anamnese.

### MVP de tags e segmentos

- persistir so tags manuais;
- segmentos automaticos derivados;
- usar isso em filtros e badges.

### MVP de financeiro

- receita recebida;
- pendencias;
- consultas concluidas;
- no-show;
- cancelamentos;
- ticket medio;
- recorte por periodo curto.

## Regra pratica de coordenacao

Se houver trabalho paralelo, dividir assim:

- frente agenda e pre-consulta
- frente mensagens
- frente pacientes e segmentos
- frente financeiro e testes

Mas a integracao deve continuar controlada para evitar tres agentes mexendo no mesmo [src/pages/admin/AdminPaciente.tsx](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/src/pages/admin/AdminPaciente.tsx) ao mesmo tempo.
