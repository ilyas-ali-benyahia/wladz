import { GamesBrowser } from "@/components/games/GamesBrowser";
import { games } from "@/lib/games";

const card = ({ slug, title, description }: (typeof games)[number]) => ({ slug, title, description });

export default function GamesPage() {
  return (
    <GamesBrowser
      classic={games.filter((game) => !game.quick && !game.featured).map(card)}
      quick={games.filter((game) => game.quick).map(card)}
    />
  );
}
