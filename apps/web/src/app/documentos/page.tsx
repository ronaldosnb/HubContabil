import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DocumentsPageClient } from "@/components/documents/documents-page-client";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos por cliente, categoria, competência, vencimento e status manual.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/documentos/enviar">Enviar</Link></Button>
          <Button asChild><Link href="/documentos/novo">Novo documento</Link></Button>
        </div>
      </div>
      <DocumentsPageClient />
    </AppShell>
  );
}
