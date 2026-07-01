"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CLIENT_STATUS_LABELS, ClientStatus, ClientType } from "@hubcontabil/shared";
import { ClientListItem, getToken, listClients } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function MeiPageClient() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro ao carregar clientes MEI.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  if (error) {
    return <Card className="p-5 text-sm text-danger">{error}</Card>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {["Apelido", "CPF/CNPJ", "Status", "Responsável", "Contato", "Tarefas", "Documentos", "Ação"].map(
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
              const mainContact = client.contacts.find((contact) => contact.isMain);

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
                    <Link className="font-medium text-primary" href={`/clientes/${client.id}`}>
                      Abrir
                    </Link>
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
