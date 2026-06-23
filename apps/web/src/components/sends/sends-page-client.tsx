"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DOCUMENT_SEND_STATUS_LABELS,
  SEND_CHANNEL_LABELS,
  SEND_CHANNEL_STATUS_LABELS,
  DocumentSendStatus,
  SendChannel
} from "@hubcontabil/shared";
import {
  ClientListItem,
  DocumentListItem,
  DocumentSendItem,
  cancelDocumentSend,
  getToken,
  listClients,
  listDocumentSends,
  listDocuments,
  resendDocumentSend
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SendsPageClient() {
  const [sends, setSends] = useState<DocumentSendItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [filters, setFilters] = useState({
    clientId: "",
    documentId: "",
    channel: "",
    status: "",
    dateFrom: "",
    errorOnly: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) {
          searchParams.set(key, "true");
        }
      } else if (value) {
        searchParams.set(key, value);
      }
    });

    return searchParams;
  }, [filters]);

  async function load() {
    if (!getToken()) {
      setIsLoading(false);
      setError("Faça login para acessar os envios.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [sendList, clientList, documentList] = await Promise.all([
        listDocumentSends(params),
        listClients(new URLSearchParams()),
        listDocuments(new URLSearchParams())
      ]);
      setSends(sendList);
      setClients(clientList);
      setDocuments(documentList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar envios.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  async function resend(id: string) {
    try {
      await resendDocumentSend(id);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao reenviar.");
    }
  }

  async function cancel(id: string) {
    try {
      await cancelDocumentSend(id);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao cancelar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.clientId}
          onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}
        >
          <option value="">Cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.documentId}
          onChange={(event) => setFilters({ ...filters, documentId: event.target.value })}
        >
          <option value="">Documento</option>
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.title}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.channel}
          onChange={(event) => setFilters({ ...filters, channel: event.target.value })}
        >
          <option value="">Canal</option>
          {Object.entries(SEND_CHANNEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">Status</option>
          {Object.entries(DOCUMENT_SEND_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
        />
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
          <input
            checked={filters.errorOnly}
            type="checkbox"
            onChange={(event) => setFilters({ ...filters, errorOnly: event.target.checked })}
          />
          Com erro
        </label>
      </div>

      {error ? <Card className="p-5 text-sm text-danger">{error}</Card> : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {[
                "Documento",
                "Cliente",
                "Canal",
                "Destinatário",
                "Status geral",
                "E-mail",
                "WhatsApp",
                "Data",
                "Usuário",
                "Ações"
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={10}>
                  Carregando envios...
                </td>
              </tr>
            ) : sends.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={10}>
                  Nenhum envio encontrado.
                </td>
              </tr>
            ) : (
              sends.map((send) => {
                const email = send.channels.find(
                  (channel) => channel.channel === SendChannel.EMAIL
                );
                const whatsapp = send.channels.find(
                  (channel) => channel.channel === SendChannel.WHATSAPP
                );
                const hasError = send.channels.some((channel) => channel.errorMessage);

                return (
                  <tr key={send.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">{send.document.title}</td>
                    <td className="px-4 py-3">{send.client.name}</td>
                    <td className="px-4 py-3">
                      {send.channels
                        .map((channel) => SEND_CHANNEL_LABELS[channel.channel])
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      {send.channels[0]?.recipientName ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={send.status} />
                    </td>
                    <td className="px-4 py-3">
                      {email ? SEND_CHANNEL_STATUS_LABELS[email.status] : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {whatsapp ? SEND_CHANNEL_STATUS_LABELS[whatsapp.status] : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(send.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">{send.createdBy.name}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {hasError ? (
                          <p className="max-w-52 text-xs text-danger">
                            {send.channels
                              .map((channel) => channel.errorMessage)
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                        ) : null}
                        <div className="flex gap-3">
                          <button
                            className="font-medium text-primary"
                            type="button"
                            onClick={() => void resend(send.id)}
                          >
                            Reenviar
                          </button>
                          {[DocumentSendStatus.PENDING, DocumentSendStatus.PROCESSING].includes(
                            send.status
                          ) ? (
                            <button
                              className="font-medium text-danger"
                              type="button"
                              onClick={() => void cancel(send.id)}
                            >
                              Cancelar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentSendStatus }) {
  const variant =
    status === DocumentSendStatus.SENT
      ? "success"
      : [DocumentSendStatus.ERROR, DocumentSendStatus.PARTIAL_ERROR].includes(status)
        ? "danger"
        : status === DocumentSendStatus.CANCELED
          ? "secondary"
          : "warning";

  return <Badge variant={variant}>{DOCUMENT_SEND_STATUS_LABELS[status]}</Badge>;
}
