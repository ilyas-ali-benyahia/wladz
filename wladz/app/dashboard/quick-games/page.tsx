import { GamesBrowser } from "@/components/games/GamesBrowser";
import { games } from "@/lib/games";

const card = ({ slug, title, description }: (typeof games)[number]) => ({ slug, title, description });

// Ancienne adresse des jeux rapides : la page « الألعاب » s'ouvre sur l'onglet des jeux rapides.
export default function QuickGamesPage() {
  return (
    <GamesBrowser
      initialMode="quick"
      classic={games.filter((game) => !game.quick && !game.featured).map(card)}
      quick={games.filter((game) => game.quick).map(card)}
    />
  );
}
