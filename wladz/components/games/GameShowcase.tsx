"use client";

import { TrailerCard, type TrailerGame } from "@/components/games/TrailerCard";
import { GameCarousel } from "@/components/ui/GameCarousel";

// « ألعاب لم تجرّبها بعد » : cartes avec trailers dans le carrousel (flèches sur ordinateur,
// anneau qui se swipe sur téléphone, comme sur la page d'accueil).
export function GameShowcase({ games }: { games: TrailerGame[] }) {
  return (
    <GameCarousel
      items={games}
      getKey={(game) => game.slug}
      getLabel={(game) => game.title}
      label="ألعاب لم تجرّبها بعد"
      renderItem={(game, { featured }) => <TrailerCard game={game} featured={featured} cta="جرّبها الآن" />}
    />
  );
}
