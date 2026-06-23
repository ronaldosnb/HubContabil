import { AppShell } from "@/components/app-shell";
import { KanbanBoardClient } from "@/components/kanban/kanban-board-client";

export default function KanbanPage() {
  return (
    <AppShell>
      <div className="mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Kanban de Tarefas</h1>
          <p className="text-sm text-muted-foreground">
            Tela principal para organizar tarefas por etapa, responsável, setor e prazo.
          </p>
        </div>
      </div>
      <KanbanBoardClient />
    </AppShell>
  );
}
