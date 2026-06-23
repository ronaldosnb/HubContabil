"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus
} from "@hubcontabil/shared";
import {
  ClientListItem,
  CreateTaskPayload,
  DepartmentOption,
  DocumentListItem,
  TaskListItem,
  UserOption,
  createTask,
  getToken,
  listClients,
  listDepartments,
  listDocuments,
  listTasks,
  listUsers,
  replicateTask,
  updateTask,
  updateTaskStatus
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialTaskForm: CreateTaskPayload = {
  title: "",
  description: "",
  clientId: "",
  departmentId: "",
  responsibleUserId: "",
  documentId: "",
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: ""
};

export function KanbanBoardClient() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [filters, setFilters] = useState({
    clientId: "",
    responsibleUserId: "",
    departmentId: "",
    priority: "",
    dueFrom: "",
    dueTo: "",
    overdue: false,
    recurring: false
  });
  const [form, setForm] = useState<CreateTaskPayload>(initialTaskForm);
  const [replicateForm, setReplicateForm] = useState({
    dueDate: "",
    responsibleUserId: "",
    status: TaskStatus.TODO,
    description: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          searchParams.set(key, "true");
        }
      } else if (value) {
        searchParams.set(key, value);
      }
    });

    return searchParams;
  }, [filters]);

  async function load() {
    if (!getToken()) {
      setIsLoading(false);
      setError("Faça login para acessar o Kanban.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [taskList, clientList, userList, departmentList, documentList] =
        await Promise.all([
          listTasks(params),
          listClients(new URLSearchParams()),
          listUsers(),
          listDepartments(),
          listDocuments(new URLSearchParams())
        ]);

      setTasks(taskList);
      setClients(clientList);
      setUsers(userList);
      setDepartments(departmentList);
      setDocuments(documentList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar Kanban.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  async function onCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await createTask(cleanPayload(form));
      setForm(initialTaskForm);
      setShowForm(false);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar tarefa.");
    } finally {
      setIsSaving(false);
    }
  }

  async function moveTask(taskId: string, status: TaskStatus) {
    const previous = tasks;
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === status) {
      return;
    }

    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, status } : item))
    );

    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((current) => current.map((item) => (item.id === taskId ? updated : item)));
      setSelectedTask((current) => (current?.id === taskId ? updated : current));
    } catch (error) {
      setTasks(previous);
      setError(error instanceof Error ? error.message : "Erro ao mover tarefa.");
    }
  }

  async function quickStatus(status: TaskStatus) {
    if (!selectedTask) {
      return;
    }

    await moveTask(selectedTask.id, status);
  }

  async function onSaveSelected() {
    if (!selectedTask) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateTask(selectedTask.id, cleanPayload({
        title: selectedTask.title,
        description: selectedTask.description ?? "",
        clientId: selectedTask.clientId ?? "",
        departmentId: selectedTask.departmentId ?? "",
        responsibleUserId: selectedTask.responsibleUserId ?? "",
        documentId: selectedTask.documentId ?? "",
        status: selectedTask.status,
        priority: selectedTask.priority,
        dueDate: selectedTask.dueDate?.slice(0, 10) ?? ""
      }));
      setSelectedTask(updated);
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar tarefa.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onReplicateSelected() {
    if (!selectedTask) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const replicated = await replicateTask(selectedTask.id, cleanPayload(replicateForm));
      setTasks((current) => [...current, replicated]);
      setSelectedTask(replicated);
      setReplicateForm({
        dueDate: "",
        responsibleUserId: "",
        status: TaskStatus.TODO,
        description: ""
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao replicar tarefa.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fechar tarefa" : "Nova tarefa"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.clientId}
          onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}
        >
          <option value="">Cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
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
          <option value="">Responsável</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.departmentId}
          onChange={(event) =>
            setFilters({ ...filters, departmentId: event.target.value })
          }
        >
          <option value="">Departamento</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.priority}
          onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
        >
          <option value="">Prioridade</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={filters.dueFrom}
          onChange={(event) => setFilters({ ...filters, dueFrom: event.target.value })}
        />
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
          <input
            checked={filters.overdue}
            type="checkbox"
            onChange={(event) => setFilters({ ...filters, overdue: event.target.checked })}
          />
          Vencidas
        </label>
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
          <input
            checked={filters.recurring}
            type="checkbox"
            onChange={(event) => setFilters({ ...filters, recurring: event.target.checked })}
          />
          Recorrentes
        </label>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateTask}>
            <Input
              required
              placeholder="Título da tarefa"
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
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.departmentId}
              onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
            >
              <option value="">Sem departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.responsibleUserId}
              onChange={(event) =>
                setForm({ ...form, responsibleUserId: event.target.value })
              }
            >
              <option value="">Sem responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value as TaskPriority })
              }
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
              value={form.documentId}
              onChange={(event) => setForm({ ...form, documentId: event.target.value })}
            >
              <option value="">Sem documento vinculado</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title} · {document.client.name}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              placeholder="Descrição"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <Button className="md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Criar tarefa"}
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

      <div className="grid gap-4 xl:grid-cols-5">
        {Object.entries(TASK_STATUS_LABELS).map(([status, label]) => {
          const columnStatus = status as TaskStatus;
          const columnTasks = tasks.filter((task) => task.status === columnStatus);

          return (
            <section
              key={status}
              className="min-h-96 rounded-lg bg-kanban-column-bg p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const taskId = draggedTaskId ?? event.dataTransfer.getData("text/plain");
                setDraggedTaskId(null);
                if (taskId) {
                  void moveTask(taskId, columnStatus);
                }
              }}
            >
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">
                {label}
                <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
              </h2>
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                ) : columnTasks.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Sem tarefas.
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => {
                        setSelectedTask(task);
                        setReplicateForm({
                          dueDate: "",
                          responsibleUserId: task.responsibleUserId ?? "",
                          status: TaskStatus.TODO,
                          description: task.description ?? ""
                        });
                      }}
                      onDragStart={() => setDraggedTaskId(task.id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {selectedTask ? (
        <Card className="fixed bottom-4 right-4 top-20 z-20 w-[min(520px,calc(100vw-2rem))] overflow-y-auto p-5 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Detalhes da tarefa</h2>
              <p className="text-sm text-muted-foreground">
                Criada por {selectedTask.createdBy.name}
              </p>
            </div>
            <button
              className="text-sm font-medium text-primary"
              type="button"
              onClick={() => setSelectedTask(null)}
            >
              Fechar
            </button>
          </div>

          <div className="space-y-3">
            <Input
              value={selectedTask.title}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, title: event.target.value })
              }
            />
            <textarea
              className="min-h-24 w-full rounded-md border border-border bg-background p-3 text-sm outline-none"
              value={selectedTask.description ?? ""}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, description: event.target.value })
              }
            />
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={selectedTask.clientId ?? ""}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, clientId: event.target.value || null })
              }
            >
              <option value="">Sem cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={selectedTask.departmentId ?? ""}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, departmentId: event.target.value || null })
              }
            >
              <option value="">Sem departamento</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={selectedTask.responsibleUserId ?? ""}
              onChange={(event) =>
                setSelectedTask({
                  ...selectedTask,
                  responsibleUserId: event.target.value || null
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
            <div className="grid grid-cols-2 gap-3">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedTask.status}
                onChange={(event) =>
                  setSelectedTask({ ...selectedTask, status: event.target.value as TaskStatus })
                }
              >
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={selectedTask.priority}
                onChange={(event) =>
                  setSelectedTask({
                    ...selectedTask,
                    priority: event.target.value as TaskPriority
                  })
                }
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              type="date"
              value={selectedTask.dueDate?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, dueDate: event.target.value || null })
              }
            />
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={selectedTask.documentId ?? ""}
              onChange={(event) =>
                setSelectedTask({ ...selectedTask, documentId: event.target.value || null })
              }
            >
              <option value="">Sem documento vinculado</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title} · {document.client.name}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <Button disabled={isSaving} type="button" onClick={() => void onSaveSelected()}>
                Salvar
              </Button>
              <Button
                disabled={isSaving}
                type="button"
                variant="outline"
                onClick={() => void quickStatus(TaskStatus.DONE)}
              >
                Concluir
              </Button>
              <Button
                disabled={isSaving}
                type="button"
                variant="outline"
                onClick={() => void quickStatus(TaskStatus.CANCELED)}
              >
                Cancelar
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold">Replicar tarefa</h3>
              <div className="space-y-3">
                <Input
                  type="date"
                  value={replicateForm.dueDate}
                  onChange={(event) =>
                    setReplicateForm({ ...replicateForm, dueDate: event.target.value })
                  }
                />
                <select
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={replicateForm.responsibleUserId}
                  onChange={(event) =>
                    setReplicateForm({
                      ...replicateForm,
                      responsibleUserId: event.target.value
                    })
                  }
                >
                  <option value="">Mesmo responsável</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-20 w-full rounded-md border border-border bg-background p-3 text-sm outline-none"
                  value={replicateForm.description}
                  onChange={(event) =>
                    setReplicateForm({ ...replicateForm, description: event.target.value })
                  }
                />
                <Button
                  disabled={isSaving}
                  type="button"
                  variant="secondary"
                  onClick={() => void onReplicateSelected()}
                >
                  Replicar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function TaskCard({
  task,
  onClick,
  onDragStart
}: {
  task: TaskListItem;
  onClick: () => void;
  onDragStart: () => void;
}) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    ![TaskStatus.DONE, TaskStatus.CANCELED].includes(task.status);

  return (
    <Card
      className="cursor-grab bg-kanban-card-bg"
      draggable
      onClick={onClick}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        onDragStart();
      }}
    >
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>{task.client?.name ?? "Sem cliente"}</p>
        <p className="text-muted-foreground">
          {task.responsibleUser?.name ?? "Sem responsável"} ·{" "}
          {task.department?.name ?? "Sem departamento"}
        </p>
        <p>Prazo: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "-"}</p>
        {task.document ? (
          <p className="text-muted-foreground">Documento: {task.document.title}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant={task.priority === TaskPriority.URGENT ? "danger" : "warning"}>
            {TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
          <Badge>{TASK_STATUS_LABELS[task.status]}</Badge>
          {isOverdue ? <Badge variant="danger">Vencida</Badge> : null}
          {task.isRecurringInstance ? <Badge variant="info">Recorrente</Badge> : null}
          {task.replicatedFromTaskId ? <Badge>Replicada</Badge> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null)
  ) as T;
}
