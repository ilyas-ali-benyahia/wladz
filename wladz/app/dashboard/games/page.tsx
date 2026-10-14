import { Gamepad2 } from "lucide-react";
import { GameList } from "@/components/games/GameList";
import { IconTile } from "@/components/ui/GameIcon";
import { games } from "@/lib/games";

export default function GamesPage() {
  return (
    <>
      <h1 className="wz-rise mb-5 flex items-center gap-3 text-2xl font-extrabold text-ink">
        <IconTile icon={Gamepad2} tone="#2f8f5b" size="sm" />
        الألعاب
      </h1>
      <GameList list={games.filter((game) => !game.quick)} />
    </>
  );
}
