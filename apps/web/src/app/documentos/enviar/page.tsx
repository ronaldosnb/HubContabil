import { AppShell } from "@/components/app-shell";
import { SendDocumentClient } from "@/components/sends/send-document-client";

export default function SendDocumentPage() {
  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-semibold">Envio de documento</h1>
      <SendDocumentClient />
    </AppShell>
  );
}
