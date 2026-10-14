import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TreasuresGameDocument } from "@/games/treasures/TreasuresGameDocument";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "كنوز الجزائر" };

async function SignedInGame() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <TreasuresGameDocument
      player={{ id: user.id, name: user.full_name.split(" ")[0] }}
    />
  );
}

// Page plein écran du jeu, affichée dans une iframe par FullscreenGameLauncher.
export default function PlayTreasuresPage() {
  return (
    <Suspense fallback={null}>
      <SignedInGame />
    </Suspense>
  );
}
