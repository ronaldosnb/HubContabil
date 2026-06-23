import { AppShell } from "@/components/app-shell";
import { NewDocumentForm } from "@/components/documents/new-document-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDocumentPage() {
  return (
    <AppShell>
      <h1 className="mb-5 text-2xl font-semibold">Novo documento</h1>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Dados do documento</CardTitle>
        </CardHeader>
        <CardContent>
          <NewDocumentForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
