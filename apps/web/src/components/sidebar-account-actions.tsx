"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { clearToken } from "@/lib/client-api";
import { Button } from "@/components/ui/button";

export function SidebarAccountActions() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button asChild variant="outline" className="justify-start" title="Perfil">
        <Link href="/perfil">
          <UserCircle className="h-4 w-4" />
          Perfil
        </Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
