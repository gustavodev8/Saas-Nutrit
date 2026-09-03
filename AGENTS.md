# Fillipe David Nutrição — Guia do Projeto

## Sobre o projeto
Landing page profissional para o Dr. Fillipe David, nutricionista clínico e esportivo de Alagoinhas/BA.
Painel administrativo completo para o nutricionista gerenciar conteúdo, agendamentos e prontuários.

**Relatório completo:** leia `PROJETO_RELATORIO.txt` na raiz para entender toda a arquitetura.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix UI)
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- React Router v6 (SPA — depende do vercel.json para funcionar no deploy)
- Deploy: Vercel (auto-deploy via push para main)

## Estrutura de páginas
- `/` → `src/pages/Index.tsx` (home)
- `/consultas` → `src/pages/ConsultasPage.tsx`
- `/resultados` → `src/pages/ResultadosPage.tsx`
- `/admin` → painel admin protegido por Supabase Auth aaa

## Regras de codificação
- Todo conteúdo editável do site passa pelo `ContentContext` (`src/contexts/ContentContext.tsx`)
- Para editar conteúdo: use `updateContent()` — nunca edite diretamente o DEFAULT_CONTENT em produção
- Componentes de UI prontos ficam em `src/components/ui/` — não editar manualmente
- Ícones: usar **lucide-react** (já instalado)
- Estilização: **Tailwind CSS** — não usar CSS inline nem arquivos .css separados
- TypeScript estrito: sem `any`, sempre tipar props e retornos

## Padrões importantes
- Páginas internas (não-home) usam `<PageLayout>` que já inclui Navbar + Footer + WhatsApp
- A Navbar faz scroll suave para âncoras `#sobre`, `#servicos`, etc. e navega para páginas `/consultas`, `/resultados`
- WhatsApp: número `5575991268688`, links gerados via `whatsappUrl()` do ContentContext
- Sem convênios — somente particular

## Banco de dados (Supabase)
Tabelas: `site_content`, `bookings`, `availability_slots`, `consultation_records`, `payment_logs`
- `site_content`: única linha (id=1), coluna `content` JSONB com todo o conteúdo do site
- `bookings`: status possíveis → `pending | confirmed | completed | no_show | cancelled`

## O que NÃO fazer
- Não commitar o arquivo `.env`
- Não editar arquivos em `src/components/ui/` (são componentes shadcn/ui)
- Não remover o `vercel.json` (SPA routing depende dele)
- Não usar `ShopSection`, `PricingSection` ou `ScheduleSection` — estão obsoletos
- Não fazer push com `--force` para o main

## Protocolo Permanente de Colaboração

Estas regras se aplicam a qualquer Codex que trabalhar neste repositório.

1. O Codex principal atua como arquiteto e coordenador: entende requisitos, inspeciona o repositório, define critérios de aceite, revisa diffs e comunica decisões. Ele só edita documentação de governança ou handoff quando necessário.
2. Alterações de implementação devem ser delegadas a um agente full-stack com `gpt-5.6-luna` e raciocínio `high`.
3. Após a implementação, um segundo agente independente, também com `gpt-5.6-luna` e raciocínio `high`, deve fazer QA em modo read-only. O QA relata achados reproduzíveis, severidade, arquivo/linha, impacto e recomendação; não corrige código.
4. Achados que reprovem o QA retornam ao mesmo agente implementador. O ciclo continua até `PASS` ou `PASS condicional`, com as condições registradas.
5. Antes de qualquer ação remota, confirme projeto, ambiente e escopo. Nunca exponha segredos em chat, logs, commits, screenshots ou comandos exibidos.
6. Migrations, deploys e alterações remotas devem respeitar dependências de publicação. Não publique funções que dependem de migrations ainda não aplicadas.
7. Ao encerrar trabalho material, atualize `CONTINUIDADE-CODEX.md` com estado local/remoto, validações, limitações, bloqueios e próximo passo seguro.
8. Ao iniciar uma nova sessão, leia `AGENTS.md`, `CONTINUIDADE-CODEX.md`, `README.md`, os exemplos de ambiente pertinentes e o status/diff do Git antes de agir.

## Comandos úteis
```bash
npm run dev       # servidor local (localhost:8080)
npm run build     # build de produção
git push origin main  # dispara auto-deploy no Vercel
```
