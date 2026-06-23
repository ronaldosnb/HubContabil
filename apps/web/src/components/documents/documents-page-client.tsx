"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUS_LABELS,
  DocumentStatus
} from "@hubcontabil/shared";
import {
  ClientListItem,
  DocumentListItem,
  UpdateDocumentPayload,
  deleteDocument,
  getDocumentDownloadUrl,
  getToken,
  listClients,
  listDocuments,
  updateDocument
} from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DocumentEditForm = {
  title: string;
  category: string;
  description: string;
  competence: string;
  dueDate: string;
  amount: string;
  status: DocumentStatus;
};

export function DocumentsPageClient() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    clientId: "",
    category: "",
    status: "",
    competence: "",
    dueSoon: false,
    pendingToSend: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null);
  const [editForm, setEditForm] = useState<DocumentEditForm | null>(null);
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
      setError("Faça login para acessar os documentos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [documentList, clientList] = await Promise.all([
        listDocuments(params),
        listClients(new URLSearchParams())
      ]);
      setDocuments(documentList);
      setClients(clientList);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao carregar documentos.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [params]);

  async function download(document: DocumentListItem) {
    const token = getToken();

    if (!token) {
      setError("Faça login para baixar documentos.");
      return;
    }

    try {
      const response = await fetch(getDocumentDownloadUrl(document.id), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Não foi possível baixar o arquivo.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.originalFileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao baixar documento.");
    }
  }

  async function view(document: DocumentListItem) {
    const token = getToken();

    if (!token) {
      setError("Faça login para visualizar documentos.");
      return;
    }

    try {
      const response = await fetch(getDocumentDownloadUrl(document.id), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Não foi possível visualizar o arquivo.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao visualizar documento.");
    }
  }

  function startEdit(document: DocumentListItem) {
    setSelectedDocument(document);
    setEditForm({
      title: document.title,
      category: document.category,
      description: document.description ?? "",
      competence: document.competence ?? "",
      dueDate: document.dueDate?.slice(0, 10) ?? "",
      amount: document.amount ?? "",
      status: document.status
    });
  }

  async function saveEdit() {
    if (!selectedDocument || !editForm) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: UpdateDocumentPayload = {
      title: editForm.title,
      category: editForm.category,
      description: editForm.description || null,
      competence: editForm.competence || null,
      dueDate: editForm.dueDate || null,
      amount: editForm.amount || null,
      status: editForm.status
    };

    try {
      const updated = await updateDocument(selectedDocument.id, payload);
      setDocuments((current) =>
        current.map((document) => (document.id === updated.id ? updated : document))
      );
      setSelectedDocument(updated);
      startEdit(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao editar documento.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSelected() {
    if (!selectedDocument) {
      return;
    }

    if (!window.confirm(`Excluir o documento "${selectedDocument.title}"?`)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await deleteDocument(selectedDocument.id);
      setDocuments((current) =>
        current.filter((document) => document.id !== selectedDocument.id)
      );
      setSelectedDocument(null);
      setEditForm(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao excluir documento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Buscar documento ou cliente"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.clientId}
          onChange={(event) => setFilters({ ...filters, clientId: event.target.value })}
        >
          <option value="">Todos os clientes</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="">Todas as categorias</option>
          {DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">Todos os status</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          placeholder="Competência"
          value={filters.competence}
          onChange={(event) => setFilters({ ...filters, competence: event.target.value })}
        />
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
          <input
            checked={filters.dueSoon}
            type="checkbox"
            onChange={(event) => setFilters({ ...filters, dueSoon: event.target.checked })}
          />
          Próximos do vencimento
        </label>
        <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
          <input
            checked={filters.pendingToSend}
            type="checkbox"
            onChange={(event) =>
              setFilters({ ...filters, pendingToSend: event.target.checked })
            }
          />
          Pendentes de envio
        </label>
      </div>

      {error ? (
        <Card className="p-5 text-sm text-danger">
          {error}{" "}
          <Link className="font-medium text-primary" href="/login">
            Ir para login
          </Link>
        </Card>
      ) : null}

      {selectedDocument && editForm ? (
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Editar documento</h2>
              <p className="text-sm text-muted-foreground">
                {selectedDocument.originalFileName}
              </p>
            </div>
            <button
              className="text-sm font-medium text-primary"
              type="button"
              onClick={() => {
                setSelectedDocument(null);
                setEditForm(null);
              }}
            >
              Fechar
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              required
              value={editForm.title}
              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={editForm.category}
              onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Input
              placeholder="Competência"
              value={editForm.competence}
              onChange={(event) => setEditForm({ ...editForm, competence: event.target.value })}
            />
            <Input
              type="date"
              value={editForm.dueDate}
              onChange={(event) => setEditForm({ ...editForm, dueDate: event.target.value })}
            />
            <Input
              placeholder="Valor"
              value={editForm.amount}
              onChange={(event) => setEditForm({ ...editForm, amount: event.target.value })}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={editForm.status}
              onChange={(event) =>
                setEditForm({ ...editForm, status: event.target.value as DocumentStatus })
              }
            >
              {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              placeholder="Descrição"
              value={editForm.description}
              onChange={(event) =>
                setEditForm({ ...editForm, description: event.target.value })
              }
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button disabled={isSaving || !editForm.title} type="button" onClick={saveEdit}>
                Salvar documento
              </Button>
              <Button disabled={isSaving} type="button" variant="outline" onClick={removeSelected}>
                Excluir
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {[
                "Documento",
                "Cliente",
                "Categoria",
                "Competência",
                "Vencimento",
                "Valor",
                "Status",
                "Envios",
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
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  Carregando documentos...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  Nenhum documento encontrado.
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{document.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {document.originalFileName}
                    </div>
                  </td>
                  <td className="px-4 py-3">{document.client.name}</td>
                  <td className="px-4 py-3">{document.category}</td>
                  <td className="px-4 py-3">{document.competence ?? "-"}</td>
                  <td className="px-4 py-3">
                    {document.dueDate
                      ? new Date(document.dueDate).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(document.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        document.status === DocumentStatus.PENDING ? "warning" : "secondary"
                      }
                    >
                      {DOCUMENT_STATUS_LABELS[document.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {document._count.sends > 0 ? "Enviado" : "Não enviado"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="font-medium text-primary"
                        type="button"
                        onClick={() => void view(document)}
                      >
                        Visualizar
                      </button>
                      <button
                        className="font-medium text-primary"
                        type="button"
                        onClick={() => void download(document)}
                      >
                        Baixar
                      </button>
                      <Link className="font-medium text-primary" href="/documentos/enviar">
                        Enviar
                      </Link>
                      <button
                        className="font-medium text-primary"
                        type="button"
                        onClick={() => startEdit(document)}
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function formatCurrency(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}
