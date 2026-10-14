import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GhirasGameDocument } from "@/games/ghiras/GhirasGameDocument";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "غِراس المواطنة" };

async function SignedInGame() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <GhirasGameDocument player={{ id: user.id, name: user.full_name.split(" ")[0] }} />;
}

// Page plein écran du jeu, affichée dans une iframe par FullscreenGameLauncher.
export default function PlayGhirasPage() {
  return (
    <Suspense fallback={null}>
      <SignedInGame />
    </Suspense>
  );
}
