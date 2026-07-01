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
import { SidebarAccountActions } from "@/components/sidebar-account-actions";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/envios", label: "Envios", icon: Send },
  { href: "/tarefas-recorrentes", label: "Tarefas recorrentes", icon: Repeat },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-semibold text-primary">HubContabil</p>
          <p className="text-sm text-muted-foreground">Operacao interna</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
        <div className="space-y-2 border-t border-border p-3">
          <ThemeToggle className="w-full justify-start" />
          <SidebarAccountActions />
        </div>
      </aside>
      <div className="lg:pl-64">
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
