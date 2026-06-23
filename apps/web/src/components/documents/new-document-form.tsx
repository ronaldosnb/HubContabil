"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUS_LABELS,
  DocumentStatus
} from "@hubcontabil/shared";
import {
  ClientListItem,
  createDocument,
  getToken,
  listClients
} from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function NewDocumentForm() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [competence, setCompetence] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<DocumentStatus>(DocumentStatus.PENDING);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadClients() {
      if (!getToken()) {
        setError("Faça login para cadastrar documentos.");
        setIsLoading(false);
        return;
      }

      try {
        const clientList = await listClients(new URLSearchParams());
        setClients(clientList);
        setClientId(clientList[0]?.id ?? "");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro ao carregar clientes.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadClients();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }

    if (!clientId) {
      setError("Selecione um cliente.");
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("clientId", clientId);
      formData.set("category", category);
      formData.set("title", title);
      formData.set("status", status);
      formData.set("file", file);

      if (description) {
        formData.set("description", description);
      }

      if (competence) {
        formData.set("competence", competence);
      }

      if (dueDate) {
        formData.set("dueDate", dueDate);
      }

      if (amount) {
        formData.set("amount", amount);
      }

      await createDocument(formData);
      router.push("/documentos");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar documento.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando clientes...</Card>;
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        required
        value={clientId}
        onChange={(event) => setClientId(event.target.value)}
      >
        <option value="">Selecione o cliente</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        {DOCUMENT_CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <Input
        placeholder="Título"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Input
        placeholder="Competência"
        value={competence}
        onChange={(event) => setCompetence(event.target.value)}
      />
      <Input
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />
      <Input
        placeholder="Valor"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
        value={status}
        onChange={(event) => setStatus(event.target.value as DocumentStatus)}
      >
        {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Input
        className="md:col-span-2"
        required
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <textarea
        className="min-h-24 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
        placeholder="Descrição"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
      <Button className="md:col-span-2" disabled={isSaving} type="submit">
        {isSaving ? "Salvando..." : "Salvar documento"}
      </Button>
    </form>
  );
}
