"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
  ClientStatus,
  ClientType
} from "@hubcontabil/shared";
import {
  ClientListItem,
  CreateClientPayload,
  UserOption,
  createClient,
  getToken,
  listClients,
  listUsers,
  lookupClientByCnpj
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialForm: CreateClientPayload = {
  type: ClientType.COMPANY,
  name: "",
  legalName: "",
  tradeName: "",
  documentNumber: "",
  taxRegime: "",
  openingDate: "",
  registrationStatus: "",
  stateRegistration: "",
  companySize: "",
  legalNature: "",
  mainActivity: "",
  addressLine: "",
  addressNumber: "",
  addressComplement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
  businessEmail: "",
  businessPhone: "",
  cnpjwsUpdatedAt: "",
  status: ClientStatus.ACTIVE,
  internalResponsibleId: "",
  notes: ""
};

export function ClientsPageClient() {
  const initialType = getInitialClientType();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: initialType ?? "",
    responsibleUserId: ""
  });
  const [form, setForm] = useState<CreateClientPayload>({
    ...initialForm,
    type: initialType ?? initialForm.type
  });
  const [showForm, setShowForm] = useState(shouldOpenNewClientForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    return searchParams;
  }, [filters]);

  async function load() {
    if (!getToken()) {
      setIsLoading(false);
      setError("Faça login para acessar os clientes.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [clientList, userList] = await Promise.all([listClients(params), listUsers()]);
      setClients(clientList);
      setUsers(userList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar clientes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createClient(cleanPayload(form));
      setForm({
        ...initialForm,
        type: initialType ?? initialForm.type
      });
      setShowForm(false);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onLookupCnpj() {
    const cnpj = form.documentNumber?.replace(/\D/g, "") ?? "";

    if (cnpj.length !== 14) {
      setError("Informe um CNPJ com 14 dígitos para consultar.");
      return;
    }

    setIsCnpjLoading(true);
    setError(null);

    try {
      const data = await lookupClientByCnpj(cnpj);
      setForm((current) => ({
        ...current,
        ...data,
        name: current.name || data.tradeName || data.legalName || data.name,
        documentNumber: data.documentNumber,
        status: current.status,
        internalResponsibleId: current.internalResponsibleId,
        notes: appendNotes(current.notes, data.notes)
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao consultar CNPJ.");
    } finally {
      setIsCnpjLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Buscar por nome, razão social, CPF ou CNPJ"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">Todos os status</option>
          {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.responsibleUserId}
          onChange={(event) =>
            setFilters({ ...filters, responsibleUserId: event.target.value })
          }
        >
          <option value="">Todos os responsáveis</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.type}
          onChange={(event) => setFilters({ ...filters, type: event.target.value })}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fechar cadastro" : "Novo cliente"}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Apelido">
              <Input
                placeholder="Nome curto usado internamente"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="CPF/CNPJ">
              <div className="flex gap-2">
                <Input
                  placeholder="Somente números ou formatado"
                  value={form.documentNumber}
                  onChange={(event) => setForm({ ...form, documentNumber: event.target.value })}
                />
                <Button
                  disabled={isCnpjLoading || (form.documentNumber?.replace(/\D/g, "").length ?? 0) !== 14}
                  type="button"
                  variant="outline"
                  onClick={() => void onLookupCnpj()}
                >
                  {isCnpjLoading ? "Consultando..." : "Consultar CNPJ"}
                </Button>
              </div>
            </Field>
            <Field label="Razão social">
              <Input
                placeholder="Razão social"
                value={form.legalName}
                onChange={(event) => setForm({ ...form, legalName: event.target.value })}
              />
            </Field>
            <Field label="Nome fantasia">
              <Input
                placeholder="Nome fantasia"
                value={form.tradeName}
                onChange={(event) => setForm({ ...form, tradeName: event.target.value })}
              />
            </Field>
            <Field label="Tipo de cliente">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as ClientType })
                }
              >
                {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ClientStatus })
                }
              >
                {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Regime tributário">
              <Input
                placeholder="Ex.: Simples Nacional"
                value={form.taxRegime}
                onChange={(event) => setForm({ ...form, taxRegime: event.target.value })}
              />
            </Field>
            <Field label="Data de abertura">
              <Input
                type="date"
                value={toDateInputValue(form.openingDate)}
                onChange={(event) => setForm({ ...form, openingDate: event.target.value })}
              />
            </Field>
            <Field label="Situação cadastral">
              <Input
                value={form.registrationStatus}
                onChange={(event) => setForm({ ...form, registrationStatus: event.target.value })}
              />
            </Field>
            <Field label="Inscrição estadual">
              <Input
                value={form.stateRegistration}
                onChange={(event) => setForm({ ...form, stateRegistration: event.target.value })}
              />
            </Field>
            <Field label="Porte">
              <Input
                value={form.companySize}
                onChange={(event) => setForm({ ...form, companySize: event.target.value })}
              />
            </Field>
            <Field label="Natureza jurídica">
              <Input
                value={form.legalNature}
                onChange={(event) => setForm({ ...form, legalNature: event.target.value })}
              />
            </Field>
            <Field label="Atividade principal">
              <Input
                value={form.mainActivity}
                onChange={(event) => setForm({ ...form, mainActivity: event.target.value })}
              />
            </Field>
            <Field label="E-mail comercial">
              <Input
                type="email"
                value={form.businessEmail}
                onChange={(event) => setForm({ ...form, businessEmail: event.target.value })}
              />
            </Field>
            <Field label="Telefone comercial">
              <Input
                value={form.businessPhone}
                onChange={(event) => setForm({ ...form, businessPhone: event.target.value })}
              />
            </Field>
            <Field label="Logradouro">
              <Input
                value={form.addressLine}
                onChange={(event) => setForm({ ...form, addressLine: event.target.value })}
              />
            </Field>
            <Field label="Número">
              <Input
                value={form.addressNumber}
                onChange={(event) => setForm({ ...form, addressNumber: event.target.value })}
              />
            </Field>
            <Field label="Complemento">
              <Input
                value={form.addressComplement}
                onChange={(event) => setForm({ ...form, addressComplement: event.target.value })}
              />
            </Field>
            <Field label="Bairro">
              <Input
                value={form.district}
                onChange={(event) => setForm({ ...form, district: event.target.value })}
              />
            </Field>
            <Field label="Cidade">
              <Input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </Field>
            <Field label="UF">
              <Input
                maxLength={2}
                value={form.state}
                onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="CEP">
              <Input
                value={form.zipCode}
                onChange={(event) => setForm({ ...form, zipCode: event.target.value })}
              />
            </Field>
            <Field className="md:col-span-2" label="Responsável interno">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={form.internalResponsibleId}
                onChange={(event) =>
                  setForm({ ...form, internalResponsibleId: event.target.value })
                }
              >
                <option value="">Sem responsável interno</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="md:col-span-2" label="Observações">
              <textarea
                className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
            <Button className="md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Salvar cliente"}
            </Button>
          </form>
        </Card>
      ) : null}

      {error ? (
        <Card className="p-5 text-sm text-danger">
          {error}{" "}
          <Link className="font-medium text-primary" href="/login">
            Ir para login
          </Link>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {[
                "Apelido",
                "CPF/CNPJ",
                "Tipo",
                "Status",
                "Responsável",
                "Contato",
                "Tarefas",
                "Documentos",
                "Ação"
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  Carregando clientes...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const mainContact = client.contacts.find((contact) => contact.isMain);

                return (
                  <tr key={client.id} className="border-t border-border">
                    <td className="px-4 py-3">{client.name}</td>
                    <td className="px-4 py-3">{client.documentNumber ?? "-"}</td>
                    <td className="px-4 py-3">{CLIENT_TYPE_LABELS[client.type]}</td>
                    <td className="px-4 py-3">
                      <Badge variant={client.status === ClientStatus.ACTIVE ? "success" : "secondary"}>
                        {CLIENT_STATUS_LABELS[client.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{client.internalResponsible?.name ?? "-"}</td>
                    <td className="px-4 py-3">{mainContact?.name ?? "-"}</td>
                    <td className="px-4 py-3">{client._count.tasks}</td>
                    <td className="px-4 py-3">{client._count.documents}</td>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-primary" href={`/clientes/${client.id}`}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function cleanPayload(payload: CreateClientPayload): CreateClientPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "")
  ) as CreateClientPayload;
}

function getInitialClientType() {
  if (typeof window === "undefined") {
    return null;
  }

  const type = new URLSearchParams(window.location.search).get("type");

  return Object.values(ClientType).includes(type as ClientType) ? (type as ClientType) : null;
}

function shouldOpenNewClientForm() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("new") === "1";
}

function Field({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm font-medium ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function appendNotes(current?: string, incoming?: string) {
  if (!incoming) {
    return current ?? "";
  }

  if (!current) {
    return incoming;
  }

  if (current.includes(incoming)) {
    return current;
  }

  return `${current.trim()}\n\n${incoming}`;
}
