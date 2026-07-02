"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MeiPageClient } from "@/components/mei/mei-page-client";
import { Button } from "@/components/ui/button";
import { emitDasForAll, getAllLatestDas, getDocumentDownloadUrl } from "@/lib/client-api";

export default function MeiPage() {
  const [emittingAll, setEmittingAll] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  async function handleEmitAll() {
    setEmittingAll(true);
    try {
      const result = await emitDasForAll();
      alert(`${result.count} guias DAS sendo emitidas em segundo plano.`);
    } catch {
      alert("Erro ao enfileirar emissão de DAS.");
    } finally {
      setEmittingAll(false);
    }
  }

  async function handleDownloadAll() {
    setDownloadingAll(true);
    try {
      const items = await getAllLatestDas();
      if (items.length === 0) {
        alert("Nenhuma DAS encontrada. Emita as guias primeiro.");
        return;
      }
      for (const item of items) {
        window.open(getDocumentDownloadUrl(item.documentId), "_blank");
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      alert("Erro ao buscar DAS.");
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">MEI</h1>
          <p className="text-sm text-muted-foreground">
            Area dedicada para acompanhamento de clientes microempreendedores individuais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={downloadingAll} onClick={() => void handleDownloadAll()}>
            {downloadingAll ? "Buscando..." : "Baixar Última DAS de Todos"}
          </Button>
          <Button variant="outline" disabled={emittingAll} onClick={() => void handleEmitAll()}>
            {emittingAll ? "Enfileirando..." : "Emitir DAS de Todos"}
          </Button>
          <Button asChild>
            <Link href="/clientes?type=MEI&new=1">Cadastrar cliente</Link>
          </Button>
        </div>
      </div>

      <MeiPageClient />
    </AppShell>
  );
}
