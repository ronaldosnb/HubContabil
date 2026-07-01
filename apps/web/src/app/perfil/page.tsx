import { AppShell } from "@/components/app-shell";
import { ProfileClient } from "@/components/profile/profile-client";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados de acesso ao sistema.
        </p>
      </div>
      <ProfileClient />
    </AppShell>
  );
}
