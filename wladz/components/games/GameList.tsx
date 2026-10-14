import type { CSSProperties } from "react";
import { Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { GameIcon, gameArtFor } from "@/components/ui/GameIcon";
import { Tilt } from "@/components/ui/Tilt";
import { games, type Game } from "@/lib/games";

export function GameList({ list = games }: { list?: Game[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {list.map((game, index) => (
        <Tilt
          as="li"
          key={game.slug}
          className="wz-glass wz-rise flex flex-col rounded-[2rem] p-5"
          style={{ "--i": index } as CSSProperties}
        >
          <div
            aria-hidden="true"
            className="relative flex h-36 items-center justify-center overflow-hidden rounded-3xl"
            style={{
              background: `radial-gradient(circle at 25% 20%, rgb(255 255 255 / 0.85), transparent 45%), linear-gradient(135deg, color-mix(in srgb, ${gameArtFor(game.slug).tone} 16%, white), color-mix(in srgb, ${gameArtFor(game.slug).tone} 38%, white))`,
            }}
          >
            <span className="absolute -top-6 -start-6 size-24 rounded-full bg-white/40" />
            <span className="absolute -bottom-8 end-6 size-20 rounded-full bg-white/30" />
            <GameIcon slug={game.slug} size="xl" className="wz-bob" />
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-ink">{game.title}</h3>
          <p className="mt-1 flex-1 text-base text-ink-soft">{game.description}</p>
          <ButtonLink href={`/dashboard/games/${game.slug}`} icon={Play} block className="mt-4">
            العب الآن
          </ButtonLink>
        </Tilt>
      ))}
    </ul>
  );
}
