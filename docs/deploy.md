# Deploy em VPS

Este MVP foi preparado para rodar a aplicação com Docker Compose e usar serviços externos para PostgreSQL, Redis e WPPConnect.

## Pré-requisitos

- Docker e Docker Compose instalados.
- Arquivo `.env` criado a partir de `.env.example`.
- PostgreSQL acessível pela `DATABASE_URL`.
- Redis acessível por `REDIS_HOST` e `REDIS_PORT`.
- WPPConnect acessível por `WPPCONNECT_BASE_URL`.
- Portas `3000` e `3333` livres para web e API.
- Volume persistente para arquivos de clientes.

## Variáveis essenciais

- `DATABASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `STORAGE_ROOT`
- `RESEND_API_KEY`
- `RESEND_FROM_NAME`
- `RESEND_FROM_EMAIL`
- `WPPCONNECT_BASE_URL`
- `WPPCONNECT_TOKEN`
- `WPPCONNECT_SESSION`

Nunca coloque tokens reais no frontend. Apenas variáveis com prefixo `NEXT_PUBLIC_` podem ser expostas ao navegador.

## Fluxo recomendado

```bash
npm install
npm run prisma:generate
npm run typecheck
npm run lint
npm run test
npm run build
docker compose config
npm run prisma:migrate
npm run prisma:seed
docker compose up -d --build
```

Em produção, use `prisma migrate deploy` dentro do serviço da API ou em uma etapa de release controlada.

Após o seed inicial, o administrador pode ajustar pela tela de configurações o nome do escritório, remetente, sessão WPPConnect e templates. Chaves e tokens reais permanecem somente no `.env`.

## Arquivos de clientes

Os documentos ficam no storage local e devem usar volume persistente. No Compose atual, o volume `app_storage` é montado em `/app/storage` para API e worker.

Os arquivos não são servidos como conteúdo público. Downloads passam pela API autenticada.
