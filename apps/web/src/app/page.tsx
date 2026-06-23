import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores operacionais definidos para o MVP.
          </p>
        </div>
        <Button asChild>
          <Link href="/kanban">Abrir Kanban</Link>
        </Button>
      </div>

      <DashboardClient />
    </AppShell>
  );
}
