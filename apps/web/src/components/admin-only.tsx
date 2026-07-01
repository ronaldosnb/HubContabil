"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@hubcontabil/shared";
import { AuthUser, getCurrentUser, getToken } from "@/lib/client-api";
import { Card } from "@/components/ui/card";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        setError("Faca login como administrador para acessar esta tela.");
        setIsLoading(false);
        return;
      }

      try {
        setUser(await getCurrentUser());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Nao foi possivel validar seu acesso.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, []);

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Validando acesso...</Card>;
  }

  if (error || user?.role !== UserRole.ADMIN) {
    return (
      <Card className="p-5">
        <p className="text-sm font-medium text-danger">Acesso restrito.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta tela esta disponivel apenas para administradores do sistema.
        </p>
      </Card>
    );
  }

  return <>{children}</>;
}
