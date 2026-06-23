"use client";

import { FormEvent, useEffect, useState } from "react";
import { RECURRENCE_RULE_LABELS } from "@hubcontabil/shared";
import {
  ClientListItem,
  CreateRecurringTaskPayload,
  DepartmentOption,
  RecurringTaskItem,
  UserOption,
  createRecurringTask,
  generateRecurringTask,
  getToken,
  listClients,
  listDepartments,
  listRecurringTasks,
  listUsers,
  updateRecurringTaskActive
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialForm: CreateRecurringTaskPayload = {
  title: "",
  description: "",
  clientId: "",
  departmentId: "",
  responsibleUserId: "",
  recurrenceRule: "MONTHLY",
  nextRunAt: "",
  isActive: true
};

export function RecurringTasksClient() {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState<CreateRecurringTaskPayload>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [monthlyDay, setMonthlyDay] = useState("5");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      setError("Faça login para acessar recorrências.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [rules, clientList, departmentList, userList] = await Promise.all([
        listRecurringTasks(),
        listClients(new URLSearchParams()),
        listDepartments(),
        listUsers()
      ]);
      setRecurringTasks(rules);
      setClients(clientList);
      setDepartments(departmentList);
      setUsers(userList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar recorrências.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createRecurringTask(cleanPayload({
        ...form,
        recurrenceRule:
          form.recurrenceRule === "MONTHLY_DAY"
            ? `MONTHLY_DAY:${monthlyDay}`
            : form.recurrenceRule
      }));
      setForm(initialForm);
      setShowForm(false);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar recorrência.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(rule: RecurringTaskItem) {
    try {
      await updateRecurringTaskActive(rule.id, !rule.isActive);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao alterar recorrência.");
    }
  }

  async function generate(rule: RecurringTaskItem) {
    try {
      await generateRecurringTask(rule.id);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao gerar tarefa.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fechar recorrência" : "Criar recorrência"}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Input
              required
              placeholder="Nome da recorrência"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.clientId}
              onChange={(event) => setForm({ ...form, clientId: event.target.value })}
            >
              <option value="">Sem cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.departmentId}
              onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
            >
              <option value="">Sem departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.responsibleUserId}
              onChange={(event) => setForm({ ...form, responsibleUserId: event.target.value })}
            >
              <option value="">Sem responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.recurrenceRule}
              onChange={(event) => setForm({ ...form, recurrenceRule: event.target.value })}
            >
              {Object.entries(RECURRENCE_RULE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {form.recurrenceRule === "MONTHLY_DAY" ? (
              <Input
                min={1}
                max={31}
                type="number"
                value={monthlyDay}
                onChange={(event) => setMonthlyDay(event.target.value)}
              />
            ) : null}
            <Input
              required
              type="datetime-local"
              value={form.nextRunAt}
              onChange={(event) => setForm({ ...form, nextRunAt: event.target.value })}
            />
            <textarea
              className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              placeholder="Descrição"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
            <Button className="md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Salvar recorrência"}
            </Button>
          </form>
        </Card>
      ) : null}

      {error && !showForm ? <Card className="p-5 text-sm text-danger">{error}</Card> : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {["Nome", "Cliente", "Departamento", "Responsável", "Frequência", "Próxima execução", "Status", "Ações"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={8}>Carregando recorrências...</td></tr>
            ) : recurringTasks.length === 0 ? (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={8}>Nenhuma recorrência cadastrada.</td></tr>
            ) : (
              recurringTasks.map((rule) => (
                <tr key={rule.id} className="border-t border-border">
                  <td className="px-4 py-3">{rule.title}</td>
                  <td className="px-4 py-3">{rule.client?.name ?? "-"}</td>
                  <td className="px-4 py-3">{rule.department?.name ?? "-"}</td>
                  <td className="px-4 py-3">{rule.responsibleUser?.name ?? "-"}</td>
                  <td className="px-4 py-3">{formatRule(rule.recurrenceRule)}</td>
                  <td className="px-4 py-3">{new Date(rule.nextRunAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={rule.isActive ? "success" : "secondary"}>
                      {rule.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="font-medium text-primary" type="button" onClick={() => void generate(rule)}>
                        Gerar
                      </button>
                      <button className="font-medium text-primary" type="button" onClick={() => void toggleActive(rule)}>
                        {rule.isActive ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function formatRule(rule: string) {
  if (rule.startsWith("MONTHLY_DAY:")) {
    return `Mensal no dia ${rule.split(":")[1]}`;
  }

  return RECURRENCE_RULE_LABELS[rule as keyof typeof RECURRENCE_RULE_LABELS] ?? rule;
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null)
  ) as T;
}
