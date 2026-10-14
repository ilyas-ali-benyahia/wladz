"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Sans className : bouton CTA rouge du site. Avec className : apparence fournie (barre latérale).
export function LogoutButton({ className, children = "خروج", ...buttonProps }: ComponentProps<"button">) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (className) {
    return (
      <button type="button" onClick={logout} className={className} {...buttonProps}>
        {children}
      </button>
    );
  }

  return (
    <Button variant="danger" size="sm" icon={LogOut} onClick={logout} {...buttonProps}>
      {children}
    </Button>
  );
}
