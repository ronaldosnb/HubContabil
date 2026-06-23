cl

Desenvolver um MVP de sistema web interno para gerenciamento de clientes, documentos, tarefas e envios automatizados de um escritório de assessoria/contabilidade.

O sistema será usado apenas pela equipe interna do escritório, sem acesso de clientes no MVP. O objetivo principal é organizar a operação do escritório, centralizando informações de clientes, documentos, tarefas, pendências, histórico e envios de documentos por e-mail e WhatsApp.

O sistema deve resolver principalmente os seguintes problemas:

* Falta de organização causada pelo crescimento do escritório.
* Informações de clientes espalhadas em WhatsApp, planilhas, pastas locais e memória da equipe.
* Dificuldade para saber quais tarefas estão abertas, atrasadas ou aguardando cliente.
* Falta de histórico confiável sobre documentos enviados.
* Dificuldade para controlar guias, boletos, vencimentos e documentos recorrentes.
* Falta de uma visão visual e operacional das tarefas por responsável, setor, prazo e etapa.

---

# 1. Escopo principal do MVP

O MVP deve conter:

1. Autenticação de usuários internos.
2. Controle de usuários com dois perfis:

   * Administrador
   * Colaborador
3. Cadastro e gestão de clientes.
4. Cadastro de contatos por cliente.
5. Cadastro dos serviços contratados por cliente.
6. Armazenamento de documentos dos clientes por categoria.
7. Upload de documentos em armazenamento local na VPS.
8. Envio semiautomatizado de documentos por e-mail e WhatsApp.
9. Revisão humana obrigatória antes do envio no MVP.
10. Histórico completo de envios por cliente.
11. Controle manual e simples de vencimentos, valores e status dos documentos.
12. Gestão de tarefas com Kanban como tela principal.
13. Tarefas manuais, tarefas recorrentes e possibilidade de replicar tarefas antigas.
14. Separação de tarefas por departamento.
15. Dashboard inicial com indicadores operacionais.
16. Identidade visual corporativa, limpa e baseada em variáveis de tema.

---

# 2. Stack técnica definida

Utilizar TypeScript em todo o projeto.

Stack final:

* Linguagem: TypeScript
* Frontend: Next.js
* Backend: NestJS
* Banco de dados: PostgreSQL
* ORM: Prisma
* Interface: Tailwind CSS + shadcn/ui
* E-mail: Resend
* WhatsApp: WPPConnect
* Armazenamento de arquivos no MVP: local na VPS
* Jobs e filas: BullMQ + Redis
* Deploy: Docker Compose em VPS
* Arquitetura: monorepo

Estrutura recomendada do monorepo:

/apps
/web
Aplicação frontend em Next.js
/api
Backend principal em NestJS
/worker
Serviço responsável por filas, envios e tarefas recorrentes

/packages
/shared
Tipos, enums, schemas e utilitários compartilhados
/config
Configurações comuns de lint, TypeScript, prettier etc.
/ui
Opcional: componentes compartilhados, se necessário

---

# 3. Arquitetura geral do sistema

O sistema deve ser dividido em três partes principais:

## 3.1 Frontend - Next.js

Responsável pela interface web usada pela equipe interna.

Principais responsabilidades:

* Login.
* Dashboard.
* Kanban de tarefas.
* Gestão de clientes.
* Página individual do cliente.
* Gestão de documentos.
* Tela de envio de documentos.
* Gestão de usuários.
* Configurações básicas.
* Consumo da API NestJS.
* Interface responsiva.
* Uso de componentes shadcn/ui.
* Tema baseado em CSS variables/design tokens.

## 3.2 Backend - NestJS

Responsável pela regra de negócio, autenticação, permissões, API e persistência.

Principais responsabilidades:

* Autenticação e autorização.
* CRUD de clientes.
* CRUD de contatos.
* CRUD de documentos.
* Upload e organização de arquivos.
* CRUD de tarefas.
* Controle de tarefas recorrentes.
* Histórico de ações.
* Criação de envios.
* Integração com filas.
* Registro dos resultados dos envios.
* API para dashboard.
* API para Kanban.
* API para configurações.

## 3.3 Worker - Node/NestJS

Responsável por processos assíncronos.

Principais responsabilidades:

* Processar envios de e-mail via Resend.
* Processar envios de WhatsApp via WPPConnect.
* Registrar status de envio por canal.
* Processar tarefas recorrentes.
* Gerar tarefas futuras com base em regras recorrentes.
* Evitar que envios travem a interface.
* Permitir retentativas em caso de erro.

---

# 4. Banco de dados

Usar PostgreSQL como banco principal.

Não usar NoSQL como banco principal no MVP, pois o sistema possui muitas relações entre clientes, documentos, tarefas, usuários, envios, contatos e histórico.

Usar Prisma como ORM.

O banco deve ser relacional, mas pode utilizar campos JSONB quando fizer sentido para metadados flexíveis.

Principais entidades sugeridas:

## 4.1 User

Representa usuários internos do escritório.

Campos sugeridos:

* id
* name
* email
* passwordHash
* role: ADMIN ou COLLABORATOR
* isActive
* createdAt
* updatedAt

Regras:

* Administrador pode gerenciar usuários, clientes, documentos, tarefas e configurações.
* Colaborador pode criar e editar clientes, documentos, tarefas e envios, conforme regra inicial simples.
* No MVP, não implementar permissões muito complexas por módulo.

## 4.2 Client

Representa o cliente do escritório.

Campos sugeridos:

* id
* type: pessoa física, pessoa jurídica, MEI, produtor rural, outro
* name
* legalName
* documentNumber: CPF ou CNPJ
* taxRegime
* status: ACTIVE, INACTIVE, PROSPECT, SUSPENDED
* internalResponsibleId
* notes
* createdAt
* updatedAt

Status do cliente:

* Ativo
* Inativo
* Prospect
* Suspenso

## 4.3 ClientContact

Contatos vinculados ao cliente.

Campos sugeridos:

* id
* clientId
* name
* roleDescription
* email
* phone
* whatsapp
* isMain
* preferredChannel: EMAIL, WHATSAPP ou BOTH
* createdAt
* updatedAt

Objetivo:

Permitir que o escritório envie documentos para o contato correto, como responsável financeiro, sócio, administrador, responsável fiscal etc.

## 4.4 Service

Serviços oferecidos pelo escritório.

Exemplos:

* Contábil
* Fiscal
* Departamento Pessoal
* Financeiro
* Societário
* MEI
* Produtor Rural
* Imposto de Renda
* Honorários
* Consultoria
* Outros

Campos sugeridos:

* id
* name
* description
* isActive

## 4.5 ClientService

Tabela de vínculo entre cliente e serviços contratados.

Campos sugeridos:

* id
* clientId
* serviceId
* isActive
* notes
* createdAt
* updatedAt

## 4.6 Department

Departamentos internos.

Departamentos iniciais:

* Fiscal
* Contábil
* Departamento Pessoal
* Financeiro
* Societário
* Administrativo

Campos sugeridos:

* id
* name
* description
* isActive

## 4.7 Document

Representa documentos armazenados no sistema.

Categorias iniciais:

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

Campos sugeridos:

* id
* clientId
* uploadedByUserId
* category
* title
* description
* originalFileName
* storedFileName
* storagePath
* mimeType
* size
* competence
* dueDate
* amount
* status
* createdAt
* updatedAt

Status de documento:

* Pendente
* Enviado
* Pago
* Vencido
* Cancelado

Observação:

No MVP, o controle de vencimento, pagamento e status será manual. O sistema não precisa confirmar pagamento automaticamente.

## 4.8 DocumentSend

Representa uma ação de envio de documento.

Campos sugeridos:

* id
* documentId
* clientId
* createdByUserId
* reviewedByUserId
* messageSubject
* messageBody
* sendEmail: boolean
* sendWhatsapp: boolean
* status: PENDING, PROCESSING, SENT, PARTIAL_ERROR, ERROR, CANCELED
* createdAt
* sentAt
* updatedAt

Esse registro representa o envio geral.

## 4.9 DocumentSendChannel

Representa o status separado por canal.

Campos sugeridos:

* id
* documentSendId
* channel: EMAIL ou WHATSAPP
* recipientName
* recipientEmail
* recipientWhatsapp
* status: PENDING, SENT, ERROR, RETRYING, CANCELED
* providerMessageId
* errorMessage
* sentAt
* createdAt
* updatedAt

Motivo:

Como o mesmo documento pode ser enviado por e-mail e WhatsApp, cada canal precisa ter status próprio.

Exemplo:

* E-mail: enviado
* WhatsApp: erro por número inválido

## 4.10 Task

Representa uma tarefa operacional do escritório.

Campos sugeridos:

* id
* clientId
* title
* description
* departmentId
* responsibleUserId
* createdByUserId
* status
* priority
* dueDate
* completedAt
* isRecurringInstance
* recurringTaskId
* replicatedFromTaskId
* createdAt
* updatedAt

Status de tarefa:

* A fazer
* Em andamento
* Aguardando cliente
* Concluída
* Cancelada

Prioridade:

* Baixa
* Média
* Alta
* Urgente

A tarefa deve poder estar vinculada a:

* cliente
* departamento
* responsável
* documento, se necessário
* envio, se necessário

## 4.11 RecurringTask

Representa uma regra de recorrência para gerar tarefas automaticamente.

Campos sugeridos:

* id
* title
* description
* clientId opcional
* departmentId
* responsibleUserId
* recurrenceRule
* nextRunAt
* isActive
* createdAt
* updatedAt

Exemplos de recorrência:

* Todo mês, dia 5, criar tarefa “Enviar DAS”
* Todo mês, dia 10, criar tarefa “Enviar boleto de honorários”
* Toda semana, criar tarefa de conferência de pendências

No MVP, a recorrência pode ser simples.

## 4.12 ActivityLog

Histórico geral de ações relevantes.

Campos sugeridos:

* id
* clientId opcional
* userId
* entityType
* entityId
* action
* description
* metadata JSONB
* createdAt

Deve registrar ações como:

* Cliente criado
* Documento enviado
* Documento reenviado
* Status de tarefa alterado
* Tarefa replicada
* Arquivo anexado
* Envio com erro
* Tarefa concluída

---

# 5. Armazenamento de arquivos

No MVP, os arquivos devem ser armazenados localmente na VPS.

Estrutura sugerida:

/storage
/clients
/{clientId}
/documents
/{year}
/{month}
arquivo.pdf

Regras:

* Nunca confiar apenas no nome original do arquivo.
* Gerar nome único interno para cada arquivo.
* Salvar o nome original no banco.
* Salvar caminho relativo no banco.
* Validar tipo de arquivo.
* No MVP, aceitar principalmente PDF, imagens e documentos comuns.
* Preparar abstração de storage para futura troca para S3, Google Drive, MinIO ou outro storage.

Criar uma interface de storage no backend, por exemplo:

StorageService

* saveFile()
* getFile()
* deleteFile()
* getFileUrl()
* moveFile()

Mesmo usando armazenamento local, evitar acoplamento direto para facilitar migração futura.

---

# 6. Envio de documentos

O envio de documentos deve ser semiautomatizado no MVP.

Fluxo principal:

1. Usuário acessa a tela de novo envio.
2. Seleciona o cliente.
3. Seleciona ou faz upload do documento.
4. Escolhe a categoria do documento.
5. Informa competência, vencimento e valor, se aplicável.
6. Escolhe o destinatário.
7. Escolhe os canais:

   * E-mail
   * WhatsApp
   * Ambos
8. O sistema gera uma mensagem com base em template.
9. O usuário revisa a mensagem.
10. O usuário confirma o envio.
11. O backend cria um registro de envio.
12. O backend adiciona jobs na fila.
13. O worker processa o envio por e-mail e/ou WhatsApp.
14. O sistema registra o status de cada canal.
15. O histórico do cliente é atualizado.

No MVP, não enviar automaticamente sem confirmação humana.

Status gerais do envio:

* Pendente
* Processando
* Enviado
* Erro parcial
* Erro
* Cancelado

Status por canal:

* Pendente
* Enviado
* Erro
* Reenviando
* Cancelado

Integrações:

* Resend para e-mail
* WPPConnect para WhatsApp

Templates de mensagem devem permitir variáveis:

* {nome_cliente}
* {documento}
* {categoria}
* {competencia}
* {vencimento}
* {valor}
* {nome_escritorio}
* {nome_usuario}

Exemplo de template de e-mail:

Assunto:
Envio de {documento} - {competencia}

Mensagem:
Olá, {nome_cliente}.

Segue em anexo o documento {documento}, referente à competência {competencia}, com vencimento em {vencimento}.

Qualquer dúvida, estamos à disposição.

Atenciosamente,
Equipe do escritório.

Exemplo de WhatsApp:

Olá, {nome_cliente}. Segue em anexo o documento {documento}, referente à competência {competencia}, com vencimento em {vencimento}. Qualquer dúvida, estamos à disposição.

---

# 7. Gestão de tarefas e Kanban

O Kanban deve ser a tela principal de gestão de tarefas.

Colunas do Kanban:

* A fazer
* Em andamento
* Aguardando cliente
* Concluída
* Cancelada

Cada card de tarefa deve exibir:

* Título da tarefa
* Nome do cliente
* Responsável
* Departamento
* Prazo
* Prioridade
* Status
* Indicador de atraso, quando vencida
* Indicador se é tarefa recorrente
* Indicador se foi replicada de tarefa antiga
* Documento vinculado, se houver

Ações no Kanban:

* Criar nova tarefa.
* Abrir detalhes da tarefa.
* Editar tarefa.
* Arrastar tarefa entre colunas.
* Alterar status ao mover card.
* Filtrar por responsável.
* Filtrar por departamento.
* Filtrar por cliente.
* Filtrar por prazo.
* Filtrar por prioridade.
* Filtrar por vencidas.
* Filtrar por recorrentes.
* Replicar tarefa antiga.
* Concluir tarefa.
* Cancelar tarefa.

Tela de detalhes da tarefa:

Deve mostrar:

* Título
* Cliente vinculado
* Departamento
* Responsável
* Criador
* Status
* Prioridade
* Prazo
* Descrição
* Comentários internos, se implementado
* Histórico de alterações
* Documento vinculado, se existir
* Botão para replicar tarefa
* Botão para concluir
* Botão para cancelar

Replicar tarefa antiga:

Ao replicar uma tarefa, o sistema deve copiar:

* título
* descrição
* cliente
* departamento
* prioridade
* responsável, se desejado

Mas deve permitir editar:

* novo prazo
* novo responsável
* status inicial
* observações

Tarefas recorrentes:

Deve ser possível criar regras simples de recorrência, como:

* diária
* semanal
* mensal
* mensal em dia específico

No MVP, a recorrência não precisa ser extremamente avançada. Deve ser suficiente para tarefas operacionais comuns do escritório.

---

# 8. Telas do sistema

## 8.1 Tela de login

Objetivo:

Permitir acesso seguro apenas para usuários internos.

Elementos:

* Logo ou nome do sistema/escritório
* Campo de e-mail
* Campo de senha
* Botão entrar
* Mensagem de erro em caso de login inválido

Não precisa ter cadastro público.

## 8.2 Layout principal autenticado

O sistema deve ter layout com:

* Sidebar lateral
* Topbar
* Área principal de conteúdo

Sidebar com menus:

* Dashboard
* Kanban
* Clientes
* Documentos
* Envios
* Tarefas recorrentes
* Usuários
* Configurações

A tela principal deve ser limpa, profissional e orientada à produtividade.

## 8.3 Dashboard

Dashboard inicial deve conter apenas os indicadores definidos para o MVP:

* Tarefas abertas
* Tarefas vencidas
* Documentos pendentes de envio
* Envios com erro
* Documentos próximos do vencimento
* Clientes ativos

O dashboard deve ter cards resumidos com números e atalhos.

Exemplos:

* Card “Tarefas abertas” → ao clicar, vai para Kanban filtrado.
* Card “Tarefas vencidas” → ao clicar, vai para Kanban com filtro de vencidas.
* Card “Documentos pendentes de envio” → ao clicar, vai para documentos filtrados.
* Card “Envios com erro” → ao clicar, vai para tela de envios com erro.
* Card “Documentos próximos do vencimento” → ao clicar, vai para documentos com vencimento próximo.
* Card “Clientes ativos” → ao clicar, vai para listagem de clientes ativos.

## 8.4 Tela Kanban

Essa deve ser uma das telas mais importantes do sistema.

Elementos:

* Título: Kanban de Tarefas
* Botão “Nova tarefa”
* Filtros superiores:

  * Cliente
  * Responsável
  * Departamento
  * Prioridade
  * Prazo
  * Vencidas
  * Recorrentes
* Colunas:

  * A fazer
  * Em andamento
  * Aguardando cliente
  * Concluída
  * Cancelada
* Cards com informações resumidas
* Drag and drop para mover tarefas
* Modal ou drawer para detalhes da tarefa

O Kanban deve ser funcional e simples no MVP, sem excesso de recursos.

## 8.5 Tela de clientes

Lista de clientes com:

* Busca por nome, razão social, CPF ou CNPJ
* Filtro por status
* Filtro por responsável interno
* Filtro por tipo de cliente
* Botão “Novo cliente”

Tabela/lista com:

* Nome
* CPF/CNPJ
* Tipo
* Status
* Responsável interno
* Contato principal
* Quantidade de tarefas abertas
* Quantidade de documentos pendentes
* Ação para abrir cliente

## 8.6 Tela de cadastro/edição de cliente

Campos:

* Tipo de cliente
* Nome
* Razão social
* CPF/CNPJ
* Regime tributário
* Status
* Responsável interno
* Observações

Seções relacionadas:

* Contatos
* Serviços contratados

## 8.7 Página individual do cliente

Essa tela deve centralizar tudo sobre um cliente.

Deve conter:

* Cabeçalho com nome do cliente, status, CPF/CNPJ e responsável interno
* Abas ou seções:

  * Visão geral
  * Contatos
  * Serviços
  * Documentos
  * Envios
  * Tarefas
  * Histórico

Aba visão geral:

* Dados cadastrais
* Status
* Serviços ativos
* Contato principal
* Tarefas abertas
* Documentos próximos do vencimento
* Últimos envios
* Últimas atividades

Aba contatos:

* Lista de contatos
* Novo contato
* Editar contato
* Canal preferencial

Aba serviços:

* Serviços contratados
* Ativar/desativar serviço
* Observações

Aba documentos:

* Lista de documentos do cliente
* Filtro por categoria
* Filtro por status
* Filtro por competência
* Filtro por vencimento
* Botão “Novo documento”
* Botão “Enviar documento”

Aba envios:

* Histórico de envios
* Documento enviado
* Canal usado
* Destinatário
* Status por canal
* Data
* Usuário responsável
* Erro, se houver
* Opção de reenviar

Aba tarefas:

* Tarefas abertas do cliente
* Tarefas concluídas
* Nova tarefa
* Replicar tarefa

Aba histórico:

* Linha do tempo com eventos relevantes:

  * cliente criado
  * documento enviado
  * tarefa criada
  * tarefa concluída
  * envio com erro
  * documento atualizado
  * status alterado

## 8.8 Tela de documentos

Tela geral para visualizar documentos de todos os clientes.

Filtros:

* Cliente
* Categoria
* Status
* Competência
* Vencimento
* Próximos do vencimento
* Pendentes de envio

Tabela com:

* Documento
* Cliente
* Categoria
* Competência
* Vencimento
* Valor
* Status
* Enviado ou não
* Ações

Ações:

* Visualizar
* Baixar
* Enviar
* Editar informações
* Excluir, apenas se permitido

## 8.9 Tela de novo documento

Campos:

* Cliente
* Categoria
* Título
* Descrição
* Competência
* Vencimento
* Valor
* Upload do arquivo
* Status inicial

Após salvar, permitir:

* Voltar para cliente
* Enviar documento
* Cadastrar outro

## 8.10 Tela de envio de documento

Tela fundamental do sistema.

Campos:

* Cliente
* Documento
* Categoria
* Competência
* Vencimento
* Valor
* Destinatário
* Canais:

  * E-mail
  * WhatsApp
  * Ambos
* Template de mensagem
* Assunto do e-mail
* Corpo da mensagem
* Prévia do arquivo anexado
* Botão “Revisar envio”
* Botão “Confirmar envio”

Regras:

* O envio só acontece após confirmação humana.
* Antes de confirmar, mostrar resumo:

  * cliente
  * documento
  * destinatário
  * e-mail
  * WhatsApp
  * canais
  * mensagem
  * arquivo
* Após confirmar, criar registro de envio e jobs na fila.

## 8.11 Tela de envios

Tela para acompanhar todos os envios.

Filtros:

* Cliente
* Documento
* Canal
* Status
* Data
* Com erro

Tabela:

* Documento
* Cliente
* Canal
* Destinatário
* Status geral
* Status e-mail
* Status WhatsApp
* Data
* Usuário
* Ações

Ações:

* Ver detalhes
* Reenviar
* Cancelar, se ainda pendente
* Ver erro

## 8.12 Tela de tarefas recorrentes

Campos/listagem:

* Nome da recorrência
* Cliente, se aplicável
* Departamento
* Responsável
* Frequência
* Próxima execução
* Ativo/inativo

Ações:

* Criar recorrência
* Editar
* Ativar/desativar
* Gerar tarefa manualmente a partir da recorrência

## 8.13 Tela de usuários

Disponível para administrador.

Campos:

* Nome
* E-mail
* Perfil
* Status ativo/inativo

Ações:

* Criar usuário
* Editar usuário
* Desativar usuário
* Resetar senha, se implementado

Perfis:

* Administrador
* Colaborador

## 8.14 Tela de configurações

Configurações básicas:

* Nome do escritório
* Dados de remetente de e-mail
* Configurações de templates
* Configuração de WPPConnect
* Configuração de Resend
* Categorias de documentos
* Departamentos
* Serviços
* Tema visual, se implementado futuramente

---

# 9. Identidade visual e design system

A interface deve ser corporativa, limpa, moderna, objetiva e fácil de usar diariamente.

Identidade visual inicial:

* Cor principal: azul escuro #0D2D53
* Fonte principal: Inter
* Fundo: cinza muito claro
* Cards: branco
* Texto principal: cinza escuro
* Texto secundário: cinza médio
* Bordas: cinza claro
* Layout: responsivo
* Componentes: shadcn/ui
* Estilização: Tailwind CSS

Obrigatório:

A identidade visual deve ser implementada usando variáveis de tema e design tokens.

Evitar cores fixas diretamente nos componentes.

Usar CSS variables para permitir troca futura de paleta, fonte, bordas e estilos principais.

Exemplo conceitual de variáveis:

--background
--foreground
--primary
--primary-foreground
--secondary
--muted
--muted-foreground
--card
--card-foreground
--border
--success
--warning
--danger
--info
--radius
--font-sans
--kanban-column-bg
--kanban-card-bg

O sistema deve estar preparado para:

* troca futura de paleta
* modo escuro futuramente
* customização da marca
* manutenção centralizada do tema

Não usar valores como #0D2D53 espalhados em componentes. Usar classes e tokens como:

* bg-primary
* text-primary
* bg-card
* border-border
* text-muted-foreground

---

# 10. System design dos fluxos principais

## 10.1 Fluxo de upload de documento

1. Frontend envia arquivo e metadados para API.
2. API valida usuário autenticado.
3. API valida cliente.
4. API valida categoria e dados do documento.
5. API salva arquivo no storage local.
6. API salva metadados no PostgreSQL.
7. API cria registro no histórico.
8. Frontend recebe confirmação.

## 10.2 Fluxo de envio de documento

1. Usuário seleciona documento.
2. Usuário escolhe destinatário e canais.
3. Frontend mostra prévia da mensagem.
4. Usuário revisa e confirma.
5. API cria DocumentSend.
6. API cria DocumentSendChannel para cada canal.
7. API adiciona jobs no BullMQ.
8. Worker processa envio de e-mail via Resend.
9. Worker processa envio de WhatsApp via WPPConnect.
10. Worker atualiza status por canal.
11. Worker atualiza status geral do envio.
12. API registra histórico no cliente.
13. Frontend exibe status atualizado.

## 10.3 Fluxo do Kanban

1. Frontend busca tarefas agrupadas por status.
2. API retorna tarefas com cliente, responsável, departamento, prazo e prioridade.
3. Usuário arrasta card para outra coluna.
4. Frontend chama API de atualização de status.
5. API valida permissão.
6. API atualiza status da tarefa.
7. API registra histórico.
8. Frontend atualiza a coluna.

## 10.4 Fluxo de tarefa recorrente

1. Usuário cria regra de recorrência.
2. API salva regra no banco.
3. Worker verifica recorrências ativas periodicamente.
4. Worker cria nova tarefa quando chegar a data.
5. Worker atualiza nextRunAt.
6. Sistema registra histórico.

## 10.5 Fluxo de replicar tarefa

1. Usuário abre uma tarefa antiga.
2. Usuário clica em “Replicar”.
3. Sistema abre formulário com dados pré-preenchidos.
4. Usuário ajusta prazo, responsável e descrição.
5. API cria nova tarefa com referência à tarefa original.
6. Sistema registra histórico.

---

# 11. Segurança e boas práticas

Implementar:

* Autenticação com JWT ou sessão segura.
* Senhas com hash seguro.
* Validação de entrada no backend.
* Controle de acesso por perfil.
* Sanitização de uploads.
* Limite de tamanho de arquivo.
* Validação de tipos de arquivo.
* Logs de ações importantes.
* Variáveis de ambiente para credenciais.
* Não expor tokens de Resend ou WPPConnect no frontend.
* Não servir arquivos privados sem validação de autenticação.
* Histórico para ações críticas.

Arquivos dos clientes devem ser protegidos. Não devem ficar públicos sem autenticação.

---

# 12. Docker e deploy

O projeto deve ser preparado para rodar em VPS usando Docker Compose.

Serviços esperados:

* web
* api
* worker
* postgres
* redis
* wppconnect, se aplicável
* nginx ou reverse proxy, se necessário

Exemplo conceitual:

docker-compose.yml deve conter:

* aplicação frontend
* aplicação backend
* worker
* banco PostgreSQL
* Redis para filas
* volume persistente para banco
* volume persistente para arquivos
* variáveis de ambiente

O armazenamento local dos documentos deve usar volume persistente para evitar perda de arquivos ao recriar containers.

---

# 13. Limites do MVP

Não implementar no MVP:

* Portal do cliente
* Login de clientes
* App mobile
* Geração automática de impostos
* Integração com sistema contábil externo
* Integração bancária
* Confirmação automática de pagamento
* Assinatura digital
* Inteligência artificial para classificar documentos
* Leitura automática de notas fiscais
* Controle financeiro completo do escritório
* Multiempresa/SaaS avançado
* Permissões muito complexas
* Chat interno completo

Essas funcionalidades podem ser consideradas em versões futuras.

---

# 14. Critérios de sucesso do MVP

O MVP será considerado bem-sucedido se:

* O escritório conseguir cadastrar e organizar seus clientes.
* Cada cliente tiver uma página centralizada com dados, contatos, documentos, envios, tarefas e histórico.
* A equipe conseguir armazenar documentos por categoria.
* A equipe conseguir enviar documentos por e-mail e WhatsApp com revisão humana.
* O sistema registrar histórico completo dos envios.
* O sistema mostrar status separado por canal de envio.
* O sistema permitir controlar vencimentos de forma simples e manual.
* O Kanban permitir visualizar e organizar tarefas por etapa, responsável, setor e prazo.
* O dashboard mostrar rapidamente tarefas abertas, tarefas vencidas, documentos pendentes, envios com erro, documentos próximos do vencimento e clientes ativos.
* O sistema reduzir dependência de planilhas, WhatsApp e pastas locais.
* O projeto estiver organizado em arquitetura modular, fácil de evoluir e manter.

---

# 15. Prioridade de desenvolvimento

Desenvolver o MVP em etapas:

## Etapa 1 - Base do projeto

* Configurar monorepo.
* Configurar Next.js.
* Configurar NestJS.
* Configurar PostgreSQL.
* Configurar Prisma.
* Configurar Docker Compose.
* Configurar autenticação.
* Criar estrutura visual base com Tailwind, shadcn/ui e tema por variáveis.

## Etapa 2 - Clientes

* CRUD de clientes.
* CRUD de contatos.
* Serviços contratados.
* Página individual do cliente.

## Etapa 3 - Documentos

* Upload de documentos.
* Categorias.
* Armazenamento local.
* Listagem e filtros.
* Vencimento, competência, valor e status manual.

## Etapa 4 - Tarefas e Kanban

* CRUD de tarefas.
* Kanban principal.
* Filtros.
* Drag and drop.
* Responsável, departamento, prazo e prioridade.
* Replicação de tarefas antigas.

## Etapa 5 - Envios

* Templates de mensagem.
* Envio por e-mail via Resend.
* Envio por WhatsApp via WPPConnect.
* Revisão humana antes do envio.
* Histórico de envios.
* Status por canal.
* Reenvio em caso de erro.

## Etapa 6 - Recorrências e dashboard

* Tarefas recorrentes simples.
* Worker com BullMQ e Redis.
* Dashboard operacional.
* Histórico de ações.

## Etapa 7 - Refinamento

* Melhorias de UX.
* Tratamento de erros.
* Logs.
* Segurança dos arquivos.
* Ajustes de responsividade.
* Testes básicos.
* Preparação para deploy real na VPS.

---

# 16. Diretriz geral para implementação

Priorizar simplicidade, organização e utilidade operacional.

Não tentar construir um ERP contábil completo.

O sistema deve ser uma central interna de controle para o escritório, com foco em:

* Clientes
* Documentos
* Envios
* Tarefas
* Kanban
* Histórico
* Prazos
* Responsáveis
* Departamentos

A arquitetura deve ser limpa, modular e preparada para evolução futura, mas sem exagerar na complexidade do MVP.
