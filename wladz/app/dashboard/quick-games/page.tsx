import { GameList } from "@/components/games/GameList";
import { games } from "@/lib/games";

export default function QuickGamesPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold text-ink">ألعاب سريعة</h1>
      <GameList list={games.filter((game) => game.quick)} />
    </>
  );
}
