import { AdminOnly } from "@/components/admin-only";
import { AppShell } from "@/components/app-shell";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <AppShell>
      <AdminOnly>
        <h1 className="mb-5 text-2xl font-semibold">Configuracoes</h1>
        <SettingsClient />
      </AdminOnly>
    </AppShell>
  );
}
