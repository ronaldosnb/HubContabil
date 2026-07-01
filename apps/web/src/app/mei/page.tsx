import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MeiPageClient } from "@/components/mei/mei-page-client";
import { Button } from "@/components/ui/button";

export default function MeiPage() {
  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">MEI</h1>
          <p className="text-sm text-muted-foreground">
            Area dedicada para acompanhamento de clientes microempreendedores individuais.
          </p>
        </div>
        <Button asChild>
          <Link href="/clientes?type=MEI&new=1">Cadastrar cliente</Link>
        </Button>
      </div>

      <MeiPageClient />
    </AppShell>
  );
}
