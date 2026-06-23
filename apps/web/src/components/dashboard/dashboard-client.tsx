"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardSummary } from "@hubcontabil/shared";
import { getDashboardSummary, getToken } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const indicatorConfig = [
  { key: "openTasks", label: "Tarefas abertas", href: "/kanban?status=open" },
  { key: "overdueTasks", label: "Tarefas vencidas", href: "/kanban?overdue=true" },
  { key: "pendingDocumentsToSend", label: "Documentos pendentes de envio", href: "/documentos?pendingToSend=true" },
  { key: "failedSends", label: "Envios com erro", href: "/envios?errorOnly=true" },
  { key: "documentsDueSoon", label: "Documentos próximos do vencimento", href: "/documentos?dueSoon=true" },
  { key: "activeClients", label: "Clientes ativos", href: "/clientes?status=ACTIVE" }
] as const;

export function DashboardClient() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        setError("Faça login para carregar os indicadores.");
        setIsLoading(false);
        return;
      }

      try {
        setSummary(await getDashboardSummary());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro ao carregar dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  if (error) {
    return (
      <Card className="p-5 text-sm text-danger">
        {error}{" "}
        <Link className="font-medium text-primary" href="/login">
          Ir para login
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {indicatorConfig.map((indicator) => (
        <Link key={indicator.key} href={indicator.href}>
          <Card className="h-full transition-colors hover:bg-muted">
            <CardHeader>
              <CardDescription>{indicator.label}</CardDescription>
              <CardTitle className="text-3xl">
                {isLoading ? "-" : summary?.[indicator.key] ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="info">Ver tela filtrada</Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
