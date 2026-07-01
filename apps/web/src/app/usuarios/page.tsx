import { AdminOnly } from "@/components/admin-only";
import { AppShell } from "@/components/app-shell";
import { UsersClient } from "@/components/users/users-client";

export default function UsersPage() {
  return (
    <AppShell>
      <AdminOnly>
        <div className="mb-5">
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestao simples com perfis Administrador e Colaborador.
          </p>
        </div>
        <UsersClient />
      </AdminOnly>
    </AppShell>
  );
}
