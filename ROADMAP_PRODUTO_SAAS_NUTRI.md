# Roadmap de Produto - Sistema para Nutricionistas

Nota criada para retomar mais tarde as ideias de evolucao do sistema, especialmente pensando em vender como produto/SaaS para nutricionistas.

## Memorias Relacionadas

- [MEMORIA_PRODUTO_BLOCO_1_SAAS.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/MEMORIA_PRODUTO_BLOCO_1_SAAS.md)
- [MEMORIA_EXECUCAO_BLOCO_1_ARQUITETURA.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/MEMORIA_EXECUCAO_BLOCO_1_ARQUITETURA.md)
- [BACKLOG_BLOCO_1_EXECUCAO.md](C:/Users/Lenovo/Documents/GitHub/nutri_ladingpage/BACKLOG_BLOCO_1_EXECUCAO.md)

## Comparacao com Dietbox Premium

Pontos que a Dietbox Premium comunica como diferenciais e que ainda devem entrar no nosso radar:

- App/portal do paciente com plano, metas, diario, lista de compras e evolucao.
- Chat ou central estruturada de comunicacao nutri-paciente.
- Diario alimentar com registro de refeicoes, fotos, agua, treino, sintomas e adesao.
- Metas acompanhaveis entre consultas.
- Lembretes de consulta, retorno, refeicoes, agua e pos-consulta.
- WhatsApp integrado de forma mais robusta, com mensagens prontas e automacoes controladas.
- Integracao com Google Agenda.
- Biblioteca de materiais educativos para enviar ao paciente.
- Relatorios gerenciais de desempenho, retencao, faltas e receita.
- Controle financeiro mais completo para rotina de consultorio.
- Acesso por perfis, como nutricionista, recepcao/secretaria e paciente.
- Recursos premium futuros: avaliacao corporal por imagem, IA assistiva, leitura assistida de exames e marca branca.

## O Que Nosso Sistema Ja Tem Como Base

- Landing page profissional com agendamento.
- Admin protegido.
- Agenda e agendamentos.
- Pagamentos e logs operacionais.
- Cadastro de pacientes.
- Prontuario.
- Antropometria.
- Plano alimentar.
- Exames.
- Relatorios.
- Templates.
- Checklist/onboarding de paciente.
- Central operacional/eventos.

## Prioridade Recomendada

1. Central do Dia
   - Consultas de hoje.
   - Retornos vencidos.
   - Pacientes sem proximo agendamento.
   - Planos a revisar.
   - Exames pendentes.
   - Pagamentos/faltas que exigem acao.

2. Resumo Pre-Consulta
   - Ultima consulta.
   - Objetivo do paciente.
   - Ultima medida.
   - Plano atual.
   - Exames pendentes.
   - Proximo passo sugerido.

3. Checklist Guiado de Consulta
   - Anamnese revisada.
   - Medidas atualizadas.
   - Exames vistos.
   - Plano entregue.
   - Retorno agendado.
   - Mensagem pos-consulta enviada.

4. Pacientes Que Precisam de Atencao
   - Sem retorno marcado.
   - Faltou consulta.
   - Plano antigo.
   - Sem evolucao registrada.
   - Exames solicitados sem resultado.
   - Inativo ha 30, 60 ou 90 dias.

5. Mensagens Prontas
   - Confirmacao de consulta.
   - Lembrete de retorno.
   - Exame pendente.
   - Pos-consulta.
   - Paciente sumido.
   - Cobranca gentil.

6. Portal do Paciente
   - Plano alimentar.
   - Lista de compras.
   - Evolucao.
   - Metas.
   - Exames enviados.
   - Materiais educativos.

7. Diario Alimentar
   - Fotos das refeicoes.
   - Marcacao de adesao.
   - Agua.
   - Treino.
   - Sintomas.
   - Comentarios do nutricionista.

8. Dashboard Financeiro e Retencao
   - Receita prevista.
   - Receita recebida.
   - Faltas.
   - Pacientes ativos.
   - Retornos vencidos.
   - Pacientes em risco de abandono.

## Roadmap Brutalmente Pratico

### 1. O que copiar do Dietbox

Copiar aqui nao significa imitar a interface. Significa absorver os blocos de valor que o mercado ja entendeu como essenciais.

#### Camada de engajamento do paciente
- Portal/app do paciente.
- Diario alimentar.
- Metas com acompanhamento.
- Lista de compras.
- Receitas.
- Lembretes de refeicao, agua, consulta e retorno.
- Chat organizado entre nutri e paciente.

Por que copiar:
- Isso aumenta adesao.
- Isso reduz abandono.
- Isso faz o paciente perceber valor continuo entre consultas.
- Isso transforma o sistema em ferramenta de acompanhamento, nao so prontuario.

#### Camada operacional do consultorio
- Integracao com Google Agenda.
- Automacao de WhatsApp com mensagens prontas e disparos por evento.
- Perfil de recepcao/secretaria.
- Controle financeiro real.
- Relatorios de desempenho.

Por que copiar:
- Isso economiza tempo da operacao.
- Isso reduz falha humana.
- Isso melhora retencao e visibilidade do consultorio.

#### Camada premium de diferenciais
- DB360 ou algum modulo proprio de antropometria assistida por foto.
- Assistente inteligente para montar refeicoes e revisar plano.
- Busca publica de nutricionistas.

Por que copiar:
- Isso aumenta percepcao de sofisticacao.
- Isso ajuda a vender plano premium.
- Isso cria distancia competitiva de sistemas mais simples.

### 2. O que fazer diferente do Dietbox

Aqui esta a chance de nao ser so "mais um Dietbox".

#### Diferenca 1: central operacional mais forte
Em vez de espalhar informacao, ter uma Central do Dia realmente acionavel:
- quem atende hoje;
- quem faltou;
- quem esta sem retorno;
- quem esta com plano vencido;
- quem tem exame pendente;
- quem corre risco de abandono.

#### Diferenca 2: fluxo clinico guiado
O sistema deve conduzir a consulta:
- pre-consulta;
- consulta;
- pos-consulta;
- acompanhamento.

Em vez de ser so um monte de tela, ele deve funcionar como um copiloto do nutricionista.

#### Diferenca 3: sistema mais comercial
Seu produto ja tem base de:
- site;
- blog;
- produtos digitais;
- leads;
- disparo.

Isso pode virar uma proposta mais forte que o Dietbox:

> consultorio + captacao + acompanhamento no mesmo produto

#### Diferenca 4: observabilidade e operacao
Seu sistema ja comeca a ter:
- logs operacionais;
- auditoria;
- painel de eventos.

Se isso evoluir bem, voce pode ter um produto mais confiavel para operacao real do que concorrentes que parecem completos, mas sao caixas fechadas.

### 3. O que ja da para vender hoje

Hoje voce ainda nao tem um SaaS aberto e maduro, mas ja tem algo vendavel em formato assistido.

#### Oferta 1: sistema + implantacao
Voce configura para o nutricionista:
- site profissional;
- agenda;
- cadastro de pacientes;
- prontuario;
- plano alimentar;
- exames;
- prescricao;
- operacao basica.

Melhor formato de venda:
- setup inicial;
- mensalidade;
- onboarding manual.

#### Oferta 2: site profissional + sistema clinico
Boa para nutricionista que quer:
- parecer mais profissional;
- captar pelo Google/Instagram;
- organizar atendimento.

#### Oferta 3: sistema para nutricionista que vende produto digital
Voce ja tem:
- loja;
- captura de leads;
- pagamentos;
- disparo.

Isso pode ser vendido como pacote de autoridade digital + organizacao clinica.

### 4. O que ainda nao da para prometer como SaaS pleno

Hoje eu evitaria prometer estas coisas como produto self-service pronto:

- onboarding automatico de nutricionista;
- multiempresa real;
- login do paciente;
- app do paciente;
- app do profissional;
- financeiro completo;
- recepcao com permissoes refinadas;
- automacoes robustas de WhatsApp;
- agenda sincronizada com servicos externos;
- acompanhamento continuo do paciente por portal proprio.

Motivo:
- ainda falta maturidade de produto e isolamento;
- isso aumenta suporte;
- isso pode gerar problema serio de operacao e dados.

### 5. O que precisa existir antes de virar SaaS de verdade

#### Bloco A: fundacao
- multitenancy de verdade;
- isolamento total de dados por conta;
- permissoes por perfil;
- onboarding de conta;
- assinatura/cobranca recorrente;
- trilha de auditoria minima.

Sem isso, vira servico customizado, nao SaaS.

#### Bloco B: experiencia do cliente final
- portal do paciente;
- fluxo de primeiro acesso;
- visualizacao de plano e exames;
- historico de evolucao;
- area de mensagens e materiais.

Sem isso, o acompanhamento fica muito dependente de WhatsApp externo.

#### Bloco C: operacao escalavel
- templates de mensagem;
- automacoes por gatilho;
- dashboard financeiro;
- dashboard de retencao;
- relatarios clinicos e operacionais.

#### Bloco D: comercializacao
- site do produto;
- planos;
- checkout de assinatura;
- demo guiada;
- trial controlado;
- onboarding dentro do produto.

### 6. Ordem de execucao que faz mais sentido

#### Fase 1 - vender melhor o que ja existe
Objetivo: aumentar credibilidade e fechar os primeiros clientes assistidos.

Fazer:
- site comercial do produto;
- demo com prints e video;
- posicionamento claro;
- planos e proposta;
- onboarding manual.

Resultado:
- voce ja consegue vender sem abrir o SaaS.

#### Fase 2 - fechar o gap operacional mais urgente
Objetivo: atacar o que mais faz falta no uso diario.

Fazer:
- Google Agenda;
- mensagens prontas/automacoes;
- financeiro basico;
- perfil recepcao;
- central do dia mais forte.

Resultado:
- produto mais util para rotina real do nutricionista.

#### Fase 3 - criar a camada de acompanhamento
Objetivo: ficar mais proximo do valor percebido do Dietbox.

Fazer:
- portal do paciente;
- diario alimentar;
- metas;
- lista de compras;
- materiais;
- lembretes.

Resultado:
- maior retencao e diferencial clinico.

#### Fase 4 - criar diferenciais premium
Objetivo: subir ticket e fugir de comparacao por preco.

Fazer:
- automacao forte de WhatsApp;
- DB360 proprio ou modulo de foto;
- assistente inteligente de plano;
- relatorios premium;
- busca publica de nutricionistas.

Resultado:
- produto com cara de plataforma, nao so sistema.

### 7. O que eu priorizaria primeiro, sem romance

Se a pergunta for "o que mexe mais no negocio agora?", minha ordem seria:

1. Site comercial do produto.
2. Google Agenda.
3. Automacao de mensagens e follow-up.
4. Financeiro basico do consultorio.
5. Perfil recepcao/secretaria.
6. Portal do paciente simples.
7. Diario alimentar e metas.

### 8. Visao de produto

O melhor caminho nao parece ser competir com o Dietbox so em "ter as mesmas features".

O caminho mais inteligente parece ser:

> construir um sistema que una consultorio, captacao e acompanhamento

Em outras palavras:
- o Dietbox e forte na operacao clinica + app;
- voce pode ficar forte em operacao clinica + site + vendas + relacionamento.

Se essa linha for bem executada, sua proposta fica menos comoditizada.

## Posicionamento

Nao vender como "nutricionista automatico".

Melhor posicionamento:

> Menos tempo montando, mais tempo cuidando.

O sistema deve ser assistivo: ajuda o nutricionista a lembrar, organizar, gerar rascunhos e acompanhar. Toda decisao clinica deve continuar com o profissional.

## Cuidados Para Depois

- IA nao deve dar diagnostico ou conduta final sem revisao profissional.
- Interpretacao de exames precisa de aprovacao do nutricionista antes de ir ao paciente.
- WhatsApp automatico em massa exige opt-in, cuidado com LGPD e politicas da Meta.
- Multiempresa/multitenancy precisa isolamento forte de dados antes de vender para varios profissionais.
- Dados de saude sao sensiveis e exigem logs, consentimento, controle de acesso e politica de retencao.
- Pagamentos recorrentes precisam fluxo claro de cancelamento, inadimplencia e preservacao de dados clinicos.
