import { AppShell } from "@/components/app-shell";
import { UsersClient } from "@/components/users/users-client";

export default function UsersPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gestão simples com perfis Administrador e Colaborador.</p>
        </div>
      </div>
      <UsersClient />
    </AppShell>
  );
}
