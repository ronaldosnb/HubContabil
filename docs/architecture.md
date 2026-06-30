# Arquitetura do MVP

O HubContabil segue o escopo definido em `GOAL.md`: um monorepo TypeScript com frontend Next.js, API NestJS, worker NestJS/Node, PostgreSQL, Prisma, Redis/BullMQ e armazenamento local com volume persistente.

## Aplicações

- `apps/web`: interface interna da equipe. Não acessa banco diretamente.
- `apps/api`: autenticação, autorização simples, regras de negócio, Prisma, metadados de arquivos, tarefas, documentos, envios e dashboard.
- `apps/worker`: processamento assíncrono de envios, recorrências e retentativas.

## Pacotes

- `packages/shared`: enums, constantes e contratos compartilhados entre web, API e worker.
- `packages/config`: local reservado para configurações compartilhadas de tooling.

## Persistência

PostgreSQL é o banco principal. Redis é usado apenas como backend de filas. PostgreSQL, Redis e WPPConnect rodam como serviços externos configurados por variáveis de ambiente. Arquivos de clientes ficam no storage local do servidor e devem ser acessados pela API com autenticação.

Configurações não secretas do escritório ficam na tabela `SystemSetting`, incluindo nome do escritório, remetente operacional, sessão WPPConnect e templates de mensagem. Segredos como `RESEND_API_KEY` e `WPPCONNECT_TOKEN` continuam em variáveis de ambiente.
