import { GameList } from "@/components/games/GameList";
import { games } from "@/lib/games";

export default function GamesPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold text-ink">الألعاب</h1>
      <GameList list={games.filter((game) => !game.quick)} />
    </>
  );
}
