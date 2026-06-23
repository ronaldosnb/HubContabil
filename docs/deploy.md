# Deploy em VPS

Este MVP foi preparado para rodar com Docker Compose em uma VPS.

## Pré-requisitos

- Docker e Docker Compose instalados.
- Arquivo `.env` criado a partir de `.env.example`.
- Portas `3000`, `3333`, `5432` e `6379` ajustadas conforme a infraestrutura.
- Volume persistente para arquivos de clientes.
- WPPConnect pode rodar como serviço externo ou pelo profile opcional `wppconnect` do Compose.

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
docker compose up -d postgres redis
npm run prisma:migrate
npm run prisma:seed
docker compose up -d --build
```

Em produção, use `prisma migrate deploy` dentro do serviço da API ou em uma etapa de release controlada.

Após o seed inicial, o administrador pode ajustar pela tela de configurações o nome do escritório, remetente, sessão WPPConnect e templates. Chaves e tokens reais permanecem somente no `.env`.

Para rodar WPPConnect no mesmo Compose, use:

```bash
docker compose --profile wppconnect up -d wppconnect
```

Nesse cenário, o worker usa `http://wppconnect:21465` como URL interna padrão. Se o WPPConnect estiver em outro servidor, defina `WPPCONNECT_BASE_URL` no `.env`.

## Arquivos de clientes

Os documentos ficam no storage local e devem usar volume persistente. No Compose atual, o volume `app_storage` é montado em `/app/storage` para API e worker.

Os arquivos não são servidos como conteúdo público. Downloads passam pela API autenticada.
