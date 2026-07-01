"use client";

import { FormEvent, useEffect, useState } from "react";
import { UserRole } from "@hubcontabil/shared";
import { AuthUser, getCurrentUser, getToken, updateCurrentUser } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const roleLabels = {
  ADMIN: "Administrador",
  COLLABORATOR: "Colaborador"
} as const satisfies Record<UserRole, string>;

export function ProfileClient() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!getToken()) {
      setError("Faca login para acessar seu perfil.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setForm({
        name: currentUser.name,
        email: currentUser.email,
        password: ""
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar perfil.");
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
    setMessage(null);

    try {
      const updatedUser = await updateCurrentUser({
        name: form.name,
        email: form.email,
        password: form.password || undefined
      });
      setUser(updatedUser);
      setForm({ name: updatedUser.name, email: updatedUser.email, password: "" });
      setMessage("Perfil atualizado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao atualizar perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando perfil...</Card>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      {error ? <Card className="p-4 text-sm text-danger">{error}</Card> : null}
      {message ? <Card className="p-4 text-sm text-success">{message}</Card> : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados do usuario</CardTitle>
          <CardDescription>
            Atualize seu nome, e-mail de acesso e senha quando necessario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-name">
                Nome
              </label>
              <Input
                id="profile-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-email">
                E-mail
              </label>
              <Input
                id="profile-email"
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="profile-password">
                Nova senha
              </label>
              <Input
                id="profile-password"
                minLength={8}
                placeholder="Deixe em branco para manter a senha atual"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </div>

            {user ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                Perfil atual:
                <Badge>{roleLabels[user.role]}</Badge>
              </div>
            ) : null}

            <Button disabled={isSaving} type="submit">
              {isSaving ? "Salvando..." : "Salvar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
