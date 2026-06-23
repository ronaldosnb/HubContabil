# AGENTS.md

## Project Context

This project is an internal MVP for a Brazilian accounting/advisory office.

The system will manage clients, documents, document sending, tasks, Kanban workflow, departments, due dates, users, and operational history.

Before implementing any relevant feature, always read `GOAL.md`.

`GOAL.md` is the main source of truth for:

* product scope
* MVP boundaries
* architecture
* system design
* screens
* database entities
* development stages
* technical decisions

Do not implement features outside the MVP scope unless explicitly requested.

---

## Product Goal

Build an internal web system for the accounting office team.

The system must centralize:

* client records
* client contacts
* contracted services
* categorized documents
* document storage
* semi-automated document sending
* email sending through Resend
* WhatsApp sending through WPPConnect
* task management
* Kanban workflow
* recurring tasks
* replicated tasks
* departments
* due dates
* manual document status control
* operational dashboard
* client history and activity log

The MVP does not include client portal access.

---

## Required Stack

Use TypeScript across the project.

Required stack:

* Frontend: Next.js
* Backend: NestJS
* Worker: Node/NestJS
* Database: PostgreSQL
* ORM: Prisma
* Queue/jobs: BullMQ
* Queue backend: Redis
* Email provider: Resend
* WhatsApp provider: WPPConnect
* UI: Tailwind CSS
* Components: shadcn/ui
* Deployment: Docker Compose on a VPS
* File storage in MVP: local VPS storage with persistent Docker volume

---

## Repository Structure

Use a monorepo structure:

```txt
apps/
  web/
    Next.js frontend

  api/
    NestJS backend API

  worker/
    Worker service for queues, sending jobs, recurring tasks and background processing

packages/
  shared/
    Shared TypeScript types, enums, DTO helpers and constants

  config/
    Shared configuration for TypeScript, ESLint, Prettier and tooling

docs/
  Project documentation

storage/
  Local development storage folder for uploaded files when applicable
```

Avoid creating a generic `src/` root application. The system must be organized around the monorepo structure above.

---

## Architecture Rules

Keep frontend, backend and worker separated, but inside the same repository.

The frontend must not directly access the database.

The frontend must communicate with the backend API.

The backend must own:

* authentication
* authorization
* business rules
* database access
* file metadata
* task management
* document management
* sending orchestration

The worker must own:

* Resend email sending jobs
* WPPConnect WhatsApp sending jobs
* retry logic
* recurring task generation
* background processing

Use PostgreSQL as the main database.

Do not use NoSQL as the main database.

Use Prisma for schema, migrations and database access.

Use Redis and BullMQ for async jobs.

Use local file storage in the MVP, but abstract storage behind a service to allow future migration to S3, Google Drive, MinIO or another provider.

---

## MVP Boundaries

Do not implement in the MVP unless explicitly requested:

* client portal
* client login
* mobile app
* automatic tax generation
* integration with accounting software
* banking integration
* automatic payment confirmation
* digital signature
* AI document classification
* automatic invoice reading
* full financial ERP
* advanced multi-tenant SaaS
* complex permission system
* internal chat

Focus on:

* clients
* documents
* sending
* tasks
* Kanban
* history
* due dates
* departments
* responsible users
* dashboard

---

## Users and Permissions

The MVP has only two user roles:

* ADMIN
* COLLABORATOR

Do not create complex permission rules in the MVP.

Admin can manage users and system settings.

Collaborator can use the operational features according to simple MVP rules.

---

## Main Screens

The frontend must include these main screens:

* Login
* Dashboard
* Kanban
* Clients
* Client details
* Documents
* New document
* Document sending
* Send history
* Recurring tasks
* Users
* Settings

The Kanban must be the main task management screen.

---

## Kanban Requirements

Kanban columns:

* A fazer
* Em andamento
* Aguardando cliente
* Concluída
* Cancelada

Task cards must show:

* task title
* client
* responsible user
* department
* due date
* priority
* current status
* overdue indicator
* recurring task indicator when applicable
* replicated task indicator when applicable
* linked document when applicable

Kanban must support:

* creating tasks
* editing tasks
* opening task details
* drag and drop between columns
* updating status after moving cards
* filtering by responsible user
* filtering by department
* filtering by client
* filtering by due date
* filtering by priority
* filtering overdue tasks
* filtering recurring tasks
* replicating old tasks

---

## Documents

Documents must be stored by client and category.

Initial document categories:

* Guias de impostos
* Boletos
* Departamento pessoal / folha
* Contrato social
* Documentos pessoais
* Procurações
* Declarações
* Certidões
* Notas fiscais
* Outros

Documents may have:

* category
* title
* description
* competence
* due date
* amount
* manual status
* file metadata
* storage path

Document status in MVP:

* Pendente
* Enviado
* Pago
* Vencido
* Cancelado

Payment and due-date control is manual in the MVP.

---

## Document Sending

Document sending must be semi-automated in the MVP.

The user must review and confirm before sending.

Supported channels:

* Email through Resend
* WhatsApp through WPPConnect
* Both channels at the same time

Each sending action must generate history.

Track status separately for each channel.

Example:

* Email: sent
* WhatsApp: error

Do not send documents automatically without human confirmation in the MVP.

---

## Dashboard

The initial dashboard must show only:

* Tarefas abertas
* Tarefas vencidas
* Documentos pendentes de envio
* Envios com erro
* Documentos próximos do vencimento
* Clientes ativos

Each dashboard card should link to the related filtered screen when possible.

---

## Design System

Use a corporate, clean and modern visual style.

Initial brand direction:

* primary color: #0D2D53
* font: Inter
* neutral background
* white cards
* subtle borders
* readable interface
* productivity-focused layout

Use Tailwind CSS and shadcn/ui.

The theme must be implemented with CSS variables and design tokens.

Do not hardcode colors directly inside components.

Use theme tokens such as:

* `--background`
* `--foreground`
* `--primary`
* `--primary-foreground`
* `--secondary`
* `--muted`
* `--muted-foreground`
* `--card`
* `--card-foreground`
* `--border`
* `--success`
* `--warning`
* `--danger`
* `--info`
* `--radius`
* `--font-sans`
* `--kanban-column-bg`
* `--kanban-card-bg`

The design must be ready for future palette changes and future dark mode.

---

## Security Rules

Do not commit secrets.

Use `.env` files for local secrets.

Provide `.env.example` with safe placeholder values.

Never expose Resend tokens, WPPConnect tokens, database credentials or JWT secrets in frontend code.

Uploaded client files must not be publicly accessible without authentication.

Validate file uploads.

Limit file size.

Validate file type.

Hash user passwords securely.

Use backend validation for all important inputs.

Register important actions in an activity log.

---

## Development Workflow

Before coding:

1. Read `GOAL.md`.
2. Understand the current implementation stage.
3. Do not jump to future stages.
4. Plan briefly before changing many files.
5. Prefer small, incremental changes.
6. Keep the project runnable after each step.

When implementing:

* Keep modules organized.
* Use TypeScript types consistently.
* Prefer clear names over abbreviations.
* Keep business rules in backend services.
* Keep UI components clean and reusable.
* Do not mix frontend-only logic with backend business rules.
* Update documentation when architectural decisions change.

---

## Development Stages

Follow the stages from `GOAL.md`.

Recommended order:

1. Base monorepo setup
2. Clients
3. Documents
4. Tasks and Kanban
5. Document sending
6. Recurring tasks and dashboard
7. Refinement, security, deploy and tests

Do not implement all stages at once.

---

## Commands

Root commands currently available:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
docker compose up -d
```

Workspace commands:

```bash
npm run dev -w @hubcontabil/web
npm run dev -w @hubcontabil/api
npm run dev -w @hubcontabil/worker
```

Only document commands that actually exist in the repository.

---

## Commit and PR Guidelines

Use clear, concise commit messages.

Examples:

```txt
Add client management module
Create document upload service
Add task Kanban board
Configure Prisma schema
Add Resend email queue
```

For UI changes, include screenshots when applicable.

For backend changes, describe migrations and environment variables when applicable.

---

## Final Rule

When in doubt, follow `GOAL.md`.

The MVP must stay focused, practical and useful for the accounting office operation.
