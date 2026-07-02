import type {
  ClientStatus,
  ClientType,
  DocumentStatus,
  DashboardSummary,
  PreferredChannel,
  SendChannel,
  SendChannelStatus,
  DocumentSendStatus,
  TaskPriority,
  TaskStatus,
  UserRole
} from "@hubcontabil/shared";

export const API_TOKEN_KEY = "hubcontabil_access_token";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departments?: DepartmentOption[];
};

export type UserOption = AuthUser;

export type ManagedUser = AuthUser & {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departments: DepartmentOption[];
};

export type ServiceOption = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type DepartmentOption = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type SystemSettings = {
  officeName: string;
  emailFromName: string;
  emailFromAddress: string;
  wppconnectSession: string;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  whatsappBodyTemplate: string;
};

export type ClientContact = {
  id: string;
  name: string;
  roleDescription?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  isMain: boolean;
  preferredChannel: PreferredChannel;
};

export type ClientService = {
  id: string;
  serviceId: string;
  isActive: boolean;
  notes?: string | null;
  service: ServiceOption;
};

export type DocumentListItem = {
  id: string;
  clientId: string;
  category: string;
  title: string;
  description?: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  competence?: string | null;
  dueDate?: string | null;
  amount?: string | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    documentNumber?: string | null;
  };
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    sends: number;
  };
};

export type UpdateDocumentPayload = Partial<{
  category: string;
  title: string;
  description: string | null;
  competence: string | null;
  dueDate: string | null;
  amount: string | null;
  status: DocumentStatus;
}>;

export type TaskListItem = {
  id: string;
  clientId?: string | null;
  title: string;
  description?: string | null;
  departmentId?: string | null;
  responsibleUserId?: string | null;
  createdByUserId: string;
  documentId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  isRecurringInstance: boolean;
  recurringTaskId?: string | null;
  replicatedFromTaskId?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    documentNumber?: string | null;
  } | null;
  department?: DepartmentOption | null;
  responsibleUser?: Pick<AuthUser, "id" | "name" | "email"> | null;
  createdBy: Pick<AuthUser, "id" | "name" | "email">;
  document?: {
    id: string;
    title: string;
    category: string;
    dueDate?: string | null;
  } | null;
};

export type DocumentSendChannelItem = {
  id: string;
  documentSendId: string;
  channel: SendChannel;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientWhatsapp?: string | null;
  status: SendChannelStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSendItem = {
  id: string;
  documentId: string;
  clientId: string;
  createdByUserId: string;
  reviewedByUserId?: string | null;
  messageSubject?: string | null;
  messageBody: string;
  sendEmail: boolean;
  sendWhatsapp: boolean;
  status: DocumentSendStatus;
  createdAt: string;
  sentAt?: string | null;
  updatedAt: string;
  document: {
    id: string;
    title: string;
    category: string;
    competence?: string | null;
    dueDate?: string | null;
    amount?: string | null;
    originalFileName: string;
  };
  client: {
    id: string;
    name: string;
    documentNumber?: string | null;
    contacts: ClientContact[];
  };
  createdBy: Pick<AuthUser, "id" | "name" | "email">;
  reviewedBy?: Pick<AuthUser, "id" | "name" | "email"> | null;
  channels: DocumentSendChannelItem[];
};

export type DocumentSendPreview = {
  recipient: {
    id: string;
    name: string;
    email?: string | null;
    whatsapp?: string | null;
    preferredChannel: PreferredChannel;
  } | null;
  messageSubject: string;
  messageBody: string;
};

export type RecurringTaskItem = {
  id: string;
  title: string;
  description?: string | null;
  clientId?: string | null;
  departmentId?: string | null;
  responsibleUserId?: string | null;
  recurrenceRule: string;
  nextRunAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string } | null;
  department?: DepartmentOption | null;
  responsibleUser?: Pick<AuthUser, "id" | "name" | "email"> | null;
};

export type ClientListItem = {
  id: string;
  type: ClientType;
  name: string;
  legalName?: string | null;
  tradeName?: string | null;
  documentNumber?: string | null;
  taxRegime?: string | null;
  openingDate?: string | null;
  registrationStatus?: string | null;
  stateRegistration?: string | null;
  companySize?: string | null;
  legalNature?: string | null;
  mainActivity?: string | null;
  addressLine?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  cnpjwsUpdatedAt?: string | null;
  status: ClientStatus;
  internalResponsible?: Pick<AuthUser, "id" | "name" | "email"> | null;
  contacts: ClientContact[];
  services: ClientService[];
  _count: {
    tasks: number;
    documents: number;
  };
};

export type ClientDetail = ClientListItem & {
  notes?: string | null;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    dueDate?: string | null;
  }>;
  documentSends: Array<{
    id: string;
    status: string;
    createdAt: string;
    document: { id: string; title: string; category: string };
    channels: Array<{ id: string; channel: string; status: string; errorMessage?: string | null }>;
    createdBy: { id: string; name: string };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    department?: { id: string; name: string } | null;
    responsibleUser?: { id: string; name: string } | null;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user?: { id: string; name: string } | null;
  }>;
};

export type CreateClientPayload = {
  type: ClientType;
  name: string;
  legalName?: string;
  tradeName?: string;
  documentNumber?: string;
  taxRegime?: string;
  openingDate?: string;
  registrationStatus?: string;
  stateRegistration?: string;
  companySize?: string;
  legalNature?: string;
  mainActivity?: string;
  addressLine?: string;
  addressNumber?: string;
  addressComplement?: string;
  district?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  businessEmail?: string;
  businessPhone?: string;
  cnpjwsUpdatedAt?: string;
  status?: ClientStatus;
  internalResponsibleId?: string;
  notes?: string;
};

export type CnpjLookupResult = Omit<
  CreateClientPayload,
  "status" | "internalResponsibleId"
>;

export type CreateContactPayload = {
  name: string;
  roleDescription?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  isMain?: boolean;
  preferredChannel?: PreferredChannel;
};

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(API_TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(API_TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(API_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message ?? "Não foi possível concluir a operação.";
    throw new Error(Array.isArray(message) ? message.join(" ") : message);
  }

  return response.json();
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers,
    body: formData
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message ?? "Não foi possível concluir a operação.";
    throw new Error(Array.isArray(message) ? message.join(" ") : message);
  }

  return response.json();
}

export async function login(email: string, password: string) {
  return request<{ accessToken: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function getCurrentUser() {
  return request<AuthUser>("/auth/me");
}

export async function updateCurrentUser(payload: {
  name?: string;
  email?: string;
  password?: string;
}) {
  return request<AuthUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listClients(params: URLSearchParams) {
  const query = params.toString();
  return request<ClientListItem[]>(`/clients${query ? `?${query}` : ""}`);
}

export async function getClient(id: string) {
  return request<ClientDetail>(`/clients/${id}`);
}

export async function createClient(payload: CreateClientPayload) {
  return request<ClientDetail>("/clients", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function lookupClientByCnpj(cnpj: string) {
  return request<CnpjLookupResult>(`/clients/cnpj/${cnpj.replace(/\D/g, "")}`);
}

export async function updateClient(id: string, payload: Partial<CreateClientPayload>) {
  return request<ClientDetail>(`/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function createContact(clientId: string, payload: CreateContactPayload) {
  return request<ClientContact>(`/clients/${clientId}/contacts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateContact(
  clientId: string,
  contactId: string,
  payload: Partial<CreateContactPayload>
) {
  return request<ClientContact>(`/clients/${clientId}/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteContact(clientId: string, contactId: string) {
  return request<{ deleted: boolean }>(`/clients/${clientId}/contacts/${contactId}`, {
    method: "DELETE"
  });
}

export async function attachClientService(
  clientId: string,
  payload: { serviceId: string; notes?: string; isActive?: boolean }
) {
  return request<ClientService>(`/clients/${clientId}/services`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateClientService(
  clientId: string,
  clientServiceId: string,
  payload: Partial<{ notes: string; isActive: boolean }>
) {
  return request<ClientService>(`/clients/${clientId}/services/${clientServiceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteClientService(clientId: string, clientServiceId: string) {
  return request<{ deleted: boolean }>(`/clients/${clientId}/services/${clientServiceId}`, {
    method: "DELETE"
  });
}

export async function listUsers() {
  return request<UserOption[]>("/users");
}

export async function listManagedUsers() {
  return request<ManagedUser[]>("/users/admin");
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
  departmentIds?: string[];
}) {
  return request<ManagedUser>("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateUser(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    departmentIds: string[];
  }>
) {
  return request<ManagedUser>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listServices() {
  return request<ServiceOption[]>("/services");
}

export async function listServicesAdmin() {
  return request<ServiceOption[]>("/services?includeInactive=true");
}

export async function createService(payload: {
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  return request<ServiceOption>("/services", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateService(
  id: string,
  payload: Partial<{ name: string; description: string; isActive: boolean }>
) {
  return request<ServiceOption>(`/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listDepartments() {
  return request<DepartmentOption[]>("/departments");
}

export async function listDepartmentsAdmin() {
  return request<DepartmentOption[]>("/departments?includeInactive=true");
}

export async function createDepartment(payload: {
  name: string;
  description?: string;
  isActive?: boolean;
}) {
  return request<DepartmentOption>("/departments", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateDepartment(
  id: string,
  payload: Partial<{ name: string; description: string; isActive: boolean }>
) {
  return request<DepartmentOption>(`/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function listDocuments(params: URLSearchParams) {
  const query = params.toString();
  return request<DocumentListItem[]>(`/documents${query ? `?${query}` : ""}`);
}

export async function createDocument(formData: FormData) {
  return requestForm<DocumentListItem>("/documents", formData);
}

export async function updateDocument(id: string, payload: UpdateDocumentPayload) {
  return request<DocumentListItem>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteDocument(id: string) {
  return request<{ deleted: boolean }>(`/documents/${id}`, {
    method: "DELETE"
  });
}

export function getDocumentDownloadUrl(id: string) {
  return `${apiUrl}/documents/${id}/download`;
}

export type CreateTaskPayload = {
  title: string;
  description?: string;
  clientId?: string;
  departmentId?: string;
  responsibleUserId?: string;
  documentId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
};

export async function listTasks(params: URLSearchParams) {
  const query = params.toString();
  return request<TaskListItem[]>(`/tasks${query ? `?${query}` : ""}`);
}

export async function createTask(payload: CreateTaskPayload) {
  return request<TaskListItem>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateTask(id: string, payload: Partial<CreateTaskPayload>) {
  return request<TaskListItem>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  return request<TaskListItem>(`/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function replicateTask(
  id: string,
  payload: {
    dueDate?: string;
    responsibleUserId?: string;
    status?: TaskStatus;
    description?: string;
  }
) {
  return request<TaskListItem>(`/tasks/${id}/replicate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function previewDocumentSend(payload: {
  documentId: string;
  recipientContactId?: string;
  channels?: SendChannel[];
}) {
  return request<DocumentSendPreview>("/document-sends/preview", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createDocumentSend(payload: {
  documentId: string;
  recipientContactId?: string;
  channels: SendChannel[];
  messageSubject: string;
  messageBody: string;
  recipient?: {
    name?: string;
    email?: string;
    whatsapp?: string;
  };
  reviewed: boolean;
}) {
  return request<DocumentSendItem>("/document-sends", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listDocumentSends(params: URLSearchParams) {
  const query = params.toString();
  return request<DocumentSendItem[]>(`/document-sends${query ? `?${query}` : ""}`);
}

export async function resendDocumentSend(id: string) {
  return request<DocumentSendItem>(`/document-sends/${id}/resend`, {
    method: "POST"
  });
}

export async function cancelDocumentSend(id: string) {
  return request<DocumentSendItem>(`/document-sends/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard/summary");
}

export async function getSettings() {
  return request<SystemSettings>("/settings");
}

export async function updateSettings(payload: Partial<SystemSettings>) {
  return request<SystemSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export type CreateRecurringTaskPayload = {
  title: string;
  description?: string;
  clientId?: string;
  departmentId?: string;
  responsibleUserId?: string;
  recurrenceRule: string;
  nextRunAt: string;
  isActive?: boolean;
};

export async function listRecurringTasks() {
  return request<RecurringTaskItem[]>("/recurring-tasks");
}

export async function createRecurringTask(payload: CreateRecurringTaskPayload) {
  return request<RecurringTaskItem>("/recurring-tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateRecurringTask(
  id: string,
  payload: Partial<CreateRecurringTaskPayload>
) {
  return request<RecurringTaskItem>(`/recurring-tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function updateRecurringTaskActive(id: string, isActive: boolean) {
  return request<RecurringTaskItem>(`/recurring-tasks/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  });
}

export async function generateRecurringTask(id: string) {
  return request<TaskListItem>(`/recurring-tasks/${id}/generate`, {
    method: "POST"
  });
}

// ── MEI / DAS ────────────────────────────────────────────────────────────────

export type LatestDasItem = {
  id: string;
  title: string;
  competence: string | null;
  createdAt: string;
  originalFileName: string;
};

export async function emitDasForClient(clientId: string) {
  return request<{ queued: boolean; clientName: string }>(`/mei/emit-das/${clientId}`, {
    method: "POST"
  });
}

export async function emitDasForAll() {
  return request<{ queued: boolean; count: number }>("/mei/emit-das", { method: "POST" });
}

export async function getLatestDas(clientId: string) {
  return request<LatestDasItem | null>(`/mei/das/${clientId}/latest`);
}

export async function getAllLatestDas() {
  return request<{ clientId: string; clientName: string; documentId: string; title: string }[]>(
    "/mei/das/latest-all"
  );
}
