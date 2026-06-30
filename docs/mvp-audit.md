# Auditoria do MVP

Resumo do estado implementado contra `GOAL.md`.

## Implementado

- Monorepo TypeScript com `apps/web`, `apps/api`, `apps/worker`, `packages/shared` e `packages/config`.
- Next.js, NestJS, Prisma, PostgreSQL, Redis/BullMQ, Docker Compose, Tailwind CSS e componentes base no padrão shadcn/ui.
- Autenticação interna com JWT.
- Usuários com perfis `ADMIN` e `COLLABORATOR`.
- CRUD operacional de clientes.
- Contatos por cliente, com criação, edição e remoção.
- Serviços contratados por cliente, com vínculo, observações, ativação/desativação e remoção.
- Upload de documentos com storage local abstraído.
- Listagem/filtros de documentos.
- Controle manual de status, competência, vencimento e valor de documentos, com edição, download, visualização autenticada e exclusão.
- Envios semiautomatizados com revisão humana obrigatória.
- Templates de envio configuráveis com variáveis do MVP.
- Histórico de envios com status geral e por canal.
- Worker para filas de e-mail, WhatsApp e tarefas recorrentes.
- Docker Compose com web, API e worker, usando PostgreSQL, Redis e WPPConnect externos por variáveis de ambiente.
- Kanban com filtros, drag and drop, detalhes, edição, conclusão, cancelamento e replicação de tarefas.
- Tarefas recorrentes simples.
- Dashboard com os seis indicadores definidos para o MVP.
- Configurações persistentes para dados do escritório, remetente, sessão WPPConnect, templates, departamentos e serviços.
- Activity log para ações críticas.
- Testes básicos para constantes, recorrência e segurança de caminho do storage.

## Verificações

Comandos esperados para auditoria local:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --omit=dev
DATABASE_URL='postgresql://USER:PASSWORD@POSTGRES_HOST:5432/hubcontabil?schema=public' npx prisma validate --schema apps/api/prisma/schema.prisma
docker compose config
```

## Limitação conhecida deste ambiente

O Docker daemon não está acessível para o usuário atual, então os fluxos que dependem de Postgres/Redis reais não puderam ser executados ponta a ponta neste ambiente. O Compose, Prisma schema, builds e rotas frontend foram validados estaticamente e por runtime do Next.
