import { AppShell } from "@/components/app-shell";
import { ClientDetailsClient } from "@/components/clients/client-details-client";

type ClientDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailsPage({ params }: ClientDetailsPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <ClientDetailsClient clientId={id} />
    </AppShell>
  );
}
