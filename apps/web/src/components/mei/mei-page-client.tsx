"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CLIENT_STATUS_LABELS, ClientStatus, ClientType } from "@hubcontabil/shared";
import {
  ClientListItem,
  emitDasForClient,
  getLatestDas,
  getDocumentDownloadUrl,
  getToken,
  listClients,
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DasRowState = "idle" | "emitting" | "done" | "error" | "downloading";

export function MeiPageClient() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowState, setRowState] = useState<Record<string, DasRowState>>({});

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        setIsLoading(false);
        setError("Faça login para acessar os clientes MEI.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ type: ClientType.MEI });
        setClients(await listClients(params));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar clientes MEI.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  function setClientState(clientId: string, state: DasRowState) {
    setRowState((prev) => ({ ...prev, [clientId]: state }));
  }

  async function handleEmit(clientId: string) {
    setClientState(clientId, "emitting");
    try {
      await emitDasForClient(clientId);
      setClientState(clientId, "done");
    } catch {
      setClientState(clientId, "error");
    }
  }

  async function handleDownload(clientId: string) {
    setClientState(clientId, "downloading");
    try {
      const latest = await getLatestDas(clientId);
      if (!latest) {
        alert("Nenhuma DAS encontrada para este cliente. Emita primeiro.");
        setClientState(clientId, "idle");
        return;
      }
      window.open(getDocumentDownloadUrl(latest.id), "_blank");
      setClientState(clientId, "idle");
    } catch {
      setClientState(clientId, "error");
    }
  }

  if (error) {
    return <Card className="p-5 text-sm text-danger">{error}</Card>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {["Apelido", "CPF/CNPJ", "Status", "Responsável", "Contato", "Tarefas", "Documentos", "Ações"].map(
              (heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                Carregando clientes MEI...
              </td>
            </tr>
          ) : clients.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                Nenhum cliente MEI cadastrado.
              </td>
            </tr>
          ) : (
            clients.map((client) => {
              const mainContact = client.contacts.find((c) => c.isMain);
              const state = rowState[client.id] ?? "idle";

              return (
                <tr key={client.id} className="border-t border-border">
                  <td className="px-4 py-3">{client.name}</td>
                  <td className="px-4 py-3">{client.documentNumber ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={client.status === ClientStatus.ACTIVE ? "success" : "secondary"}>
                      {CLIENT_STATUS_LABELS[client.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{client.internalResponsible?.name ?? "-"}</td>
                  <td className="px-4 py-3">{mainContact?.name ?? "-"}</td>
                  <td className="px-4 py-3">{client._count.tasks}</td>
                  <td className="px-4 py-3">{client._count.documents}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link className="font-medium text-primary text-sm" href={`/clientes/${client.id}`}>
                        Abrir
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={state === "emitting"}
                        onClick={() => void handleEmit(client.id)}
                      >
                        {state === "emitting" ? "Emitindo..." : state === "done" ? "Emitida ✓" : "Emitir DAS"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={state === "downloading"}
                        onClick={() => void handleDownload(client.id)}
                      >
                        {state === "downloading" ? "Buscando..." : "Baixar DAS"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
}
