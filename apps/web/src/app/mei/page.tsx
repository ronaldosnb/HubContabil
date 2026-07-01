import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <Link href="/clientes">Ver clientes</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes MEI</CardTitle>
          <CardDescription>
            Use esta area para centralizar a rotina operacional dos clientes MEI dentro do MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          A listagem especifica de MEI pode ser conectada ao cadastro de clientes filtrando pelo
          tipo MEI.
        </CardContent>
      </Card>
    </AppShell>
  );
}
