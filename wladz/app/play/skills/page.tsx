import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SkillsGameDocument } from "@/games/skills/SkillsGameDocument";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "درب المهارات" };

async function SignedInGame() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <SkillsGameDocument player={{ id: user.id, name: user.full_name.split(" ")[0] }} />;
}

// Page plein écran du jeu, affichée dans une iframe par FullscreenGameLauncher.
export default function PlaySkillsPage() {
  return (
    <Suspense fallback={null}>
      <SignedInGame />
    </Suspense>
  );
}
