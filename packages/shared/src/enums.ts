export enum UserRole {
  ADMIN = "ADMIN",
  COLLABORATOR = "COLLABORATOR"
}

export enum ClientType {
  INDIVIDUAL = "INDIVIDUAL",
  COMPANY = "COMPANY",
  MEI = "MEI",
  RURAL_PRODUCER = "RURAL_PRODUCER",
  OTHER = "OTHER"
}

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PROSPECT = "PROSPECT",
  SUSPENDED = "SUSPENDED"
}

export enum PreferredChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  BOTH = "BOTH"
}

export enum DocumentStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELED = "CANCELED"
}

export enum DocumentSendStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SENT = "SENT",
  PARTIAL_ERROR = "PARTIAL_ERROR",
  ERROR = "ERROR",
  CANCELED = "CANCELED"
}

export enum SendChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP"
}

export enum SendChannelStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  ERROR = "ERROR",
  RETRYING = "RETRYING",
  CANCELED = "CANCELED"
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING_CLIENT = "WAITING_CLIENT",
  DONE = "DONE",
  CANCELED = "CANCELED"
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}
