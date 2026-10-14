"use client";

import GameShell from "@/components/games/GameShell";
import Game from "./_components/Game";
import { manifest } from "./manifest";

// Game route: /dashboard/games/salati. This file contains nothing but the shell.
export default function Page() {
  return <GameShell manifest={manifest} Game={Game} />;
}
