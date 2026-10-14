import Link from "next/link";
import { games, type Game } from "@/lib/games";

export function GameList({ list = games }: { list?: Game[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {list.map((game) => (
        <li
          key={game.slug}
          className="flex flex-col rounded-[2rem] bg-white p-5 shadow-xl shadow-dz-green/10"
        >
          <div
            aria-hidden="true"
            className="flex h-28 items-center justify-center rounded-3xl bg-dz-green-soft text-6xl"
          >
            {game.emoji}
          </div>
          <h3 className="mt-4 text-xl font-extrabold text-ink">{game.title}</h3>
          <p className="mt-1 flex-1 text-base text-ink-soft">{game.description}</p>
          <Link
            href={`/dashboard/games/${game.slug}`}
            className="mt-4 flex h-12 items-center justify-center fun-btn bg-dz-green text-lg font-extrabold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
          >
            العب الآن
          </Link>
        </li>
      ))}
    </ul>
  );
}
