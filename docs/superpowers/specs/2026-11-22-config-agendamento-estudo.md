# Aba de Configurações de Agendamento — Estudo de Mercado + Opções + UI/UX

**Data:** 2026-11-22 · **Contexto:** a aba `WorkspaceBookingSettingsTab.tsx` hoje parece "pouca e desorganizada".
Este doc levanta o que o mercado expõe, o que falta, e como reorganizar.

## 1. O diagnóstico (por que parece pouco/bagunçado)

A aba hoje é **um formulário plano e longo**, misturando assuntos diferentes num mesmo card:
- "Configurações gerais" junta: link público + chave PIX + taxa + 4 regras de agendamento + nome + bio.
- Depois, soltos: Serviços e Disponibilidade semanal.

Problemas de arquitetura de informação (IA):
- **Assuntos misturados** (identidade visual, dinheiro, regras e agenda no mesmo bloco).
- **Sem hierarquia** (tudo no mesmo peso; nada de "básico vs. avançado").
- **Sem status** (não dá pra bater o olho e ver o que falta pra ativar).
- **Disponibilidade pobre**: um único intervalo por dia (sem manhã/tarde), sem exceções de data com horário especial (só bloqueio total).

Princípios de UX que vamos aplicar (NN/g, Toptal, Android, Apple): IA primeiro → agrupar relacionados → mostrar o status ao lado de cada item → mais usados no topo → **progressive disclosure** (esconder avançado) → rótulos simples → defaults sensatos → ações destrutivas reversíveis.

## 2. O que o mercado expõe (Calendly / Cal.com / Acuity / SimplyBook)

| Categoria | Opções padrão de mercado | Você tem? |
|---|---|---|
| **Disponibilidade** | Múltiplos intervalos/dia (manhã+tarde); exceções de data (horário especial); disponibilidade por serviço; fuso horário | Parcial (1 intervalo/dia; só bloqueio) |
| **Regras & Limites** | Buffer antes/depois; antecedência mínima; janela máxima; intervalo de slot; **limite por dia/semana/mês**; duração mínima entre marcações | Parcial (buffer único, notice, janela, intervalo) |
| **Pagamento** | Cobrança total, **sinal/depósito** (fixo ou %); taxa de no-show/cancelamento; política de reembolso; provedor | Parcial (PIX total, taxa fixa 5%) |
| **Formulário de reserva** | Perguntas/intake por serviço; campos obrigatórios; **checkbox de consentimento** (termo/LGPD); anamnese pré-consulta | Não (dados fixos nome/email/tel; LGPD agora hardcoded) |
| **Lembretes & mensagens** | Confirmação; **lembrete e-mail/SMS/WhatsApp** (24h/2h); follow-up/retorno (recall); texto da política de cancelamento | Não (há "recalls" no backend, não exposto aqui) |
| **Cancelamento & remarcação** | Auto-serviço pelo paciente; janela mínima p/ cancelar/remarcar; limite de remarcações | Não |
| **Página de confirmação** | Mensagem personalizada; redirect; **adicionar ao calendário** | Parcial (.ics já na Fase 2) |
| **Local / modalidade** | Presencial (endereço) vs **online** (link Meet/Zoom/WhatsApp vídeo) vs telefone | Não |
| **Marca & perfil** | Nome, bio, **logo/avatar**, cor de destaque, idioma da página, slug | Parcial (nome, bio, slug) |

## 3. Opções novas recomendadas (agrupadas, com prioridade)

Prioridade: 🔴 alta (impacto direto em conversão/operação) · 🟡 média · ⚪ nice-to-have.

**Disponibilidade**
- 🔴 Múltiplos intervalos por dia (ex.: 08:00–12:00 e 14:00–18:00). *Maior gargalo real de oferta de horário.*
- 🟡 Exceções de data com horário especial (não só bloquear: "sábado 15/12 só 08–11").
- ⚪ Disponibilidade por serviço (ex.: retorno só às tardes).
- 🟡 Fuso horário do consultório (hoje assume o do navegador).

**Regras & Limites**
- 🔴 Máximo de consultas por dia (evita dia lotado) e por semana.
- 🟡 Buffer separado antes/depois.
- ⚪ Duração mínima entre marcações distintas.

**Pagamento**
- 🔴 Sinal/depósito (ex.: 30% no PIX pra segurar o horário; resto presencial) — reduz no-show.
- 🟡 Política de no-show/cancelamento (cobra taxa? reembolsa?).

**Formulário & Consentimento**
- 🔴 Texto de consentimento LGPD configurável (hoje fixo no código) + obrigatório.
- 🟡 Perguntas de intake por serviço (objetivo, restrições alimentares, como conheceu).
- 🟡 Telefone/WhatsApp obrigatório (hoje recomendado).

**Lembretes & Mensagens**
- 🔴 Lembrete automático por WhatsApp/e-mail (24h e 2h antes) — maior corte de no-show.
- 🟡 Expor o "recall"/retorno que já existe no backend aqui na config.
- 🟡 Mensagem de confirmação e política de cancelamento (texto livre).

**Cancelamento & Remarcação**
- 🔴 Auto-serviço do paciente (link p/ remarcar/cancelar) + janela mínima (ex.: até 24h antes).
- ⚪ Limite de remarcações.

**Local / Modalidade**
- 🔴 Presencial (endereço + mapa) vs Online (link de vídeo gerado/colado) — essencial pra nutri que atende online.

**Marca**
- 🟡 Logo/avatar e cor de destaque da página pública.
- ⚪ Idioma / mensagens customizáveis.

## 4. Reorganização proposta (IA)

Trocar o formulão plano por **seções com cabeçalho, ícone e chip de status**, na ordem de uso. Duas formas:

**Opção A — Sub-abas internas** (como Calendly/Cal.com; melhor quando crescer):
`Página & Perfil` · `Serviços` · `Disponibilidade` · `Regras & Limites` · `Pagamento` · `Formulário` · `Lembretes` · `Cancelamento`

**Opção B — Página única em cards agrupados + "Avançado" recolhível** (menos clique, bom agora):

```
┌ Agendamento online            [● Ativo]  [Ver página ↗] ┐
│  ✔ Checklist de ativação: Serviço ✓ · PIX ✓ · Dias ✓    │
├─────────────────────────────────────────────────────────┤
│ 🔗 Página & Perfil      link, nome, bio, logo, cor       │
│ 🧾 Serviços             (lista) + Adicionar              │
│ 📅 Disponibilidade      grade semanal + (+) intervalo    │
│ ⚙️ Regras & Limites     buffer, antecedência, por dia    │
│ 💳 Pagamento            PIX, sinal, no-show              │
│ 📝 Formulário & LGPD    campos, intake, consentimento    │
│ 🔔 Lembretes            WhatsApp/e-mail, retorno         │
│ 🔁 Cancelamento         auto-serviço, janela            │
│  ▸ Avançado             fuso, idioma, limites finos      │
└─────────────────────────────────────────────────────────┘
```

**Recomendo começar pela Opção B** (reaproveita o que existe, menos navegação) e migrar pra sub-abas se a lista crescer.

## 5. Ideias de UI/UX de alto impacto

1. **Preview ao vivo da página pública ao lado** (split) — vê a mudança na hora. Enorme pra confiança.
2. **Checklist de ativação** no topo ("Para ativar: ✓ 1 serviço · ✓ PIX · ✓ 1 dia disponível") — resolve o "tá incompleto e não sei por quê".
3. **Chip de status por seção** (Ativo / Incompleto / Opcional) — bate o olho.
4. **QR Code do link** (além de copiar) — compartilhar no Instagram/recepção.
5. **Disponibilidade como grade visual** com botão **(+) adicionar intervalo** por dia (manhã/tarde) e presets ("Horário comercial 8–18", "Só manhãs").
6. **Defaults sensatos + presets** em vez de campos vazios.
7. **Ações destrutivas reversíveis** (remover serviço → desfazer, não `confirm()` seco).
8. **Progressive disclosure**: só o essencial visível; fuso/idioma/limites finos atrás de "Avançado".
9. **Salvar por seção** com feedback inline (hoje é um "Salvar" global) — reduz medo de perder.
10. **Microcopy orientada a resultado** ("Clientes agendam e pagam sem depender de você") — já existe, estender por seção.

## 6. Próximos passos sugeridos

Isto é um estudo; dá pra virar um plano executável por agentes Haiku igual à rodada anterior. Ordem sugerida:
1. **Reorganização visual** (Opção B: cards + status + checklist) — baixo risco, alto ganho percebido, não mexe em dados.
2. **Múltiplos intervalos/dia** (precisa de migração: a tabela de disponibilidade hoje é 1 linha por dia).
3. **Lembretes** (WhatsApp/e-mail) + expor recall.
4. **Sinal/depósito** e **auto-serviço de cancelamento**.

## Fontes
- Calendly — [customizar event types](https://calendly.com/help/how-to-customize-your-event-types), [limites de reunião](https://calendly.com/help/how-to-set-meeting-limits), [política de cancelamento](https://help.calendly.com/hc/en-us/articles/28926500961431)
- Cal.com — [guia de settings/features](https://cal.com/blog/a-guide-to-cal-com-s-event-settings-and-features), [limites: frequência/duração/futuro](https://cal.com/blog/booking-limits-frequency-duration-future), [buffer](https://cal.com/docs/core-features/event-types/event-buffer)
- Acuity — [features](https://acuityscheduling.com/features), [políticas de pagamento](https://acuityscheduling.com/learn/how-to-set-up-payment-policies), [limitar no-show](https://help.acuityscheduling.com/hc/articles/16676924217101)
- SimplyBook.me — [features](https://simplybook.me/en/booking-system-features), [intake forms](https://help.simplybook.me/wiki/Intake_Forms_custom_feature)
- UX — [Toptal: settings UX](https://www.toptal.com/designers/ux/settings-ux), [NN/g: progressive disclosure](https://nngroup.com/articles/progressive-disclosure/), [Apple HIG: settings](https://developer.apple.com/design/human-interface-guidelines/settings)
