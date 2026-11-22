# Rascunho de privacidade: solicitação de acesso ao SaaS

> **RASCUNHO — NÃO PUBLICADO.** A aprovação do proprietário está pendente. A revisão jurídica ainda não foi realizada para este rascunho. Este texto descreve o fluxo local atualmente implementado e uma proposta de retenção; não confirma que o intake esteja ativo em produção.

## Dados previstos no pedido

O formulário solicita nome e e-mail profissional. Telefone e CRN são opcionais. A pessoa seleciona uma categoria fixa sobre a área que deseja organizar. Não há campo de texto livre para explicar a solicitação.

O envio exige consentimento afirmativo. O fluxo registra o horário do consentimento e o horário de criação do pedido. O estado inicial é `pending`; uma pessoa autorizada pode revisar o pedido como `approved` ou `rejected`, registrando o horário e a identidade do revisor.

O formulário não solicita dados de pacientes ou informações clínicas e não oferece campo de texto livre. A categoria fixa `clinical_records` é apenas uma opção de interesse; não é um pedido para enviar prontuários. Oriente a pessoa a não incluir dados de pacientes ou informações clínicas em nenhum campo. A solicitação não cria automaticamente uma conta ou workspace. Aprovar o pedido apenas registra a decisão de triagem; emitir um convite é uma ação administrativa separada e não automática.

Os pedidos são listados e revisados somente pela função administrativa. Esse acesso exige uma conta autenticada, e-mail confirmado e endereço incluído na allowlist configurada no servidor.

## Proteção contra abuso

Para limitar envios repetidos, o fluxo também grava registros técnicos em `public_request_rate_limits`. Eles incluem uma impressão técnica SHA-256 calculada a partir do endpoint e de sinais de IP, navegador e idioma, usada no limite de cinco tentativas por hora, e um HMAC calculado a partir do endpoint e do e-mail normalizado, usado no limite de três tentativas por dia. Esses valores derivados são usados para controle de frequência e não são necessários para a triagem do pedido.

O esquema desses registros contém `created_at` e `updated_at`. **O prazo de retenção e o processo de limpeza desses registros não estão definidos; não foi encontrado um mecanismo de expurgo nas migrations/funções revisadas. Essa pendência bloqueia a abertura pública do intake.** Nenhum prazo de retenção para esses registros está proposto ou aprovado neste documento.

## Finalidade e limite de uso

Conforme o texto de consentimento apresentado no formulário, os dados profissionais são usados para analisar manualmente o pedido e entrar em contato sobre o SaaS. O consentimento não autoriza mensagens de marketing. Não usar os dados para finalidades diferentes sem definir e informar previamente uma base e um aviso apropriados.

O contato indicado para questões de privacidade é [gustavu.dev@gmail.com](mailto:gustavu.dev@gmail.com).

## Retenção e exclusão — proposta não aprovada

**Recomendação para decisão do proprietário: excluir cada registro do pedido 90 dias após sua criação.** Essa proposta aplica-se somente à linha do pedido de acesso; não define a retenção dos registros técnicos de limite contra abuso. O prazo não está aprovado, configurado ou implementado. A candidate local não estabelece prazo de retenção nem exclusão automática.

Antes de informar que a exclusão é total, é necessário confirmar os prazos e processos aplicáveis a backups e logs mantidos por provedores. Até essa confirmação, não prometer eliminação imediata ou completa de todas as cópias.

## Estado e aprovação

- Documento de trabalho, não publicado; revisão jurídica ainda não realizada para este rascunho.
- Aprovação do proprietário pendente, inclusive para o prazo proposto de 90 dias.
- Obter revisão jurídica antes de qualquer publicação ou abertura pública do formulário.
- A ativação pública do intake permanece sujeita à definição e validação do aviso, da retenção e do processo de exclusão.
