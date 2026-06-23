import Link from "next/link";
import {
  BarChart3,
  FileText,
  KanbanSquare,
  Repeat,
  Send,
  Settings,
  Users
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/envios", label: "Envios", icon: Send },
  { href: "/tarefas-recorrentes", label: "Tarefas recorrentes", icon: Repeat },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-semibold text-primary">HubContabil</p>
          <p className="text-sm text-muted-foreground">Operação interna</p>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
          <div>
            <p className="text-sm font-medium">Escritório</p>
            <p className="text-xs text-muted-foreground">Ambiente interno do MVP</p>
          </div>
          <Link href="/login" className="text-sm font-medium text-primary">
            Entrar
          </Link>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
