"use client";

import GameShell from "@/components/games/GameShell";
import Game from "./_components/Game";
import { manifest } from "./manifest";

// Route du jeu : /dashboard/games/<slug>. Ce fichier ne contient rien d'autre.
export default function Page() {
  return <GameShell manifest={manifest} Game={Game} />;
}
