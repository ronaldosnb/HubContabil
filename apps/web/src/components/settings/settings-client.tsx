"use client";

import { FormEvent, useEffect, useState } from "react";
import { DOCUMENT_CATEGORIES } from "@hubcontabil/shared";
import {
  DepartmentOption,
  ServiceOption,
  SystemSettings,
  createDepartment,
  createService,
  getSettings,
  getToken,
  listDepartmentsAdmin,
  listServicesAdmin,
  updateDepartment,
  updateService,
  updateSettings
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const emptySettings: SystemSettings = {
  officeName: "",
  emailFromName: "",
  emailFromAddress: "",
  wppconnectSession: "",
  emailSubjectTemplate: "",
  emailBodyTemplate: "",
  whatsappBodyTemplate: ""
};

export function SettingsClient() {
  const [settings, setSettings] = useState<SystemSettings>(emptySettings);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      setIsLoading(false);
      setError("Faça login para acessar as configurações.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [settingsData, departmentList, serviceList] = await Promise.all([
        getSettings(),
        listDepartmentsAdmin(),
        listServicesAdmin()
      ]);
      setSettings(settingsData);
      setDepartments(departmentList);
      setServices(serviceList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar configurações.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setMessage("Configurações salvas.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onCreateDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createDepartment(cleanPayload(newDepartment));
      setNewDepartment({ name: "", description: "" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar departamento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onCreateService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createService(cleanPayload(newService));
      setNewService({ name: "", description: "" });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar serviço.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDepartment(department: DepartmentOption) {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateDepartment(department.id, {
        name: department.name,
        description: department.description ?? "",
        isActive: department.isActive
      });
      setDepartments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setMessage("Departamento atualizado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar departamento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveService(service: ServiceOption) {
    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateService(service.id, {
        name: service.name,
        description: service.description ?? "",
        isActive: service.isActive
      });
      setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage("Serviço atualizado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar serviço.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando configurações...</Card>;
  }

  return (
    <div className="space-y-4">
      {error ? <Card className="p-4 text-sm text-danger">{error}</Card> : null}
      {message ? <Card className="p-4 text-sm text-success">{message}</Card> : null}

      <Card>
        <CardHeader>
          <CardTitle>Escritório, remetente e templates</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSettingsSubmit}>
            <Input
              required
              placeholder="Nome do escritório"
              value={settings.officeName}
              onChange={(event) =>
                setSettings({ ...settings, officeName: event.target.value })
              }
            />
            <Input
              required
              placeholder="Nome do remetente"
              value={settings.emailFromName}
              onChange={(event) =>
                setSettings({ ...settings, emailFromName: event.target.value })
              }
            />
            <Input
              required
              placeholder="E-mail remetente"
              type="email"
              value={settings.emailFromAddress}
              onChange={(event) =>
                setSettings({ ...settings, emailFromAddress: event.target.value })
              }
            />
            <Input
              required
              placeholder="Sessão WPPConnect"
              value={settings.wppconnectSession}
              onChange={(event) =>
                setSettings({ ...settings, wppconnectSession: event.target.value })
              }
            />
            <Input
              className="md:col-span-2"
              required
              placeholder="Assunto do e-mail"
              value={settings.emailSubjectTemplate}
              onChange={(event) =>
                setSettings({ ...settings, emailSubjectTemplate: event.target.value })
              }
            />
            <textarea
              className="min-h-36 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              required
              placeholder="Template do corpo do e-mail"
              value={settings.emailBodyTemplate}
              onChange={(event) =>
                setSettings({ ...settings, emailBodyTemplate: event.target.value })
              }
            />
            <textarea
              className="min-h-28 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              required
              placeholder="Template do WhatsApp"
              value={settings.whatsappBodyTemplate}
              onChange={(event) =>
                setSettings({ ...settings, whatsappBodyTemplate: event.target.value })
              }
            />
            <div className="text-sm text-muted-foreground md:col-span-2">
              Variáveis disponíveis: {"{nome_cliente}"}, {"{documento}"}, {"{categoria}"},{" "}
              {"{competencia}"}, {"{vencimento}"}, {"{valor}"}, {"{nome_escritorio}"},{" "}
              {"{nome_usuario}"}. Tokens e chaves de API continuam configurados no `.env`.
            </div>
            <Button className="md:col-span-2" disabled={isSaving} type="submit">
              Salvar configurações
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RegistryCard
          title="Departamentos"
          items={departments}
          newItem={newDepartment}
          disabled={isSaving}
          onNewItemChange={setNewDepartment}
          onCreate={onCreateDepartment}
          onItemChange={(updated) =>
            setDepartments((current) =>
              current.map((item) => (item.id === updated.id ? updated : item))
            )
          }
          onSave={saveDepartment}
        />
        <RegistryCard
          title="Serviços"
          items={services}
          newItem={newService}
          disabled={isSaving}
          onNewItemChange={setNewService}
          onCreate={onCreateService}
          onItemChange={(updated) =>
            setServices((current) =>
              current.map((item) => (item.id === updated.id ? updated : item))
            )
          }
          onSave={saveService}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias de documentos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DOCUMENT_CATEGORIES.map((category) => (
            <Badge key={category}>{category}</Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RegistryCard<T extends DepartmentOption | ServiceOption>({
  title,
  items,
  newItem,
  disabled,
  onNewItemChange,
  onCreate,
  onItemChange,
  onSave
}: {
  title: string;
  items: T[];
  newItem: { name: string; description: string };
  disabled: boolean;
  onNewItemChange: (value: { name: string; description: string }) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onItemChange: (value: T) => void;
  onSave: (value: T) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3" onSubmit={onCreate}>
          <Input
            required
            placeholder={`Novo item em ${title.toLowerCase()}`}
            value={newItem.name}
            onChange={(event) => onNewItemChange({ ...newItem, name: event.target.value })}
          />
          <Input
            placeholder="Descrição"
            value={newItem.description}
            onChange={(event) =>
              onNewItemChange({ ...newItem, description: event.target.value })
            }
          />
          <Button disabled={disabled} type="submit" variant="secondary">
            Adicionar
          </Button>
        </form>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3">
              <div className="grid gap-3">
                <Input
                  value={item.name}
                  onChange={(event) => onItemChange({ ...item, name: event.target.value })}
                />
                <Input
                  placeholder="Descrição"
                  value={item.description ?? ""}
                  onChange={(event) =>
                    onItemChange({ ...item, description: event.target.value })
                  }
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      checked={item.isActive}
                      type="checkbox"
                      onChange={(event) =>
                        onItemChange({ ...item, isActive: event.target.checked })
                      }
                    />
                    Ativo
                  </label>
                  <Button
                    disabled={disabled || !item.name}
                    type="button"
                    variant="outline"
                    onClick={() => onSave(item)}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "")
  ) as T;
}
