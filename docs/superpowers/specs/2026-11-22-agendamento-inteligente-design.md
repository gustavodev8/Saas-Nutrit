# Agendamento Inteligente — Design + Plano de Execução

**Data:** 2026-11-22
**Autor/arquiteto:** orquestração (Opus) · execução delegada a agentes Haiku
**Escopo escolhido:** Caminho C (endurecer o core → redesenhar a UI por cima)
**Foco priorizado pelo dono:** (1) converter mais pacientes no link público · (2) robustez/base técnica

---

## 1. Intenção e porquê

O agendamento online já funciona ponta a ponta (serviço → data → hora → dados → PIX → sucesso),
mas está **abaixo do padrão de mercado** (Calendly / Cal.com / Doctoralia) em dois eixos que o dono
quer atacar: a **experiência do paciente que fecha pelo link** (conversão) e a **confiabilidade
técnica** da base (datas, corrida de duplo-agendamento, slot preso, LGPD).

A meta não é adicionar features soltas e sim deixar o fluxo **lógico, enxuto e correto**: o motor de
slots não pode errar data por fuso nem travar horário à toa, e a tela do paciente precisa ter menos
fricção e um calendário de verdade.

## 2. Estado atual (resumo factual)

- Página pública: `src/pages/WorkspacePublicBookingPage.tsx` (fluxo de 5 passos).
- Motor de slots: `src/lib/workspaceBookings.ts` → `generateTimeSlots()` (duração, buffer, antecedência,
  intervalo, conflito por sobreposição). Já tem testes vizinhos em `src/lib/__tests__/`.
- Config do nutri: `src/components/workspace/WorkspaceBookingSettingsTab.tsx`
  (serviços, **um único intervalo por dia**, PIX, regras, datas bloqueadas).
- Pagamento: edge function `supabase/functions/create-workspace-booking-payment/index.ts` (MP PIX, taxa 5%).
- Confirmação de pagamento: polling no front + `payment-webhook`.

### Problemas confirmados por leitura
1. **Fuso horário:** `toISO()` usa `toISOString()` (UTC). Em UTC-3, perto da meia-noite a data pode pular um dia.
2. **Duplo-agendamento:** conflito é *check-then-insert* na edge function → janela de corrida (TOCTOU). Sem
   constraint/RPC atômico. Migrações `*atomic_bridge_candidate.sql` e `*booking_uniqueness_candidate.sql` existem
   mas são "candidate" (não confirmado aplicado).
3. **Slot pendente eterno:** `pending_payment` entra nos horários ocupados e nunca expira → pagamento abandonado
   trava o horário.
4. **Sem LGPD:** coleta nome/e-mail/telefone sem consentimento explícito.
5. **UX do calendário:** lista de dias agrupada por mês, não grade navegável; sem "próximo horário livre".
6. **Bug menor:** ícone `Copy` usado em `WorkspacePublicBookingPage.tsx` sem import (passo de pagamento).

## 3. Metas, não-metas, anti-metas

**Metas (esta rodada)**
- Core de datas timezone-safe e testado.
- Slot pendente com expiração (TTL) → horários abandonados voltam a ficar livres.
- Trava atômica real contra duplo-agendamento.
- Consentimento LGPD no fluxo público.
- Calendário em grade de mês navegável + "próximo horário disponível".
- Menos fricção no fluxo + capricho mobile.
- Adicionar ao calendário (.ics / Google) na confirmação.

**Não-metas (esta rodada — recomendadas para a próxima)**
- Automação de lembretes WhatsApp/e-mail (o dono tirou "cortar no-show" do foco principal).
- Otimização da agenda do nutri: **múltiplos intervalos por dia (manhã/tarde)**, limites por dia, folgas parciais.
  > ⚠️ Recomendação do arquiteto: múltiplos intervalos/dia é o maior gargalo de oferta de horários e vale
  > priorizar logo na próxima rodada, pois também afeta conversão.
- Self-service de cancelar/remarcar pelo paciente (tangencia no-show).
- Troca de provedor de pagamento.

**Anti-metas (fracasso mesmo "funcionando")**
- Qualquer regressão no admin, no webhook de pagamento ou no repasse PIX.
- Quebrar a RLS pública (anon só lê o que já lê hoje).
- Introduzir `any`, CSS inline ou editar `src/components/ui/`.

## 4. Restrições (do projeto)

- React 18 + TS estrito (sem `any`), Tailwind only, lucide-react, shadcn/ui intocável.
- Supabase (RLS); mudanças de banco via **migração nova** (nunca editar migração aplicada).
- Testes com **vitest** (`npx vitest run <arquivo>`); build com `npm run build`.
- Protocolo do repo: toda implementação é seguida de **QA read-only independente** (achado → volta ao implementador
  até PASS). Atualizar `CONTINUIDADE-CODEX.md` ao fim.
- Não publicar função que dependa de migração ainda não aplicada.

## 5. Abordagens consideradas

- **A — Polir incremental** sobre o fluxo atual. Baixo risco, tarefas pequenas, teto de ambição menor.
- **B — Reconstruir motor "smart" novo** (tela única, reserva com TTL nativa). Ambicioso, raio de impacto grande,
  tarefas grandes demais para agente pequeno, risco de regressão alto.
- **C — Híbrido (ESCOLHIDA):** Fase 1 endurece o core (datas/atomicidade/TTL/LGPD); Fase 2 reconstrói a UI de
  conversão sobre a base já correta. Decompõe em fila de tarefas curtas, independentes e com teste — ideal para Haiku.

**Decisão:** C. Não se otimiza conversão sobre um motor que erra data por fuso; corrigir a base primeiro reduz
retrabalho e regressão.

---

## 6. Plano de execução para agentes Haiku

Cada tarefa é **autocontida**: arquivos exatos, mudança, critério de aceite e teste obrigatório.
Contrato de cada agente Haiku:
1. Ler só os arquivos listados na tarefa.
2. Implementar a mudança mínima que satisfaz o aceite.
3. Escrever/atualizar o teste vitest indicado.
4. Rodar `npx vitest run <arquivo_de_teste>` e `npm run build` — ambos verdes.
5. Não tocar em arquivo fora do escopo da tarefa; não commitar; relatar diff + saída dos comandos.
Depois de cada tarefa, um **QA Haiku read-only** verifica o aceite e aponta achados (arquivo/linha/severidade).

### Regra de paralelismo (evita conflito de merge)
- `WorkspacePublicBookingPage.tsx` é tocado por várias tarefas → **essas rodam em série, um escritor por vez.**
- Tarefas de **backend** (edge function, migração) podem rodar **em paralelo** com as de front.

### FASE 1 — Robustez / base

**F1-1 · Core de datas timezone-safe** *(pré-requisito de F1-2, F2-1, F2-2, F2-5)*
- Arquivos: criar `src/lib/bookingDates.ts` (`toISODate(d: Date): string` local, `parseISODate`, `isPast`);
  substituir em `WorkspacePublicBookingPage.tsx` todo uso de `toISOString().slice(0,10)` por `toISODate`.
- Aceite: data selecionada = data gravada; sem off-by-one em UTC-3 à meia-noite; rejeição de data passada correta.
- Teste: `src/lib/bookingDates.test.ts` (meia-noite, viradas de mês, data passada/hoje/futura).

**F1-2 · Expiração de slot pendente (TTL)** *(backend; paralelo ao front)*
- Arquivos: `src/lib/workspaceBookings.ts` (`fetchBookedSlots`) e
  `supabase/functions/create-workspace-booking-payment/index.ts` (query de conflito) — excluir
  `pending_payment` com `created_at < now() - INTERVAL '15 min'`. Migração nova adicionando índice
  `(workspace_id, booking_date, status)` e (opcional) job/SQL que marca pendentes vencidos como `cancelled`.
- Aceite: pendente abandonado > 15 min libera o horário; `paid`/`confirmed`/`completed` nunca liberam.
- Teste: unidade sobre a função de filtro (pendente novo bloqueia, pendente vencido não; pago sempre bloqueia).

**F1-3 · Trava atômica de duplo-agendamento** *(backend; paralelo ao front)*
- Arquivos: revisar `supabase/migrations/*atomic_bridge_candidate.sql` e `*booking_uniqueness_candidate.sql`;
  autorizar **RPC `SECURITY DEFINER`** que faz conflito+insert em uma transação (ou constraint de exclusão por
  sobreposição). `create-workspace-booking-payment/index.ts` passa a chamar a RPC em vez de check-then-insert.
- Aceite: duas reservas concorrentes sobre horários sobrepostos → exatamente uma cria, a outra recebe 409.
- Teste: nota de integração + unidade sobre o contrato da RPC (entrada/saída, erro de conflito).

**F1-4 · Consentimento LGPD** *(front; série com os outros editores da página)*
- Arquivos: `WorkspacePublicBookingPage.tsx` (passo "info") — checkbox obrigatório + texto curto de privacidade;
  persistir `consent_at` no booking (adicionar coluna via migração se não existir; senão omitir persistência e só
  bloquear envio).
- Aceite: botão "Pagar" desabilitado até marcar o consentimento; se persistido, `consent_at` gravado.
- Teste: componente — pagar bloqueado sem consentimento.

### FASE 2 — Conversão / UI (depende de F1-1)

**F2-1 · Calendário em grade de mês navegável**
- Arquivos: novo util `src/lib/bookingCalendar.ts` (`buildMonthMatrix`, dias habilitados) +
  `WorkspacePublicBookingPage.tsx` troca a lista por grade com ‹ › de mês, dias indisponíveis esmaecidos,
  respeitando `max_advance_days` e datas bloqueadas.
- Aceite: navega entre meses dentro da janela; só dias com disponibilidade são clicáveis; sem erro de fuso.
- Teste: `src/lib/bookingCalendar.test.ts` (matriz do mês, offset do 1º dia, conjunto de dias desabilitados).

**F2-2 · "Próximo horário disponível"** *(reusa util de F2-1)*
- Arquivos: `src/lib/bookingCalendar.ts` (`findNextAvailableSlot`) + chip na página que, ao tocar, seleciona a data
  e o horário livre mais próximos (respeitando antecedência/buffer/intervalo).
- Aceite: toque seleciona o primeiro slot real livre futuro; nada livre → chip some.
- Teste: unidade de `findNextAvailableSlot` (hoje cheio → amanhã; tudo cheio → null).

**F2-3 · Menos fricção no fluxo**
- Arquivos: `WorkspacePublicBookingPage.tsx` — resumo fixo (serviço/data/hora/preço) visível nos passos; CTA e
  preço mais claros; **corrigir o import faltante de `Copy`**; telefone/WhatsApp como recomendado (para confirmação).
- Aceite: menos toques até pagar; resumo sempre visível; zero erro no console.
- Teste: componente/smoke do fluxo até o passo de pagamento.

**F2-4 · Capricho mobile**
- Arquivos: `WorkspacePublicBookingPage.tsx` — grade e slots sem overflow a 375px, alvos de toque ≥ 44px,
  indicador de passos compacto.
- Aceite: sem scroll horizontal a 375px; alvos adequados.
- Teste: e2e Playwright (já há `e2e/` + `playwright.config.ts`) ou checagem manual documentada.

**F2-5 · Adicionar ao calendário + confirmação**
- Arquivos: novo util `src/lib/icsBooking.ts` (`buildICS`) + passo "success" com download `.ics` e link Google
  Calendar; capturar telefone para a confirmação.
- Aceite: `.ics` válido com início/fim/fuso corretos; link do Google abre pré-preenchido.
- Teste: `src/lib/icsBooking.test.ts` (string .ics bem formada, duração = serviço).

## 7. Ordem de despacho sugerida

1. **F1-1** (sozinha — destrava o resto).
2. Em paralelo: **F1-2** e **F1-3** (backend) ‖ **F1-4** (front).
3. **F2-1** → **F2-2** (compartilham util).
4. **F2-3** → **F2-4** → **F2-5** (mesma página, em série).
5. QA independente após cada uma; ao fechar a fase, atualizar `CONTINUIDADE-CODEX.md`.

## 8. O que fica a cargo do agente

- Microdecisões de layout/Tailwind dentro do padrão existente (cor `#166b50`, cantos `rounded-2xl`).
- Nomes internos de função/variável e estrutura dos testes.
- TTL exato (15 min é o default; pode ajustar 10–20 se justificar).
- **Não** decide: escopo, mudança de provedor, não-metas, alteração de contrato público/ RLS.
