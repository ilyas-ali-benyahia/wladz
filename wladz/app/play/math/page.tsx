import type { Metadata } from "next";
import { MathGameDocument } from "@/games/math/MathGameDocument";

export const metadata: Metadata = { title: "احسب وصوّب" };

// Page plein écran du jeu, affichée dans une iframe par MathLauncher.
export default function PlayMathPage() {
  return <MathGameDocument />;
}
