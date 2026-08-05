# Memoria de Produto - Bloco 1 SaaS Nutri

Contexto: esta memoria consolida a decisao de produto para o primeiro bloco de evolucao do sistema, aproveitando o que o produto ja tem e copiando do mercado apenas o que gera valor rapido.

Base de comparacao: Dietbox e outros sistemas fortes em operacao clinica.

## Objetivo do Bloco 1

Transformar o sistema de "prontuario bom" em "ferramenta que ajuda o nutricionista a operar e reter paciente no dia a dia".

O foco deste bloco nao e abrir uma nova frente gigante. O foco e aumentar:

- organizacao da rotina;
- follow-up com paciente;
- leitura operacional do consultorio;
- valor percebido na venda.

## O que copiar agora do mercado

Este e o menor pacote que aproxima o produto do que o mercado espera sem abrir app, portal e automacoes pesadas.

### 1. Mensagens prontas e follow-up operacional

Entram:

- confirmacao de consulta;
- lembrete de consulta;
- lembrete de retorno;
- exame pendente;
- pos-consulta;
- paciente sem retorno.

Por que entra:

- vende muito bem;
- reduz trabalho manual;
- reaproveita agenda, pacientes e disparo;
- aumenta consistencia no atendimento.

### 2. Questionario pre-consulta

Entram:

- objetivo;
- rotina;
- restricoes;
- sintomas;
- suplementacao e medicacao;
- exames previos;
- historico com nutricionista;
- observacoes.

Por que entra:

- reduz atrito da primeira consulta;
- aumenta percepcao de profissionalismo;
- conversa bem com a anamnese e com o checklist do prontuario.

### 3. Tags e segmentos de pacientes

Entram:

- tags manuais:
  - emagrecimento;
  - hipertrofia;
  - online;
  - presencial;
  - gestante;
  - metabolico.
- segmentos automaticos:
  - sem proximo agendamento;
  - sem plano ativo;
  - exames pendentes;
  - cadastro incompleto;
  - inativo 30, 60 ou 90 dias;
  - retorno vencido.

Por que entra:

- deixa a base de pacientes mais acionavel;
- melhora filtros e priorizacao;
- encaixa muito bem com mensagens prontas.

### 4. Financeiro basico de consultorio

Entram:

- receita recebida;
- receita pendente;
- consultas concluidas;
- no-show;
- cancelamentos;
- ticket medio simples;
- leitura por periodo curto.

Por que entra:

- o sistema ja tem pagamentos e logs;
- falta transformar isso em leitura de negocio;
- ajuda bastante na venda do produto.

## O que fica fora do Bloco 1

Para manter escopo controlado, ficam fora:

- portal do paciente;
- app do paciente;
- app do profissional;
- chat em tempo real;
- videoconferencia;
- diario alimentar;
- metas do paciente;
- lembretes de agua e refeicao;
- Google Agenda;
- recepcao e perfis;
- marketplace;
- DB360 e modulos por imagem;
- automacao avancada de WhatsApp;
- financeiro completo com despesas e fluxo de caixa.

## Por que o portal do paciente fica para depois

Hoje o portal ainda nao e uma extensao leve do sistema. Ele abre uma nova frente inteira de autenticacao, RLS, experiencia do paciente, permissao por conta e superficie publica.

No estado atual, o portal e quase um novo produto. Ja o Bloco 1 consegue gerar valor aproveitando a base que existe.

## Narrativa comercial do Bloco 1

Ao final deste bloco, o produto deve conseguir se vender assim:

- organiza a rotina clinica;
- facilita o follow-up do paciente;
- reduz atrito antes e depois da consulta;
- da uma leitura simples do consultorio;
- ajuda o nutricionista a agir, nao so registrar.

## Criterios de pronto

O Bloco 1 esta pronto quando o nutricionista conseguir:

- identificar quais pacientes exigem acao;
- enviar a mensagem certa com pouco esforco;
- abrir a consulta com pre-consulta preenchida;
- entender rapidamente receita, pendencia e faltas do periodo.

E, do lado tecnico:

- UI consistente;
- sem regressao em agenda, pacientes, planos e exames;
- build, lint e testes passando.

## Ordem de entrega recomendada

1. Questionario pre-consulta
2. Mensagens prontas
3. Tags e segmentos
4. Financeiro basico

## Resumo executivo

O que copiar agora e fazer:

- mensagens prontas;
- pre-consulta melhor;
- tags e segmentos;
- financeiro basico.

O que nao copiar agora:

- portal/app;
- camada social;
- automacao pesada;
- modulos premium caros.

Essa e a linha mais inteligente para aumentar valor percebido sem transformar o sistema num Frankenstein antes da hora.
