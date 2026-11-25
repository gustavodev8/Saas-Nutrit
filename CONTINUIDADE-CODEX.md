# Continuidade Codex

## Hardening de agendamento público por workspace — rollout em duas fases — 2026-11-24

- **Estado local:** a correção do pacote de agendamento público está somente local. Não houve migration remota, deploy, push, alteração de dados ou mudança de segredo.
- **Fase A — aditiva:** 20261205000000_workspace_public_booking_hardening_candidate.sql cria RPCs mínimos de leitura pública e redefine create_workspace_booking_atomic para validar, dentro do lock, configuração ativa, escopo/estado do serviço, antecedência, limite futuro, janela ativa, data bloqueada, intervalo e conflito. Ela **não** remove policies ou grants anônimos legados.
- **Edge Function:** create-workspace-booking-payment aceita temporariamente tanto `{ workspace_id, ... }` quanto `{ workspace_slug, ... }`. Se ambos forem recebidos, a consulta exige a mesma configuração ativa; um par divergente não é confiado. A função usa o RPC de slots antes de cobrar, mantém a inserção atômica como autoridade final e aplica rate limit com HMAC, falhando fechada sem SAAS_RATE_LIMIT_HMAC_SECRET.
- **Fase B — contração:** 20261206000000_workspace_public_booking_contract_candidate.sql contém exclusivamente a remoção das policies/grants anônimos diretos. Só pode ser aplicada depois de Fase A, publicação da Edge Function compatível, publicação da UI RPC e smoke explícito dos dois contratos (legado por workspace_id e novo por workspace_slug), além de um período de coexistência de cache documentado: refresh forçado ou invalidação equivalente e verificação em navegador/CDN de que nenhum bundle antigo ainda faz leitura anônima direta.
- **Ordem obrigatória de publicação:** Fase A migration -> preflight dos secrets SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN e SAAS_RATE_LIMIT_HMAC_SECRET -> Edge Function compatível -> UI RPC -> smoke dos dois contratos -> Fase B migration. Não inverter a ordem.
- **Validação local:** testes focados de contrato devem cobrir que a Fase A não contém DROP POLICY/REVOKE de tabela, que a Fase B contém a contração e que a inserção atômica mantém as regras de elegibilidade. Não considerar isso como prova de smoke remoto.
- **Risco adiado:** o sistema ainda não possui timezone explícito por workspace; regras de antecedência usam o timezone do banco. Não adicionar schema nesta entrega; decidir e modelar timezone antes da abertura ampla de agendamento público.

## Tarefa 3 — aba inicial das configurações — 2026-11-24

- **Escopo local:** a selecao inicial em Configuracoes prioriza `?tab=` quando corresponder a uma aba valida; `?subscribed=1` continua levando a Plano quando nao houver aba valida; Perfil permanece o fallback final.
- **Validacoes:** 3 testes focados passaram; `npm run build` e `git diff --check` passaram.
- **Publicacao:** commit somente local; nenhum push, deploy, migration ou operacao remota.

## Piloto — resumo nutricional e exclusao de planos — 2026-11-24

- **Tarefa 0 verificada em producao:** o detalhe de `Biblioteca Dieta - Emagrecimento 1307 kcal - M001` abriu em `/workspace/modelos/124` com 5 refeicoes e alimentos visiveis; o RLS dos filhos do modelo esta operacional para o workspace Gustavo.
- **Tarefa 1 concluida:** o resumo do plano passa a preferir macros absolutos ja salvos no alimento. O editor continua recalculando alimentos catalogados por `*_per_100g` ao mudar quantidade. Testes focados: 11/11; build e QA independente: `QA_PASS`.
- **Tarefa 2 concluida:** exclusao de plano tem confirmacao, erro recuperavel, cancelamento sem `DELETE` e reload apos sucesso. O servico limita o `DELETE` por `workspace_id`, `patient_id` e `id`. Testes de servico/pagina: 22/22; build e QA independente: `QA_PASS`.
- **Limite de publicacao:** nenhuma migration/DDL foi aplicada. O proximo pacote local seguro e inicializar a aba de configuracoes por `?tab=plano`; a limpeza remota de dados QA continua dependente de acao explicita do usuario.

## Tarefa 2 — exclusao de plano alimentar no workspace — 2026-11-24

- **Escopo local:** adicionada exclusao de plano alimentar na jornada de prontuario workspace, com confirmacao acessivel, tratamento de erro e recarga da lista somente apos sucesso.
- **Isolamento:** `deleteWorkspaceMealPlan` aplica filtros explicitos por `workspace_id`, `patient_id` e `id` no `DELETE`; nao houve alteracao de migration, RLS, Supabase remoto ou dados.
- **Validacoes:** testes focados do servico e da pagina passaram (4 testes); `npm run build` e `git diff --check` passaram. A execucao ampla da pagina nesta base ainda possui falhas preexistentes relacionadas a testes que esperam a lista de planos fora da aba `Planos`.
- **Publicacao:** commit apenas local; nenhum push ou deploy executado.
- **Proximo passo seguro:** revisar o fluxo em sessao autenticada no piloto antes de qualquer publicacao.

## Reconciliacao apos merge compartilhado — 2026-11-24

- Estado confirmado apos `git fetch`: `HEAD` e `origin/main` estavam em `588eb8d5`; o WIP anterior ja estava incorporado em `a0562f20` e a arvore estava limpa.
- Revisados manualmente os conflitos de `WorkspaceShell.tsx` e `WorkspacePatientsPage.tsx`: menu movel, responsividade, acoes acessiveis e tema do workspace foram preservados; restaurados apenas bordas, divisores, espaco de linha e foco do seletor perdidos do polish `4d635bb7`.
- Publicado em fast-forward: `364a9739 style(workspace): restore shell and patient list polish`. Teste de Pacientes 14/14 e `npm run build` passaram. QA independente condicional: falta homologacao visual autenticada mobile/light/dark e teste especifico do shell.
- A correcao de tema `588eb8d5` foi preservada: o site publico permanece claro e somente `/workspace` pode aplicar dark mode.

## Landing e acesso Nutrit — 2026-11-24

- Redesign local da landing SaaS e telas de login, cadastro, recuperacao e convite. Hero mostra previa ilustrativa com dados ficticios, sem expor dados clinicos; oferta existente de 30 dias/R$79,90 permanece consistente.
- Capturas locais da landing em 320x568 e 1440x900 verificaram ausencia de overflow horizontal, previa sem corte e proxima secao visivel. Build passou; testes direcionados de landing/auth/workspace passaram 68/68 segundo QA independente.
- Suite geral permanece vermelha: execucao local 430/437, falhas em AuthContext, workspaceMeasurements e componentes admin fora do diff; QA reexecutou e encontrou 5 falhas em 3 arquivos. Nao atribuir falhas ao redesign sem evidencia, mas nao declarar QA_PASS.
- QA_FAIL para deploy integral: faltam investigar falhas da suite, homologacao autenticada em mobile/light/dark e cobertura visual de outras telas publicas/portal/admin. Nenhum commit, push, deploy, migration ou alteracao Supabase nesta rodada.

## Reconciliacao de testes clinicos — 2026-11-24

- Pacote visual permanece local, sem commit, push, flags ou Supabase remoto.
- Testes do diretorio e detalhe do paciente foram alinhados ao fluxo atual por abas, preservando verificacoes de navegacao e isolamento entre workspaces. Cinco suites focadas passaram: 36/36; TypeScript e `git diff --check` passaram.
- QA independente: `QA_CONDITIONAL` para manter local. Falta cobertura da jornada completa de criacao/edicao de avaliacao e relatorio na aba Medidas, alem de homologacao visual autenticada desktop/mobile/dark/light/reduced-motion antes de publicar.

## Expansao visual e loader do piloto — 2026-11-24

- Pacote local ainda sem commit/push/deploy: refinamento de Agenda, Inicio, Pacientes, Modelos, Alimentos, detalhe de modelo e Configuracoes; menu movel e estados vazios/erro mais claros.
- `LeafLoader` agora usa tres folhas em queda com alternativa estatica para `prefers-reduced-motion`; aplicado a esperas de paginas/consultas, mantendo spinners de acoes curtas.
- Falhas de carregamento de Modelos/Alimentos deixam de parecer lista vazia ou loading infinito; oferecem retry e ignoram respostas obsoletas.
- Build, tipagem, lint direcionado e `git diff --check` passaram nas implementacoes. QA independente: 4 testes de catalogo, 2 do loader e 2 da Agenda passaram; suite focada clinica teve 23 falhas em 39 testes (13 Pacientes, 10 Detalhe), aparentemente expectativas antigas, ainda nao reconciliadas.
- QA_FAIL para publicar: falta reconciliar esses testes e homologar desktop/mobile, dark/light e movimento reduzido em navegador autenticado. Nenhuma alteracao remota, de Supabase ou dados clinicos nesta rodada.

## Revisao visual do piloto — 2026-11-23

- Base publicada antes deste pacote: `95d1383a` na `main`. Este novo pacote permanece local, sem commit, push, deploy ou alteracao remota.
- Capturas do usuario motivaram melhorias em Agenda, Inicio, onboarding e Pacientes: estado vazio com CTA, indicadores mais densos, superficies dark/light, acoes de paciente visiveis, idade futura sem valor negativo e menu movel em telas estreitas.
- QA de design identificou e confirmou correcoes de acao por toque, agenda vazia, idade negativa, contraste e hierarquia. Filtros da Agenda receberam `aria-pressed`.
- Build, tipagem, lint direcionado, `git diff --check`, 2 testes da Agenda e novo teste de idade passaram. A suite de Pacientes permanece com 13 testes legados falhando por expectativas de UI/fluxos antigos (incluindo wizard de antropometria na lista); nao foram ignorados nem reescritos em massa.
- QA final condicional: falta homologacao visual autenticada em desktop/mobile e revisao separada da suite legada. Preservar demais alteracoes locais.

## Integração visual do workspace — 2026-11-23

- Integração local, sem commit, push, deploy, Supabase remoto, migration, flag ou alteração de ambiente.
- Destino confirmado em `8412262d`; apenas `src/components/workspace/WorkspaceShell.tsx` e `src/pages/workspace/WorkspacePatientsPage.tsx` ficaram modificados.
- Portados seletivamente tokens visuais, foco, áreas de toque, hierarquia do diretório, indicadores, filtros, estados de painel e sticky do formulário. A lista em cartões e todos os fluxos do destino foram preservados: sidebar, tema, seleção de modelo, CPF/notas, prontuário, rotas, paginação, handlers, mutations e escopo por workspace.
- Validações locais: `npx tsc --noEmit`, ESLint direcionado, `npm run build` e `git diff --check` passaram.
- Testes focados falham por condições preexistentes no checkout: `WorkspacePatientsPage.test.tsx` monta sem Router apesar de `useSearchParams()` já existir no HEAD; `WorkspacePatientDetailPage.test.tsx` falha em expectativas de dados/contrato fora dos dois arquivos alterados. Nenhum teste foi alterado para mascarar isso.
- QA independente read-only: sem regressão funcional identificada no diff; status condicional por falhas preexistentes e ausência de screenshot/browser autenticado. Próximo passo seguro: revisão visual manual local antes de commit ou publicação.
## Redesign da listagem de pacientes — 2026-11-15

- **Estado local:** redesign visual publicado no commit `34faf2b`; a correção que preserva a navegação lateral e móvel em `/admin/pacientes` está local, ainda não commitada, em `src/components/admin/AdminLayout.tsx`. Nenhuma migration, segredo ou deploy foi executado.
- **Escopo:** somente `/admin/pacientes` recebeu o cabeçalho horizontal de clínica; a sidebar desktop e a navegação móvel padrão foram preservadas nessa rota e as demais rotas, inclusive o prontuário individual, mantêm o shell administrativo anterior.
- **Entrega:** cartão de total verde, painel único de atenção com seis filtros operacionais clicáveis e tabela reorganizada em Paciente, Contato, Pendências, Perfil e Cadastro. Busca, filtros, ordenação, paginação, exclusão e cadastro permanecem no mesmo fluxo.
- **Validações:** `npm run build`, `npm run test -- --run` (146 testes), ESLint direcionado aos dois arquivos e `git diff --check` passaram. O lint global segue com 56 erros pré-existentes fora desse escopo.
- **QA:** revisão independente em modo read-only: `QA_PASS` para o redesign e para a restauração posterior da navegação. Observação não bloqueadora: o texto de variação mensal do cartão total omite o sinal positivo antes do valor, com impacto apenas de fidelidade visual.
- **Próximo passo seguro:** revisar visualmente com sessão autenticada em desktop e mobile; se aprovado, criar commit e solicitar autorização explícita antes de publicar a correção da navegação.

## Fundação SaaS — sincronização de histórico — 2026-11-04

- **Estado:** o Supabase de origem `qwwltjaoftnsuvpgrsmm` já tem fundações de workspace/convites e migrations de expansão clínica aplicadas, conforme `supabase migration list --linked` executado pelo CLI 2.111.0; o ledger retornou `local=remote` até `20261103010000` e 19 versões posteriores pendentes (`20261104000000` a `20261124000000`) no checkout legado.
- **Fonte:** nove migrations previamente aplicadas, mas ausentes do `main`, foram portadas para este worktree a partir do checkout legado, sem alteração de conteúdo. QA confirmou igualdade byte a byte entre as cópias local e fonte. O ledger remoto guarda versões, não checksum do SQL; portanto, a identidade desses bytes com o SQL historicamente executado não foi comprovada de forma independente. A migration `20261103010000` já rastreada também permanece intacta.
- **Escopo excluído:** nenhuma das 19 migrations pendentes foi copiada, aplicada ou publicada; nenhum SQL remoto foi executado nesta etapa.
- **Prontidão SaaS:** ainda **NO-GO para cadastro público/trial**. O `main` contém o painel legado do Fillipe, sem onboarding SaaS/workspace clínico; o isolamento RLS para o fluxo clínico continua uma dependência antes de liberar profissionais.
- **QA:** `QA_CONDITIONAL`; condição registrada: a proveniência remota das versões copiadas é baseada em ledger/checkout e não em checksum remoto.
- **Próximo passo:** auditoria remota somente leitura do catálogo/ACL efetivo e das constraints de workspace no projeto de origem; em paralelo, preparar um piloto fechado mínimo com RLS por workspace e testes A/B/C. Não aplicar migrations pendentes em lote nem habilitar trial público.

## Entrega de proteção de exclusão — 2026-11-04

- **Escopo:** impedir que a exclusão de um agendamento apague ou deixe sem vínculo um prontuário clínico; informar claramente o administrador quando a FK `consultation_records_booking_id_fkey` bloquear a operação.
- **Supabase de origem:** `qwwltjaoftnsuvpgrsmm`. A migration autorizada `20261103010000_consultation_booking_delete_guard_candidate.sql` foi aplicada e verificada anteriormente: FK com `ON DELETE RESTRICT` presente e `NOT VALID` por causa de 20 registros órfãos preservados; constraint CHECK validada. Nenhum dado foi removido ou reassociado.
- **Fonte versionada da migration:** commit `23f7019` registrou o arquivo portado, byte idêntico ao artefato aplicado (SHA-256 `D464E71B406FE4F5F8009889AAAE90F3FEE97A75D832A05914998C68AEC35FBF`, 4.333 bytes); QA independente `QA_PASS`. A migration não foi reaplicada ao Supabase.
- **Código local:** patch isolado em `src/lib/supabase.ts` e `src/pages/admin/agendamentos/useBookingStatusActions.ts`, com testes focados nos mesmos fluxos. O bloqueio diferencia somente SQLSTATE `23503` com o nome esperado da FK; outros erros mantêm mensagem genérica.
- **Validações reportadas:** 99 testes, TypeScript, ESLint, build e `git diff --check` passaram; teste de concorrência em banco Docker local com fixtures sintéticas cobriu inserção concorrente e exclusão prévia, com limpeza confirmada. O build ainda reporta avisos existentes de chunk grande/importação dinâmica.
- **QA:** agente independente emitiu `QA_PASS` para os quatro arquivos de código/teste; sem achados bloqueadores.
- **Publicação:** patch de interface publicado pelo commit `58553fa`; migration já aplicada sincronizada no Git pelo commit `23f7019`. Ambos enviados por fast-forward a `main`; sem mudanças remotas no Supabase nesta sincronização. O site `https://fillipedavidnutri.online/` respondeu HTTP 200 e o bundle servido contém o texto específico do bloqueio.
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
