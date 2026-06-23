"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SEND_CHANNEL_LABELS,
  SendChannel
} from "@hubcontabil/shared";
import {
  ClientContact,
  ClientListItem,
  DocumentListItem,
  createDocumentSend,
  getToken,
  listClients,
  listDocuments,
  previewDocumentSend
} from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SendDocumentClient() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [recipientContactId, setRecipientContactId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
  const [channels, setChannels] = useState<SendChannel[]>([SendChannel.EMAIL]);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocument = documents.find((document) => document.id === documentId);
  const selectedClient = clients.find((client) => client.id === selectedDocument?.clientId);
  const contacts = useMemo(() => selectedClient?.contacts ?? [], [selectedClient]);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        setError("Faça login para enviar documentos.");
        setIsLoading(false);
        return;
      }

      try {
        const [documentList, clientList] = await Promise.all([
          listDocuments(new URLSearchParams()),
          listClients(new URLSearchParams())
        ]);
        setDocuments(documentList);
        setClients(clientList);
        setDocumentId(documentList[0]?.id ?? "");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    const mainContact = contacts.find((contact) => contact.isMain) ?? contacts[0];
    setRecipientContactId(mainContact?.id ?? "");
    applyContact(mainContact);
  }, [contacts]);

  async function generatePreview() {
    if (!documentId) {
      setError("Selecione um documento.");
      return;
    }

    setError(null);

    try {
      const preview = await previewDocumentSend({
        documentId,
        recipientContactId: recipientContactId || undefined,
        channels
      });
      setMessageSubject(preview.messageSubject);
      setMessageBody(preview.messageBody);

      if (preview.recipient) {
        setRecipientName(preview.recipient.name);
        setRecipientEmail(preview.recipient.email ?? "");
        setRecipientWhatsapp(preview.recipient.whatsapp ?? "");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao gerar prévia.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!reviewed) {
      setError("Marque a revisão humana antes de confirmar o envio.");
      return;
    }

    if (channels.length === 0) {
      setError("Selecione ao menos um canal.");
      return;
    }

    setIsSaving(true);

    try {
      await createDocumentSend({
        documentId,
        recipientContactId: recipientContactId || undefined,
        channels,
        messageSubject,
        messageBody,
        recipient: {
          name: recipientName,
          email: recipientEmail,
          whatsapp: recipientWhatsapp
        },
        reviewed
      });
      router.push("/envios");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao confirmar envio.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleChannel(channel: SendChannel) {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  }

  function applyContact(contact?: ClientContact) {
    setRecipientName(contact?.name ?? selectedClient?.name ?? "");
    setRecipientEmail(contact?.email ?? "");
    setRecipientWhatsapp(contact?.whatsapp ?? "");
  }

  if (isLoading) {
    return <Card className="p-5 text-sm text-muted-foreground">Carregando dados...</Card>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Revisão humana obrigatória</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
              required
              value={documentId}
              onChange={(event) => {
                setDocumentId(event.target.value);
                setReviewed(false);
              }}
            >
              <option value="">Selecione o documento</option>
              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title} · {document.client.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm md:col-span-2"
              value={recipientContactId}
              onChange={(event) => {
                const contactId = event.target.value;
                setRecipientContactId(contactId);
                applyContact(contacts.find((contact) => contact.id === contactId));
              }}
            >
              <option value="">Destinatário manual</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Nome do destinatário"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
            />
            <Input
              placeholder="WhatsApp"
              value={recipientWhatsapp}
              onChange={(event) => setRecipientWhatsapp(event.target.value)}
            />
            <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
              {Object.entries(SEND_CHANNEL_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    checked={channels.includes(value as SendChannel)}
                    type="checkbox"
                    onChange={() => toggleChannel(value as SendChannel)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Input
              className="md:col-span-2"
              placeholder="Assunto do e-mail"
              value={messageSubject}
              onChange={(event) => setMessageSubject(event.target.value)}
            />
            <textarea
              className="min-h-40 rounded-md border border-border bg-background p-3 text-sm outline-none md:col-span-2"
              placeholder="Corpo da mensagem"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
            />
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                checked={reviewed}
                type="checkbox"
                onChange={(event) => setReviewed(event.target.checked)}
              />
              Revisei cliente, documento, destinatário, canais, mensagem e arquivo.
            </label>
            {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
            <Button type="button" variant="outline" onClick={() => void generatePreview()}>
              Revisar envio
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Confirmando..." : "Confirmar envio"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Cliente: {selectedDocument?.client.name ?? "-"}</p>
          <p>Documento: {selectedDocument?.title ?? "-"}</p>
          <p>Categoria: {selectedDocument?.category ?? "-"}</p>
          <p>Competência: {selectedDocument?.competence ?? "-"}</p>
          <p>
            Vencimento:{" "}
            {selectedDocument?.dueDate
              ? new Date(selectedDocument.dueDate).toLocaleDateString("pt-BR")
              : "-"}
          </p>
          <p>Destinatário: {recipientName || "-"}</p>
          <p>Canais: {channels.map((channel) => SEND_CHANNEL_LABELS[channel]).join(", ")}</p>
          <p>Arquivo: {selectedDocument?.originalFileName ?? "-"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
