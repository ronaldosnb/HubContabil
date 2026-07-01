"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  KanbanSquare,
  Repeat,
  Send,
  Settings,
  Users
} from "lucide-react";
import { UserRole } from "@hubcontabil/shared";
import { SidebarAccountActions } from "@/components/sidebar-account-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthUser, getCurrentUser, getToken } from "@/lib/client-api";

const navItems = [
  { href: "/", label: "Dashboard", icon: BarChart3, adminOnly: false },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare, adminOnly: false },
  { href: "/clientes", label: "Clientes", icon: Building2, adminOnly: false },
  { href: "/mei", label: "MEI", icon: Users, adminOnly: false },
  { href: "/documentos", label: "Documentos", icon: FileText, adminOnly: false },
  { href: "/envios", label: "Envios", icon: Send, adminOnly: false },
  { href: "/tarefas-recorrentes", label: "Tarefas recorrentes", icon: Repeat, adminOnly: false },
  { href: "/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings, adminOnly: true }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!getToken()) {
        return;
      }

      try {
        setUser(await getCurrentUser());
      } catch {
        setUser(null);
      }
    }

    void loadUser();
  }, []);

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === UserRole.ADMIN
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-semibold text-primary">HubContabil</p>
          <p className="text-sm text-muted-foreground">Operacao interna</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNavItems.map((item) => (
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
