"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  listUsers
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialForm: CreateClientPayload = {
  type: ClientType.COMPANY,
  name: "",
  legalName: "",
  documentNumber: "",
  taxRegime: "",
  status: ClientStatus.ACTIVE,
  internalResponsibleId: "",
  notes: ""
};

export function ClientsPageClient() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    responsibleUserId: ""
  });
  const [form, setForm] = useState<CreateClientPayload>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      setForm(initialForm);
      setShowForm(false);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar cliente.");
    } finally {
      setIsSaving(false);
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
            <Input
              placeholder="Nome"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              placeholder="Razão social"
              value={form.legalName}
              onChange={(event) => setForm({ ...form, legalName: event.target.value })}
            />
            <Input
              placeholder="CPF/CNPJ"
              value={form.documentNumber}
              onChange={(event) => setForm({ ...form, documentNumber: event.target.value })}
            />
            <Input
              placeholder="Regime tributário"
              value={form.taxRegime}
              onChange={(event) => setForm({ ...form, taxRegime: event.target.value })}
            />
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
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
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
            <textarea
              className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              placeholder="Observações"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
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
                "Nome",
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
