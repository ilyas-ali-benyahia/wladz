"use client";

import { useState, type CSSProperties } from "react";
import { Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GameMedia } from "@/components/ui/GameMedia";
import { Tilt } from "@/components/ui/Tilt";

export type TrailerGame = { slug: string; title: string; description: string };

// Carte de jeu du tableau de bord : trailer (lu au survol, ou quand la carte est au centre
// du carrousel du téléphone), titre, description et bouton « العب الآن ».
export function TrailerCard({
  game,
  featured = false,
  index = 0,
  cta = "العب الآن",
}: {
  game: TrailerGame;
  featured?: boolean;
  index?: number;
  cta?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Tilt
      as="article"
      className="wz-glass wz-rise flex h-full flex-col rounded-[2rem] p-4"
      style={{ "--i": index } as CSSProperties}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="wz-trailer-frame">
        <GameMedia slug={game.slug} playing={hovered || featured} />
      </div>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{game.title}</h3>
      <p className="mt-1 flex-1 text-base text-ink-soft">{game.description}</p>
      <ButtonLink href={`/dashboard/games/${game.slug}`} icon={Play} block className="mt-4">
        {cta}
      </ButtonLink>
    </Tilt>
  );
}
