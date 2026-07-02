"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
  PREFERRED_CHANNEL_LABELS,
  ClientStatus,
  ClientType,
  PreferredChannel
} from "@hubcontabil/shared";
import {
  ClientContact,
  ClientDetail,
  ClientService,
  CreateClientPayload,
  CreateContactPayload,
  ServiceOption,
  UserOption,
  attachClientService,
  createContact,
  deleteClientService,
  deleteContact,
  getClient,
  getToken,
  listServices,
  listUsers,
  lookupClientByCnpj,
  updateClientService,
  updateContact,
  updateClient
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const tabs = ["Visão geral", "Contatos", "Serviços", "Documentos", "Envios", "Tarefas", "Histórico"];

const emptyContact: CreateContactPayload = {
  name: "",
  roleDescription: "",
  email: "",
  phone: "",
  whatsapp: "",
  preferredChannel: PreferredChannel.EMAIL,
  isMain: false
};

export function ClientDetailsClient({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [clientForm, setClientForm] = useState<CreateClientPayload | null>(null);
  const [contactForm, setContactForm] = useState<CreateContactPayload>(emptyContact);
  const [serviceForm, setServiceForm] = useState({ serviceId: "", notes: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      setIsLoading(false);
      setError("Faça login para acessar este cliente.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [clientData, userList, serviceList] = await Promise.all([
        getClient(clientId),
        listUsers(),
        listServices()
      ]);
      setClient(clientData);
      setUsers(userList);
      setServices(serviceList);
      setClientForm({
        type: clientData.type,
        name: clientData.name,
        legalName: clientData.legalName ?? "",
        tradeName: clientData.tradeName ?? "",
        documentNumber: clientData.documentNumber ?? "",
        taxRegime: clientData.taxRegime ?? "",
        openingDate: toDateInputValue(clientData.openingDate),
        registrationStatus: clientData.registrationStatus ?? "",
        stateRegistration: clientData.stateRegistration ?? "",
        companySize: clientData.companySize ?? "",
        legalNature: clientData.legalNature ?? "",
        mainActivity: clientData.mainActivity ?? "",
        addressLine: clientData.addressLine ?? "",
        addressNumber: clientData.addressNumber ?? "",
        addressComplement: clientData.addressComplement ?? "",
        district: clientData.district ?? "",
        city: clientData.city ?? "",
        state: clientData.state ?? "",
        zipCode: clientData.zipCode ?? "",
        businessEmail: clientData.businessEmail ?? "",
        businessPhone: clientData.businessPhone ?? "",
        cnpjwsUpdatedAt: clientData.cnpjwsUpdatedAt ?? "",
        status: clientData.status,
        internalResponsibleId: clientData.internalResponsible?.id ?? "",
        notes: clientData.notes ?? ""
      });
      setServiceForm((current) => ({
        ...current,
        serviceId: current.serviceId || serviceList[0]?.id || ""
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar cliente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [clientId]);

  async function onClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientForm) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateClient(clientId, cleanPayload(clientForm));
      setClient(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onLookupCnpj() {
    if (!clientForm) {
      return;
    }

    const cnpj = clientForm.documentNumber?.replace(/\D/g, "") ?? "";

    if (cnpj.length !== 14) {
      setError("Informe um CNPJ com 14 dígitos para consultar.");
      return;
    }

    setIsCnpjLoading(true);
    setError(null);

    try {
      const data = await lookupClientByCnpj(cnpj);
      setClientForm((current) =>
        current
          ? {
              ...current,
              ...data,
              name: current.name || data.tradeName || data.legalName || data.name,
              documentNumber: data.documentNumber,
              status: current.status,
              internalResponsibleId: current.internalResponsibleId,
              notes: appendNotes(current.notes, data.notes)
            }
          : current
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao consultar CNPJ.");
    } finally {
      setIsCnpjLoading(false);
    }
  }

  async function onContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createContact(clientId, cleanPayload(contactForm) as CreateContactPayload);
      setContactForm(emptyContact);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar contato.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onServiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await attachClientService(clientId, cleanPayload({ ...serviceForm, isActive: true }));
      setServiceForm({ serviceId: services[0]?.id ?? "", notes: "" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao vincular serviço.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateContactState(contactId: string, patch: Partial<ClientContact>) {
    setClient((current) =>
      current
        ? {
            ...current,
            contacts: current.contacts.map((contact) =>
              contact.id === contactId ? { ...contact, ...patch } : contact
            )
          }
        : current
    );
  }

  async function saveContact(contact: ClientContact) {
    setIsSaving(true);
    setError(null);

    try {
      await updateContact(clientId, contact.id, {
        name: contact.name,
        roleDescription: contact.roleDescription ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        whatsapp: contact.whatsapp ?? "",
        preferredChannel: contact.preferredChannel,
        isMain: contact.isMain
      });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar contato.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeContact(contact: ClientContact) {
    if (!window.confirm(`Remover o contato "${contact.name}"?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteContact(clientId, contact.id);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao remover contato.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateClientServiceState(clientServiceId: string, patch: Partial<ClientService>) {
    setClient((current) =>
      current
        ? {
            ...current,
            services: current.services.map((clientService) =>
              clientService.id === clientServiceId
                ? { ...clientService, ...patch }
                : clientService
            )
          }
        : current
    );
  }

  async function saveClientService(clientService: ClientService) {
    setIsSaving(true);
    setError(null);

    try {
      await updateClientService(clientId, clientService.id, {
        isActive: clientService.isActive,
        notes: clientService.notes ?? ""
      });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar serviço.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeClientService(clientService: ClientService) {
    if (!window.confirm(`Remover o serviço "${clientService.service.name}" deste cliente?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteClientService(clientId, clientService.id);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao remover serviço.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando cliente...</Card>;
  }

  if (error && !client) {
    return (
      <Card className="p-5 text-sm text-danger">
        {error}{" "}
        <Link className="font-medium text-primary" href="/login">
          Ir para login
        </Link>
      </Card>
    );
  }

  if (!client || !clientForm) {
    return <Card className="p-5 text-sm text-muted-foreground">Cliente não encontrado.</Card>;
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={client.status === ClientStatus.ACTIVE ? "success" : "secondary"}>
            {CLIENT_STATUS_LABELS[client.status]}
          </Badge>
          <Badge>{client.documentNumber ?? "Sem CPF/CNPJ"}</Badge>
          <Badge>Responsável: {client.internalResponsible?.name ?? "Não definido"}</Badge>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`rounded-md border border-border px-3 py-2 text-sm ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {activeTab === "Visão geral" ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={onClientSubmit}>
                <Field className="md:col-span-1" label="Apelido">
                  <Input
                    required
                    value={clientForm.name}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, name: event.target.value })
                    }
                  />
                </Field>
                <Field className="md:col-span-1 xl:col-span-2" label="CPF/CNPJ">
                  <div className="flex gap-2">
                    <Input
                      value={clientForm.documentNumber}
                      onChange={(event) =>
                        setClientForm({ ...clientForm, documentNumber: event.target.value })
                      }
                    />
                    <Button
                      disabled={
                        isCnpjLoading ||
                        (clientForm.documentNumber?.replace(/\D/g, "").length ?? 0) !== 14
                      }
                      type="button"
                      variant="outline"
                      onClick={() => void onLookupCnpj()}
                    >
                      {isCnpjLoading ? "Consultando..." : "Consultar CNPJ"}
                    </Button>
                  </div>
                </Field>
                <Field className="md:col-span-2" label="Razão social">
                  <Input
                    value={clientForm.legalName}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, legalName: event.target.value })
                    }
                  />
                </Field>
                <Field label="Nome fantasia">
                  <Input
                    value={clientForm.tradeName}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, tradeName: event.target.value })
                    }
                  />
                </Field>
                <Field label="Tipo de cliente">
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={clientForm.type}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, type: event.target.value as ClientType })
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
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={clientForm.status}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, status: event.target.value as ClientStatus })
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
                    value={clientForm.taxRegime}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, taxRegime: event.target.value })
                    }
                  />
                </Field>
                <Field label="Data de abertura">
                  <Input
                    type="date"
                    value={toDateInputValue(clientForm.openingDate)}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, openingDate: event.target.value })
                    }
                  />
                </Field>
                <Field label="Situação cadastral">
                  <Input
                    value={clientForm.registrationStatus}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, registrationStatus: event.target.value })
                    }
                  />
                </Field>
                <Field label="Inscrição estadual">
                  <Input
                    value={clientForm.stateRegistration}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, stateRegistration: event.target.value })
                    }
                  />
                </Field>
                <Field label="Porte">
                  <Input
                    value={clientForm.companySize}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, companySize: event.target.value })
                    }
                  />
                </Field>
                <Field label="Natureza jurídica">
                  <Input
                    value={clientForm.legalNature}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, legalNature: event.target.value })
                    }
                  />
                </Field>
                <Field className="md:col-span-2" label="Atividade principal">
                  <Input
                    value={clientForm.mainActivity}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, mainActivity: event.target.value })
                    }
                  />
                </Field>
                <Field label="E-mail comercial">
                  <Input
                    type="email"
                    value={clientForm.businessEmail}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, businessEmail: event.target.value })
                    }
                  />
                </Field>
                <Field label="Telefone comercial">
                  <Input
                    value={clientForm.businessPhone}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, businessPhone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Logradouro">
                  <Input
                    value={clientForm.addressLine}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, addressLine: event.target.value })
                    }
                  />
                </Field>
                <Field label="Número">
                  <Input
                    value={clientForm.addressNumber}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, addressNumber: event.target.value })
                    }
                  />
                </Field>
                <Field className="md:col-span-2 xl:col-span-1" label="Complemento">
                  <Input
                    value={clientForm.addressComplement}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, addressComplement: event.target.value })
                    }
                  />
                </Field>
                <Field label="Bairro">
                  <Input
                    value={clientForm.district}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, district: event.target.value })
                    }
                  />
                </Field>
                <Field label="Cidade">
                  <Input
                    value={clientForm.city}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, city: event.target.value })
                    }
                  />
                </Field>
                <Field label="UF">
                  <Input
                    maxLength={2}
                    value={clientForm.state}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, state: event.target.value.toUpperCase() })
                    }
                  />
                </Field>
                <Field label="CEP">
                  <Input
                    value={clientForm.zipCode}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, zipCode: event.target.value })
                    }
                  />
                </Field>
                <Field label="Responsável interno">
                  <select
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                    value={clientForm.internalResponsibleId}
                    onChange={(event) =>
                      setClientForm({
                        ...clientForm,
                        internalResponsibleId: event.target.value
                      })
                    }
                  >
                    <option value="">Sem responsável</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field className="md:col-span-2 xl:col-span-3" label="Observações">
                  <textarea
                    className="min-h-36 w-full rounded-md border border-border bg-background p-3 text-sm outline-none"
                    value={clientForm.notes}
                    onChange={(event) =>
                      setClientForm({ ...clientForm, notes: event.target.value })
                    }
                  />
                </Field>
                <div className="md:col-span-2 xl:col-span-3">
                  <Button disabled={isSaving} type="submit">
                  Salvar alterações
                  </Button>
                </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "Contatos" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {[
                    "Nome",
                    "Função",
                    "E-mail",
                    "WhatsApp",
                    "Canal",
                    "Principal",
                    "Ações"
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.contacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Input
                        value={contact.name}
                        onChange={(event) =>
                          updateContactState(contact.id, { name: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={contact.roleDescription ?? ""}
                        onChange={(event) =>
                          updateContactState(contact.id, {
                            roleDescription: event.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="email"
                        value={contact.email ?? ""}
                        onChange={(event) =>
                          updateContactState(contact.id, { email: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={contact.whatsapp ?? ""}
                        onChange={(event) =>
                          updateContactState(contact.id, { whatsapp: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                        value={contact.preferredChannel}
                        onChange={(event) =>
                          updateContactState(contact.id, {
                            preferredChannel: event.target.value as PreferredChannel
                          })
                        }
                      >
                        {Object.entries(PREFERRED_CHANNEL_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        checked={contact.isMain}
                        type="checkbox"
                        onChange={(event) =>
                          updateContactState(contact.id, { isMain: event.target.checked })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isSaving || !contact.name}
                          type="button"
                          variant="outline"
                          onClick={() => void saveContact(contact)}
                        >
                          Salvar
                        </Button>
                        <Button
                          disabled={isSaving}
                          type="button"
                          variant="outline"
                          onClick={() => void removeContact(contact)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <form className="space-y-3" onSubmit={onContactSubmit}>
              <Input
                required
                placeholder="Nome"
                value={contactForm.name}
                onChange={(event) =>
                  setContactForm({ ...contactForm, name: event.target.value })
                }
              />
              <Input
                placeholder="Função"
                value={contactForm.roleDescription}
                onChange={(event) =>
                  setContactForm({ ...contactForm, roleDescription: event.target.value })
                }
              />
              <Input
                placeholder="E-mail"
                type="email"
                value={contactForm.email}
                onChange={(event) =>
                  setContactForm({ ...contactForm, email: event.target.value })
                }
              />
              <Input
                placeholder="Telefone"
                value={contactForm.phone}
                onChange={(event) =>
                  setContactForm({ ...contactForm, phone: event.target.value })
                }
              />
              <Input
                placeholder="WhatsApp"
                value={contactForm.whatsapp}
                onChange={(event) =>
                  setContactForm({ ...contactForm, whatsapp: event.target.value })
                }
              />
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={contactForm.preferredChannel}
                onChange={(event) =>
                  setContactForm({
                    ...contactForm,
                    preferredChannel: event.target.value as PreferredChannel
                  })
                }
              >
                {Object.entries(PREFERRED_CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={contactForm.isMain}
                  type="checkbox"
                  onChange={(event) =>
                    setContactForm({ ...contactForm, isMain: event.target.checked })
                  }
                />
                Contato principal
              </label>
              <Button disabled={isSaving} type="submit">
                Novo contato
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {activeTab === "Serviços" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Card className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  {["Serviço", "Status", "Observações", "Ações"].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.services.map((clientService) => (
                  <tr key={clientService.id} className="border-t border-border">
                    <td className="px-4 py-3">{clientService.service.name}</td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2">
                        <input
                          checked={clientService.isActive}
                          type="checkbox"
                          onChange={(event) =>
                            updateClientServiceState(clientService.id, {
                              isActive: event.target.checked
                            })
                          }
                        />
                        <Badge variant={clientService.isActive ? "success" : "secondary"}>
                          {clientService.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={clientService.notes ?? ""}
                        onChange={(event) =>
                          updateClientServiceState(clientService.id, {
                            notes: event.target.value
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isSaving}
                          type="button"
                          variant="outline"
                          onClick={() => void saveClientService(clientService)}
                        >
                          Salvar
                        </Button>
                        <Button
                          disabled={isSaving}
                          type="button"
                          variant="outline"
                          onClick={() => void removeClientService(clientService)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <form className="space-y-3" onSubmit={onServiceSubmit}>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={serviceForm.serviceId}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, serviceId: event.target.value })
                }
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm outline-none"
                placeholder="Observações"
                value={serviceForm.notes}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, notes: event.target.value })
                }
              />
              <Button disabled={isSaving || !serviceForm.serviceId} type="submit">
                Vincular serviço
              </Button>
            </form>
          </Card>
        </div>
      ) : null}

      {activeTab === "Documentos" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" href="/documentos/novo">
              Novo documento
            </Link>
            <Link className="rounded-md border border-border px-3 py-2 text-sm" href="/documentos/enviar">
              Enviar documento
            </Link>
          </div>
          <SimpleTable
            empty="Nenhum documento cadastrado."
            headers={["Documento", "Categoria", "Status", "Vencimento"]}
            rows={client.documents.map((document) => [
              document.title,
              document.category,
              document.status,
              document.dueDate ? new Date(document.dueDate).toLocaleDateString("pt-BR") : "-"
            ])}
          />
        </div>
      ) : null}

      {activeTab === "Envios" ? (
        <div className="space-y-3">
          <Link className="inline-flex rounded-md border border-border px-3 py-2 text-sm" href="/envios">
            Ver histórico completo
          </Link>
          <SimpleTable
            empty="Nenhum envio registrado."
            headers={["Documento", "Status", "Canais", "Data"]}
            rows={client.documentSends.map((send) => [
              send.document.title,
              send.status,
              send.channels.map((channel) => `${channel.channel}: ${channel.status}`).join(", "),
              new Date(send.createdAt).toLocaleDateString("pt-BR")
            ])}
          />
        </div>
      ) : null}

      {activeTab === "Tarefas" ? (
        <div className="space-y-3">
          <Link className="inline-flex rounded-md border border-border px-3 py-2 text-sm" href={`/kanban?clientId=${client.id}`}>
            Abrir no Kanban
          </Link>
          <SimpleTable
            empty="Nenhuma tarefa vinculada."
            headers={["Tarefa", "Status", "Prioridade", "Prazo", "Responsável"]}
            rows={client.tasks.map((task) => [
              task.title,
              task.status,
              task.priority,
              task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "-",
              task.responsibleUser?.name ?? "-"
            ])}
          />
        </div>
      ) : null}

      {activeTab === "Histórico" ? (
        <Card className="p-5">
          <div className="space-y-3">
            {client.activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
            ) : (
              client.activityLogs.map((log) => (
                <div key={log.id} className="border-b border-border pb-3 text-sm last:border-0">
                  <p className="font-medium">{log.description}</p>
                  <p className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("pt-BR")} · {log.user?.name ?? "Sistema"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
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

function SimpleTable({
  headers,
  rows,
  empty
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={headers.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "")
  ) as T;
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
