"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserRole } from "@hubcontabil/shared";
import {
  DepartmentOption,
  ManagedUser,
  createUser,
  getToken,
  listDepartmentsAdmin,
  listManagedUsers,
  updateUser
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const roleLabels = {
  ADMIN: "Administrador",
  COLLABORATOR: "Colaborador"
} as const;

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  departmentIds: string[];
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: UserRole.COLLABORATOR,
  isActive: true,
  departmentIds: []
};

export function UsersClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(editingUserId);

  async function load() {
    if (!getToken()) {
      setError("Faca login como administrador para gerenciar usuarios.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [userList, departmentList] = await Promise.all([
        listManagedUsers(),
        listDepartmentsAdmin()
      ]);
      setUsers(userList);
      setDepartments(departmentList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar usuarios.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingUserId(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(emptyForm);
    setEditingUserId(null);
    setShowForm(true);
  }

  function startEdit(user: ManagedUser) {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
      departmentIds: user.departments.map((department) => department.id)
    });
    setEditingUserId(user.id);
    setShowForm(true);
  }

  function toggleDepartment(departmentId: string) {
    setForm((current) => ({
      ...current,
      departmentIds: current.departmentIds.includes(departmentId)
        ? current.departmentIds.filter((id) => id !== departmentId)
        : [...current.departmentIds, departmentId]
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
          isActive: form.isActive,
          departmentIds: form.departmentIds
        });
      } else {
        await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive,
          departmentIds: form.departmentIds
        });
      }

      resetForm();
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar usuario.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao alterar usuario.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={showForm ? resetForm : startCreate}>
          {showForm ? "Fechar formulario" : "Novo usuario"}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Input
              required
              placeholder="Nome"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              required
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <Input
              required={!isEditing}
              minLength={8}
              placeholder={isEditing ? "Nova senha opcional" : "Senha inicial"}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Usuario ativo
            </label>

            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium">Departamentos</p>
              <div className="grid gap-2 md:grid-cols-3">
                {departments.map((department) => (
                  <label
                    key={department.id}
                    className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.departmentIds.includes(department.id)}
                      onChange={() => toggleDepartment(department.id)}
                    />
                    <span>{department.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 md:col-span-2">
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Criar usuario"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {error ? <Card className="p-5 text-sm text-danger">{error}</Card> : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {["Nome", "E-mail", "Perfil", "Departamentos", "Status", "Acoes"].map(
                (heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Carregando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Nenhum usuario cadastrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{roleLabels[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.departments.length ? (
                        user.departments.map((department) => (
                          <Badge key={department.id} variant="secondary">
                            {department.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Sem departamento</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "secondary"}>
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        className="font-medium text-primary"
                        type="button"
                        onClick={() => startEdit(user)}
                      >
                        Editar
                      </button>
                      <button
                        className="font-medium text-primary"
                        type="button"
                        onClick={() => void toggleActive(user)}
                      >
                        {user.isActive ? "Desativar" : "Ativar"}
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
