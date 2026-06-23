import { AppShell } from "@/components/app-shell";
import { SendsPageClient } from "@/components/sends/sends-page-client";

export default function SendsPage() {
  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-semibold">Envios</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Acompanhamento de status geral e status separado por canal.
      </p>
      <SendsPageClient />
    </AppShell>
  );
}
