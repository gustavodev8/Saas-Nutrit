# Roteiro de QA — Pronto pra Piloto (SaaS Nutrit)

**Data:** 2026-11-24 · **Objetivo:** validar a jornada completa do nutricionista + os pontos críticos
(billing e isolamento multi-tenant) antes de abrir o piloto. Marque `[x]` o que passar; anote o bug ao lado do que falhar.

## 0. Pré-requisitos

- [ ] **Dois workspaces de teste** (Workspace A e Workspace B), com e-mails diferentes — essenciais pro teste de isolamento.
- [ ] Testar em **produção** (ou ambiente equivalente). Billing usa o Mercado Pago **real** (token de produção): o teste de pagamento cobra de verdade (R$79,90) — **cancele/estorne depois**, ou use o fluxo só até o checkout.
- [ ] Navegador com uma aba normal e uma aba anônima (pra simular 2 sessões / o paciente).

---

## 1. Cadastro / Onboarding / Trial

- [ ] Criar Workspace A via **/workspace/signup** → confirmar e-mail. **Esperado:** cai logado na área clínica.
- [ ] **Dashboard** carrega, mostra **banner de trial** ("X dias restantes") e **"Primeiros passos" (1/3)**.
- [ ] **Billing (banco):** o workspace novo nasce com assinatura `status = trialing` *(já verificado por mim no RPC de signup).*

## 2. Pacientes

- [ ] **Adicionar paciente** (nome, nascimento, sexo, e-mail, telefone, cidade) → salva e aparece na lista.
- [ ] **Editar** um paciente → alterações persistem.
- [ ] **Buscar** por nome/contato/cidade; **filtrar** por sexo/cidade; **ordenar** (nome / mais recentes).
- [ ] **Paginação** funciona (se tiver +10 pacientes).
- [ ] **Abrir prontuário** do paciente.

## 3. Antropometria / Medições

- [ ] **Registrar medição** (peso, dobras cutâneas, circunferências).
- [ ] **Gráficos de evolução** renderizam.
- [ ] **Gerar PDF antropométrico** → baixa e abre corretamente.

## 4. Anamnese

- [ ] **Preencher anamnese**, salvar, reabrir → dados persistem.

## 5. Plano alimentar  *(várias features novas — testar com atenção)*

- [ ] **Criar plano do zero** e **criar a partir de um modelo** (Modelos → usar modelo → paciente).
- [ ] **Adicionar alimento:** autocomplete busca (base + OpenFoodFacts) e **preenche macros/medida** ao selecionar.
- [ ] **Metas** (kcal, proteína, carbo, gordura) → **barras de aderência** aparecem no resumo (verde/âmbar/vermelho).
- [ ] **Autosave:** editar algo num plano **salvo** e esperar ~2,5s → aparece **"Salvo automaticamente às HH:MM"** (sem recarregar a tela).
- [ ] **Duplicar refeição** (clona com alimentos, insere abaixo).
- [ ] **Duplicar plano** e **"Copiar de outro paciente"** (na aba Planos do paciente).
- [ ] **Lista de compras** → diálogo com alimentos agregados + **"Copiar lista"**.
- [ ] **Salvar como modelo** → nomear → salva; confirmar que aparece na **biblioteca de modelos**.
- [ ] **Gerar PDF** do plano salvo.

## 6. Plano de treino

- [ ] **Criar plano de treino**, adicionar exercícios: **autocomplete**, **atalhos 3×10/4×12**, **edição inline** (séries/reps/carga), **reordenar ↑/↓**, **salvar-e-adicionar-outro**.
- [ ] **Duplicar** exercício / dia / plano e **"Copiar de outro paciente"**.

## 7. Agendamento (booking)

- [ ] **Configurações → Agendamento:** seções organizadas, **checklist de ativação**, adicionar **serviço** + **chave PIX**.
- [ ] **Disponibilidade:** adicionar **2 intervalos no mesmo dia** (ex. 08–12 e 14–18) e **salvar sem erro** *(depende da migração de intervalos múltiplos, já aplicada).*
- [ ] **Página pública** (`/agendar/<slug>`): abre **sem login**, calendário mostra os horários dos 2 intervalos, consentimento LGPD aparece.
- [ ] **Paciente agenda + paga PIX** → a reserva aparece pro nutri.
- [ ] **Concorrência:** tentar reservar o **mesmo horário** em duas abas → só uma deve confirmar (insert atômico).

## 8. Consultas / Agenda / Recordatório

- [ ] **Registrar consulta** → aparece na **Agenda** e nas "Últimas consultas" da dashboard.
- [ ] **Recordatório R24h** salva e reabre.

## 9. Portal do paciente

- [ ] Gerar credenciais do paciente → paciente **acessa o portal** e vê o que está publicado (plano/treino, conforme configurado).

## 10. Billing — round-trip completo  🔴 *(bloqueador; precisa de pagamento)*

- [ ] **"Assinar agora"** → abre o **checkout do Mercado Pago** (sem erro). *(valida create-workspace-subscription)*
- [ ] **Pagar** (cartão real ou de teste) → voltar pro app.
- [ ] Em ~1 min, **status vira `active`** e some o paywall. *(valida o webhook preapproval → workspace_subscriptions)*
- [ ] **E-mail de "assinatura ativa"** chega (Resend).
- [ ] **Pós-trial sem pagar:** simular trial expirado → o **paywall/WorkspaceTrialGate bloqueia** o acesso.
- [ ] **Cancelar assinatura** → status reflete; (se foi pagamento real, **estornar** no MP).

## 11. Isolamento multi-tenant  🔴 *(crítico; segurança)*

- [ ] Logado como **Workspace A**, confirmar que **NÃO** aparece nenhum paciente/plano/consulta do **Workspace B**.
- [ ] Pegar a URL de um paciente do B (`/workspace/patients/<id-do-B>`) e abrir **logado como A** → deve **bloquear/não carregar** (não vazar dado).
- [ ] Repetir pra um **plano alimentar** e uma **medição** do B. *(RLS já auditado por mim: ok no banco; aqui confirmamos pelo app.)*

## 12. Tema / site público

- [ ] Site público do Fillipe (`/`) fica **branco** mesmo com o navegador/OS em **dark** *(corrigido — ThemeScopeSync).*
- [ ] Workspace **mantém o dark mode** quando o OS está em dark / pelo toggle.

## 13. Robustez / erros

- [ ] Recarregar páginas no meio de edições não perde dado inesperadamente.
- [ ] Logout/login mantém o workspace certo.
- [ ] Testar em **mobile** (largura de celular) as telas principais (dashboard, pacientes, plano).

---

## Onde eu (Claude) ajudo vs. onde é você

- **Você:** tudo que precisa de **login** (senha de produção) e o **pagamento** — não posso fazer essas duas.
- **Eu:** reproduzir/depurar qualquer bug que aparecer (puxar logs, achar no código, corrigir via Haiku se não-UI, ou mandar pro Codex se for UI), e dirigir o navegador nas partes públicas (ex.: página de agendamento sem login).

## Severidade (como classificar os bugs)

- 🔴 **Bloqueia piloto:** billing não fecha, vazamento entre workspaces, perda de dado, erro que trava fluxo principal.
- 🟡 **Corrigir antes de abrir amplo:** bug de UX, cálculo errado, PDF torto.
- ⚪ **Depois:** cosmético, nice-to-have.
