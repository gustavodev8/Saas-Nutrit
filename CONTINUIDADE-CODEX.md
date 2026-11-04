# Continuidade Codex

## Entrega de proteção de exclusão — 2026-11-04

- **Escopo:** impedir que a exclusão de um agendamento apague ou deixe sem vínculo um prontuário clínico; informar claramente o administrador quando a FK `consultation_records_booking_id_fkey` bloquear a operação.
- **Supabase de origem:** `qwwltjaoftnsuvpgrsmm`. A migration autorizada `20261103010000_consultation_booking_delete_guard_candidate.sql` foi aplicada e verificada anteriormente: FK com `ON DELETE RESTRICT` presente e `NOT VALID` por causa de 20 registros órfãos preservados; constraint CHECK validada. Nenhum dado foi removido ou reassociado.
- **Fonte versionada da migration:** arquivo portado do checkout de trabalho para este worktree limpo, byte idêntico ao artefato aplicado (SHA-256 `D464E71B406FE4F5F8009889AAAE90F3FEE97A75D832A05914998C68AEC35FBF`, 4.333 bytes); QA independente `QA_PASS`. O arquivo será apenas registrado no Git, nunca reaplicado ao Supabase.
- **Código local:** patch isolado em `src/lib/supabase.ts` e `src/pages/admin/agendamentos/useBookingStatusActions.ts`, com testes focados nos mesmos fluxos. O bloqueio diferencia somente SQLSTATE `23503` com o nome esperado da FK; outros erros mantêm mensagem genérica.
- **Validações reportadas:** 99 testes, TypeScript, ESLint, build e `git diff --check` passaram; teste de concorrência em banco Docker local com fixtures sintéticas cobriu inserção concorrente e exclusão prévia, com limpeza confirmada. O build ainda reporta avisos existentes de chunk grande/importação dinâmica.
- **QA:** agente independente emitiu `QA_PASS` para os quatro arquivos de código/teste; sem achados bloqueadores.
- **Publicação:** commit `58553fa` publicado por fast-forward em `main`; somente os quatro arquivos focados e este handoff foram incluídos. `origin/main` confirmou o commit. O site `https://fillipedavidnutri.online/` respondeu HTTP 200 e o bundle servido contém o texto específico do bloqueio.
- **Limitações:** o smoke PostgREST com a mensagem real não foi executado porque `docker ps` deixou de responder. O caminho continua protegido pela FK; se a mensagem do servidor diferir, a aplicação permanece no aviso genérico.
- **Próximo passo:** validar visualmente a mensagem no painel sem tentar excluir registros reais; acompanhar e planejar, separadamente, a reconciliação segura dos 20 órfãos. Antes de qualquer migration remota futura, confirmar a FK e o CHECK por catálogo read-only. Não reaplicar esta migration nem reabrir agendamento público neste pacote.

## Estado atual

- Branch local: `main`, sincronizada com `origin/main` apos os commits `6808cd6`, `22a6d1b`, `d481a8a` e `dd282be`.
- Nenhuma migration, segredo ou Edge Function foi aplicada/publicada nesta rodada.
- QA independente: PASS condicional. Todas as verificacoes locais passaram; as condicoes restantes dependem da validacao no Supabase, Resend e Vercel.
- Tentativa de validacao e publicacao remota em 2026-09-01 foi inicialmente bloqueada: a CLI do Supabase retornou `Unauthorized (401)` ao consultar projetos e migrations.
- Em 2026-09-02, a CLI foi autenticada e o projeto vinculado foi confirmado como `nutri` (`qwwltjaoftnsuvpgrsmm`, `us-east-1`). A unica migration pendente e `supabase/migrations/20260831000000_atomic_security_controls.sql`. O ciclo remoto continua bloqueado porque o secret `MP_WEBHOOK_SECRET` esta ausente. Ele deve corresponder ao segredo configurado no painel Mercado Pago; nao deve ser gerado arbitrariamente.
- Em 2026-09-02, foi implementado e aprovado em QA o fracionamento antropometrico em quatro componentes. A migration local `supabase/migrations/20260902000000_add_four_component_anthropometry.sql` tambem esta pendente e deve ser aplicada junto das migrations de seguranca antes de publicar o conjunto.

## Alteracoes locais

- `package.json`, `package-lock.json` e `.nvmrc`: runtime Node minimo `22.13.0` e dependencias de producao atualizadas.
- `vercel.json`: headers de seguranca e Content Security Policy para a SPA.
- `supabase/functions/payment-webhook/index.ts`: configuracao obrigatoria, validacao HMAC/anti-replay, vinculacao do ID assinado ao corpo, idempotencia e falha fechada para erros transitorios.
- `supabase/functions/_shared/mpWebhookSecurity.ts`: funcoes reutilizaveis para assinatura Mercado Pago.
- `src/lib/mpWebhookSecurity.test.ts`: testes de assinatura, expiração, configuracao e mismatch de identificador.
- `supabase/functions/_shared/publicEndpoint.ts`: rate limit fail-closed via RPC atomica.
- `supabase/migrations/20260831000000_atomic_security_controls.sql`: RPCs atomicas para rate limit e claim de webhook.
- `src/lib/fourComponentAnthropometry.ts` e telas antropometricas: estimativa de massa gorda, ossea, residual e muscular por diferenca, baseada em von Dobeln/Rocha, Wurch e De Rose/Guimaraes.
- `supabase/migrations/20260902000000_add_four_component_anthropometry.sql`: campos rastreaveis para diâmetros osseos e referencia do protocolo, com constraints de validade.
- `pnpm-lock.yaml` e `package.json`: lockfile sincronizado e pnpm `10.34.5` fixado para builds Vercel reproduziveis.

## Validacoes locais

- `npm run build`: passou.
- `npm run test`: 74 testes passaram.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `git diff --check`: passou.
- Fracionamento em quatro componentes: `npm test` passou com 80 testes; `npm run build` e `git diff --check` passaram. QA independente: PASS.

## Pre-condicoes para publicacao

1. Configurar `MP_WEBHOOK_SECRET` no projeto Supabase com o valor correspondente ao webhook do Mercado Pago.
2. Confirmar o projeto Supabase correto e aplicar `supabase/migrations/20260831000000_atomic_security_controls.sql` e `supabase/migrations/20260902000000_add_four_component_anthropometry.sql` antes de publicar as Edge Functions.
3. Confirmar que `payment-webhook` aceita o webhook externo sem JWT obrigatorio e que sua validacao HMAC permanece ativa.
4. Confirmar, sem exibir valores, a presenca dos secrets de Mercado Pago e Supabase exigidos pelo webhook.
5. Publicar as Edge Functions e testar pagamento em ambiente seguro com um evento valido, verificando retry/idempotencia.
6. Fazer deploy Vercel e conferir Node `>=22.13.0` e headers/CSP entregues em producao.
7. Confirmar suporte do Resend a `Idempotency-Key` para deduplicacao de reenvios.

## Proximo passo seguro

Configurar o secret `MP_WEBHOOK_SECRET` correto no Supabase e entao executar a validacao remota coordenada acima. Nao fazer push ou deploy antes da migration estar aplicada, pois os endpoints endurecidos falham fechados se os RPCs ainda nao existirem.
