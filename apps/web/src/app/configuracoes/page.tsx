import { AppShell } from "@/components/app-shell";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-semibold">Configurações</h1>
      <SettingsClient />
    </AppShell>
  );
}
