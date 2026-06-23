export const TASK_STATUS_LABELS = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  WAITING_CLIENT: "Aguardando cliente",
  DONE: "Concluída",
  CANCELED: "Cancelada"
} as const;

export const TASK_PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente"
} as const;

export const CLIENT_TYPE_LABELS = {
  INDIVIDUAL: "Pessoa física",
  COMPANY: "Pessoa jurídica",
  MEI: "MEI",
  RURAL_PRODUCER: "Produtor rural",
  OTHER: "Outro"
} as const;

export const CLIENT_STATUS_LABELS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PROSPECT: "Prospect",
  SUSPENDED: "Suspenso"
} as const;

export const PREFERRED_CHANNEL_LABELS = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  BOTH: "Ambos"
} as const;

export const DOCUMENT_STATUS_LABELS = {
  PENDING: "Pendente",
  SENT: "Enviado",
  PAID: "Pago",
  OVERDUE: "Vencido",
  CANCELED: "Cancelado"
} as const;

export const DOCUMENT_SEND_STATUS_LABELS = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  SENT: "Enviado",
  PARTIAL_ERROR: "Erro parcial",
  ERROR: "Erro",
  CANCELED: "Cancelado"
} as const;

export const SEND_CHANNEL_LABELS = {
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp"
} as const;

export const SEND_CHANNEL_STATUS_LABELS = {
  PENDING: "Pendente",
  SENT: "Enviado",
  ERROR: "Erro",
  RETRYING: "Reenviando",
  CANCELED: "Cancelado"
} as const;

export const RECURRENCE_RULE_LABELS = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  MONTHLY_DAY: "Mensal em dia específico"
} as const;

export const USER_ROLE_LABELS = {
  ADMIN: "Administrador",
  COLLABORATOR: "Colaborador"
} as const;

export const DOCUMENT_CATEGORIES = [
  "Guias de impostos",
  "Boletos",
  "Departamento pessoal / folha",
  "Contrato social",
  "Documentos pessoais",
  "Procurações",
  "Declarações",
  "Certidões",
  "Notas fiscais",
  "Outros"
] as const;

export const INITIAL_DEPARTMENTS = [
  "Fiscal",
  "Contábil",
  "Departamento Pessoal",
  "Financeiro",
  "Societário",
  "Administrativo"
] as const;

export const INITIAL_SERVICES = [
  "Contábil",
  "Fiscal",
  "Departamento Pessoal",
  "Financeiro",
  "Societário",
  "MEI",
  "Produtor Rural",
  "Imposto de Renda",
  "Honorários",
  "Consultoria",
  "Outros"
] as const;

export const QUEUE_NAMES = {
  EMAIL_SEND: "email-send",
  WHATSAPP_SEND: "whatsapp-send",
  RECURRING_TASKS: "recurring-tasks"
} as const;
