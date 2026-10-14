import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

async function RedirectSignedIn({ children }: { children: ReactNode }) {
  if (await getSessionUser()) redirect("/dashboard");
  return children;
}

// Pages de connexion et d'inscription : un enfant déjà connecté va au tableau de bord.
export function GuestOnly({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RedirectSignedIn>{children}</RedirectSignedIn>
    </Suspense>
  );
}
