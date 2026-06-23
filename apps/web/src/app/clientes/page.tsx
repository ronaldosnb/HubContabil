import { AppShell } from "@/components/app-shell";
import { ClientsPageClient } from "@/components/clients/clients-page-client";

export default function ClientsPage() {
  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e gestão de clientes, contatos e serviços contratados.
          </p>
        </div>
      </div>
      <ClientsPageClient />
    </AppShell>
  );
}
