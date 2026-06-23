import { AppShell } from "@/components/app-shell";
import { RecurringTasksClient } from "@/components/recurring-tasks/recurring-tasks-client";

export default function RecurringTasksPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Tarefas recorrentes</h1>
          <p className="text-sm text-muted-foreground">Regras simples de recorrência operacional.</p>
        </div>
      </div>
      <RecurringTasksClient />
    </AppShell>
  );
}
