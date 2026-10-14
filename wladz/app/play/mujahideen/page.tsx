import { Suspense } from "react";
import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import { redirect } from "next/navigation";
import { MujahideenGameDocument } from "@/games/mujahideen/MujahideenGameDocument";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "المجاهدون الستة" };

// Police de la citation coranique de l'écran de fin (Amiri dans le jeu d'origine).
const amiri = Amiri({ subsets: ["arabic"], weight: "700", variable: "--font-amiri" });

async function SignedInGame() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <MujahideenGameDocument player={{ id: user.id, name: user.full_name.split(" ")[0] }} />;
}

// Page plein écran du jeu, affichée dans une iframe par FullscreenGameLauncher.
export default function PlayMujahideenPage() {
  return (
    <div className={amiri.variable}>
      <Suspense fallback={null}>
        <SignedInGame />
      </Suspense>
    </div>
  );
}
