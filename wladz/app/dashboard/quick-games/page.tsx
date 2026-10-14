import { Zap } from "lucide-react";
import { GameList } from "@/components/games/GameList";
import { IconTile } from "@/components/ui/GameIcon";
import { games } from "@/lib/games";

export default function QuickGamesPage() {
  return (
    <>
      <h1 className="wz-rise mb-5 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <IconTile icon={Zap} tone="#d21034" size="sm" />
        ألعاب سريعة
      </h1>
      <GameList list={games.filter((game) => game.quick)} />
    </>
  );
}
