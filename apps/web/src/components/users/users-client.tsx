"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserRole } from "@hubcontabil/shared";
import {
  ManagedUser,
  createUser,
  getToken,
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

export function UsersClient() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.COLLABORATOR
  });
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      setError("Faça login como administrador para gerenciar usuários.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setUsers(await listManagedUsers());
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar usuários.");
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
      await createUser(form);
      setForm({ name: "", email: "", password: "", role: UserRole.COLLABORATOR });
      setShowForm(false);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar usuário.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    try {
      await updateUser(user.id, { isActive: !user.isActive });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao alterar usuário.");
    }
  }

  async function toggleRole(user: ManagedUser) {
    try {
      await updateUser(user.id, {
        role: user.role === UserRole.ADMIN ? UserRole.COLLABORATOR : UserRole.ADMIN
      });
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao alterar perfil.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Fechar cadastro" : "Novo usuário"}
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
              required
              minLength={8}
              placeholder="Senha inicial"
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
            <Button className="md:col-span-2" disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Criar usuário"}
            </Button>
          </form>
        </Card>
      ) : null}

      {error ? <Card className="p-5 text-sm text-danger">{error}</Card> : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {["Nome", "E-mail", "Perfil", "Status", "Ações"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  Carregando usuários...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  Nenhum usuário cadastrado.
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
                    <Badge variant={user.isActive ? "success" : "secondary"}>
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="font-medium text-primary" type="button" onClick={() => void toggleRole(user)}>
                        Alternar perfil
                      </button>
                      <button className="font-medium text-primary" type="button" onClick={() => void toggleActive(user)}>
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
